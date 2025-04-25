import logging
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
import os
import numpy as np
from typing import List, Dict, Optional
from utils.database import get_connection
from datetime import datetime

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize models and clients with environment variables
model = SentenceTransformer('all-MiniLM-L6-v2')
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("job-indexx")

# Check index stats
try:
    index_stats = index.describe_index_stats()
except Exception as e:
    logger.error(f"Error getting index stats: {e}")


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
        # Prepare query terms
        query_terms = set(
            term.lower()
            for term in query.replace('OR', ' ')
                             .replace('AND', ' ')
                             .replace('site:sam.gov', '')
                             .split()
        )

        # Generate and normalize embedding
        embedding = model.encode(query).tolist()
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = (np.array(embedding) / norm).tolist()

        # Pinecone query
        try:
            results = index.query(
                vector=embedding,
                top_k=100,
                include_metadata=True,
                namespace=""
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
                         WHERE notice_id IN ({placeholders})
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
                        all_results.append(dict(zip(fcols, r)))

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
                    words = [w for w in query.lower().replace('OR',' ').replace('AND',' ').replace('site:sam.gov','').split() if w]
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
