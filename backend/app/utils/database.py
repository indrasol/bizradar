import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    """Establish and return a connection to our PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            sslmode="require"  # Add this line for Supabase

        )
        return conn
    except psycopg2.Error as e:
        print("Error connecting to the database:", e)
        return None

def insert_data(rows):
    """
    Inserts multiple rows into the sam_gov table.
    """
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            query = """
                INSERT INTO sam_gov
                (title, department, published_date, response_date, naics_code, description,
                 notice_id, solicitation_number, url, active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            for row in rows:
                cursor.execute(query, (
                    row["title"],
                    row["department"],
                    row["published_date"],
                    row["response_date"],
                    row["naics_code"],
                    row["description"],
                    row["notice_id"],
                    row["solicitation_number"],
                    row["url"],
                    row["active"]
                ))
        connection.commit()
    except psycopg2.Error as e:
        connection.rollback()
        print("Error inserting data:", e)
    finally:
        connection.close()
