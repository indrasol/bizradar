# backend/app/utils/db_utils.py
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from utils.logger import get_logger

# Configure logging
logger = get_logger(__name__)

class MissingEnvironmentVariableError(Exception):
    pass

def get_db_connection_params():
    required_vars = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"]
    params = {}

    for var in required_vars:
        value = os.getenv(var)
        if value is None:
            raise MissingEnvironmentVariableError(f"Environment variable '{var}' is required but not set.")
        params[var] = value

    # Convert port to int safely, default to 5432 if empty or invalid
    try:
        params["DB_PORT"] = int(params["DB_PORT"])
    except ValueError:
        logger.warning(f"Invalid DB_PORT value '{params['DB_PORT']}', using default port 5432")
        params["DB_PORT"] = 5432

    return {
        "host": params["DB_HOST"],
        "port": params["DB_PORT"],
        "database": params["DB_NAME"],
        "user": params["DB_USER"],
        "password": params["DB_PASSWORD"],
    }

def get_db_connection():
    """
    Create and return a connection to the PostgreSQL database
    """
    try:
        connection_params = get_db_connection_params()
        conn = psycopg2.connect(**connection_params)
        return conn
    except MissingEnvironmentVariableError as e:
        logger.error(f"Missing env var: {e}")
        raise
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