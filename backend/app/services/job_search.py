import logging
import re
# from sentence_transformers import SentenceTransformer
# from pinecone import Pinecone
import os
import numpy as np
from typing import List, Dict, Optional
from utils.database import get_connection
from datetime import datetime

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# # Initialize models and clients with environment variables
# model = SentenceTransformer('all-MiniLM-L6-v2')
# pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
# index = pc.Index("job-indexx")

# # Check index stats
# try:
#     index_stats = index.describe_index_stats()
# except Exception as e:
#     logger.error(f"Error getting index stats: {e}")

# Lazy-load globals
_model = None
_index = None
 
def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading SentenceTransformer...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model
 
def get_index():
    global _index
    if _index is None:
        from pinecone import Pinecone
        logger.info("Initializing Pinecone index...")
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        _index = pc.Index("job-indexx")
    return _index
 
# Optional: helper to check index stats (if used elsewhere)
def describe_index_stats():
    try:
        index = get_index()
        return index.describe_index_stats()
    except Exception as e:
        logger.error(f"Error getting index stats: {e}")
        return None

def extract_id_from_pinecone(pinecone_id):
    """
    Extract the SAM.gov notice_id from a Pinecone ID.
    Treats the entire ID as the hex notice_id string.
    """
    if pinecone_id is None:
        return None, None

    if "_" in pinecone_id:
        parts = pinecone_id.split("_")
        source = parts[0] if parts[0] != "sam" else "sam_gov"
        notice_id = parts[-1]
        return notice_id, source

    return pinecone_id, "sam_gov"


def is_valid_additional_description(text):
    """
    Check if additional description is valid and not a placeholder.
    """
    if not text:
        return False
    placeholder = (
        "OOPS !! There is some issue in fetching the additional details, "
        "please click on View Details to check directly on sam.gov"
    )
    return placeholder not in text

def build_filters(
    contract_type: Optional[str] = None,
    platform: Optional[str] = None,
    due_date_filter: Optional[str] = None,
    posted_date_filter: Optional[str] = None,
    naics_code: Optional[str] = None,
    opportunity_type: Optional[str] = None,
    user_id: Optional[str] = None
) -> dict:
    filters = {}

    # Filter by platform ("sam_gov" or "freelancer")
    if platform:
        filters["source"] = platform  # "source" stores the platform ('sam_gov', 'freelancer')

    # Filter by contract_type (could be stored in "department" for SAM.gov)
    if contract_type:
        filters["department"] = contract_type  # "department" is the assumed field for contract type in SAM.gov

    # Filter by NAICS code (only available in SAM.gov)
    if naics_code:
        filters["naics_code"] = naics_code  # "naics_code" is available in SAM.gov metadata

    # Filter by opportunity_type (maps to platform type 'sam_gov' or 'freelancer')
    if opportunity_type:
        filters["platform"] = opportunity_type  # "platform" field indicates opportunity type (e.g., 'Federal', 'Freelancer')

    # Filter by user_id (assuming user_id is part of the metadata for user-specific filtering)
    if user_id:
        filters["user_id"] = user_id  # Assuming "user_id" exists in the metadata

    # Filter by due date (response_date) 
    if due_date_filter:
        filters["response_date"] = {"$lte": due_date_filter}  # Filters based on "response_date" metadata

    # Filter by posted date (published_date)
    if posted_date_filter:
        filters["published_date"] = {"$gte": posted_date_filter}  # Filters based on "published_date" metadata

    return {}


def extract_budget_mentions(text: str) -> Optional[str]:
    """
    Extract budget mentions from text using regex patterns.
    Looks for patterns like:
    - $X,XXX,XXX
    - $X.X million
    - Budget: $X,XXX
    - Estimated value: $X,XXX
    """
    if not text:
        return None
        
    # First try to match patterns with units (M, Million, etc.)
    unit_patterns = [
        (r'\$[\d,]+(?:\.\d+)?\s*[MBK]', 'short'),  # $99M, $99.9B, $99K
        (r'\$[\d,]+(?:\.\d+)?\s*(?:Million|Billion|Thousand)', 'full'),  # $99 Million, $99.9 Billion
        (r'\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|thousand))', 'full'),  # $1.2 million
    ]
    
    for pattern, unit_type in unit_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            match = matches[0]
            # Extract the number and unit
            if unit_type == 'short':
                # For short form (M, B, K)
                num = re.sub(r'[^\d.]', '', match)
                unit = re.search(r'[MBK]', match, re.IGNORECASE).group().upper()
                if unit == 'M':
                    return f"${float(num):,.1f}M"
                elif unit == 'B':
                    return f"${float(num):,.1f}B"
                elif unit == 'K':
                    return f"${float(num):,.1f}K"
            else:
                # For full form (Million, Billion, Thousand)
                num = re.sub(r'[^\d.]', '', match)
                if 'million' in match.lower():
                    return f"${float(num):,.1f}M"
                elif 'billion' in match.lower():
                    return f"${float(num):,.1f}B"
                elif 'thousand' in match.lower():
                    return f"${float(num):,.1f}K"
    
    # If no unit patterns match, try regular dollar amounts
    regular_patterns = [
        r'\$[\d,]+(?:\.\d+)?',  # $1,234,567
        r'(?:budget|estimated value|estimated cost|total value):\s*\$[\d,]+(?:\.\d+)?',  # Budget: $1,234,567
        r'(?:not to exceed|NTE|not exceeding):\s*\$[\d,]+(?:\.\d+)?',  # NTE: $1,234,567
    ]
    
    for pattern in regular_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            match = matches[0]
            num = float(re.sub(r'[^\d.]', '', match))
            return f"${num:,.2f}"
            
    return None


def search_jobs(
    query: str,
    contract_type: Optional[str] = None,
    platform: Optional[str] = None,
    due_date_filter: Optional[str] = None,
    posted_date_filter: Optional[str] = None,
    naics_code: Optional[str] = None,
    opportunity_type: Optional[str] = None,
    user_id: Optional[str] = None,
    sort_by: Optional[str] = "relevance"
) -> List[Dict]:
    """
    Enhanced search with re-ranking for relevance, ending soon, or newest sorting.
    """
    try:
        # query = query.replaceAll('OR', ' ').replaceAll('AND', ' ').replaceAll('site:sam.gov', '').split()
        query = re.sub(r'OR|AND|site:sam.gov|government contract|"', ' ', query)
        # Prepare query terms
        query_terms = set(
            term.lower()
            for term in query
        )

        # Generate and normalize embedding
        model = get_model()
        embedding = model.encode(query).tolist()
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = (np.array(embedding) / norm).tolist()

        # Pinecone query
        try:
            filters = build_filters(
                contract_type,        # Example: contract type filter
                platform,               # Example: platform filter
                due_date_filter,     # Example: due date filter
                posted_date_filter,  # Example: posted date filter
                naics_code,              # Example: NAICS code filter
                opportunity_type       # Example: opportunity type filter
            )
            index = get_index()
            results = index.query(
                vector=embedding,
                top_k=50,
                include_metadata=True,
                namespace="",
                filter=filters
            )
            if not results.matches:
                return []

            scores = [m.score for m in results.matches]
            scores.sort(reverse=True)
            min_thr = 0.35
            if len(scores) >= 10:
                top_mean = sum(scores[:10]) / 10
                thr = max(min_thr, top_mean * 0.6)
            else:
                thr = min_thr

            filtered = [m for m in results.matches if m.score >= thr]
        except Exception as e:
            logger.error(f"Pinecone query error: {e}")
            return []

        # Extract SAM.gov notice_ids
        sam_gov_ids = []
        freelancer_ids = []
        for match in filtered:
            try:
                src = match.metadata.get('source')
                if not src:
                    original_id, src = extract_id_from_pinecone(match.id)
                else:
                    original_id, _ = extract_id_from_pinecone(match.id)
                if original_id:
                    if src == 'sam_gov':
                        sam_gov_ids.append(original_id)
                    elif src == 'freelancer':
                        freelancer_ids.append(original_id)
            except Exception:
                continue

        if not sam_gov_ids and not freelancer_ids:
            return []

        # Fetch from Postgres
        conn = get_connection()
        if not conn:
            logger.error("DB connection failed")
            return []

        try:
            with conn.cursor() as cur:
                all_results = []

                # SAM.gov records
                if sam_gov_ids and (not opportunity_type or opportunity_type in ["All", "Federal"]):
                    placeholders = ','.join(['%s'] * len(sam_gov_ids))
                    sql = f"""
                        SELECT id, notice_id, solicitation_number, title, department,
                               naics_code, published_date, response_date, description,
                               additional_description, url, active
                          FROM sam_gov
                         WHERE id IN ({placeholders})
                    """
                    params = sam_gov_ids.copy()

                    # Optional filters
                    if naics_code:
                        sql += " AND naics_code::text LIKE %s"
                        params.append(f"%{naics_code}%")
                    if posted_date_filter and posted_date_filter != 'all':
                        # add posted_date_filter logic
                        pass
                    if due_date_filter:
                        # add due_date_filter logic
                        pass
                    
                    # Add condition to filter out past due opportunities
                    # sql += " AND (response_date IS NULL OR response_date >= CURRENT_DATE)"
                    # sql += " AND active = true"

                    cur.execute(sql, params)
                    rows = cur.fetchall()
                    cols = [
                        "id", "notice_id", "solicitation_number", "title", "department",
                        "naics_code", "published_date", "response_date", "description",
                        "additional_description", "url", "active"
                    ]
                    for r in rows:
                        rec = dict(zip(cols, r))
                        nid = rec.get('notice_id')
                        rec['external_url'] = f"https://sam.gov/opp/{nid}/view" if nid else None
                        rec['platform'] = 'sam.gov'
                        rec['agency'] = rec.get('department')
                        
                        # Extract budget mentions from description and additional_description
                        description = rec.get('description', '')
                        additional_description = rec.get('additional_description', '')
                        budget = extract_budget_mentions(description) or extract_budget_mentions(additional_description)
                        if budget:
                            rec['budget'] = budget
                            
                        all_results.append(rec)

                # Freelancer records
                if freelancer_ids and (not opportunity_type or opportunity_type in ["All", "Freelancer"]):
                    ph = ','.join(['%s'] * len(freelancer_ids))
                    fq = f"""
                        SELECT id, title, additional_details AS description,
                               skills_required AS agency, 'freelancer' AS platform,
                               price_budget AS value, job_url AS external_url
                          FROM freelancer_data_table
                         WHERE id IN ({ph})
                    """
                    cur.execute(fq, freelancer_ids)
                    fcols = ["id", "title", "description", "agency", "platform", "value", "external_url"]
                    for r in cur.fetchall():
                        rec = dict(zip(fcols, r))
                        # Extract budget mentions from description
                        budget = extract_budget_mentions(rec.get('description', ''))
                        if budget:
                            rec['budget'] = budget
                        all_results.append(rec)

                # Ranking & sorting
                for res in all_results:
                    title = res.get('title', '').lower()
                    eq = 1 if query.lower() in title else 0
                    tm = sum(1 for t in query_terms if t in title)
                    agency_text = (res.get('agency') or res.get('department') or '').lower()
                    am = sum(1 for t in query_terms if t in agency_text)
                    ad = res.get('additional_description', '')
                    adm = 0
                    if ad and is_valid_additional_description(ad):
                        adm = sum(1 for t in query_terms if t in ad.lower())

                    tmr = tm / len(query_terms) if query_terms else 0
                    words = [w for w in query.lower().split() if w]
                    bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]
                    bgm = sum(1 for bg in bigrams if bg in title)

                    d_str = res.get('response_date')
                    days_due = float('inf')
                    if d_str:
                        try:
                            dd = datetime.strptime(str(d_str).split('T')[0], '%Y-%m-%d')
                            today = datetime.now().replace(hour=0,minute=0,second=0,microsecond=0)
                            diff = (dd - today).days
                            if diff >= 0 and res.get('active') is not False:
                                days_due = diff
                        except Exception:
                            pass

                    comps = {
                        'title_exact_match': eq * 0.5,
                        'title_matches': tm * 0.25,
                        'agency_matches': am * 0.05,
                        'term_match_ratio': tmr * 0.1,
                        'bigram_matches': bgm * 0.15,
                        'additional_desc_matches': adm * 0.2,
                        'days_until_due': days_due
                    }
                    res['relevance_components'] = comps
                    res['relevance_score'] = (
                        0.4 +
                        comps['title_exact_match'] +
                        comps['title_matches'] +
                        comps['agency_matches'] +
                        comps['term_match_ratio'] +
                        comps['bigram_matches'] +
                        comps['additional_desc_matches']
                    )

                if sort_by == 'ending_soon':
                    all_results.sort(key=lambda x: x['relevance_components']['days_until_due'])
                elif sort_by == 'newest':
                    all_results.sort(
                        key=lambda x: datetime.strptime(
                            str(x.get('published_date','2000-01-01')).split('T')[0],
                            '%Y-%m-%d'
                        ) if x.get('published_date') else datetime(2000,1,1),
                        reverse=True
                    )
                else:
                    all_results.sort(key=lambda x: x['relevance_score'], reverse=True)

                return all_results
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Search error: {e}")
        return []
