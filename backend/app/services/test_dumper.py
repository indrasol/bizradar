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
from utils.database import insert_data

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

async def fetch_opportunities() -> Dict[str, Any]:
    api_key = os.getenv("SAM_API_KEY")
    if not api_key:
        logger.error("SAM.gov API key not found in environment variables.")
        return {"source": "sam.gov", "count": 0}

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

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    full_url = f"{base_url}?{urllib.parse.urlencode(params, safe='/')}"
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
                            "naics_code": naics,  # Use the converted NAICS code
                            "description": opp.get("description", "")
                        }
                        rows.append(row)
                    
                    if rows:
                        logger.info(f"Inserting {len(rows)} opportunities")
                        insert_data(rows)
                    return {"source": "sam.gov", "count": len(rows)}
                else:
                    logger.error(f"Error fetching from SAM.gov: HTTP {response.status}")
                    return {"source": "sam.gov", "count": 0}
    except Exception as e:
        logger.error(f"Error fetching from SAM.gov: {str(e)}")
        return {"source": "sam.gov", "count": 0}

if __name__ == "__main__":
    import asyncio
    # Run the async function and print its result
    result = asyncio.run(fetch_opportunities())
    print(result)