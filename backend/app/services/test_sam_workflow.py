import os
import sys
import uuid
from datetime import datetime, timedelta
import asyncio
import logging

# Add the parent directory to the Python path so we can import utils
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Now import the database module
from utils.database import insert_data, get_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_workflow():
    """
    Test function to insert a test record and trigger the indexing process.
    This simulates the fetch_opportunities function but with a single test record.
    """
    logger.info("Starting test workflow with test record insertion")
    
    # Generate a unique ID for this test
    test_id = str(uuid.uuid4())
    unique_notice_id = f"test-{test_id[:8]}"
    
    # Create a test record with a unique notice_id
    test_record = {
        "notice_id": unique_notice_id,
        "solicitation_number": f"TEST-SOLICITATION-{test_id[:6]}",
        "title": "Test Record for Pinecone Indexing Verification",
        "department": "TEST DEPARTMENT",
        "naics_code": 541512,  # Computer Systems Design Services
        "published_date": datetime.now().date(),
        "response_date": (datetime.now() + timedelta(days=30)).date(),
        "description": "This is a test record created to verify the end-to-end workflow from PostgreSQL insertion to Pinecone indexing. The record contains specific keywords like machine learning, artificial intelligence, and data analytics that should be captured in the embedding.",
        "url": f"https://test-url.example.com/{unique_notice_id}",
        "active": True
    }
    
    logger.info(f"Created test record with notice_id: {unique_notice_id}")
    
    # Insert the test record into the database
    rows = [test_record]
    result = insert_data(rows)
    
    logger.info(f"Database insertion result: {result}")
    
    # Check if the record was inserted successfully
    if result.get("inserted", 0) > 0:
        logger.info("Test record inserted successfully, now triggering Pinecone indexing...")
        
        try:
            # Import the indexing function
            sys.path.append(os.path.join(parent_dir, "utils"))
            
            # Try importing using the direct path first
            try:
                from index_to_pinecone import index_sam_gov_to_pinecone
            except ImportError:
                # If that fails, try importing as if we're in the app directory
                from utils.index_to_pinecone import index_sam_gov_to_pinecone
            
            # Run indexing for SAM.gov only (incremental)
            index_result = index_sam_gov_to_pinecone(incremental=True)
            
            logger.info(f"Pinecone indexing completed with {index_result} records indexed")
            
            # Return a success report
            return {
                "status": "success",
                "notice_id": unique_notice_id,
                "db_result": result,
                "index_result": index_result
            }
            
        except ImportError as e:
            logger.error(f"Could not import index_to_pinecone module: {e}")
            logger.error(f"sys.path is now: {sys.path}")
            return {
                "status": "error",
                "message": f"Database insertion succeeded but indexing failed: {e}",
                "notice_id": unique_notice_id,
                "db_result": result
            }
        except Exception as e:
            logger.error(f"Error during Pinecone indexing: {e}")
            return {
                "status": "error",
                "message": f"Unexpected error during indexing: {e}",
                "notice_id": unique_notice_id,
                "db_result": result
            }
    else:
        logger.warning("Test record was not inserted. Check for duplicates or database errors.")
        return {
            "status": "warning",
            "message": "Test record was not inserted",
            "notice_id": unique_notice_id,
            "db_result": result
        }

# For running as a script
if __name__ == "__main__":
    # Run the test function and print its result
    result = asyncio.run(test_workflow())
    print("\n----------- TEST RESULT -----------")
    print(f"Status: {result.get('status', 'unknown')}")
    print(f"Notice ID: {result.get('notice_id', 'unknown')}")
    
    if result.get('status') == 'success':
        print(f"Records inserted to DB: {result.get('db_result', {}).get('inserted', 0)}")
        print(f"Records indexed to Pinecone: {result.get('index_result', 0)}")
        print("\nTEST SUCCESSFUL! The end-to-end workflow is working correctly.")
    else:
        print(f"Error: {result.get('message', 'Unknown error')}")
        print(f"DB Result: {result.get('db_result', {})}")
        print("\nTEST FAILED. Please check the logs for details.")