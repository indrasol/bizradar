
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from utils.logger import get_logger

logger = get_logger(__name__)

_index = None

def get_index():
    global _index
    if _index is None:
        try:
            from pinecone import Pinecone
            logger.info("Initializing Pinecone index...")

            api_key = os.getenv("PINECONE_API_KEY")
            if not api_key:
                logger.error("Environment variable 'PINECONE_API_KEY' is not set or empty.")
            else:
                pc = Pinecone(api_key=api_key)

                index_name = os.getenv("PINECONE_INDEX_NAME") or 'job-indexx'
                if not index_name:
                    logger.error("Environment variable 'PINECONE_INDEX_NAME' is not set or empty.")
                else:   
                    # Check if index exists
                    existing_indexes = pc.list_indexes()  # Typically this method returns a list of index names
                    existing_index_names = [idx.name for idx in existing_indexes]  # extract names
                    if index_name not in existing_index_names:
                        logger.error(f"Pinecone index '{index_name}' does not exist. Available indexes: {existing_indexes}")
                    else:
                        _index = pc.Index(index_name)

                        # Validate index object has expected attribute(s)
                        if not hasattr(_index, 'query'):
                            logger.error(f"Initialized index object does not have expected methods. Index name: {index_name}")
                            _index = None
                        else:
                            logger.info(f"Pinecone index '{index_name}' initialized successfully.")

        except ImportError as e:
            logger.error("Failed to import Pinecone module: %s", e)
            
        except Exception as e:
            logger.error("Error initializing Pinecone index: %s", e)
            
    else:
        logger.debug("Returning existing Pinecone index instance.")

    return _index

# Optional: helper to check index stats (if used elsewhere)
def describe_index_stats():
    try:
        index = get_index()
        stats = index.describe_index_stats()
        logger.info(f"Index dimension: {stats.dimension}")
        logger.info(f"Total vectors: {stats.total_vector_count}")
        logger.info(f"Namespaces: {stats.namespaces}")
        return stats
    except Exception as e:
        logger.error(f"Error getting index stats: {e}")
        return None
    
def check_vector_exists(record_id):
    """
    Check if a vector with the given ID already exists in Pinecone
    """
    try:
        index = get_index()
        result = index.fetch(ids=[record_id])
        return bool(result.vectors)
    except Exception as e:
        logger.error(f"Error checking if vector exists: {str(e)}")
        return False