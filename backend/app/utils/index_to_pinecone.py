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
from typing import List, Dict
from database import get_connection

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
                SELECT id, title, description, department, published_date
                FROM sam_gov
            """)
            records = cursor.fetchall()
        return records
    except psycopg2.Error as e:
        raise Exception(f"Error fetching sam_gov records: {str(e)}")
    finally:
        connection.close()

def fetch_freelancer_table() -> List[Dict]:
    """
    Fetch all records from the freelancer_table table in Postgres.
    Returns a list of dictionaries with relevant fields.
    """
    connection = get_connection()
    if connection is None:
        raise Exception("Failed to connect to PostgreSQL")

    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # First get column names to help debug
            cursor.execute("SELECT * FROM freelancer_table LIMIT 1")
            columns = [desc[0] for desc in cursor.description]
            print(f"Available columns in freelancer_table: {columns}")
            
            # Now select with the correct column names
            cursor.execute("""
                SELECT id, title, skills_required, bids_so_far, price_budget, additional_details, published_date 
                FROM freelancer_table
            """)
            records = cursor.fetchall()
        return records
    except psycopg2.Error as e:
        raise Exception(f"Error fetching freelancer_table records: {str(e)}")
    finally:
        connection.close()

def index_sam_gov_to_pinecone():
    """
    Generate embeddings for sam_gov records and upsert them to Pinecone.
    """
    # Fetch all records from sam_gov table
    records = fetch_sam_gov_records()
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
            # Create the Pinecone ID
            record_id = f"sam_gov_{record['id']}"
            
            # Check if vector already exists in Pinecone - skip if it does
            if check_vector_exists(record_id):
                logger.info(f"Vector {record_id} already exists in Pinecone, skipping")
                skipped_count += 1
                continue
                
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
    for record in records:
        # Create content to embed - combine relevant fields
        description = record['description'] if record['description'] else ""
        text = f"{record['title']} {description}"
        embedding = model.encode(text).tolist()

        # Create metadata for filtering
        metadata = {
            "source": "sam_gov",
            "department": record["department"],
            "title": record["title"],
            "published_date": str(record["published_date"]),
            "id_type": "sam_gov"
        }

        # Add vector to list (id must be a string in Pinecone)
        vectors.append((f"sam_gov_{record['id']}", embedding, metadata))

    # Batch upsert to Pinecone
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        try:
            index.upsert(vectors=batch)
            print(f"Upserted sam_gov batch {i//batch_size + 1} of {len(vectors)//batch_size + 1}")
        except Exception as e:
            print(f"Error upserting sam_gov batch {i//batch_size + 1}: {str(e)}")

    print(f"Successfully indexed {len(records)} sam_gov records to Pinecone.")

def index_freelancer_table_to_pinecone():
    """
    Generate embeddings for freelancer_table records and upsert them to Pinecone.
    """
    # Fetch all records from freelancer_table table
    records = fetch_freelancer_table()
    if not records:
        print("No records found in freelancer_table table.")
        return

    # Prepare vectors for Pinecone
    vectors = []
    for record in records:
        # Create content to embed - combine relevant fields
        additional_details = record['additional_details'] if record['additional_details'] else ""
        skills = record['skills_required'] if record['skills_required'] else ""
        text = f"{record['title']} {skills} {additional_details}"
        embedding = model.encode(text).tolist()

        # Create metadata for filtering
        metadata = {
            "source": "freelancer",
            "skills": record["skills_required"],
            "title": record["title"],
            "bids": str(record["bids_so_far"]),
            "price": str(record["price_budget"]),
            "created_at": str(record["published_date"]),
            "id_type": "freelancer"
        }

        # Add vector to list
        vectors.append((f"freelancer_{record['id']}", embedding, metadata))

    # Batch upsert to Pinecone
    batch_size = 100
    total_batches = (len(vectors) + batch_size - 1) // batch_size
    
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        try:
            index.upsert(vectors=batch)
            print(f"Upserted freelancer batch {i//batch_size + 1} of {len(vectors)//batch_size + 1}")
        except Exception as e:
            print(f"Error upserting freelancer batch {i//batch_size + 1}: {str(e)}")

    print(f"Successfully indexed {len(records)} freelancer records to Pinecone.")

def index_all_to_pinecone():
    """
    Index both sam_gov and freelancer_table to Pinecone
    """
    print("Starting to index SAM.gov records...")
    index_sam_gov_to_pinecone()
    
    print("\nStarting to index Freelancer projects...")
    index_freelancer_table_to_pinecone()
    
    print("\nIndexing completed for both datasets!")

if __name__ == "__main__":
    index_all_to_pinecone()