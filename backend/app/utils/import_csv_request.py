import os
import time
import logging
import requests
import threading
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
from tqdm import tqdm
from multiprocessing.pool import ThreadPool
from datetime import datetime, timedelta

# Setup
load_dotenv()
IMPORT_USER = os.getenv("IMPORT_USER", "system")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("indexing_csv.log"), logging.StreamHandler()]
)
logger = logging.getLogger("csv_importer")

# Constants
CSV_URL = "https://s3.amazonaws.com/falextracts/Contract%20Opportunities/datagov/ContractOpportunitiesFullCSV.csv"
LOCAL_FILE = "temp/contract_opportunities.csv"
NOTICE_ID_COL = "NoticeId"
DESCRIPTION_COL = "Description"
CHUNK_SIZE = 50000
MAX_WORKERS = 5
BATCH_SIZE = 1000

def ensure_dir():
    os.makedirs(os.path.dirname(LOCAL_FILE), exist_ok=True)

def should_download_new_file(filepath):
    """Download if file doesn't exist or is older than a day."""
    if not os.path.exists(filepath):
        logger.info("CSV file does not exist, proceeding to download.")
        return True
    modified_time = datetime.fromtimestamp(os.path.getmtime(filepath))
    if datetime.now() - modified_time > timedelta(days=1):
        logger.info("CSV file is older than 1 day, deleting and re-downloading.")
        os.remove(filepath)
        return True
    logger.info("CSV file already exists and is fresh. Skipping download.")
    return False

def download_with_resume(url, filepath):
    ensure_dir()
    headers = {}
    pos = 0

    if os.path.exists(filepath):
        pos = os.path.getsize(filepath)
        headers["Range"] = f"bytes={pos}-"
        logger.info(f"Resuming download from byte {pos}")

    response = requests.get(url, headers=headers, stream=True)
    total_size = int(response.headers.get("content-length", 0)) + pos
    mode = "ab" if pos else "wb"
    progress = tqdm(total=total_size, initial=pos, unit='iB', unit_scale=True, desc="Downloading CSV")

    with open(filepath, mode) as f:
        for chunk in response.iter_content(1024):
            if chunk:
                f.write(chunk)
                progress.update(len(chunk))

    progress.close()
    logger.info("Download complete.")

def db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

def check_duplicates(cursor, notice_ids):
    format_ids = tuple(notice_ids)
    sql = f"SELECT notice_id FROM sam_gov_csv WHERE notice_id IN %s"
    cursor.execute(sql, (format_ids,))
    return set(row[0] for row in cursor.fetchall())

def insert_records(records):
    if not records:
        return 0

    try:
        conn = db_connection()
        cursor = conn.cursor()

        execute_values(
            cursor,
            """
            INSERT INTO sam_gov_csv (
                notice_id, description, created_by, updated_by, updated_at
            )
            VALUES %s
            ON CONFLICT (notice_id) DO UPDATE
            SET
                description = EXCLUDED.description,
                updated_by = EXCLUDED.updated_by,
                updated_at = EXCLUDED.updated_at
            """,
            [(nid, desc, IMPORT_USER, IMPORT_USER) for nid, desc in records],
            template="(%s, %s, %s, %s, CURRENT_TIMESTAMP)"
        )

        conn.commit()
        cursor.close()
        conn.close()
        return len(records)
    except Exception as e:
        logger.error(f"Insert failed: {e}")
        return 0


def process_chunk(chunk, conn_params):
    skipped = {
        "empty_notice_id": 0,
        "empty_description": 0,
        "duplicates": 0
    }
    records = []

    try:
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()

        # Drop empty notice_id or description
        original_count = len(chunk)
        chunk = chunk.dropna(subset=[NOTICE_ID_COL, DESCRIPTION_COL])
        cleaned_count = len(chunk)

        skipped["empty_notice_id"] = original_count - cleaned_count

        # Remove rows where description is just whitespace
        before_desc_strip = len(chunk)
        chunk = chunk[chunk[DESCRIPTION_COL].str.strip() != ""]
        skipped["empty_description"] = before_desc_strip - len(chunk)

        chunk[NOTICE_ID_COL] = chunk[NOTICE_ID_COL].astype(str)
        chunk[DESCRIPTION_COL] = chunk[DESCRIPTION_COL].astype(str)

        ids_to_check = chunk[NOTICE_ID_COL].tolist()
        existing_ids = check_duplicates(cursor, ids_to_check)

        for _, row in chunk.iterrows():
            nid = row[NOTICE_ID_COL]
            if nid in existing_ids:
                skipped["duplicates"] += 1
                logger.debug(f"Skipped duplicate: {nid}")
                continue
            records.append((nid, row[DESCRIPTION_COL]))

        cursor.close()
        conn.close()

    except Exception as e:
        logger.error(f"Error processing chunk: {e}")

    return records, skipped


def import_csv_to_db():
    start = time.time()
    ensure_dir()
    logger.info("Starting import...")

    # Step 1: Download if necessary
    if should_download_new_file(LOCAL_FILE):
        downloader = threading.Thread(target=download_with_resume, args=(CSV_URL, LOCAL_FILE))
        downloader.start()
        downloader.join()

    # Step 2: Ensure DB and Table
    conn = db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sam_gov_csv (
            notice_id VARCHAR(255) PRIMARY KEY,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(100) DEFAULT 'system',
            updated_by VARCHAR(100) DEFAULT 'system'
        );
        CREATE INDEX IF NOT EXISTS idx_notice_id ON sam_gov_csv(notice_id);
    """)
    conn.commit()
    cursor.close()
    conn.close()

    # Step 3: Process and insert with multiprocessing
    conn_params = {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD")
    }

    total_inserted = 0
    total_skipped = {"empty_notice_id": 0, "empty_description": 0, "duplicates": 0}
    pool = ThreadPool(MAX_WORKERS)

    for chunk_num, chunk in enumerate(pd.read_csv(
        LOCAL_FILE,
        chunksize=CHUNK_SIZE,
        usecols=[NOTICE_ID_COL, DESCRIPTION_COL],
        encoding="cp1252",
        encoding_errors="replace"
    ), start=1):
        logger.info(f"Processing chunk #{chunk_num}...")
        records,skipped  = process_chunk(chunk, conn_params)
        logger.info(f"Chunk #{chunk_num}: {len(records)} records to insert")

        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i:i+BATCH_SIZE]
            pool.apply_async(insert_records, args=(batch,), callback=lambda x: logger.info(f"Chunk {i+1}: Inserted {x} records"))

        total_inserted += len(records)
        for key in total_skipped:
            total_skipped[key] += skipped[key]

        logger.info(
            f"Chunk {i+1}: Skipped(Duplicates)={skipped['duplicates']}, "
            f"Skipped(Empty ID)={skipped['empty_notice_id']}, Skipped(Empty Desc)={skipped['empty_description']}"
        )

    pool.close()
    pool.join()

    logger.info(f"Import finished: Total inserted: {total_inserted}, Total skipped: {total_skipped}  in {time.time() - start:.2f}s")

    # Step 4: Clean up file (optional: retain for a day)
    # try:
    #     os.remove(LOCAL_FILE)
    #     logger.info(f"Deleted temp file: {LOCAL_FILE}")
    # except Exception as e:
    #     logger.warning(f"Failed to delete temp file: {e}")

if __name__ == "__main__":
    import_csv_to_db()
