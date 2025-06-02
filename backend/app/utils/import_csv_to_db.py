import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import logging
import time
from dotenv import load_dotenv

# ----------------------------
# Configure Logging
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("indexing_csv.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("indexer_csv")

# ----------------------------
# Load Environment Variables
# ----------------------------
load_dotenv()

# ----------------------------
# Constants
# ----------------------------
CSV_URL = "https://s3.amazonaws.com/falextracts/Contract%20Opportunities/datagov/ContractOpportunitiesFullCSV.csv"
NOTICE_ID_COL = "NoticeId"
DESCRIPTION_COL = "Description"

# ----------------------------
# Helper Function: Check for Duplicate
# ----------------------------
def check_duplicate(cursor, notice_id: str) -> bool:
    """
    Check if a notice_id already exists in the sam_gov_csv table.
    """
    cursor.execute("SELECT 1 FROM sam_gov_csv WHERE notice_id = %s", (notice_id,))
    exists = cursor.fetchone() is not None
    logger.debug(f"Checked for duplicate notice_id={notice_id}: {'FOUND' if exists else 'NOT FOUND'}")
    return exists

# ----------------------------
# Main Function to Import CSV
# ----------------------------
def import_csv_to_db(chunksize=50000):
    start_time = time.time()
    logger.info("Starting CSV import process...")

    try:
        # Connect to database
        logger.info("Connecting to database...")
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        cursor = conn.cursor()
        logger.info("Connected to database.")

        # Create table if not exists
        logger.info("Ensuring target table and index exist...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sam_gov_csv (
                notice_id VARCHAR(255) PRIMARY KEY,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_sam_gov_csv_notice_id ON sam_gov_csv (notice_id);
        """)
        conn.commit()
        logger.info("Table check and index creation completed.")

        # Read CSV in chunks
        total_rows = 0
        skipped = 0
        logger.info(f"Downloading and processing CSV from: {CSV_URL}")
        
        for i, chunk in enumerate(pd.read_csv(
            CSV_URL,
            chunksize=chunksize,
            usecols=[NOTICE_ID_COL, DESCRIPTION_COL],
            engine="c",
            encoding="cp1252",
            encoding_errors="replace",
        )):
            logger.info(f"Processing chunk {i+1}...")

            # Clean and prepare chunk
            chunk_start = time.time()
            chunk = chunk.dropna(subset=[NOTICE_ID_COL])
            chunk[NOTICE_ID_COL] = chunk[NOTICE_ID_COL].astype(str)
            chunk[DESCRIPTION_COL] = chunk[DESCRIPTION_COL].astype(str).fillna("")

            records = []
            for _, row in chunk.iterrows():
                notice_id = row[NOTICE_ID_COL]
                if check_duplicate(cursor, notice_id):
                    logger.debug(f"Duplicate found: {notice_id}")
                    skipped += 1
                    continue
                records.append((notice_id, row[DESCRIPTION_COL]))

            if records:
                execute_values(
                    cursor,
                    """
                    INSERT INTO sam_gov_csv (notice_id, description, updated_at)
                    VALUES %s
                    """,
                    records,
                    template="(%s, %s, CURRENT_TIMESTAMP)"
                )
                conn.commit()
                total_rows += len(records)
                logger.info(f"Inserted {len(records)} new records (chunk {i+1}) in {time.time() - chunk_start:.2f}s")
            else:
                logger.info(f"No new records to insert in chunk {i+1}")

        logger.info(f"Finished processing CSV in {time.time() - start_time:.2f}s")
        logger.info(f"Total inserted: {total_rows}, Skipped duplicates: {skipped}")

        # Cleanup
        cursor.close()
        conn.close()
        logger.info("Database connection closed.")

    except Exception as e:
        logger.error(f"Error during import: {str(e)}", exc_info=True)
        raise

# ----------------------------
# Entrypoint
# ----------------------------
if __name__ == "__main__":
    import_csv_to_db()
