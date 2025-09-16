import os
import sys
import json
import csv
import pandas as pd
import asyncio

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from typing import Dict, Any, List
import psycopg2
from datetime import datetime, timedelta, date
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from utils.logger import get_logger
from utils.db_utils import get_supabase_connection
from services.summary_service import generate_description_summary

# Configure logging
logger = get_logger(__name__)

# === Database Functions (from database.py) ===

EMBED_MODEL = "text-embedding-3-small"

def _canonicalize_value(v):
    if v is None:
        return ""
    if isinstance(v, (list, tuple)):
        return ", ".join(str(x) for x in v if x is not None)
    if isinstance(v, dict):
        return "; ".join(f"{k}={_canonicalize_value(v[k])}" for k in sorted(v.keys()))
    return str(v)

def build_embedding_text_full_row(opp: Dict[str, Any]) -> str:
    """Create canonical text from the entire row to embed the whole record."""
    fields_in_order = [
        "title","description","objective","expected_outcome","eligibility","key_facts",
        "department","sub_departments","naics_code","classification_code",
        "published_date","response_date","due_date","funding","solicitation_number",
        "notice_id","url","point_of_contact","active"
    ]
    lines, seen = [], set()
    for f in fields_in_order:
        if f in opp:
            seen.add(f)
            lines.append(f"{f}: {_canonicalize_value(opp.get(f))}")
    for k, v in opp.items():
        if k in seen:
            continue
        lines.append(f"{k}: {_canonicalize_value(v)}")
    return "\n".join(lines)[:20000]

async def generate_embedding(text: str) -> List[float]:
    from utils.openai_client import get_openai_client
    client = get_openai_client()
    r = client.embeddings.create(model=EMBED_MODEL, input=text)
    return r.data[0].embedding

def _make_json_serializable(value):
    """Coerce value into JSON-serializable form for Supabase client."""
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value

def _coerce_row_for_supabase(row: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure row payload only contains JSON-serializable values.

    - Dates to ISO strings
    - point_of_contact to dict
    """
    safe_row = dict(row)
    for key in ("published_date", "response_date", "due_date"):
        value = safe_row.get(key)
        if isinstance(value, (datetime, date)):
            # For date columns, a 'YYYY-MM-DD' string is acceptable
            safe_row[key] = value.isoformat()
    # Ensure JSON not stringified
    poc = safe_row.get("point_of_contact")
    if isinstance(poc, str):
        try:
            safe_row["point_of_contact"] = json.loads(poc)
        except Exception:
            safe_row["point_of_contact"] = None
    # Ensure embedding is a JSON-serializable list
    emb = safe_row.get("embedding")
    try:
        if hasattr(emb, "tolist"):
            safe_row["embedding"] = emb.tolist()
    except Exception:
        pass
    return safe_row

def check_duplicate_sb(supabase, notice_id: str) -> bool:
    """Check if a record with given notice_id exists using Supabase client."""
    resp = (
        supabase
        .table("ai_enhanced_opportunities")
        .select("id")
        .eq("notice_id", notice_id)
        .limit(1)
        .execute()
    )
    return bool(getattr(resp, "data", None))

def deduplicate_solicitation_number_sb(supabase, solicitation_number: str, archived_by: str = "dedup_script"):
    """Deduplicate by solicitation_number using Supabase client with history archiving."""
    resp = (
        supabase
        .table("ai_enhanced_opportunities")
        .select("id, notice_id, solicitation_number, title, department, naics_code, published_date, response_date, description, url, active, created_at, updated_at, additional_description, objective, expected_outcome, eligibility, key_facts, due_date, funding, point_of_contact, sub_departments")
        .eq("solicitation_number", solicitation_number)
        .order("id", desc=True)
        .execute()
    )
    rows = getattr(resp, "data", None) or []
    if len(rows) <= 1:
        return False
    latest = rows[0]
    to_archive = rows[1:]

    if to_archive:
        now_iso = datetime.utcnow().isoformat()
        history_rows = []
        for r in to_archive:
            history_rows.append({
                "id": r["id"],
                "notice_id": r.get("notice_id"),
                "solicitation_number": r.get("solicitation_number"),
                "title": r.get("title"),
                "department": r.get("department"),
                "naics_code": r.get("naics_code"),
                "published_date": r.get("published_date"),
                "response_date": r.get("response_date"),
                "description": r.get("description"),
                "url": r.get("url"),
                "active": r.get("active"),
                "created_at": r.get("created_at"),
                "updated_at": r.get("updated_at"),
                "additional_description": r.get("additional_description"),
                "archived_at": now_iso,
                "archived_by": archived_by,
                "objective": r.get("objective"),
                "expected_outcome": r.get("expected_outcome"),
                "eligibility": r.get("eligibility"),
                "key_facts": r.get("key_facts"),
                "due_date": r.get("due_date"),
                "funding": r.get("funding"),
                "point_of_contact": r.get("point_of_contact"),
                "sub_departments": r.get("sub_departments"),
            })
        if history_rows:
            supabase.table("ai_enhanced_opportunities_history").insert(history_rows).execute()
            supabase.table("ai_enhanced_opportunities").delete().in_("id", [r["id"] for r in to_archive]).execute()
    return True

def upsert_with_history_sb(supabase, row: Dict[str, Any], archived_by: str = "upsert_script"):
    """Upsert with history using Supabase client, preserving original semantics."""
    # Coerce payload to JSON-serializable values
    row = _coerce_row_for_supabase(row)

    existing_resp = (
        supabase
        .table("ai_enhanced_opportunities")
        .select("*")
        .eq("notice_id", row["notice_id"])\
        .limit(1)
        .execute()
    )
    existing_rows = getattr(existing_resp, "data", None) or []

    if not existing_rows:
        supabase.table("ai_enhanced_opportunities").insert(row).execute()
        return True

    existing = existing_rows[0]
    changed = False
    for k, v in row.items():
        if k in existing and existing[k] != v:
            logger.info(f"Change detected for notice_id {row['notice_id']} in field '{k}'. DB: '{existing[k]}', API: '{v}'")
            changed = True
            break

    if not changed:
        return False

    # Archive existing into history, then replace
    history_payload = {
        "id": existing["id"],
        "notice_id": existing.get("notice_id"),
        "solicitation_number": existing.get("solicitation_number"),
        "title": existing.get("title"),
        "department": existing.get("department"),
        "naics_code": existing.get("naics_code"),
        "published_date": _make_json_serializable(existing.get("published_date")),
        "response_date": _make_json_serializable(existing.get("response_date")),
        "description": existing.get("description"),
        "url": existing.get("url"),
        "active": existing.get("active"),
        "created_at": _make_json_serializable(existing.get("created_at")),
        "updated_at": _make_json_serializable(existing.get("updated_at")),
        "additional_description": existing.get("additional_description"),
        "archived_at": datetime.utcnow().isoformat(),
        "archived_by": archived_by,
        "objective": existing.get("objective"),
        "expected_outcome": existing.get("expected_outcome"),
        "eligibility": existing.get("eligibility"),
        "key_facts": existing.get("key_facts"),
        "due_date": _make_json_serializable(existing.get("due_date")),
        "funding": existing.get("funding"),
        "point_of_contact": existing.get("point_of_contact"),
        "sub_departments": existing.get("sub_departments"),
    }
    supabase.table("ai_enhanced_opportunities_history").insert(history_payload).execute()
    supabase.table("ai_enhanced_opportunities").delete().eq("notice_id", row["notice_id"]).execute()
    supabase.table("ai_enhanced_opportunities").insert(row).execute()
    return True


def insert_data(rows):
    """Insert or update rows using Supabase client with history and deduplication."""
    supabase = get_supabase_connection(use_service_key=True)
    inserted = 0
    skipped = 0
    try:
        for row in rows:
            notice_id = row.get("notice_id")
            if not notice_id:
                logger.warning("Skipping row with missing notice_id")
                skipped += 1
                continue
            try:
                changed_or_inserted = upsert_with_history_sb(supabase, row)
                if changed_or_inserted:
                    inserted += 1
                solicitation_number = row.get("solicitation_number")
                if solicitation_number:
                    deduplicate_solicitation_number_sb(supabase, solicitation_number)
            except Exception as e:
                logger.error(f"Error upserting record {notice_id}: {e}")
                skipped += 1
                continue
        logger.info(f"Database upsert complete. Inserted/Updated: {inserted}, Skipped: {skipped}")
        return {"inserted": inserted, "skipped": skipped}
    except Exception as e:
        logger.error(f"Error during Supabase operations: {e}")
        return {"error": str(e), "inserted": inserted, "skipped": skipped}

# === CSV Processing Functions ===

# Define the allowed NAICS codes
ALLOWED_NAICS_CODES = ["541512", "541611", "541519", "541715", "518210"]

def parse_date(date_str):
    """Parse a date string into a date object."""
    if not date_str:
        return None
    
    # Handle NaN/float values from pandas
    if pd.isna(date_str) or (isinstance(date_str, float) and pd.isna(date_str)):
        return None
    
    try:
        # Handle various date formats including datetime
        if isinstance(date_str, str):
            # Try datetime format first (e.g., "2025-09-01 22:48:51.482-04")
            if ' ' in date_str and 'T' not in date_str:
                # Format: "2025-09-01 22:48:51.482-04"
                date_part = date_str.split(' ')[0]
                return datetime.strptime(date_part, '%Y-%m-%d').date()
            elif 'T' in date_str:
                # Format: "2025-09-12T17:00:00-04:00"
                date_part = date_str.split('T')[0]
                return datetime.strptime(date_part, '%Y-%m-%d').date()
            else:
                # Try direct date format
                return datetime.strptime(date_str, '%Y-%m-%d').date()
        return None
    except (ValueError, AttributeError) as e:
        logger.error(f"Date parsing error for {date_str}: {e}")
        return None

def truncate_string(text, max_length=255):
    """Truncate a string to specified maximum length."""
    if not text:
        return text
    return text[:max_length]

def safe_string(value, default=""):
    """Safely convert a value to string, handling NaN and None values."""
    if pd.isna(value) or value is None:
        return default
    return str(value).strip()

def is_allowed_naics(naics_code):
    """Check if the NAICS code is in the allowed list."""
    if not naics_code:
        return False
    
    # Convert to string for comparison (CSV stores NAICS codes as strings)
    naics_str = str(naics_code).strip()
    return naics_str in ALLOWED_NAICS_CODES

def process_csv_row(row: Dict[str, str]) -> Dict[str, Any]:
    """
    Process a single CSV row and convert it to the format expected by the database.
    
    Args:
        row: Dictionary containing CSV row data
        
    Returns:
        Dictionary formatted for database insertion, or None if NAICS code not allowed
    """
    # Get NAICS code (keep as string for comparison, convert to int for database)
    naics = row.get("NaicsCode")
    if not is_allowed_naics(naics):
        return None  # Skip this row
    
    # Convert NAICS to integer for database
    try:
        naics_code = int(naics) if naics else None
    except (ValueError, TypeError):
        naics_code = None
    
    # Get notice ID
    notice_id = str(row.get("NoticeId", "")).strip()
    if not notice_id:
        return None  # Skip rows without notice ID
    
    # Get description and generate AI summary
    description = row.get("Description", "")
    # Ensure description is a valid string
    if pd.isna(description) or not isinstance(description, str):
        description = ""
    
    # Format data to match table schema exactly as in original code
    processed_row = {
        "notice_id": notice_id,
        "solicitation_number": safe_string(row.get("Sol#"), ""),
        "title": truncate_string(safe_string(row.get("Title"), "No title")),
        "department": safe_string(row.get("Department/Ind.Agency"), "").split(".")[0] if safe_string(row.get("Department/Ind.Agency")) else "",
        "naics_code": naics_code,
        "published_date": parse_date(row.get("PostedDate")),
        "response_date": parse_date(row.get("ResponseDeadLine")),
        "description": description,
        "url": f"https://sam.gov/opp/{notice_id}/view" if notice_id else None,
        "point_of_contact": json.dumps({
            "primary": {
                "title": safe_string(row.get("PrimaryContactTitle"), ""),
                "name": safe_string(row.get("PrimaryContactFullname"), ""),
                "email": safe_string(row.get("PrimaryContactEmail"), ""),
                "phone": safe_string(row.get("PrimaryContactPhone"), ""),
                "fax": safe_string(row.get("PrimaryContactFax"), "")
            },
            "secondary": {
                "title": safe_string(row.get("SecondaryContactTitle"), ""),
                "name": safe_string(row.get("SecondaryContactFullname"), ""),
                "email": safe_string(row.get("SecondaryContactEmail"), ""),
                "phone": safe_string(row.get("SecondaryContactPhone"), ""),
                "fax": safe_string(row.get("SecondaryContactFax"), "")
            }
        }),
        "active": True if safe_string(row.get("Active", "Yes")).strip().lower() == "yes" else False,
        "sub_departments": safe_string(row.get("Sub-Tier"), ""),
        "objective": "",
        "expected_outcome": "",
        "eligibility": "",
        "key_facts": "",
        "due_date": None,
        "funding": ""
    }
    
    return processed_row

async def process_csv_file(csv_file_path: str, batch_size: int = 1000) -> Dict[str, Any]:
    """
    Process the CSV file and update the database with opportunities.
    
    Args:
        csv_file_path: Path to the CSV file
        batch_size: Number of rows to process in each batch
        
    Returns:
        Dictionary with results summary
    """
    if not os.path.exists(csv_file_path):
        return {"source": "csv_import", "count": 0, "error": f"CSV file not found: {csv_file_path}"}
    
    logger.info(f"Starting CSV import from: {csv_file_path}")
    
    all_opportunities = []
    total_processed = 0
    
    try:
        # Use pandas to read the large CSV file efficiently with proper encoding
        logger.info("Reading CSV file with pandas...")
        
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        df = None
        
        for encoding in encodings:
            try:
                df = pd.read_csv(csv_file_path, encoding=encoding, low_memory=False)
                cols = df.columns.tolist()
                # Filter: Published within last 3 days, and deadline today or later
                today = datetime.utcnow().date()
                three_days_ago = today - timedelta(days=7)

                # Create parsed date helper columns without overwriting originals used later
                posted = df.get("PostedDate")
                deadline = df.get("ResponseDeadLine")

                if posted is not None:
                    df["PostedDate_dt"] = (
                        pd.to_datetime(posted, errors="coerce", utc=True)
                        .dt.tz_convert(None)
                        .dt.date
                    )
                else:
                    df["PostedDate_dt"] = pd.NaT

                if deadline is not None:
                    df["ResponseDeadLine_dt"] = (
                        pd.to_datetime(deadline, errors="coerce", utc=True)
                        .dt.tz_convert(None)
                        .dt.date
                    )
                else:
                    df["ResponseDeadLine_dt"] = pd.NaT

                before_count = len(df)
                mask = (
                    (df["PostedDate_dt"] >= three_days_ago) &
                    (df["ResponseDeadLine_dt"] >= today)
                )
                df = df.loc[mask, cols].copy()

                logger.info(
                    f"Successfully read CSV with {encoding} encoding; filtered {before_count} -> {len(df)} rows "
                    f"(PostedDate >= {three_days_ago}, ResponseDeadLine >= {today})"
                )
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            return {"source": "csv_import", "count": 0, "error": "Could not read CSV file with any encoding"}
        
        logger.info(f"CSV loaded: {len(df)} total rows")
        
        # Process rows in batches
        for start_idx in range(0, len(df), batch_size):
            end_idx = min(start_idx + batch_size, len(df))
            batch_df = df.iloc[start_idx:end_idx]
            
            logger.info(f"Processing batch {start_idx//batch_size + 1}: rows {start_idx+1}-{end_idx}")
            
            batch_opportunities = []
            for _, row in batch_df.iterrows():
                # Convert pandas row to dictionary
                row_dict = row.to_dict()
                
                # Process the row
                processed_row = process_csv_row(row_dict)
                if processed_row:
                    batch_opportunities.append(processed_row)
                    total_processed += 1
            
            all_opportunities.extend(batch_opportunities)
            logger.info(f"Batch complete: {len(batch_opportunities)} opportunities found, {total_processed} total processed")
        
        logger.info(f"CSV processing complete: {total_processed} opportunities found out of {len(df)} total rows")
        
        # Generate AI summaries for all opportunities
        logger.info("Generating AI summaries for opportunities...")
        for opp in all_opportunities:
            try:
                description_text = opp.get("description", "")
                # Handle cases where description might be float/NaN
                if description_text and not pd.isna(description_text) and isinstance(description_text, str):
                    # Generate AI summary exactly as in original code
                    summary = await generate_description_summary("description: " + description_text)
                    summary = summary.get("summary", {})
                    
                    opp["objective"] = summary.get("objective", "")
                    opp["expected_outcome"] = summary.get("goal", "")
                    opp["eligibility"] = summary.get("eligibility", "")
                    opp["key_facts"] = summary.get("key_facts", "")
                    
                    # Parse due date from summary
                    due_date_str = summary.get("due_date", "")
                    if due_date_str and not pd.isna(due_date_str) and isinstance(due_date_str, str):
                        opp["due_date"] = parse_date(due_date_str)
                    else:
                        opp["due_date"] = None
                    opp["funding"] = summary.get("budget", "")
                else:
                    # Skip AI summary for invalid descriptions
                    logger.warning(f"Skipping AI summary for {opp.get('notice_id')}: invalid description type")
                    opp["objective"] = ""
                    opp["expected_outcome"] = ""
                    opp["eligibility"] = ""
                    opp["key_facts"] = ""
                    opp["due_date"] = None
                    opp["funding"] = ""
            except Exception as e:
                logger.error(f"Error generating AI summary for {opp.get('notice_id')}: {e}")
                # Continue with default values
                opp["objective"] = ""
                opp["expected_outcome"] = ""
                opp["eligibility"] = ""
                opp["key_facts"] = ""
                opp["due_date"] = None
                opp["funding"] = ""
            # After summary fields are set, generate full-row embedding
            try:
                text_for_embedding = build_embedding_text_full_row(opp)
                if text_for_embedding.strip():
                    opp["embedding_text"] = text_for_embedding
                    opp["embedding"] = await generate_embedding(text_for_embedding)
                    opp["embedding_model"] = EMBED_MODEL
                    opp["embedding_version"] = 1
            except Exception as e:
                logger.error(f"Error generating embedding for {opp.get('notice_id')}: {e}")
        
        # Insert into database
        if all_opportunities:
            logger.info(f"Preparing to insert {len(all_opportunities)} opportunities into database")
            result = insert_data(all_opportunities)
            
            # Return detailed results exactly as in original code
            db_results = {
                "source": "csv_import", 
                "total_fetched": total_processed,
                "processed": len(all_opportunities),
                "inserted": result.get("inserted", 0),
                "skipped": result.get("skipped", 0),
                "error": result.get("error")
            }
            
            # Supabase vector refresh: fill embeddings for rows missing them (full reindex style)
            try:
                supabase = get_supabase_connection(use_service_key=True)
                PAGE = 200
                total_refreshed = 0
                while True:
                    q = (
                        supabase
                        .table("ai_enhanced_opportunities")
                        .select(
                            "id, notice_id, title, department, naics_code, description, url, "
                            "objective, expected_outcome, eligibility, key_facts, response_date, due_date, "
                            "sub_departments, funding, point_of_contact, published_date, active, embedding"
                        )
                        .is_("embedding", None)
                        .limit(PAGE)
                    ).execute()
                    rows = getattr(q, "data", None) or []
                    if not rows:
                        break

                    updates = []
                    for r in rows:
                        try:
                            row_full = {
                                "notice_id": r.get("notice_id"),
                                "title": r.get("title"),
                                "department": r.get("department"),
                                "naics_code": r.get("naics_code"),
                                "description": r.get("description"),
                                "url": r.get("url"),
                                "objective": r.get("objective"),
                                "expected_outcome": r.get("expected_outcome"),
                                "eligibility": r.get("eligibility"),
                                "key_facts": r.get("key_facts"),
                                "response_date": r.get("response_date"),
                                "due_date": r.get("due_date"),
                                "sub_departments": r.get("sub_departments"),
                                "funding": r.get("funding"),
                                "point_of_contact": r.get("point_of_contact"),
                                "published_date": r.get("published_date"),
                                "active": r.get("active"),
                            }
                            full_text = build_embedding_text_full_row(row_full)
                            if not full_text.strip():
                                continue
                            emb = await generate_embedding(full_text)
                            updates.append({
                                "id": r["id"],
                                "embedding_text": full_text[:20000],
                                "embedding": emb,
                                "embedding_model": EMBED_MODEL,
                                "embedding_version": 1
                            })
                        except Exception as ee:
                            logger.error(f"Embedding refresh failed for {r.get('notice_id')}: {ee}")
                            continue

                    if updates:
                        supabase.table("ai_enhanced_opportunities").upsert(updates, on_conflict="id").execute()
                        total_refreshed += len(updates)

                db_results["indexed_count"] = total_refreshed
                logger.info(f"Supabase vector refresh complete. Embeddings updated: {total_refreshed}")
            except Exception as e:
                logger.error(f"Error during Supabase vector refresh: {e}")
                db_results["indexing_error"] = str(e)

            # --- Post-ETL: Mark records as inactive if not in latest CSV fetch (exactly as in original) ---
            try:
                latest_notice_ids = set(row["notice_id"] for row in all_opportunities if row.get("notice_id"))
                supabase = get_supabase_connection(use_service_key=True)
                if latest_notice_ids:
                    active_resp = (
                        supabase
                        .table("ai_enhanced_opportunities")
                        .select("notice_id")
                        .eq("active", True)
                        .execute()
                    )
                    active_rows = getattr(active_resp, "data", None) or []
                    active_ids = {r["notice_id"] for r in active_rows if r.get("notice_id")}
                    to_deactivate = list(active_ids - latest_notice_ids)
                    marked_inactive = 0
                    if to_deactivate:
                        CHUNK = 500
                        for i in range(0, len(to_deactivate), CHUNK):
                            chunk = to_deactivate[i:i+CHUNK]
                            supabase.table("ai_enhanced_opportunities").update({"active": False}).in_("notice_id", chunk).execute()
                            marked_inactive += len(chunk)
                    logger.info(f"Marked {marked_inactive} records as inactive (not present in latest CSV fetch)")
                    db_results["marked_inactive"] = marked_inactive
                else:
                    logger.warning("No notice_ids found in latest CSV fetch for inactive marking step.")
            except Exception as e:
                logger.error(f"Error during post-ETL inactive marking step: {e}")
                db_results["inactive_marking_error"] = str(e)
                
            return db_results
        
        return {"source": "csv_import", "count": 0, "status": "No opportunities found"}
        
    except Exception as e:
        logger.error(f"Error processing CSV file: {e}")
        return {"source": "csv_import", "count": 0, "error": str(e)}

async def import_from_csv(csv_file_path: str = None) -> Dict[str, Any]:
    """
    Main function to import opportunities from CSV file.
    
    Args:
        csv_file_path: Path to the CSV file. If None, uses default path.
        
    Returns:
        Dictionary with results summary
    """
    if csv_file_path is None:
        # Prefer env var if present; fallback to default filename at CWD
        csv_file_path = os.getenv("CSV_PATH") or "ContractOpportunitiesFullCSV.csv"
    # If a directory path was provided, append the default filename
    if os.path.isdir(csv_file_path):
        csv_file_path = os.path.join(csv_file_path, "ContractOpportunitiesFullCSV.csv")
    
    logger.info(f"Starting CSV import process from: {csv_file_path}")
    
    # Process the CSV file
    result = await process_csv_file(csv_file_path)
    
    logger.info(f"CSV import process complete: {result}")
    return result

# Function to handle command line arguments (exactly as in original)
def parse_args():
    """Parse command line arguments"""
    import argparse
    parser = argparse.ArgumentParser(description='CSV import script for SAM.gov opportunities')
    parser.add_argument('--record-id', type=int, help='ETL record ID')
    parser.add_argument('--trigger-type', type=str, help='Trigger type (scheduled or manual)')
    parser.add_argument('--csv-path', type=str, help='Path to CSV file')
    return parser.parse_args()

# For running as a script (exactly as in original)
if __name__ == "__main__":
    # Parse command line arguments
    args = parse_args()
    
    if args.record_id:
        logger.info(f"Running with ETL record ID: {args.record_id}, trigger type: {args.trigger_type}")
    
    # Run the async function
    result = asyncio.run(import_from_csv(args.csv_path))
    
    # Calculate counts for output (exactly as in original)
    count = result.get("total_fetched", 0)
    new_count = result.get("inserted", 0) 
    status = "error" if result.get("error") else "success"
    
    # Output in JSON format for the GitHub workflow (exactly as in original)
    output = {
        "count": count,
        "new_count": new_count, 
        "status": status
    }
    
    print(output)
