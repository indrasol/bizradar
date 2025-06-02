import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import logging
import time
from dotenv import load_dotenv

# Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("indexing_csv.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("indexer_csv")


# Load environment variables
load_dotenv()

# Constants
CSV_URL = "https://s3.amazonaws.com/falextracts/Contract%20Opportunities/datagov/ContractOpportunitiesFullCSV.csv"
NOTICE_ID_COL = "NoticeId"
DESCRIPTION_COL = "Description"

def check_duplicate(cursor, notice_id: str) -> bool:
    """
    Check if a notice_id already exists in the sam_gov_csv table.
    
    Args:
        cursor: Database cursor
        notice_id: Notice ID to check
    
    Returns:
        bool: True if notice_id exists, False otherwise
    """
    cursor.execute("SELECT 1 FROM sam_gov_csv WHERE notice_id = %s", (notice_id,))
    return cursor.fetchone() is not None

def import_csv_to_db(chunksize=50000):
    """
    Import NoticeId and Description from CSV to PostgreSQL sam_gov_csv table.
    Skips duplicate notice_ids.
    """
    start_time = time.time()
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        cursor = conn.cursor()

        # Create table if not exists
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

        # Read and import CSV in chunks
        total_rows = 0
        skipped = 0
        for chunk in pd.read_csv(
            CSV_URL,
            chunksize=chunksize,
            usecols=[NOTICE_ID_COL, DESCRIPTION_COL],
            engine="c",
            encoding="utf-8",
            encoding_errors="replace",
        ):
            # Clean data
            chunk = chunk.dropna(subset=[NOTICE_ID_COL])
            chunk[NOTICE_ID_COL] = chunk[NOTICE_ID_COL].astype(str)
            chunk[DESCRIPTION_COL] = chunk[DESCRIPTION_COL].astype(str).fillna("")

            # Prepare records, checking for duplicates
            records = []
            for _, row in chunk.iterrows():
                notice_id = row[NOTICE_ID_COL]
                if check_duplicate(cursor, notice_id):
                    logger.info(f"Skipping duplicate record with notice_id: {notice_id}")
                    skipped += 1
                    continue
                records.append((notice_id, row[DESCRIPTION_COL]))

            # Bulk insert non-duplicate records
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
                logger.info(f"Imported {len(records)} records in chunk, total: {total_rows}, skipped: {skipped}")

        cursor.close()
        conn.close()
        logger.info(f"Imported {total_rows} records, skipped {skipped} duplicates in {time.time() - start_time:.2f} seconds")

    except Exception as e:
        logger.error(f"Error importing CSV to database: {str(e)}")
        raise

if __name__ == "__main__":
    import_csv_to_db()