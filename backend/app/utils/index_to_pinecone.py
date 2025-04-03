import os
import time
import logging
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import List, Dict
from database import get_connection
import numpy as np
from tqdm import tqdm

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("indexing.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("indexer")

# Load environment variables from .env
load_dotenv()

# Initialize models and clients
model = SentenceTransformer('all-MiniLM-L6-v2')  # 384-dimensional embeddings
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("job-indexx")  # Ensure this index exists in Pinecone with dimension 384 and metric 'cosine'

def check_index_stats():
    """
    Check the current state of the Pinecone index
    """
    try:
        stats = index.describe_index_stats()
        logger.info(f"Index dimension: {stats.dimension}")
        logger.info(f"Total vectors: {stats.total_vector_count}")
        logger.info(f"Namespaces: {stats.namespaces}")
        return stats
    except Exception as e:
        logger.error(f"Error checking index stats: {str(e)}")
        return None

def fetch_sam_gov_records() -> List[Dict]:
    """
    Fetch all records from the sam_gov table in Postgres.
    Returns a list of dictionaries with id, title, description, and department.
    """
    connection = get_connection()
    if connection is None:
        raise Exception("Failed to connect to PostgreSQL")

    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, title, description, department, published_date, 
                       notice_id, solicitation_number, response_date, naics_code, url
                FROM sam_gov
            """)
            records = cursor.fetchall()
            logger.info(f"Fetched {len(records)} SAM.gov records from database")
        return records
    except psycopg2.Error as e:
        logger.error(f"Error fetching sam_gov records: {str(e)}")
        raise Exception(f"Error fetching sam_gov records: {str(e)}")
    finally:
        connection.close()

def fetch_freelancer_data_table() -> List[Dict]:
    """
    Fetch all records from the freelancer_data_table table in Postgres.
    Returns a list of dictionaries with relevant fields.
    """
    connection = get_connection()
    if connection is None:
        raise Exception("Failed to connect to PostgreSQL")

    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # First get column names to help debug
            cursor.execute("SELECT * FROM freelancer_data_table LIMIT 1")
            columns = [desc[0] for desc in cursor.description]
            logger.info(f"Available columns in freelancer_data_table: {columns}")
            
            # Now select with the correct column names
            cursor.execute("""
                SELECT id, title, skills_required, price_budget, bids_so_far, 
                       additional_details, published_date, job_url
                FROM freelancer_data_table
            """)
            records = cursor.fetchall()
            logger.info(f"Fetched {len(records)} Freelancer records from database")
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

def index_sam_gov_to_pinecone():
    """
    Generate embeddings for sam_gov records and upsert them to Pinecone.
    """
    # Fetch all records from sam_gov table
    records = fetch_sam_gov_records()
    if not records:
        logger.warning("No records found in sam_gov table.")
        return

    # Prepare vectors for Pinecone
    vectors = []
    for record in records:
        try:
            # Create content to embed - combine relevant fields
            description = record['description'] if record['description'] else ""
            title = record['title'] if record['title'] else ""
            
            # Skip records with no meaningful content
            if not title.strip() and not description.strip():
                logger.warning(f"Skipping record {record['id']} due to empty content")
                continue
                
            # Combine fields for embedding
            text = f"{title} {description}"
            embedding = model.encode(text).tolist()
            
            # Normalize the embedding
            embedding = normalize_embedding(embedding)
            if not embedding:
                logger.warning(f"Failed to normalize embedding for record {record['id']}")
                continue
                
            # Create metadata for filtering - include more fields
            metadata = {
                "source": "sam_gov",
                "id_type": "sam_gov",
                "department": record["department"] if record["department"] else "",
                "title": title,
                "published_date": str(record["published_date"]) if record["published_date"] else "",
                "notice_id": record["notice_id"] if record["notice_id"] else "",
                "solicitation_number": record["solicitation_number"] if record["solicitation_number"] else "",
                "response_date": str(record["response_date"]) if record["response_date"] else "",
                "naics_code": str(record["naics_code"]) if record["naics_code"] else "",
                "url_available": "yes" if record.get("url") else "no"
            }

            # Add vector to list (id must be a string in Pinecone)
            vectors.append((f"sam_gov_{record['id']}", embedding, metadata))
            
        except Exception as e:
            logger.error(f"Error processing SAM.gov record {record['id']}: {str(e)}")

    # Batch upsert to Pinecone
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        try:
            index.upsert(vectors=batch)
            logger.info(f"Upserted sam_gov batch {i//batch_size + 1} of {len(vectors)//batch_size + 1}")
        except Exception as e:
            logger.error(f"Error upserting sam_gov batch {i//batch_size + 1}: {str(e)}")

    logger.info(f"Successfully indexed {len(vectors)} sam_gov records to Pinecone.")

def index_freelancer_data_table_to_pinecone():
    """
    Generate embeddings for freelancer_data_table records and upsert them to Pinecone.
    """
    # Fetch all records from freelancer_data_table table
    records = fetch_freelancer_data_table()
    if not records:
        logger.warning("No records found in freelancer_data_table table.")
        return

    # Prepare vectors for Pinecone
    vectors = []
    for record in records:
        try:
            # Create content to embed - combine relevant fields
            additional_details = record['additional_details'] if record['additional_details'] else ""
            skills = record['skills_required'] if record['skills_required'] else ""
            title = record['title'] if record['title'] else ""
            
            # Skip records with no meaningful content
            if not title.strip() and not skills.strip() and not additional_details.strip():
                logger.warning(f"Skipping record {record['id']} due to empty content")
                continue
                
            # Combine fields for embedding
            text = f"{title} {skills} {additional_details}"
            embedding = model.encode(text).tolist()
            
            # Normalize the embedding
            embedding = normalize_embedding(embedding)
            if not embedding:
                logger.warning(f"Failed to normalize embedding for record {record['id']}")
                continue

            # Create metadata for filtering
            metadata = {
                "source": "freelancer",
                "id_type": "freelancer",
                "skills": skills,
                "title": title,
                "bids": str(record["bids_so_far"]) if record["bids_so_far"] else "0",
                "price": str(record["price_budget"]) if record["price_budget"] else "0",
                "published_date": str(record["published_date"]) if record["published_date"] else "",
                "job_url": record["job_url"] if record.get("job_url") else ""
            }

            # Add vector to list
            vectors.append((f"freelancer_{record['id']}", embedding, metadata))
            
        except Exception as e:
            logger.error(f"Error processing Freelancer record {record['id']}: {str(e)}")

    # Batch upsert to Pinecone
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        try:
            index.upsert(vectors=batch)
            logger.info(f"Upserted freelancer batch {i//batch_size + 1} of {len(vectors)//batch_size + 1}")
        except Exception as e:
            logger.error(f"Error upserting freelancer batch {i//batch_size + 1}: {str(e)}")

    logger.info(f"Successfully indexed {len(vectors)} freelancer records to Pinecone.")

def check_search(query="cybersecurity"):
    """
    Simple test to verify indexing worked correctly
    """
    logger.info(f"Testing search with query: '{query}'")
    
    try:
        # Generate query embedding
        query_embedding = model.encode(query).tolist()
        embedding = normalize_embedding(query_embedding)
        
        # Search without filter first
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

def index_all_to_pinecone():
    """
    Index both sam_gov and freelancer_data_table to Pinecone
    """
    start_time = time.time()
    
    # Check the index first
    logger.info("Checking Pinecone index before indexing...")
    before_stats = check_index_stats()
    
    logger.info("Starting to index SAM.gov records...")
    index_sam_gov_to_pinecone()
    
    logger.info("\nStarting to index Freelancer projects...")
    index_freelancer_data_table_to_pinecone()
    
    # Check the index after indexing
    logger.info("Checking Pinecone index after indexing...")
    after_stats = check_index_stats()
    
    # Log the difference
    if before_stats and after_stats:
        vectors_added = after_stats.total_vector_count - before_stats.total_vector_count
        logger.info(f"Added {vectors_added} vectors to the index")
    
    # Run a test search
    logger.info("\nTesting search functionality...")
    check_search()
    check_search("web development")
    
    elapsed_time = time.time() - start_time
    logger.info(f"\nIndexing completed for both datasets in {elapsed_time:.2f} seconds!")

if __name__ == "__main__":
    index_all_to_pinecone()