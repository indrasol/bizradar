# backend/app/utils/db_utils.py
import os
import psycopg2
from utils.logger import get_logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = get_logger(__name__)

def get_db_connection():
    """
    Create and return a connection to the PostgreSQL database
    """
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def initialize_tables():
    """
    Initialize required database tables if they don't exist
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create ETL history table
        create_etl_history_table = '''
        CREATE TABLE IF NOT EXISTS etl_history (
            id SERIAL PRIMARY KEY,
            time_fetched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_records INTEGER DEFAULT 0,
            sam_gov_count INTEGER DEFAULT 0,
            sam_gov_new_count INTEGER DEFAULT 0,
            freelancer_count INTEGER DEFAULT 0,
            freelancer_new_count INTEGER DEFAULT 0,
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        '''
        
        cursor.execute(create_etl_history_table)
        conn.commit()
        cursor.close()
        conn.close()
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")
        raise