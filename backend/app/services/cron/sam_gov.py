"""
SAM.gov API fetcher module for scheduled data collection
"""
import os
import sys
import urllib.parse
import asyncio
import aiohttp
import logging
import ssl
import certifi
import argparse
from datetime import datetime
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load environment variables from .env file in the backend root directory
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), '.env')
load_dotenv(dotenv_path)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('sam_gov_fetcher')

# Define constants
SAM_GOV_TABLE = "sam_gov"

def parse_date(date_str):
    """
    Parse a date string (ISO 8601 format with timezone) into a date object.
    Returns None if parsing fails.
    """
    if not date_str:
        return None
    try:
        # Handle ISO 8601 format with timezone
        return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
    except ValueError as e:
        logger.error(f"Date parsing error for {date_str}: {e}")
        return None

async def fetch_opportunities():
    """Fetch opportunities from SAM.gov API and store them in the database"""
    
    # Get API key from environment
    api_key = os.getenv("SAM_API_KEY")
    if not api_key:
        logger.error("SAM.gov API key not found in environment variables.")
        return {"source": "sam.gov", "status": "error", "message": "API key not found"}

    # Use the exact same parameters as your working file
    base_url = "https://api.sam.gov/prod/opportunities/v2/search"
    params = {
        "api_key": api_key,
        "q": "cybersecurity",
        "ncode": "541519",
        "postedFrom": "02/27/2024",
        "postedTo": "02/26/2025",
        "limit": 1000,
        "offset": 0
    }

    # Set up SSL context
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    
    # Create URL for logging (remove API key from logged URL)
    safe_params = {k: v for k, v in params.items() if k != 'api_key'}
    full_url = f"{base_url}?{urllib.parse.urlencode(safe_params, safe='/')}"
    logger.info(f"Fetching URL: {full_url}")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(base_url, params=params, ssl=ssl_context) as response:
                if response.status == 200:
                    data = await response.json()
                    opportunities = data.get("opportunitiesData", [])
                    rows = []
                    for opp in opportunities: 
                        # Convert empty NAICS code to None
                        naics = opp.get("ncode")
                        if naics:
                            try:
                                naics = int(naics)
                            except ValueError:
                                naics = None
                        
                        row = {
                            "title": opp.get("title", "No title"),
                            "department": opp.get("fullParentPathName", "No department"),
                            "published_date": parse_date(opp.get("postedDate")),
                            "response_date": parse_date(opp.get("responseDeadLine")),
                            "naics_code": naics,
                            "description": opp.get("description", "") 
                        }
                        rows.append(row)
                    
                    if rows:
                        logger.info(f"Retrieved {len(rows)} opportunities from SAM.gov")
                        
                        try:
                            # Connect to database using environment variables
                            conn = psycopg2.connect(
                                host=os.getenv("DB_HOST"),
                                port=os.getenv("DB_PORT"),
                                database=os.getenv("DB_NAME"),
                                user=os.getenv("DB_USER"),
                                password=os.getenv("DB_PASSWORD")
                            )
                            cursor = conn.cursor()
                            logger.info("✅ Database connection successful")
                            
                            # Create table if not exists
                            create_table_query = f'''
                            CREATE TABLE IF NOT EXISTS {SAM_GOV_TABLE} (
                                id SERIAL PRIMARY KEY,
                                title TEXT,
                                department TEXT,
                                published_date DATE,
                                response_date DATE,
                                naics_code INTEGER,
                                description TEXT,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            );
                            '''
                            cursor.execute(create_table_query)
                            conn.commit()
                            
                            # Query to check for existing records
                            existing_count_query = f"SELECT COUNT(*) FROM {SAM_GOV_TABLE};"
                            cursor.execute(existing_count_query)
                            existing_records = cursor.fetchone()[0]
                            logger.info(f"Existing records in database: {existing_records}")
                            
                            # Insert data
                            insert_count = 0
                            new_record_count = 0
                            for row in rows:
                                # Check if this opportunity already exists
                                check_query = f"SELECT COUNT(*) FROM {SAM_GOV_TABLE} WHERE title = %s AND published_date = %s"
                                cursor.execute(check_query, (row["title"], row["published_date"]))
                                count = cursor.fetchone()[0]
                                
                                if count == 0:
                                    # This is a new record
                                    new_record_count += 1
                                
                                # Insert the record
                                insert_query = f'''
                                INSERT INTO {SAM_GOV_TABLE} 
                                (title, department, published_date, response_date, naics_code, description)
                                VALUES (%s, %s, %s, %s, %s, %s)
                                '''
                                cursor.execute(insert_query, (
                                    row["title"],
                                    row["department"],
                                    row["published_date"],
                                    row["response_date"],
                                    row["naics_code"],
                                    row["description"]
                                ))
                                insert_count += 1
                            
                            conn.commit()
                            logger.info(f"✅ {insert_count} opportunities inserted into database")
                            logger.info(f"✅ {new_record_count} new opportunities identified")
                            
                            # Prepare result dictionary
                            result = {
                                "source": "sam.gov", 
                                "status": "success", 
                                "count": insert_count,
                                "new_count": new_record_count
                            }
                            
                            # Close connection
                            cursor.close()
                            conn.close()
                            
                            return result
                            
                        except Exception as e:
                            logger.error(f"❌ Database error: {str(e)}")
                            result = {
                                "source": "sam.gov", 
                                "status": "error", 
                                "message": f"Database error: {str(e)}"
                            }
                            return result
                    else:
                        logger.info("No opportunities found to insert")
                        result = {
                            "source": "sam.gov", 
                            "status": "success", 
                            "count": 0,
                            "new_count": 0
                        }
                        return result
                else:
                    # Log error details
                    error_text = await response.text()
                    logger.error(f"Error fetching from SAM.gov: HTTP {response.status}")
                    logger.error(f"Error response: {error_text}")
                    
                    result = {
                        "source": "sam.gov", 
                        "status": "error",  
                        "message": f"HTTP error: {response.status}"
                    }
                    return result
    except Exception as e:
        logger.error(f"Error fetching from SAM.gov: {str(e)}")
        result = {
            "source": "sam.gov", 
            "status": "error", 
            "message": f"Request error: {str(e)}"
        }
        return result

def update_etl_history(results, trigger_type='manual'):
    """Update the most recent ETL history record with results from SAM.gov fetching"""
    try:
        logger.info(f"Updating ETL history with trigger_type: {trigger_type}")
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        cursor = conn.cursor()
        
        # Find the most recent 'triggered' record
        query = """
        SELECT id FROM etl_history 
        WHERE status = 'triggered' 
        ORDER BY time_fetched DESC LIMIT 1
        """
        cursor.execute(query)
        result = cursor.fetchone()
        
        if not result:
            logger.warning("No triggered ETL history records found to update")
            return
            
        record_id = result[0]
        logger.info(f"Found ETL history record to update: {record_id}")
        
        # Get current record values
        current_query = """
        SELECT freelancer_count, freelancer_new_count FROM etl_history
        WHERE id = %s
        """
        cursor.execute(current_query, (record_id,))
        current_values = cursor.fetchone()
        freelancer_count = current_values[0] if current_values else 0
        freelancer_new_count = current_values[1] if current_values else 0
        
        # Update with the results
        update_query = """
        UPDATE etl_history 
        SET 
            status = %s,
            sam_gov_count = %s,
            sam_gov_new_count = %s,
            total_records = %s,
            trigger_type = %s
        WHERE id = %s
        """
        
        sam_gov_count = results.get('count', 0)
        sam_gov_new_count = results.get('new_count', 0)
        total_records = sam_gov_count + freelancer_count
        status = 'success' if results.get('status') == 'success' else 'failed'
        
        cursor.execute(update_query, (
            status,
            sam_gov_count,
            sam_gov_new_count,
            total_records,
            trigger_type,
            record_id
        ))
        
        conn.commit()
        logger.info(f"Successfully updated ETL history record {record_id}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Error updating ETL history: {str(e)}")


# This allows the script to be run directly
if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--auto-trigger', action='store_true', help='Flag to indicate this is an auto-triggered run')
    args = parser.parse_args()
    
    # Set trigger type
    trigger_type = 'scheduled' if args.auto_trigger else 'manual'
    
    # Run the fetcher
    result = asyncio.run(fetch_opportunities())
    print(result)
    
    # Update ETL history with trigger type
    update_etl_history(result, trigger_type)
