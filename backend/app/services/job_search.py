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
        logger.info(f"First 5 values of embedding: {query_embedding[:5]}")

        # Normalize the embedding
        norm = np.linalg.norm(query_embedding)
        if norm > 0:
            query_embedding = (np.array(query_embedding) / norm).tolist()
            logger.info("Embedding normalized")

        # First try without filters to verify vector search works
        try:
            logger.info("Attempting query without filters first...")
            base_results = index.query(
                vector=query_embedding,
                top_k=5,
                include_metadata=True,
                namespace=""
            )
            
            logger.info(f"Base query results (no filters): {len(base_results.matches)} matches")
            if base_results.matches:
                logger.info("Sample metadata from first match:")
                logger.info(base_results.matches[0].metadata)

            # Now try with filters
            filters = {}
            if contract_type and contract_type.lower() != "all":
                filters["type"] = contract_type.lower()
            if platform and platform.lower() != "all":
                filters["source"] = platform.lower()

            logger.info(f"Attempting query with filters: {filters}")
            filtered_results = index.query(
                vector=query_embedding,
                top_k=10,
                include_metadata=True,
                namespace="",
                filter=filters if filters else None
            )
            
            logger.info(f"Filtered query results: {len(filtered_results.matches)} matches")
            
            # Use the filtered results if available, otherwise use base results
            results = filtered_results if filtered_results.matches else base_results

            if results.matches:
                logger.info("\nTop matches:")
                for idx, match in enumerate(results.matches[:3]):
                    logger.info(f"\nMatch {idx + 1}:")
                    logger.info(f"ID: {match.id}")
                    logger.info(f"Score: {match.score:.4f}")
                    logger.info(f"Metadata: {match.metadata}")
            else:
                logger.warning("No matches found in either filtered or unfiltered search")

        except Exception as e:
            logger.error(f"Pinecone query error: {str(e)}")
            logger.error(f"Query embedding dimension: {len(query_embedding)}")
            return []

        # Extract job IDs
        job_ids = [int(match.id) for match in results.matches] if results.matches else []
        logger.info(f"Extracted job IDs: {job_ids}")

        if not job_ids:
            logger.info("No matching jobs found")
            return []

        # Fetch from database
        connection = get_connection()
        if not connection:
            logger.error("Could not establish database connection")
            return []

        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id, title, description, department AS agency, 
                           'sam.gov' AS platform, NULL AS value
                    FROM sam_gov 
                    WHERE id = ANY(%s)
                """, (job_ids,))
                
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
        finally:
            connection.close()

    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return []  # Return empty list instead of raising