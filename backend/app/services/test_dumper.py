import os
import sys
# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import urllib.parse
from typing import Dict, Any
import aiohttp
import logging
import ssl
import certifi
from datetime import datetime
from utils.database import insert_data  # Use the existing database function

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_date(date_str: str):
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

def truncate_string(text, max_length=255):
    """
    Truncate a string to specified maximum length.
    """
    if not text:
        return text
    return text[:max_length]

async def fetch_opportunities() -> Dict[str, Any]:
    api_key = os.getenv("SAM_API_KEY")
    if not api_key:
        logger.error("SAM.gov API key not found in environment variables.")
        return {"source": "sam.gov", "count": 0}

    base_url = "https://api.sam.gov/prod/opportunities/v2/search"
    params = {
        "api_key": api_key,
        "postedFrom": "04/01/2025",
        "postedTo": "04/02/2025",
        "limit": 1000,
        "offset": 0
    }

    # Use a safer logging approach - don't log the API key
    log_params = params.copy()
    log_params["api_key"] = "***REDACTED***"
    log_url = f"{base_url}?{urllib.parse.urlencode(log_params, safe='/')}"
    logger.info(f"Fetching URL: {log_url}")

    ssl_context = ssl.create_default_context(cafile=certifi.where())

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(base_url, params=params, ssl=ssl_context, timeout=60) as response:
                if response.status == 200:
                    data = await response.json()
                    opportunities = data.get("opportunitiesData", [])
                    rows = []
                    
                    total_opportunities = len(opportunities)
                    logger.info(f"Processing {total_opportunities} opportunities...")
                    
                    for idx, opp in enumerate(opportunities):
                        # CRITICAL: Extract noticeId and solicitationNumber explicitly
                        notice_id = str(opp.get("noticeId", "")).strip()
                        solicitation_number = str(opp.get("solicitationNumber", "")).strip()
                        
                        # Log the first few for debugging
                        if idx < 5:
                            logger.info(f"Example {idx+1}: noticeId={notice_id}, solicitationNumber={solicitation_number}")
                        
                        # Get NAICS code
                        naics = opp.get("naicsCode")
                        if not naics and opp.get("naicsCodes"):
                            if isinstance(opp["naicsCodes"], list) and len(opp["naicsCodes"]) > 0:
                                naics = opp["naicsCodes"][0]
                        
                        if naics:
                            try:
                                if isinstance(naics, list) and len(naics) > 0:
                                    naics = naics[0]
                                naics = int(naics)
                            except (ValueError, TypeError):
                                naics = None
                        
                        # Generate the public URL for this opportunity
                        opportunity_url = f"https://sam.gov/opp/{notice_id}/view" if notice_id else ""
                        
                        # Map API fields to database schema - match your existing code pattern
                        row = {
                            "notice_id": notice_id,
                            "solicitation_number": solicitation_number,
                            "title": truncate_string(opp.get("title", "No title"), 255),
                            "department": truncate_string(opp.get("fullParentPathName", "No department"), 255),
                            "naics_code": naics,
                            "published_date": parse_date(opp.get("postedDate")),
                            "response_date": parse_date(opp.get("responseDeadLine")),
                            "description": opp.get("description") or f"https://api.sam.gov/prod/opportunities/v1/noticedesc?noticeid={notice_id}",
                            "url": opp.get("uiLink") or opportunity_url,
                            "active": opp.get("active") == "Yes"
                        }
                        
                        # Add the row to our collection
                        rows.append(row)
                    
                    logger.info(f"Successfully processed {len(rows)} opportunities")
                    
                    # Insert the data using your existing database function
                    if rows:
                        try:
                            logger.info(f"Inserting {len(rows)} opportunities into database")
                            insert_data(rows)
                            return {
                                "source": "sam.gov", 
                                "count": len(rows),
                                "status": "success"
                            }
                        except Exception as e:
                            logger.error(f"Error inserting data: {str(e)}")
                            return {
                                "source": "sam.gov", 
                                "count": 0,
                                "status": "error", 
                                "message": str(e)
                            }
                    return {"source": "sam.gov", "count": len(rows), "status": "success"}
                else:
                    logger.error(f"Error fetching from SAM.gov: HTTP {response.status}")
                    return {"source": "sam.gov", "count": 0, "status": "error", "message": f"HTTP {response.status}"}
    except Exception as e:
        logger.error(f"Error fetching from SAM.gov: {str(e)}")
        return {"source": "sam.gov", "count": 0, "status": "error", "message": str(e)}

if __name__ == "__main__":
    import asyncio
    
    # Run the async function and print its result
    result = asyncio.run(fetch_opportunities())
    print(result)