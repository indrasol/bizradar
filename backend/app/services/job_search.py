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
    Returns the numeric ID as an integer.
    """
    if pinecone_id is None:
        return None
        
    # If the ID has a prefix like "sam_gov_" or "freelancer_"
    if "_" in pinecone_id:
        parts = pinecone_id.split("_")
        # Get the source/platform
        source = parts[0] if parts[0] != "sam" else "sam_gov"
        # The numeric ID is the last part after the prefix
        id_part = parts[-1]
        try:
            return int(id_part), source
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