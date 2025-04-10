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

def extract_id_from_pinecone(pinecone_id):
    """
    Extract the original database ID from a Pinecone ID.
    Handles both formats: 'sam_gov_123' or 'freelancer_456' or plain '123'
    Returns the numeric ID as an integer.
    """
    if pinecone_id is None:
        return None
        
    # If the ID has a prefix like "sam_gov_" or "freelancer_"
    if "_" in pinecone_id:
        parts = pinecone_id.split("_")
        # The numeric ID is the last part after the prefix
        id_part = parts[-1]
        try:
            return int(id_part)
        except ValueError:
            logger.warning(f"Could not extract numeric ID from {pinecone_id}")
            return None
    
    # For plain IDs (no prefix)
    try:
        return int(pinecone_id)
    except ValueError:
        logger.warning(f"Could not convert {pinecone_id} to integer")
        return None

def extract_id_from_pinecone(pinecone_id):
    """
    Extract the original database ID from a Pinecone ID.
    Handles both formats: 'sam_gov_123' or 'freelancer_456' or plain '123'
    Returns the numeric ID as an integer.
    """
    if pinecone_id is None:
        return None
        
    # If the ID has a prefix like "sam_gov_" or "freelancer_"
    if "_" in pinecone_id:
        parts = pinecone_id.split("_")
        # The numeric ID is the last part after the prefix
        id_part = parts[-1]
        try:
            return int(id_part)
        except ValueError:
            logger.warning(f"Could not extract numeric ID from {pinecone_id}")
            return None
    
    # For plain IDs (no prefix)
    try:
        return int(pinecone_id)
    except ValueError:
        logger.warning(f"Could not convert {pinecone_id} to integer")
        return None

def search_jobs(query: str, contract_type: Optional[str] = None, platform: Optional[str] = None) -> List[Dict]:
    """
    Search for job opportunities using vector similarity and filters.
    Now includes filtering by due date, posted date, and NAICS code.
    """
    try:
        # Generate query embedding with minimal logging
        query_embedding = model.encode(query).tolist()

        # Normalize the embedding
        norm = np.linalg.norm(query_embedding)
        if norm > 0:
            query_embedding = (np.array(query_embedding) / norm).tolist()
            logger.info("Embedding normalized")

        # Build filter based on parameters
        filter_dict = {}
        if platform:
            filter_dict["source"] = platform
        if contract_type:
            filter_dict["department"] = contract_type
            
        # Log the filter being used
        logger.info(f"Using filter: {filter_dict}")

        # Query Pinecone with a high top_k to get all potential matches
        try:
            results = index.query(
                vector=query_embedding,
                top_k=100,  # Get more potential matches
                include_metadata=True,
                filter=filter_dict if filter_dict else None,
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
            
            logger.info(f"Filtered from {len(results.matches)} to {len(filtered_matches)} relevant matches")
            
            # Process the matches to extract the correct IDs and sources
            processed_matches = []
            for match in filtered_matches:
                # Extract source from metadata
                source = match.metadata.get('source', 'unknown')
                
                # Extract original ID from Pinecone ID
                original_id = extract_id_from_pinecone(match.id)
                
                if original_id is not None:
                    processed_matches.append({
                        'id': original_id,
                        'score': match.score,
                        'source': source
                    })
            
            # Group matches by source
            sam_gov_matches = [m for m in processed_matches if m['source'] == 'sam_gov']
            freelancer_matches = [m for m in processed_matches if m['source'] == 'freelancer']
            
            logger.info(f"Processed matches: {len(processed_matches)} total, "
                       f"{len(sam_gov_matches)} from SAM.gov, "
                       f"{len(freelancer_matches)} from freelancer")
            
            # Extract job IDs for each source
            sam_gov_ids = [m['id'] for m in sam_gov_matches]
            freelancer_ids = [m['id'] for m in freelancer_matches]
            
            logger.info(f"SAM.gov IDs: {sam_gov_ids}")
            logger.info(f"Freelancer IDs: {freelancer_ids}")
            
            if not sam_gov_ids and not freelancer_ids:
                logger.info("No matching jobs found")
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
                    placeholders = ','.join(['%s'] * len(sam_gov_ids))
                    query_sql = f"""
                        SELECT id, title, description, department AS agency, 
                               'sam.gov' AS platform, NULL AS value
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
                    cursor.execute(query_sql, sam_gov_ids)
                    
                    columns = ["id", "title", "description", "agency", "platform", "value"]
                    sam_gov_results = [dict(zip(columns, record)) for record in cursor.fetchall()]
                    all_results.extend(sam_gov_results)
                    logger.info(f"Retrieved {len(sam_gov_results)} SAM.gov jobs")
                
                # Fetch freelancer records if we have IDs
                if freelancer_ids:
                    placeholders = ','.join(['%s'] * len(freelancer_ids))
                    query_sql = f"""
                        SELECT id, title, additional_details AS description, 
                               skills_required AS agency, 'freelancer' AS platform, 
                               price_budget AS value
                        FROM freelancer_table 
                        WHERE id IN ({placeholders})
                    """
                    cursor.execute(query_sql, freelancer_ids)
                    
                    columns = ["id", "title", "description", "agency", "platform", "value"]
                    freelancer_results = [dict(zip(columns, record)) for record in cursor.fetchall()]
                    all_results.extend(freelancer_results)
                    logger.info(f"Retrieved {len(freelancer_results)} freelancer jobs")
                
                # Log retrieved jobs
                logger.info("\n" + "="*50)
                logger.info("Retrieved Jobs:")
                logger.info("="*50)
                for idx, job in enumerate(all_results, 1):
                    logger.info(f"\nJob {idx}:")
                    logger.info(f"Title: {job['title']}")
                    logger.info(f"Platform: {job['platform']}")
                    logger.info(f"Agency/Skills: {job['agency']}")
                    logger.info("-"*40)
                
                logger.info(f"Total jobs retrieved: {len(all_results)}")
                return all_results
        finally:
            connection.close()

    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return []  # Return empty list instead of raising