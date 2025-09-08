# backend/app/utils/db_utils.py
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.config.settings import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
except ImportError:
    from config.settings import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
from utils.logger import get_logger
try:
    # supabase-py client (install via: pip install supabase)
    from supabase import create_client  # type: ignore
except Exception:
    create_client = None  # Lazily error when used

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

def get_supabase_connection(use_service_key: bool = True):
    """
    Initialize and return a Supabase client using environment variables.
    Prefers service key for elevated privileges when available.

    Expected env vars:
      - SUPABASE_URL_BIZ
      - SUPABASE_SERVICE_KEY_BIZ (preferred for writes)
      - SUPABASE_ANON_KEY_BIZ (fallback)
    """
    try:
        # Ensure env variables are loaded
        load_dotenv()

        url = os.getenv("SUPABASE_URL_BIZ") or os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_SERVICE_KEY_BIZ")
        anon_key = os.getenv("SUPABASE_ANON_KEY_BIZ")

        key = service_key if (use_service_key and service_key) else (anon_key or service_key)

        if not url or not key:
            raise MissingEnvironmentVariableError(
                "Missing SUPABASE_URL_BIZ and/or SUPABASE_*_KEY_BIZ env vars"
            )
        if create_client is None:
            raise RuntimeError(
                "Supabase client not installed. Please install with: pip install supabase"
            )

        client = create_client(url, key)
        logger.info("Supabase client initialized")
        return client
    except Exception as e:
        logger.error(f"Supabase client initialization error: {e}")
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
