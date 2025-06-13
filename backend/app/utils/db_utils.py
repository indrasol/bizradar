# backend/app/utils/db_utils.py
import os
import sys
import psycopg2
from dotenv import load_dotenv
from config.settings import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# Load environment variables
load_dotenv()
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils.logger import get_logger

# Configure logging
logger = get_logger(__name__)

class MissingEnvironmentVariableError(Exception):
    pass

def get_db_connection_params():
    required_vars = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"]
    params = {}
    
    # sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    
    import importlib

    # Load the settings module
    # settings_module = importlib.import_module("config.settings")
    
    
    # for var in required_vars:
    #     value = getattr(settings_module, var, None)
    #     if value is None:
    #         raise MissingEnvironmentVariableError(f"Environment variable '{var}' is required but not set.")
    #     params[var] = value

    # Convert port to int safely, default to 5432 if empty or invalid
    # try:
    #     params["DB_PORT"] = int(params["DB_PORT"])
    # except ValueError:
    #     logger.warning(f"Invalid DB_PORT value '{params['DB_PORT']}', using default port 5432")
    #     params["DB_PORT"] = 5432

    return {
        "host": DB_HOST,
        "port": DB_PORT,
        "database": DB_NAME,
        "user": DB_USER,
        "password": DB_PASSWORD,
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
    
get_db_connection_params()
