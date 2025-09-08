#!/usr/bin/env python3
"""
Script to run the conversation database migration
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

# Add the app directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.config.settings import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
from app.utils.logger import get_logger

# Load environment variables
load_dotenv()

# Configure logging
logger = get_logger(__name__)

def run_migration():
    """Run the conversation database migration"""
    try:
        # Read the migration SQL file
        migration_file = os.path.join(os.path.dirname(__file__), 'app', 'migrations', 'create_conversations.sql')
        
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        # Connect to the database
        connection_params = {
            "host": DB_HOST,
            "port": DB_PORT,
            "database": DB_NAME,
            "user": DB_USER,
            "password": DB_PASSWORD,
        }
        
        logger.info("Connecting to database...")
        conn = psycopg2.connect(**connection_params)
        cursor = conn.cursor()
        
        logger.info("Running conversation migration...")
        
        # Execute the entire migration as one statement
        try:
            cursor.execute(migration_sql)
            logger.info("Migration SQL executed successfully")
        except psycopg2.Error as e:
            logger.error(f"Migration failed: {e}")
            raise
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info("Conversation migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
