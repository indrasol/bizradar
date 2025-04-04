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

# After index initialization, add:
try:
    index_stats = index.describe_index_stats()
    logger.info(f"Index stats: {index_stats}")
    logger.info(f"Dimension: {index_stats.dimension}")
    logger.info(f"Total vectors: {index_stats.total_vector_count}")
    logger.info(f"Namespaces: {index_stats.namespaces}")
except Exception as e:
    logger.error(f"Error getting index stats: {str(e)}")

# Add this after index initialization
try:
    # Get a sample vector to check metadata structure
    sample_results = index.query(
        vector=[0] * 384,  # Zero vector
        top_k=1,
        include_metadata=True
    )
    if sample_results.matches:
        logger.info("Sample vector metadata structure:")
        logger.info(sample_results.matches[0].metadata)
except Exception as e:
    logger.error(f"Error checking metadata structure: {str(e)}")

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
            logger.warning(f"Could not extract numeric ID from {pinecone_id}")
            return None, source
    
    # For plain IDs (no prefix)
    try:
        return int(pinecone_id), "unknown"
    except ValueError:
        logger.warning(f"Could not convert {pinecone_id} to integer")
        return None, "unknown"

def search_jobs(query: str, contract_type: Optional[str] = None, platform: Optional[str] = None) -> List[Dict]:
    """
    Search for job opportunities using vector similarity and filters.
    Now includes external URLs in the results for direct linking.
    """
    try:
        logger.info(f"Starting search with query: {query}")
        logger.info(f"Filters - Contract Type: {contract_type}, Platform: {platform}")

        # Generate query embedding
        query_embedding = model.encode(query).tolist()
        logger.info(f"Query embedding shape: {len(query_embedding)}")

        # Normalize the embedding
        norm = np.linalg.norm(query_embedding)
        if norm > 0:
            query_embedding = (np.array(query_embedding) / norm).tolist()
            logger.info("Embedding normalized")

        # Query Pinecone with a high top_k to get all potential matches
        try:
            results = index.query(
                vector=query_embedding,
                top_k=100,  # Get more potential matches
                include_metadata=True,
                namespace=""
            )
            
            logger.info(f"Query results: {len(results.matches)} matches")
            
            if not results.matches:
                logger.warning("No matches found in vector search")
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
                
                logger.info(f"Using threshold {threshold:.4f} for filtering")
                
                # Apply the threshold
                filtered_matches = [match for match in results.matches if match.score >= threshold]
            else:
                filtered_matches = []
            
            logger.info(f"Filtered from {len(results.matches)} to {len(filtered_matches)} relevant matches")

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
                except Exception as e:
                    logger.error(f"Error processing match ID {match.id}: {str(e)}")
                    continue
            
            logger.info(f"Extracted job IDs: {len(sam_gov_ids)} from SAM.gov, {len(freelancer_ids)} from freelancer")
            
            if not sam_gov_ids and not freelancer_ids:
                logger.info("No matching jobs found")
                return []

        except Exception as e:
            logger.error(f"Pinecone query error: {str(e)}")
            logger.error(f"Query embedding dimension: {len(query_embedding)}")
            return []

        # Define a set of valid NAICS codes
        VALID_NAICS_CODES = {
            541511, 541512, 541513, 541519, 518210,
            541690, 561622, 511210, 541330, 541341,
            518210, 519130, 517311, 517312, 517410,
            541715, 541720
        }

        # Fetch from database
        connection = get_connection()
        if not connection:
            logger.error("Could not establish database connection")
            return []

        try:
            with connection.cursor() as cursor:
                all_results = []
                
                # Debug SAM.gov IDs
                logger.info(f"SAM.gov IDs to retrieve: {sam_gov_ids}")

                # Fetch SAM.gov records if we have IDs
                if sam_gov_ids:
                    placeholders = ','.join(['%s'] * len(sam_gov_ids))
                    query_sql = f"""
                        SELECT id, notice_id, solicitation_number, title, department, 
                               naics_code, published_date, response_date, description, 
                               url, active
                        FROM sam_gov 
                        WHERE id IN ({placeholders})
                    """
                    logger.info(f"SAM.gov SQL query: {query_sql}")
                    logger.info(f"SAM.gov IDs for query: {sam_gov_ids}")
                    
                    try:
                        cursor.execute(query_sql, sam_gov_ids)
                        sam_gov_results = cursor.fetchall()
                        logger.info(f"SAM.gov raw results count: {len(sam_gov_results)}")
                        
                        if not sam_gov_results:
                            # Try debugging query to see exact table structure
                            cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'sam_gov' LIMIT 20")
                            columns = cursor.fetchall()
                            logger.info(f"SAM.gov table columns: {columns}")
                            
                            # Try a simpler query to check if table has any data
                            cursor.execute("SELECT COUNT(*) FROM sam_gov")
                            count = cursor.fetchone()[0]
                            logger.info(f"Total records in sam_gov table: {count}")
                            
                            # Try to fetch one of the IDs directly to check format
                            if sam_gov_ids:
                                cursor.execute(f"SELECT id FROM sam_gov WHERE id = %s", [sam_gov_ids[0]])
                                direct_match = cursor.fetchone()
                                logger.info(f"Direct ID check for {sam_gov_ids[0]}: {direct_match}")
                    except Exception as e:
                        logger.error(f"Error executing SAM.gov query: {str(e)}")
                    
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
                        
                        # Validate NAICS code
                        if result.get('naics_code') not in VALID_NAICS_CODES:
                            logger.warning(f"Invalid NAICS code {result.get('naics_code')} for job {result['title']}. Excluding from results.")
                            continue  # Skip this result if the NAICS code is invalid
                        
                        # Only add valid results to all_results
                        all_results.append(result)  # Add only if valid
                    logger.info(f"Retrieved {len(all_results)} SAM.gov jobs")
                
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
                    cursor.execute(query_sql, freelancer_ids)
                    
                    columns = ["id", "title", "description", "agency", "platform", "value", "external_url"]
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