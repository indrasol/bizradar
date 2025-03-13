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
            
            # Extract job IDs from the filtered matches
            job_ids = [int(match.id) for match in filtered_matches] if filtered_matches else []
            logger.info(f"Extracted job IDs: {job_ids}")
            
            if not job_ids:
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
                # Use a placeholders approach to handle any number of IDs
                if job_ids:
                    placeholders = ','.join(['%s'] * len(job_ids))
                    query_sql = f"""
                        SELECT id, title, description, department AS agency, 
                               'sam.gov' AS platform, NULL AS value
                        FROM sam_gov 
                        WHERE id IN ({placeholders})
                    """
                    cursor.execute(query_sql, job_ids)
                    
                    columns = ["id", "title", "description", "agency", "platform", "value"]
                    results = [dict(zip(columns, record)) for record in cursor.fetchall()]
                    
                    # Log retrieved jobs
                    logger.info("\n" + "="*50)
                    logger.info("Retrieved Jobs:")
                    logger.info("="*50)
                    for idx, job in enumerate(results, 1):
                        logger.info(f"\nJob {idx}:")
                        logger.info(f"Title: {job['title']}")
                        logger.info(f"Agency: {job['agency']}")
                        logger.info(f"Platform: {job['platform']}")
                        logger.info("-"*40)
                    
                    logger.info(f"Total jobs retrieved: {len(results)}")
                    return results
                else:
                    return []
        finally:
            connection.close()

    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return []  # Return empty list instead of raising