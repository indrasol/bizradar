import os
import sys
# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import urllib.parse
from typing import Dict, Any, List
import aiohttp
import logging
import ssl
import certifi
from datetime import datetime, timedelta
import asyncio
import pandas as pd
from utils.database import insert_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_date(date_str: str):
    """Parse a date string (ISO 8601 format with timezone) into a date object."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
    except ValueError as e:
        logger.error(f"Date parsing error for {date_str}: {e}")
        return None

def truncate_string(text, max_length=255):
    """Truncate a string to specified maximum length."""
    if not text:
        return text
    return text[:max_length]

async def fetch_opportunities() -> Dict[str, Any]:
    """
    Fetch opportunities from SAM.gov API for multiple NAICS codes and save to database.
    
    Returns:
        Dictionary with results summary
    """
    # Get SAM.gov API key from environment variable
    api_key = os.getenv("SAM_API_KEY")
    
    if not api_key:
        logger.error("SAM.gov API key not found in environment variables.")
        return {"source": "sam.gov", "count": 0, "error": "API key missing"}

    base_url = "https://api.sam.gov/prod/opportunities/v2/search"
    
    # Format dates as required by the API
    posted_to = datetime.now().strftime('%m/%d/%Y')
    posted_from = (datetime.now() - timedelta(days=30)).strftime('%m/%d/%Y')
    
    logger.info(f"Searching for opportunities from {posted_from} to {posted_to}")

    # Top NAICS codes to search (from our Colab implementation)
    naics_list = ["541512", "541511", "541519","518210","541618","541330","541513"]
    
    all_opportunities = []  # Store all collected opportunities here
    total_fetched = 0
    records_per_naics = 1000  # Number of records per NAICS code to fetch

    for i, naics in enumerate(naics_list, 1):
        # Make a single API call per NAICS code
        params = {
            "api_key": api_key,
            "ncode": naics,
            "postedFrom": posted_from,
            "postedTo": posted_to,
            "limit": records_per_naics  # Only request what we need
        }
        
        log_params = params.copy()
        log_params["api_key"] = "***REDACTED***"
        log_url = f"{base_url}?{urllib.parse.urlencode(log_params, safe='/')}"
        logger.info(f"Call {i}/{len(naics_list)}: Fetching for NAICS {naics} from {log_url}")

        ssl_context = ssl.create_default_context(cafile=certifi.where())
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(base_url, params=params, ssl=ssl_context, timeout=60) as response:
                    response_text = await response.text()
                    if response.status == 200:
                        try:
                            data = await response.json()
                            current_opps = data.get("opportunitiesData", [])
                            
                            if not current_opps:
                                logger.info(f"No records found for NAICS {naics}")
                                continue
                            
                            # Add NAICS code to each opportunity for reference
                            for opp in current_opps:
                                opp['naics_code'] = naics
                            
                            # Only take up to records_per_naics
                            naics_opportunities = current_opps[:records_per_naics]
                            all_opportunities.extend(naics_opportunities)
                            
                            total_fetched += len(naics_opportunities)
                            logger.info(f"Fetched {len(naics_opportunities)} opportunities for NAICS {naics}, Total: {total_fetched}")
                            
                        except Exception as json_error:
                            logger.error(f"Error parsing JSON response: {json_error}")
                            logger.error(f"Response text: {response_text[:500]}")
                    else:
                        logger.error(f"Error fetching for NAICS {naics}: HTTP {response.status} - {response_text}")
            
            # Add a delay between requests to respect rate limits
            if i < len(naics_list):  # No need to delay after the last request
                await asyncio.sleep(1)
                
        except Exception as e:
            logger.error(f"Exception for NAICS {naics}: {str(e)}")

    # Format data for database insertion
    if all_opportunities:
        rows = []
        for opp in all_opportunities:
            # Get NAICS code (integer)
            naics = opp.get("naics_code")
            if naics:
                try:
                    naics = int(naics)
                except ValueError:
                    naics = None
            
            notice_id = str(opp.get("noticeId", "")).strip()
            
            # Format data to match table schema
            row = {
                "notice_id": notice_id,
                "solicitation_number": opp.get("solicitationNumber"),
                "title": truncate_string(opp.get("title", "No title")),
                "department": truncate_string(opp.get("fullParentPathName", opp.get("department", ""))),
                "naics_code": naics,
                "published_date": parse_date(opp.get("postedDate")),
                "response_date": parse_date(opp.get("responseDeadLine")),
                "description": opp.get("description", ""),
                "url": f"https://sam.gov/opp/{notice_id}/view" if notice_id else None,
                "active": opp.get("active", True)
            }
            rows.append(row)
        
        if rows:
            logger.info(f"Preparing to insert {len(rows)} opportunities into database")
            result = insert_data(rows)
            
            # Return detailed results
            db_results = {
                "source": "sam.gov", 
                "total_fetched": total_fetched,
                "processed": len(rows),
                "inserted": result.get("inserted", 0),
                "skipped": result.get("skipped", 0),
                "error": result.get("error")
            }
            
            # Only run indexing if new records were inserted
            if result.get("inserted", 0) > 0:
                try:
                    # Import indexing function and run indexing for newly inserted data
                    logger.info("New records inserted, running Pinecone indexing...")
                    
                    # Try to import the indexing function
                    try:
                        # Import here to avoid circular imports - file is in utils folder
                        try:
                            from utils.index_to_pinecone import index_sam_gov_to_pinecone
                        except ModuleNotFoundError:
                            from app.utils.index_to_pinecone import index_sam_gov_to_pinecone
                        
                        # Run indexing for SAM.gov only (incremental)
                        index_result = index_sam_gov_to_pinecone(incremental=True)
                        db_results["indexed_count"] = index_result
                        logger.info(f"Successfully indexed {index_result} new records to Pinecone")
                        
                    except ImportError as e:
                        logger.warning(f"Could not import utils.index_to_pinecone module: {e}")
                        logger.warning("Pinecone indexing will be skipped for this run")
                        db_results["indexed_count"] = 0
                        
                except Exception as e:
                    logger.error(f"Error during Pinecone indexing: {e}")
                    db_results["indexing_error"] = str(e)
                    
            return db_results
    
    return {"source": "sam.gov", "count": 0, "status": "No opportunities found"}

# For running as a script
if __name__ == "__main__":
    # Run the async function and print its result
    result = asyncio.run(fetch_opportunities())
    print(result)