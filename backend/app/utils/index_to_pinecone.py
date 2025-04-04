import os
import time
import logging
import json
from datetime import datetime, timedelta
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import List, Dict, Optional
from utils.database import get_connection
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

# File to track last indexing timestamp
INDEX_STATE_FILE = "index_state.json"

def load_index_state():
    """Load the last indexing state from a file"""
    try:
        if os.path.exists(INDEX_STATE_FILE):
            with open(INDEX_STATE_FILE, 'r') as f:
                return json.load(f)
        return {
            "sam_gov": {"last_indexed": None, "count": 0},
            "freelancer": {"last_indexed": None, "count": 0}
        }
    except Exception as e:
        logger.error(f"Error loading index state: {str(e)}")
        return {
            "sam_gov": {"last_indexed": None, "count": 0},
            "freelancer": {"last_indexed": None, "count": 0}
        }

def save_index_state(state):
    """Save the current indexing state to a file"""
    try:
        with open(INDEX_STATE_FILE, 'w') as f:
            json.dump(state, f)
    except Exception as e:
        logger.error(f"Error saving index state: {str(e)}")

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

def fetch_sam_gov_records(last_indexed: Optional[str] = None) -> List[Dict]:
    """
    Fetch records from the sam_gov table in Postgres.
    If last_indexed is provided, only fetch records updated since that time.
    """
    connection = get_connection()
    if connection is None:
        raise Exception("Failed to connect to PostgreSQL")

    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if created_at and updated_at columns exist
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'sam_gov' AND 
                      column_name IN ('created_at', 'updated_at')
            """)
            existing_columns = [row['column_name'] for row in cursor.fetchall()]
            
            # If timestamp columns don't exist, get all records
            if 'created_at' not in existing_columns or 'updated_at' not in existing_columns or not last_indexed:
                cursor.execute("""
                    SELECT id, title, description, department, published_date, 
                           notice_id, solicitation_number, response_date, naics_code, url
                    FROM sam_gov
                """)
                records = cursor.fetchall()
                logger.info(f"Fetched {len(records)} SAM.gov records from database")
            else:
                # Use timestamp columns for incremental updates
                cursor.execute("""
                    SELECT id, title, description, department, published_date, 
                           notice_id, solicitation_number, response_date, naics_code, url,
                           created_at, updated_at
                    FROM sam_gov
                    WHERE created_at > %s OR updated_at > %s
                """, (last_indexed, last_indexed))
                records = cursor.fetchall()
                logger.info(f"Fetched {len(records)} SAM.gov records from database since {last_indexed}")
            
        return records
    except psycopg2.Error as e:
        logger.error(f"Error fetching sam_gov records: {str(e)}")
        raise Exception(f"Error fetching sam_gov records: {str(e)}")
    finally:
        connection.close()

def fetch_freelancer_data_table(last_indexed: Optional[str] = None) -> List[Dict]:
    """
    Fetch records from the freelancer_data_table table in Postgres.
    If last_indexed is provided, only fetch records updated since that time.
    """
    connection = get_connection()
    if connection is None:
        raise Exception("Failed to connect to PostgreSQL")

    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if created_at and updated_at columns exist
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'freelancer_data_table' AND 
                      column_name IN ('created_at', 'updated_at')
            """)
            existing_columns = [row['column_name'] for row in cursor.fetchall()]
            
            # If timestamp columns don't exist or no last_indexed, get all records
            if 'created_at' not in existing_columns or 'updated_at' not in existing_columns or not last_indexed:
                cursor.execute("""
                    SELECT id, title, skills_required, price_budget, bids_so_far, 
                           additional_details, published_date, job_url
                    FROM freelancer_data_table
                """)
                records = cursor.fetchall()
                logger.info(f"Fetched {len(records)} Freelancer records from database")
            else:
                # Use timestamp columns for incremental updates
                cursor.execute("""
                    SELECT id, title, skills_required, price_budget, bids_so_far, 
                           additional_details, published_date, job_url, created_at, updated_at
                    FROM freelancer_data_table
                    WHERE created_at > %s OR updated_at > %s
                """, (last_indexed, last_indexed))
                records = cursor.fetchall()
                logger.info(f"Fetched {len(records)} Freelancer records from database since {last_indexed}")
                
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

def check_vector_exists(record_id):
    """
    Check if a vector with the given ID already exists in Pinecone
    """
    try:
        result = index.fetch(ids=[record_id])
        return bool(result.vectors)
    except Exception as e:
        logger.error(f"Error checking if vector exists: {str(e)}")
        return False

def index_sam_gov_to_pinecone(incremental=True):
    """
    Generate embeddings for sam_gov records and upsert them to Pinecone.
    If incremental is True, only process records since the last indexing.
    """
    # Load the current indexing state
    state = load_index_state()
    last_indexed = state["sam_gov"]["last_indexed"] if incremental else None
    
    # Fetch records from sam_gov table
    records = fetch_sam_gov_records(last_indexed)
    if not records:
        logger.warning("No new records found in sam_gov table to index.")
        return 0
    
    # Keep track of successfully indexed records
    indexed_count = 0
    skipped_count = 0
    vectors = []

    # Process records
    for record in tqdm(records, desc="Processing SAM.gov records"):
        try:
            # Create content to embed - combine relevant fields
            description = record['description'] if record['description'] else ""
            title = record['title'] if record['title'] else ""
            
            # Skip records with no meaningful content
            if not title.strip() and not description.strip():
                logger.warning(f"Skipping record {record['id']} due to empty content")
                skipped_count += 1
                continue
                
            # Combine fields for embedding
            text = f"{title} {description}"
            embedding = model.encode(text).tolist()
            
            # Normalize the embedding
            embedding = normalize_embedding(embedding)
            if not embedding:
                logger.warning(f"Failed to normalize embedding for record {record['id']}")
                skipped_count += 1
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
                "url_available": "yes" if record.get("url") else "no",
                "indexed_at": datetime.now().isoformat()
            }

            # Create the Pinecone ID
            record_id = f"sam_gov_{record['id']}"
            
            # Add vector to list (id must be a string in Pinecone)
            vectors.append((record_id, embedding, metadata))
            indexed_count += 1
            
        except Exception as e:
            logger.error(f"Error processing SAM.gov record {record['id']}: {str(e)}")
            skipped_count += 1

    # Batch upsert to Pinecone
    batch_size = 100
    total_batches = (len(vectors) + batch_size - 1) // batch_size
    
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        try:
            index.upsert(vectors=batch)
            logger.info(f"Upserted sam_gov batch {i//batch_size + 1} of {total_batches}")
        except Exception as e:
            logger.error(f"Error upserting sam_gov batch {i//batch_size + 1}: {str(e)}")
            indexed_count -= len(batch)  # Adjust count for failed batch

    # Update the state with the latest indexing time
    if indexed_count > 0:
        state["sam_gov"]["last_indexed"] = datetime.now().isoformat()
        state["sam_gov"]["count"] += indexed_count
        save_index_state(state)
    
    logger.info(f"Successfully indexed {indexed_count} sam_gov records to Pinecone. Skipped {skipped_count} records.")
    return indexed_count

def index_freelancer_data_table_to_pinecone(incremental=True):
    """
    Generate embeddings for freelancer_data_table records and upsert them to Pinecone.
    If incremental is True, only process records since the last indexing.
    """
    # Load the current indexing state
    state = load_index_state()
    last_indexed = state["freelancer"]["last_indexed"] if incremental else None
    
    # Fetch records from freelancer_data_table
    records = fetch_freelancer_data_table(last_indexed)
    if not records:
        logger.warning("No new records found in freelancer_data_table to index.")
        return 0

    # Keep track of successfully indexed records
    indexed_count = 0
    skipped_count = 0
    vectors = []

    # Process records
    for record in tqdm(records, desc="Processing Freelancer records"):
        try:
            # Create content to embed - combine relevant fields
            additional_details = record['additional_details'] if record['additional_details'] else ""
            skills = record['skills_required'] if record['skills_required'] else ""
            title = record['title'] if record['title'] else ""
            
            # Skip records with no meaningful content
            if not title.strip() and not skills.strip() and not additional_details.strip():
                logger.warning(f"Skipping record {record['id']} due to empty content")
                skipped_count += 1
                continue
                
            # Combine fields for embedding
            text = f"{title} {skills} {additional_details}"
            embedding = model.encode(text).tolist()
            
            # Normalize the embedding
            embedding = normalize_embedding(embedding)
            if not embedding:
                logger.warning(f"Failed to normalize embedding for record {record['id']}")
                skipped_count += 1
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
                "job_url": record["job_url"] if record.get("job_url") else "",
                "indexed_at": datetime.now().isoformat()
            }

            # Create the Pinecone ID
            record_id = f"freelancer_{record['id']}"
            
            # Add vector to list
            vectors.append((record_id, embedding, metadata))
            indexed_count += 1
            
        except Exception as e:
            logger.error(f"Error processing Freelancer record {record['id']}: {str(e)}")
            skipped_count += 1

    # Batch upsert to Pinecone
    batch_size = 100
    total_batches = (len(vectors) + batch_size - 1) // batch_size
    
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        try:
            index.upsert(vectors=batch)
            logger.info(f"Upserted freelancer batch {i//batch_size + 1} of {total_batches}")
        except Exception as e:
            logger.error(f"Error upserting freelancer batch {i//batch_size + 1}: {str(e)}")
            indexed_count -= len(batch)  # Adjust count for failed batch

    # Update the state with the latest indexing time
    if indexed_count > 0:
        state["freelancer"]["last_indexed"] = datetime.now().isoformat()
        state["freelancer"]["count"] += indexed_count
        save_index_state(state)
    
    logger.info(f"Successfully indexed {indexed_count} freelancer records to Pinecone. Skipped {skipped_count} records.")
    return indexed_count

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

def index_all_to_pinecone(incremental=True, sources=None):
    """
    Index data to Pinecone with flexible options
    
    Args:
        incremental: If True, only index records since last indexing run
        sources: List of sources to index ["sam_gov", "freelancer"], or None for all
    """
    start_time = time.time()
    
    # Check the index first
    logger.info("Checking Pinecone index before indexing...")
    before_stats = check_index_stats()
    
    total_indexed = 0
    
    # Index SAM.gov records if requested or if no specific sources are specified
    if not sources or "sam_gov" in sources:
        logger.info("Starting to index SAM.gov records...")
        sam_indexed = index_sam_gov_to_pinecone(incremental=incremental)
        total_indexed += sam_indexed
    
    # Index Freelancer records if requested or if no specific sources are specified
    if not sources or "freelancer" in sources:
        logger.info("\nStarting to index Freelancer projects...")
        freelancer_indexed = index_freelancer_data_table_to_pinecone(incremental=incremental)
        total_indexed += freelancer_indexed
    
    # Check the index after indexing
    logger.info("Checking Pinecone index after indexing...")
    after_stats = check_index_stats()
    
    # Log the difference
    if before_stats and after_stats:
        vectors_added = after_stats.total_vector_count - before_stats.total_vector_count
        logger.info(f"Added {vectors_added} vectors to the index (total processed: {total_indexed})")
    
    # Run a test search
    logger.info("\nTesting search functionality...")
    check_search()
    check_search("web development")
    
    elapsed_time = time.time() - start_time
    logger.info(f"\nIndexing completed in {elapsed_time:.2f} seconds!")
    return {"total_indexed": total_indexed, "elapsed_time": elapsed_time}

if __name__ == "__main__":
    # By default, run incremental indexing (only new/updated records)
    # For a full reindex, run with: python index_to_pinecone.py --full
    import sys
    incremental = "--full" not in sys.argv
    
    if not incremental:
        logger.info("Running FULL reindexing of all records...")
    else:
        logger.info("Running INCREMENTAL indexing (new/updated records only)...")
    
    index_all_to_pinecone(incremental=incremental)