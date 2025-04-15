import logging
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
import os
import numpy as np
from typing import List, Dict, Optional
from utils.database import get_connection  # Import from utils/ (your postgres_connection renamed to database.py)

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize models and clients with environment variables
model = SentenceTransformer('all-MiniLM-L6-v2')
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))  # Initialize Pinecone client with API key from .env
index = pc.Index("job-indexx")  # Access the job-index (dimension 384, metric cosine)

# Check index without logging details
try:
    index_stats = index.describe_index_stats()
except Exception as e:
    logger.error(f"Error getting index stats: {str(e)}")

def extract_id_from_pinecone(pinecone_id):
    """
    Extract the original database ID from a Pinecone ID.
    Handles both formats: 'sam_gov_123' or 'freelancer_456' or plain '123'
    Returns the numeric ID as an integer and normalized source name.
    """
    if pinecone_id is None:
        return None, None
        
    # If the ID has a prefix like "sam_gov_" or "freelancer_"
    if "_" in pinecone_id:
        parts = pinecone_id.split("_")
        # Get the source/platform
        source = parts[0] if parts[0] != "sam" else "sam_gov"
        # The numeric ID is the last part after the prefix
        id_part = parts[-1]
        try:
            # Normalize the source name - use sam_gov internally, but display as sam.gov in the UI
            normalized_source = "sam.gov" if source == "sam_gov" else source
            return int(id_part), normalized_source
        except ValueError:
            return None, source
    
    # For plain IDs (no prefix)
    try:
        return int(pinecone_id), "unknown"
    except ValueError:
        return None, "unknown"

def search_jobs(query: str, contract_type: Optional[str] = None, platform: Optional[str] = None,
                due_date_filter: Optional[str] = None, posted_date_filter: Optional[str] = None,
                naics_code: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict]:
    """
    Enhanced search with re-ranking for better relevance and user interaction boosting.
    """
    try:
        # Extract query terms for re-ranking
        query_terms = set([term.lower() for term in query.replace('OR', ' ').replace('AND', ' ')
                          .replace('site:sam.gov', '').split()])
        
        # Generate query embedding
        query_embedding = model.encode(query).tolist()

        # Normalize the embedding
        norm = np.linalg.norm(query_embedding)
        if norm > 0:
            query_embedding = (np.array(query_embedding) / norm).tolist()

        # Query Pinecone with a high top_k to get all potential matches
        try:
            results = index.query(
                vector=query_embedding,
                top_k=100,  # Get more potential matches
                include_metadata=True,
                namespace=""
            )
            
            if not results.matches:
                return []
                
            # Use a dynamic threshold based on the distribution of scores
            if len(results.matches) > 0:
                # Get all scores
                scores = [match.score for match in results.matches]
                
                # Look at the distribution of scores
                scores.sort(reverse=True)
                
                # Use a minimum absolute threshold to maintain quality
                min_threshold = 0.35
                
                # If we have enough results, use a dynamic threshold
                if len(scores) >= 10:
                    # Use the mean of the top 10 scores as reference
                    top_mean = sum(scores[:10]) / 10
                    
                    # Use 60% of the top mean as threshold
                    dynamic_threshold = top_mean * 0.6
                    
                    # Use the higher of the two thresholds
                    threshold = max(min_threshold, dynamic_threshold)
                else:
                    # Just use the minimum threshold for small result sets
                    threshold = min_threshold
                
                # Apply the threshold
                filtered_matches = [match for match in results.matches if match.score >= threshold]
            else:
                filtered_matches = []

            # Group matches by source and extract IDs
            sam_gov_ids = []
            freelancer_ids = []
            
            for match in filtered_matches:
                try:
                    # First try to get source from metadata
                    source = match.metadata.get('source', None)
                    
                    # If not in metadata, try to extract from ID
                    if not source:
                        original_id, source = extract_id_from_pinecone(match.id)
                    else:
                        # If source is in metadata, extract just the ID
                        original_id, _ = extract_id_from_pinecone(match.id)
                    
                    # Only add valid IDs to the list
                    if original_id is not None:
                        if source == 'sam_gov':
                            sam_gov_ids.append(original_id)
                        elif source == 'freelancer':
                            freelancer_ids.append(original_id)
                except Exception:
                    continue
            
            if not sam_gov_ids and not freelancer_ids:
                return []

        except Exception as e:
            logger.error(f"Pinecone query error: {str(e)}")
            return []

        # Fetch from database
        connection = get_connection()
        if not connection:
            logger.error("Could not establish database connection")
            return []

        try:
            with connection.cursor() as cursor:
                all_results = []

                # Fetch SAM.gov records if we have IDs
                if sam_gov_ids:
                    # Start building the SQL query
                    sql_query = """
                        SELECT id, notice_id, solicitation_number, title, department, 
                               naics_code, published_date, response_date, description, 
                               url, active
                        FROM sam_gov 
                        WHERE id IN ({})
                    """
                    
                    # Add filters if present
                    additional_conditions = []
                    params = sam_gov_ids.copy()  # Start with the IDs
                    
                    # NAICS code filter - we still keep this filter if user explicitly requests it
                    if naics_code:
                        additional_conditions.append("naics_code = %s")
                        params.append(naics_code)
                    
                    # Posted date filter
                    if posted_date_filter:
                        if posted_date_filter == "past_day":
                            additional_conditions.append("published_date >= CURRENT_DATE - INTERVAL '1 day'")
                        elif posted_date_filter == "past_week":
                            additional_conditions.append("published_date >= CURRENT_DATE - INTERVAL '7 days'")
                        elif posted_date_filter == "past_month":
                            additional_conditions.append("published_date >= CURRENT_DATE - INTERVAL '30 days'")
                        elif posted_date_filter == "past_year":
                            additional_conditions.append("published_date >= CURRENT_DATE - INTERVAL '365 days'")
                    
                    # Due date filter
                    if due_date_filter:
                        if due_date_filter == "next_30_days":
                            additional_conditions.append("response_date <= CURRENT_DATE + INTERVAL '30 days' AND response_date >= CURRENT_DATE")
                        elif due_date_filter == "next_3_months":
                            additional_conditions.append("response_date <= CURRENT_DATE + INTERVAL '90 days' AND response_date >= CURRENT_DATE")
                        elif due_date_filter == "next_12_months":
                            additional_conditions.append("response_date <= CURRENT_DATE + INTERVAL '365 days' AND response_date >= CURRENT_DATE")
                    
                    # Only consider active opportunities
                    if due_date_filter == "active_only":
                        additional_conditions.append("active = TRUE")
                    
                    # Add any additional conditions to the query
                    if additional_conditions:
                        placeholders = ','.join(['%s'] * len(sam_gov_ids))
                        sql_query = sql_query.format(placeholders)
                        sql_query += " AND " + " AND ".join(additional_conditions)
                    else:
                        placeholders = ','.join(['%s'] * len(sam_gov_ids))
                        sql_query = sql_query.format(placeholders)
                    
                    try:
                        cursor.execute(sql_query, params)
                        sam_gov_results = cursor.fetchall()
                    except Exception as e:
                        logger.error(f"Error executing SAM.gov query: {str(e)}")
                        sam_gov_results = []
                    
                    columns = ["id", "notice_id", "solicitation_number", "title", "department", 
                               "naics_code", "published_date", "response_date", "description", 
                               "url", "active"]
                    sam_gov_results = [dict(zip(columns, record)) for record in sam_gov_results]
                    
                    # Add external_url for SAM.gov results with a fallback
                    for result in sam_gov_results:
                        # Use notice_id if available
                        notice_id = result.get('notice_id')
                        result['external_url'] = f"https://sam.gov/opp/{notice_id}/view" if notice_id else None
                        result['platform'] = 'sam.gov'  # Add platform field
                        result['agency'] = result.get('department')  # Map department to agency field
                        
                        # All results are considered valid, no NAICS validation
                        all_results.append(result)
                
                # Fetch freelancer records if we have IDs
                if freelancer_ids:
                    placeholders = ','.join(['%s'] * len(freelancer_ids))
                    # Include job_url in the query, map it to external_url
                    query_sql = f"""
                        SELECT id, title, additional_details AS description, 
                               skills_required AS agency, 'freelancer' AS platform, 
                               price_budget AS value, job_url AS external_url
                        FROM freelancer_data_table 
                        WHERE id IN ({placeholders})
                    """
                    
                    # Include all freelancer results regardless of NAICS filter
                    cursor.execute(query_sql, freelancer_ids)
                    
                    columns = ["id", "title", "description", "agency", "platform", "value", "external_url"]
                    freelancer_results = [dict(zip(columns, record)) for record in cursor.fetchall()]
                    all_results.extend(freelancer_results)
                
                # Get user interaction data if user_id is provided
                user_interactions = {}
                if user_id and connection:
                    try:
                        # Get opportunities the user has interacted with
                        cursor.execute("""
                            SELECT opportunity_id, 
                                   SUM(CASE WHEN action_type = 'view' THEN 1 ELSE 0 END) as views,
                                   SUM(CASE WHEN action_type = 'pursuit' THEN 3 ELSE 0 END) as pursuits,
                                   SUM(CASE WHEN action_type = 'generate_response' THEN 5 ELSE 0 END) as responses
                            FROM user_interactions
                            WHERE user_id = %s
                            GROUP BY opportunity_id
                        """, (user_id,))
                        
                        for record in cursor.fetchall():
                            opp_id, views, pursuits, responses = record
                            # Calculate an interaction score
                            user_interactions[str(opp_id)] = (views + pursuits + responses) / 10  # Normalize to 0-1 range
                    except Exception as e:
                        logger.error(f"Error fetching user interactions: {str(e)}")
                
                # Re-rank results based on multiple factors
                for result in all_results:
                    # Start with the original vector similarity score
                    base_score = 0.5  # Default score
                    
                    # 1. Title-Based Re-Ranking
                    title = result.get('title', '').lower()
                    title_matches = sum(1 for term in query_terms if term in title)
                    
                    # 2. Using Metadata for Scoring
                    agency = result.get('agency', '').lower() or result.get('department', '').lower()
                    agency_matches = sum(1 for term in query_terms if term in agency)
                    
                    # NAICS code exact match bonus
                    naics_bonus = 0.15 if naics_code and str(result.get('naics_code', '')) == str(naics_code) else 0
                    
                    # 3. Term Frequency Analysis - weight by how many different terms match
                    term_match_ratio = title_matches / len(query_terms) if query_terms else 0
                    
                    # 4. N-gram Matching
                    # Create bi-grams (two consecutive words) from the query terms
                    query_words = [word for word in query.lower().replace('OR', ' ').replace('AND', ' ')
                                  .replace('site:sam.gov', '').split() if word]
                    query_bigrams = [f"{query_words[i]} {query_words[i+1]}" for i in range(len(query_words)-1)]
                    
                    # Check for bi-gram matches in the title
                    bigram_matches = sum(1 for bigram in query_bigrams if bigram in title)
                    
                    # 5. User Interaction Boosting
                    interaction_boost = 0
                    result_id = str(result.get('id', ''))
                    if result_id in user_interactions:
                        interaction_boost = user_interactions[result_id] * 0.3  # 30% weight to user history
                    
                    # Domain-specific boosts based on NAICS code patterns
                    domain_boost = 0
                    if naics_code:
                        naics = str(result.get('naics_code', ''))
                        # Examples of domain-specific boosts
                        cybersecurity_naics = ['541519', '541512']
                        software_naics = ['541511']
                        
                        if 'cyber' in query.lower() and naics in cybersecurity_naics:
                            domain_boost = 0.1
                        elif 'software' in query.lower() and naics in software_naics:
                            domain_boost = 0.1
                    
                    # Combine all scores with appropriate weights
                    result['relevance_score'] = (
                        base_score + 
                        (title_matches * 0.15) +           # Title match bonus
                        (agency_matches * 0.05) +          # Agency match bonus
                        naics_bonus +                      # NAICS exact match bonus
                        (term_match_ratio * 0.1) +         # Term frequency bonus
                        (bigram_matches * 0.2) +           # N-gram matching (higher weight)
                        interaction_boost +                # User interaction history
                        domain_boost                       # Domain-specific relevance
                    )
                
                # Re-sort by the new relevance score
                all_results.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
                
                return all_results
        finally:
            connection.close()

    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return []  # Return empty list instead of raising