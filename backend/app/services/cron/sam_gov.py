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
from datetime import datetime
import psycopg2
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
                            
                            # Insert data
                            insert_count = 0
                            for row in rows:
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
                            
                            # Close connection
                            cursor.close()
                            conn.close()
                            
                            return {
                                "source": "sam.gov", 
                                "status": "success", 
                                "count": insert_count
                            }
                            
                        except Exception as e:
                            logger.error(f"❌ Database error: {str(e)}")
                            return {
                                "source": "sam.gov", 
                                "status": "error", 
                                "message": f"Database error: {str(e)}"
                            }
                    else:
                        logger.info("No opportunities found to insert")
                        return {
                            "source": "sam.gov", 
                            "status": "success", 
                            "count": 0
                        }
                else:
                    # Log error details
                    error_text = await response.text()
                    logger.error(f"Error fetching from SAM.gov: HTTP {response.status}")
                    logger.error(f"Error response: {error_text}")
                    
                    return {
                        "source": "sam.gov", 
                        "status": "error",  
                        "message": f"HTTP error: {response.status}"
                    }
    except Exception as e:
        logger.error(f"Error fetching from SAM.gov: {str(e)}")
        return {
            "source": "sam.gov", 
            "status": "error", 
            "message": f"Request error: {str(e)}"
        }


# This allows the script to be run directly
if __name__ == "__main__":
    result = asyncio.run(fetch_opportunities())
    print(result)