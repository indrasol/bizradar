import os
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
import psycopg2
from psycopg2.extras import RealDictCursor  # Import RealDictCursor
from dotenv import load_dotenv
from typing import List, Dict
from database import get_connection  # Import from same directory (utils/)

# Load environment variables from .env
load_dotenv()

# Initialize models and clients
model = SentenceTransformer('all-MiniLM-L6-v2')  # Using all-MiniLM-L6-v2 for 384-dimensional embeddings
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))  # Initialize Pinecone client with API key from .env
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
        # Use RealDictCursor to return rows as dictionaries
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, title, description, department
                FROM sam_gov
            """)
            # Fetch all records as dictionaries (no need for dict(row))
            records = [dict(row) for row in cursor.fetchall()]
        return records
    except psycopg2.Error as e:
        raise Exception(f"Error fetching records: {str(e)}")
    finally:
        connection.close()

def index_to_pinecone():
    """
    Generate embeddings for sam_gov records and upsert them to Pinecone.
    Combines title and description for embedding, includes metadata for filtering.
    """
    # Fetch all records from Postgres
    records = fetch_sam_gov_records()
    if not records:
        print("No records found in sam_gov table.")
        return

    # Prepare vectors for Pinecone
    vectors = []
    for record in records:
        # Combine title and description for embedding (adjust if needed)
        text = f"{record['title']} {record['description']}"
        embedding = model.encode(text).tolist()  # Generate 384-dimensional embedding

        # Create metadata with relevant fields for filtering in searches
        metadata = {
            "contract_type": record["department"],  # Assuming department indicates gov contract
            "platform": "sam.gov",  # Hardcoded since all are from SAM.gov
            "title": record["title"]
        }

        # Add vector to list (Pinecone expects (id, vector, metadata))
        vectors.append((str(record["id"]), embedding, metadata))

    # Batch upsert to Pinecone to handle 1,000 records efficiently
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        try:
            index.upsert(vectors=batch)
            print(f"Upserted batch {i//batch_size + 1} of {len(vectors)//batch_size + 1}")
        except Exception as e:
            print(f"Error upserting batch {i//batch_size + 1}: {str(e)}")

    print(f"Successfully indexed {len(records)} records to Pinecone.")

if __name__ == "__main__":
    index_to_pinecone()