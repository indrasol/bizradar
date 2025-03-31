import os
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
                SELECT id, title, skills_required, price_budget, bids_so_far, additional_details, published_date  
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
        print("No records found in sam_gov table.")
        return

    # Prepare vectors for Pinecone
    vectors = []
    for record in records:
        # Create content to embed - combine relevant fields
        description = record['description'] if record['description'] else ""
        text = f"{record['title']} {description}"
        embedding = model.encode(text).tolist()

        # Create metadata for filtering
        metadata = {
            "source": "sam_gov",
            "department": record["department"] if record["department"] else "",
            "title": record["title"] if record["title"] else "",
            "published_date": str(record["published_date"]) if record["published_date"] else "",
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
            "skills": record["skills_required"] if record["skills_required"] else "",
            "title": record["title"] if record["title"] else "",
            "bids": str(record["bids_so_far"]) if record["bids_so_far"] else "0",
            "price": str(record["price_budget"]) if record["price_budget"] else "0",
            "published_date": str(record["published_date"]) if record["published_date"] else "",
            "id_type": "freelancer"
        }

        # Add vector to list
        vectors.append((f"freelancer_{record['id']}", embedding, metadata))

    # Batch upsert to Pinecone
    batch_size = 100
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