import os
import psycopg2
from config.settings import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

def run_migration():
    """Run database migrations"""
    conn = None
    try:
        # Connect to the database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()
        
        # Read the migration file
        with open('migrations/add_stripe_subscription_id.sql', 'r') as f:
            sql_script = f.read()
        
        # Execute the migration
        cursor.execute(sql_script)
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error running migration: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration()
