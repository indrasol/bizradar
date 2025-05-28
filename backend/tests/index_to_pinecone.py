import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
# import pinecone
# from datetime import datetime, timedelta
from dotenv import load_dotenv
# import numpy as np
# from pinecone.core.client.model.vector import Vector
from typing import List, Dict, Any, Optional, Union, Tuple

import time


# if 'procurlytics' not in pinecone.list_indexes().names():
#     pinecone.create_index(
#         name='procurlytics',
#         dimension=1536,
#         metric='euclidean',
#         spec=ServerlessSpec(
#             cloud='aws',
#             region='us-east1-gcp'
#         )
# )
# if 'procurlytics' not in pinecone.list_indexes().names():
#     pinecone.create_index(
#         name='procurlytics',
#         dimension=1536,
#         metric='euclidean',
#         spec=ServerlessSpec(
#             cloud='aws',
#             region='us-east1-gcp'
#         )
# )

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize the embedding model
def get_embedding_model():
    """Initialize and return the sentence transformer model."""
    try:
        # You can change the model to any sentence-transformer model from Hugging Face
        model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(model_name)
        return model
    except Exception as e:
        logger.error(f"Error loading embedding model: {e}")
        raise

# Database connection function
def get_connection():
    """Establish and return a connection to our PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            sslmode="require"  # For Supabase
        )
        return conn
    except psycopg2.Error as e:
        logger.error(f"Error connecting to the database: {e}")
        return None    

# Pinecone connection function
def initialize_pinecone():
    """Initialize and return the Pinecone client."""
    try:
        api_key = os.getenv("PINECONE_API_KEY") or 'pcsk_6RoTWM_9rPmar9wBeUWBiMGsCJQM9tvcrRskb6CnewfpQWsP84AnioqxHiZqDGZVvRZCx7'
        environment = os.getenv("PINECONE_ENV") or 'us-east-1'
        logger.warning(api_key)
        logger.warning(environment)
        if not api_key or not environment:
            logger.error("Pinecone API key or environment not found in environment variables.")
            return None
            
        # pinecone.init(api_key=api_key, environment=environment)

        from pinecone import Pinecone, ServerlessSpec
        
        pinecone = Pinecone(
            api_key=api_key,
            environment=environment
        )
        
        # Get the index name from environment variable
        index_name = os.getenv("PINECONE_INDEX_NAME", "procurlytics")
        
        # Check if index exists, create it if it doesn't
        if index_name not in pinecone.list_indexes().names():
            logger.info(f"Creating new Pinecone index: {index_name}")
            dimension = 384  # This is for all-MiniLM-L6-v2, adjust for your model
            pinecone.create_index(name=index_name, dimension=dimension, metric="cosine",
                spec=ServerlessSpec(
                    cloud='aws',
                    region='us-east-1'
                )
            )
            logger.info(f"Created index {index_name}")
        
        # Connect to the index
        index = pinecone.Index(index_name)
        return index
    except Exception as e:
        logger.error(f"Error initializing Pinecone: {e}")
        return None

def fetch_records_from_db(chunk_size=1000):
    """
    Fetch all records from the database for indexing.
    
    Args:
        chunk_size: Number of records to fetch at once
        
    Returns:
        List of records from the database
    """
    connection = get_connection()
    if not connection:
        logger.error("Could not connect to database to fetch records")
        return []
    
    all_records = []
    
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # Fetch all records
            query = """
            SELECT id, title, department, published_date, response_date, 
                   naics_code, description, notice_id, solicitation_number, url, active
            FROM sam_gov
            ORDER BY id
            LIMIT %s
            """
            cursor.execute(query, (chunk_size,))
            
            # Fetch all records
            records = cursor.fetchall()
            all_records.extend(records)
            
            logger.info(f"Fetched {len(all_records)} records to index")
            
    except psycopg2.Error as e:
        logger.error(f"Error fetching records: {e}")
    finally:
        connection.close()
        
    return all_records

def create_embedding(model, text: str) -> List[float]:
    """
    Create an embedding vector for the provided text using the sentence transformer model.
    
    Args:
        model: SentenceTransformer model
        text: Text to embed
        
    Returns:
        List of floats representing the embedding vector
    """
    try:
        # Clean up text - remove excessive whitespace, newlines, etc.
        if text is None:
            text = ""
        cleaned_text = " ".join(str(text).split())
        
        # Generate the embedding
        embedding = model.encode(cleaned_text)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Error creating embedding: {e}")
        return []

def prepare_record_for_indexing(record: Dict[str, Any], model) -> Tuple[str, Dict[str, Any], List[float]]:
    """
    Prepare a database record for indexing in Pinecone.
    
    Args:
        record: Database record
        model: SentenceTransformer model
        
    Returns:
        Tuple containing the ID, metadata, and vector
    """
    # Convert record to dictionary if it's not already
    if not isinstance(record, dict):
        record = dict(record)
    
    # Create a unique ID for the record
    record_id = f"sam-{record['notice_id']}"
    
    # Extract and format the text to embed
    text_to_embed = ""
    
    # Combine title and description for the text to embed
    if record.get('title'):
        text_to_embed += record['title'] + " "
    
    if record.get('description'):
        text_to_embed += record['description']
    
    # Create metadata
    metadata = {
        'id': record.get('id'),
        'title': record.get('title', ''),
        'department': record.get('department', ''),
        'notice_id': record.get('notice_id', ''),
        'solicitation_number': record.get('solicitation_number', ''),
        'naics_code': record.get('naics_code'),
        'published_date': record.get('published_date').isoformat() if record.get('published_date') else None,
        'response_date': record.get('response_date').isoformat() if record.get('response_date') else None,
        'url': record.get('url', ''),
        'source': 'sam_gov',
        'active': record.get('active', True)
    }
    
    # Create embedding
    vector = create_embedding(model, text_to_embed)
    
    return record_id, metadata, vector

# Removed mark_records_as_indexed function since we're not tracking indexing status in the database

def index_sam_gov_to_pinecone(batch_size=100, max_records=None):
    """
    Index all SAM.gov records to Pinecone.
    
    Args:
        batch_size: Number of records to index in a single batch
        max_records: Maximum number of records to index (None for no limit)
        
    Returns:
        Number of records indexed
    """
    logger.info("Starting SAM.gov indexing process")
    
    # Initialize Pinecone client
    index = initialize_pinecone()
    if not index:
        logger.error("Failed to initialize Pinecone")
        return 0
        
    # Load embedding model
    try:
        model = get_embedding_model()
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")
        return 0
    
    records_indexed = 0
    total_indexed = 0
    
    # Get records to index
    records = fetch_records_from_db(chunk_size=max_records or 1000)
    
    if not records:
        logger.info("No records to index")
        return 0
        
    logger.info(f"Retrieved {len(records)} records to index")
    
    # Prepare for batch upsert
    vectors_batch = []
    
    try:
        # Process records in batches
        for record in records:
            try:
                # Prepare record for indexing
                record_id, metadata, vector = prepare_record_for_indexing(record, model)
                
                # Skip if vector creation failed
                if not vector:
                    logger.warning(f"Skipping record {record['id']} due to empty vector")
                    continue
                    
                # Create vector object for Pinecone
                vector_obj = {
                    "id": record_id,
                    "values": vector,
                    "metadata": metadata
                }
                
                vectors_batch.append(vector_obj)
                records_indexed += 1
                
                # Upsert when batch is full
                if len(vectors_batch) >= batch_size:
                    # Upsert vectors to Pinecone
                    index.upsert(vectors=vectors_batch)
                    
                    # Log progress
                    total_indexed += len(vectors_batch)
                    logger.info(f"Indexed batch of {len(vectors_batch)} records. Total: {total_indexed}")
                    
                    # Clear batch
                    vectors_batch = []
                    
                    # Add a small delay to avoid rate limits
                    time.sleep(0.5)
                
                # Check if we've reached the maximum number of records
                if max_records and records_indexed >= max_records:
                    logger.info(f"Reached maximum records limit of {max_records}")
                    break
                    
            except Exception as e:
                logger.error(f"Error processing record {record['id']}: {e}")
                continue
                
        # Upsert any remaining vectors
        if vectors_batch:
            index.upsert(vectors=vectors_batch)
            total_indexed += len(vectors_batch)
            logger.info(f"Indexed final batch of {len(vectors_batch)} records. Total: {total_indexed}")
            
        logger.info(f"Indexing completed. Total records indexed: {total_indexed}")
        return total_indexed
        
    except Exception as e:
        logger.error(f"Error during indexing process: {e}")
        return records_indexed

# Function to handle command line arguments
def parse_args():
    """Parse command line arguments"""
    import argparse
    parser = argparse.ArgumentParser(description='SAM.gov data indexing script')
    parser.add_argument('--batch-size', type=int, default=100, help='Number of records to index in a single batch')
    parser.add_argument('--max-records', type=int, help='Maximum number of records to index')
    return parser.parse_args()

# For running as a script
if __name__ == "__main__":
    # Parse command line arguments
    args = parse_args()
    
    # Run the indexing function
    result = index_sam_gov_to_pinecone(
        batch_size=args.batch_size,
        max_records=args.max_records
    )
    
    # Print results
    print(f"Successfully indexed {result} records to Pinecone")