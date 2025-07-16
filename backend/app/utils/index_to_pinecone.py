import os
import sys
 
app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)
    
import time

import json
from datetime import datetime, timedelta, date
import psycopg2
from psycopg2.extras import RealDictCursor

from typing import List, Dict, Optional
import numpy as np
from tqdm import tqdm

from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from utils.logger import get_logger

# Set up logging
logger = get_logger("indexer",True, True, "indexing.log")

from utils.pinecone_client import check_vector_exists, describe_index_stats, get_index
from utils.sentence_transformer import get_model
from utils.db_utils import get_db_connection

# File to track last indexing timestamp
INDEX_STATE_FILE = "index_state.json"

def load_index_state():
    """Load the last indexing state from a file"""
    try:
        if os.path.exists(INDEX_STATE_FILE):
            with open(INDEX_STATE_FILE, 'r') as f:
                return json.load(f)
        return {
            "sam_gov": {"last_indexed": None, "count": 0},
            "freelancer": {"last_indexed": None, "count": 0}
        }
    except Exception as e:
        logger.error(f"Error loading index state: {str(e)}")
        return {
            "sam_gov": {"last_indexed": None, "count": 0},
            "freelancer": {"last_indexed": None, "count": 0}
        }

def save_index_state(state):
    """Save the current indexing state to a file"""
    try:
        with open(INDEX_STATE_FILE, 'w') as f:
            json.dump(state, f)
    except Exception as e:
        logger.error(f"Error saving index state: {str(e)}")



def fetch_sam_gov_records(last_indexed: Optional[str] = None) -> List[Dict]:
    """
    Fetch records from the sam_gov table in Postgres.
    If last_indexed is provided, only fetch records updated since that time.
    """
    connection = get_db_connection()
    if connection is None:
        raise Exception("Failed to connect to PostgreSQL")

    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if created_at and updated_at columns exist
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'sam_gov' AND 
                      column_name IN ('created_at', 'updated_at')
            """)
            existing_columns = [row['column_name'] for row in cursor.fetchall()]
            
            # If timestamp columns don't exist or no last_indexed, get all records
            if 'created_at' not in existing_columns or 'updated_at' not in existing_columns or not last_indexed:
                cursor.execute("""
                    SELECT id, title, description, department, published_date, 
                           notice_id, solicitation_number, response_date, naics_code, url
                    FROM sam_gov
                    ORDER BY id DESC
                """)
                records = cursor.fetchall()
                logger.info(f"Fetched {len(records)} SAM.gov records from database")
            else:
                # Use timestamp columns for incremental updates
                cursor.execute("""
                    SELECT id, title, description, department, published_date, 
                           notice_id, solicitation_number, response_date, naics_code, url,
                           created_at, updated_at
                    FROM sam_gov
                    WHERE created_at > %s OR updated_at > %s
                    ORDER BY id DESC
                """, (last_indexed, last_indexed))
                records = cursor.fetchall()
                logger.info(f"Fetched {len(records)} SAM.gov records from database since {last_indexed}")
            
        return records
    except psycopg2.Error as e:
        logger.error(f"Error fetching sam_gov records: {str(e)}")
        raise Exception(f"Error fetching sam_gov records: {str(e)}")
    finally:
        connection.close()

def fetch_freelancer_data_table(last_indexed: Optional[str] = None) -> List[Dict]:
    """
    Fetch records from the freelancer_data_table table in Postgres.
    If last_indexed is provided, only fetch records updated since that time.
    """
    connection = get_db_connection()
    if connection is None:
        raise Exception("Failed to connect to PostgreSQL")

    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if created_at and updated_at columns exist
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'freelancer_data_table' AND 
                      column_name IN ('created_at', 'updated_at')
            """)
            existing_columns = [row['column_name'] for row in cursor.fetchall()]
            
            # If timestamp columns don't exist or no last_indexed, get all records
            if 'created_at' not in existing_columns or 'updated_at' not in existing_columns or not last_indexed:
                cursor.execute("""
                    SELECT id, title, skills_required, price_budget, bids_so_far, 
                           additional_details, published_date, job_url
                    FROM freelancer_data_table
                    ORDER BY id DESC
                """)
                records = cursor.fetchall()
                logger.info(f"Fetched {len(records)} Freelancer records from database")
            else:
                # Use timestamp columns for incremental updates
                cursor.execute("""
                    SELECT id, title, skills_required, price_budget, bids_so_far, 
                           additional_details, published_date, job_url, created_at, updated_at
                    FROM freelancer_data_table
                    WHERE created_at > %s OR updated_at > %s
                    ORDER BY id DESC
                """, (last_indexed, last_indexed))
                records = cursor.fetchall()
                logger.info(f"Fetched {len(records)} Freelancer records from database since {last_indexed}")
                
        return records
    except psycopg2.Error as e:
        logger.error(f"Error fetching freelancer_data_table records: {str(e)}")
        raise Exception(f"Error fetching freelancer_data_table records: {str(e)}")
    finally:
        connection.close()

def normalize_embedding(embedding):
    """
    Normalize embedding to unit length
    """
    if not embedding:
        return None
        
    norm = np.linalg.norm(embedding)
    if norm > 0:
        return (np.array(embedding) / norm).tolist()
    return embedding

def has_record_changed(existing_metadata: Dict, new_record: Dict, source: str) -> bool:
    """
    Compare existing metadata with new record to detect changes.
    Returns True if any relevant fields have changed.
    """
    if source == "sam_gov":
        # Fields to compare for SAM.gov records
        fields_to_compare = {
            "title": "title",
            "department": "department",
            "published_date": "published_date",
            "response_date": "response_date",
            "naics_code": "naics_code",
            "notice_id": "notice_id",
            "solicitation_number": "solicitation_number"
        }
    else:  # freelancer
        # Fields to compare for Freelancer records
        fields_to_compare = {
            "title": "title",
            "skills": "skills_required",
            "bids": "bids_so_far",
            "price": "price_budget",
            "published_date": "published_date"
        }

    for metadata_field, record_field in fields_to_compare.items():
        existing_value = existing_metadata.get(metadata_field, "")
        new_value = str(new_record.get(record_field, ""))
        
        # Handle date fields
        if "date" in metadata_field:
            if existing_value and new_value:
                try:
                    existing_ts = int(existing_value)
                    new_ts = int(datetime.strptime(str(new_value).split('T')[0], '%Y-%m-%d').timestamp())
                    if existing_ts != new_ts:
                        return True
                except (ValueError, TypeError):
                    if existing_value != new_value:
                        return True
        # Handle other fields
        elif str(existing_value).strip() != str(new_value).strip():
            return True
            
    return False

def parse_freelancer_date(date_str: str) -> datetime:
    """
    Parse Freelancer-specific date formats.
    Handles relative time strings and converts them to actual dates.
    """
    if not date_str:
        return datetime.utcnow()
        
    date_str = date_str.lower().strip()
    
    # Handle relative time strings
    if 'left' in date_str or 'ago' in date_str:
        try:
            # Extract number and unit
            parts = date_str.split()
            if len(parts) >= 2:
                number = int(parts[0])
                unit = parts[1]
                
                # Calculate time delta
                if 'day' in unit:
                    delta = timedelta(days=number)
                elif 'hour' in unit:
                    delta = timedelta(hours=number)
                elif 'minute' in unit:
                    delta = timedelta(minutes=number)
                elif 'second' in unit:
                    delta = timedelta(seconds=number)
                else:
                    return datetime.utcnow()
                
                # Add or subtract based on 'left' or 'ago'
                if 'left' in date_str:
                    return datetime.utcnow() + delta
                else:  # ago
                    return datetime.utcnow() - delta
        except (ValueError, IndexError):
            pass
    
    # Try parsing as ISO format
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        pass
    
    # Try parsing as YYYY-MM-DD
    try:
        return datetime.strptime(date_str.split('T')[0], '%Y-%m-%d')
    except ValueError:
        pass
    
    # If all parsing fails, return current time
    return datetime.utcnow()

def safe_timestamp(date_value) -> int:
    """
    Safely convert date to timestamp.
    Handles various date formats including relative time strings.
    """
    if not date_value:
        return int(datetime.utcnow().timestamp())
        
    try:
        # Handle string dates
        if isinstance(date_value, str):
            # Use Freelancer-specific date parser for relative time strings
            date_value = parse_freelancer_date(date_value)
                    
        # Handle datetime objects
        elif isinstance(date_value, datetime):
            pass
        # Handle date objects
        elif isinstance(date_value, date):
            # Convert date to datetime at midnight UTC
            date_value = datetime.combine(date_value, datetime.min.time())
        # Handle objects with timestamp method
        elif hasattr(date_value, 'timestamp'):
            return int(date_value.timestamp())
        else:
            logger.warning(f"Unsupported date type: {type(date_value)}, using current time")
            return int(datetime.utcnow().timestamp())
            
        # Ensure we have a timezone-naive datetime
        if date_value.tzinfo is not None:
            date_value = date_value.replace(tzinfo=None)
        return int(date_value.timestamp())
    except (ValueError, TypeError, AttributeError) as e:
        logger.warning(f"Error converting date to timestamp: {e}, using current time")
        return int(datetime.utcnow().timestamp())

def prepare_metadata(record: Dict, source: str) -> Dict:
    """
    Prepare metadata dictionary based on source type.
    """
    if source == "sam_gov":
        return {
            "source": "sam_gov",
            "id_type": "sam_gov",
            "department": record["department"] if record["department"] else "",
            "title": record["title"] if record["title"] else "",
            "published_date": safe_timestamp(record["published_date"]),
            "notice_id": record["notice_id"] if record["notice_id"] else "",
            "solicitation_number": record["solicitation_number"] if record["solicitation_number"] else "",
            "response_date": safe_timestamp(record["response_date"]),
            "naics_code": str(record["naics_code"]).strip() if record["naics_code"] else "",
            "url_available": "yes" if record.get("url") else "no",
            "indexed_at": int(datetime.utcnow().timestamp())
        }
    else:  # freelancer
        # Clean and normalize price and bids
        price = record["price_budget"] if record["price_budget"] else "0"
        if isinstance(price, str):
            # Remove currency symbols and convert to float
            price = ''.join(c for c in price if c.isdigit() or c == '.')
            try:
                price = float(price)
            except ValueError:
                price = 0
                
        bids = record["bids_so_far"] if record["bids_so_far"] else "0"
        if isinstance(bids, str):
            # Extract number from strings like "5 bids"
            bids = ''.join(c for c in bids if c.isdigit())
            try:
                bids = int(bids)
            except ValueError:
                bids = 0
        
        return {
            "source": "freelancer",
            "id_type": "freelancer",
            "skills": record["skills_required"] if record["skills_required"] else "",
            "title": record["title"] if record["title"] else "",
            "bids": str(bids),
            "price": str(price),
            "published_date": safe_timestamp(record["published_date"]),
            "job_url": record["job_url"] if record.get("job_url") else "",
            "indexed_at": int(datetime.utcnow().timestamp())
        }

def index_records_to_pinecone(records: List[Dict], source: str, incremental: bool = True) -> int:
    """
    Common function to index records to Pinecone.
    
    Args:
        records: List of records to index
        source: Source type ("sam_gov" or "freelancer")
        incremental: Whether this is an incremental update
    
    Returns:
        Number of records indexed/updated
    """
    if not records:
        logger.warning(f"No new records found in {source} to index.")
        return 0
    
    logger.info(f"Starting to process {len(records)} {source} records...")
    
    # Keep track of statistics
    stats = {
        "indexed": 0,
        "updated": 0,
        "skipped": 0,
        "failed": 0,
        "empty_content": 0,
        "invalid_dates": 0,
        "batch_errors": 0,
        "vector_errors": 0
    }
    
    # Get Pinecone index
    index = get_index()
    if not index:
        logger.error("Failed to initialize Pinecone index")
        return 0

    # Process records in batches
    batch_size = 100
    vectors = []
    batch_count = 0
    
    for record in tqdm(records, desc=f"Processing {source} records"):
        try:
            # Create the Pinecone ID
            record_id = f"{source}_{record['id']}"
            
            # Check if vector exists and get its metadata
            existing_vector = None
            if check_vector_exists(record_id):
                try:
                    fetch_result = index.fetch(ids=[record_id])
                    if record_id in fetch_result.vectors:
                        existing_vector = fetch_result.vectors[record_id]
                        # logger.debug(f"Found existing vector for {record_id}")
                except Exception as e:
                    # logger.warning(f"Error fetching existing vector {record_id}: {e}")
                    stats["vector_errors"] += 1
            
            # Prepare new metadata
            new_metadata = prepare_metadata(record, source)
            
            # Skip if no changes and vector exists
            if existing_vector and not has_record_changed(existing_vector.metadata, record, source):
                # logger.info(f"Skipping {record_id} - no changes detected")
                stats["skipped"] += 1
                continue
            
            # Create content to embed based on source
            if source == "sam_gov":
                description = record['description'] if record['description'] else ""
                title = record['title'] if record['title'] else ""
                text = f"{title} {description}"
            else:  # freelancer
                additional_details = record['additional_details'] if record['additional_details'] else ""
                skills = record['skills_required'] if record['skills_required'] else ""
                title = record['title'] if record['title'] else ""
                text = f"{title} {skills} {additional_details}"
            
            # Skip records with no meaningful content
            if not text.strip():
                # logger.warning(f"Skipping record {record_id} due to empty content")
                stats["empty_content"] += 1
                continue
            
            # Generate embedding
            model = get_model()
            embedding = model.encode(text).tolist()
            embedding = normalize_embedding(embedding)
            
            if not embedding:
                # logger.warning(f"Failed to normalize embedding for record {record_id}")
                stats["failed"] += 1
                continue
            
            # Add vector to batch
            vectors.append((record_id, embedding, new_metadata))
            
            # Update statistics
            if existing_vector:
                stats["updated"] += 1
                # logger.debug(f"Updating existing vector for {record_id}")
            else:
                stats["indexed"] += 1
                # logger.debug(f"Creating new vector for {record_id}")
            
            # Process batch if full
            if len(vectors) >= batch_size:
                batch_count += 1
                try:
                    logger.info(f"Processing batch {batch_count} with {len(vectors)} vectors...")
                    index.upsert(vectors=vectors)
                    logger.info(f"Successfully processed batch {batch_count}")
                    vectors = []
                except Exception as e:
                    logger.error(f"Error upserting batch {batch_count}: {e}")
                    stats["batch_errors"] += 1
                    stats["failed"] += len(vectors)
                    vectors = []
                
        except Exception as e:
            logger.error(f"Error processing {source} record {record['id']}: {str(e)}")
            stats["failed"] += 1
    
    # Process remaining vectors
    if vectors:
        batch_count += 1
        try:
            logger.info(f"Processing final batch {batch_count} with {len(vectors)} vectors...")
            index.upsert(vectors=vectors)
            logger.info(f"Successfully processed final batch {batch_count}")
        except Exception as e:
            logger.error(f"Error upserting final batch {batch_count}: {e}")
            stats["batch_errors"] += 1
            stats["failed"] += len(vectors)
    
    # Update state
    if stats["indexed"] > 0 or stats["updated"] > 0:
        state = load_index_state()
        state[source]["last_indexed"] = datetime.now().isoformat()
        state[source]["count"] += stats["indexed"]
        save_index_state(state)
        logger.info(f"Updated indexing state for {source}")
    
    # Log detailed statistics
    logger.info(f"\n{source} indexing completed with detailed statistics:")
    logger.info(f"  - Total records processed: {len(records)}")
    logger.info(f"  - New records indexed: {stats['indexed']}")
    logger.info(f"  - Existing records updated: {stats['updated']}")
    logger.info(f"  - Records skipped (no changes): {stats['skipped']}")
    logger.info(f"  - Records skipped (empty content): {stats['empty_content']}")
    logger.info(f"  - Records failed: {stats['failed']}")
    logger.info(f"  - Vector fetch errors: {stats['vector_errors']}")
    logger.info(f"  - Batch processing errors: {stats['batch_errors']}")
    logger.info(f"  - Success rate: {((stats['indexed'] + stats['updated']) / len(records) * 100):.2f}%")
    
    return stats["indexed"] + stats["updated"]

def index_sam_gov_to_pinecone(incremental=True):
    """
    Generate embeddings for sam_gov records and upsert them to Pinecone.
    If incremental is True, only process records since the last indexing.
    """
    # Load the current indexing state
    state = load_index_state()
    last_indexed = state["sam_gov"]["last_indexed"] if incremental else None
    
    # Fetch records from sam_gov table
    records = fetch_sam_gov_records(last_indexed)
    
    # Use common indexing function
    return index_records_to_pinecone(records, "sam_gov", incremental)

def index_freelancer_data_table_to_pinecone(incremental=True):
    """
    Generate embeddings for freelancer_data_table records and upsert them to Pinecone.
    If incremental is True, only process records since the last indexing.
    """
    # Load the current indexing state
    state = load_index_state()
    last_indexed = state["freelancer"]["last_indexed"] if incremental else None
    
    # Fetch records from freelancer_data_table
    records = fetch_freelancer_data_table(last_indexed)
    
    # Use common indexing function
    return index_records_to_pinecone(records, "freelancer", incremental)

def check_search(query="cybersecurity"):
    """
    Simple test to verify indexing worked correctly
    """
    logger.info(f"Testing search with query: '{query}'")
    
    try:
        # Generate query embedding
        model = get_model()
        query_embedding = model.encode(query).tolist()
        embedding = normalize_embedding(query_embedding)
        
        # Search without filter first
        index = get_index()
        results = index.query(
            vector=embedding,
            top_k=5,
            include_metadata=True
        )
        
        if results.matches:
            logger.info(f"Found {len(results.matches)} matches for query '{query}'")
            for i, match in enumerate(results.matches):
                logger.info(f"Match {i+1}: ID={match.id}, Score={match.score}, Source={match.metadata.get('source', 'unknown')}")
                logger.info(f"  Title: {match.metadata.get('title', 'unknown')}")
        else:
            logger.warning(f"No matches found for query '{query}'")
            
        # Now try separate searches for each source
        for source in ["sam_gov", "freelancer"]:
            results = index.query(
                vector=embedding,
                top_k=3,
                include_metadata=True,
                filter={"source": source}
            )
            
            logger.info(f"Results for {source}: {len(results.matches)} matches")
    except Exception as e:
        logger.error(f"Error during test search: {str(e)}")

def index_all_to_pinecone(incremental=True, sources=None):
    """
    Index data to Pinecone with flexible options
    
    Args:
        incremental: If True, only index records since last indexing run
        sources: List of sources to index ["sam_gov", "freelancer"], or None for all
    """
    start_time = time.time()
    
    # Check the index first
    logger.info("Checking Pinecone index before indexing...")
    before_stats = describe_index_stats()
    
    total_indexed = 0
    
    # Index SAM.gov records if requested or if no specific sources are specified
    if not sources or "sam_gov" in sources:
        logger.info("Starting to index SAM.gov records...")
        sam_indexed = index_sam_gov_to_pinecone(incremental=incremental)
        total_indexed += sam_indexed
    
    # Index Freelancer records if requested or if no specific sources are specified
    if not sources or "freelancer" in sources:
        logger.info("\nStarting to index Freelancer projects...")
        freelancer_indexed = index_freelancer_data_table_to_pinecone(incremental=incremental)
        total_indexed += freelancer_indexed
    
    # Check the index after indexing
    logger.info("Checking Pinecone index after indexing...")
    after_stats = describe_index_stats()
    
    # Log the difference
    if before_stats and after_stats:
        vectors_added = after_stats.total_vector_count - before_stats.total_vector_count
        logger.info(f"Added {vectors_added} vectors to the index (total processed: {total_indexed})")
    
    # Run a test search
    logger.info("\nTesting search functionality...")
    check_search()
    check_search("web development")
    
    elapsed_time = time.time() - start_time
    logger.info(f"\nIndexing completed in {elapsed_time:.2f} seconds!")
    return {"total_indexed": total_indexed, "elapsed_time": elapsed_time}

def cleanup_orphaned_sam_gov_vectors():
    """
    Remove Pinecone vectors for notice_ids that no longer exist in the sam_gov table.
    """
    logger.info("Starting cleanup of orphaned Pinecone vectors for sam_gov...")
    index = get_index()
    # 1. Get all notice_ids in Pinecone for sam_gov
    pinecone_ids = set()
    try:
        # Pinecone may require pagination for large indexes
        response = index.fetch(ids=None, filter={"source": "sam_gov"})
        if hasattr(response, 'vectors'):
            pinecone_ids = set(response.vectors.keys())
        else:
            logger.warning("Pinecone fetch did not return vectors. Skipping cleanup.")
            return 0
    except Exception as e:
        logger.error(f"Error fetching Pinecone vectors: {e}")
        return 0
    logger.info(f"Found {len(pinecone_ids)} sam_gov vectors in Pinecone.")
    # 2. Get all notice_ids in sam_gov table
    connection = get_db_connection()
    db_ids = set()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT notice_id FROM sam_gov")
            db_ids = set(str(row[0]) for row in cursor.fetchall())
    except Exception as e:
        logger.error(f"Error fetching notice_ids from sam_gov: {e}")
        return 0
    finally:
        connection.close()
    logger.info(f"Found {len(db_ids)} notice_ids in sam_gov table.")
    # 3. Find orphaned vectors
    orphaned_ids = pinecone_ids - db_ids
    logger.info(f"Found {len(orphaned_ids)} orphaned vectors to delete.")
    # 4. Delete orphaned vectors
    deleted = 0
    if orphaned_ids:
        try:
            # Pinecone delete can take a list of ids
            index.delete(ids=list(orphaned_ids))
            deleted = len(orphaned_ids)
            logger.info(f"Deleted {deleted} orphaned vectors from Pinecone.")
        except Exception as e:
            logger.error(f"Error deleting orphaned vectors: {e}")
    return deleted

if __name__ == "__main__":
    # By default, run incremental indexing (only new/updated records)
    # For a full reindex, run with: python index_to_pinecone.py --full
    import sys
    incremental = "--full" not in sys.argv
    cleanup = "--cleanup" in sys.argv
    if not incremental:
        logger.info("Running FULL reindexing of all records...")
    else:
        logger.info("Running INCREMENTAL indexing (new/updated records only)...")
    if cleanup:
        logger.info("Running orphaned vector cleanup before indexing...")
        cleanup_orphaned_sam_gov_vectors()
    index_all_to_pinecone(incremental=incremental)