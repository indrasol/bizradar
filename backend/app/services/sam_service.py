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
from utils.database import insert_data  # Now Python can find the utils module

logger = logging.getLogger(__name__)

def parse_date(date_str: str):
    """
    Parse a date string (expected format: YYYY-MM-DD) into a date object.
    Returns None if parsing fails.
    """
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as e:
        logger.error(f"Date parsing error: {e}")
        return None

async def fetch_opportunities() -> Dict[str, Any]:
    api_key = os.getenv("SAM_API_KEY")
    if not api_key:
        logger.error("SAM.gov API key not found in environment variables.")
        return {"source": "sam.gov", "count": 0}

    base_url = "https://api.sam.gov/prod/opportunities/v2/search"
    params = {
        "api_key": api_key,
        "postedFrom": "12/01/2024",
        "postedTo": "02/20/2025",
        "limit": 1000
    }

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    full_url = f"{base_url}?{urllib.parse.urlencode(params, safe='/')}"
    logger.info(f"Fetching URL: {full_url}")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(base_url, params=params, ssl=ssl_context) as response:
                if response.status == 200:
                    data = await response.json()
                    # logger.info(f"Full API response: {data}")
                    
                    # Use the correct key from the API response
                    opportunities = data.get("opportunitiesData", [])
                    rows = []
                    for opp in opportunities:
                        row = {
                            "title": opp.get("title", "No title"),
                            "department": opp.get("fullParentPathName", "No department"),
                            "published_date": parse_date(opp.get("postedDate")),
                            "response_date": parse_date(opp.get("responseDeadLine")),
                            "naics_code": opp.get("naicsCode", "")
                        }
                        row["description"] = opp.get("description", "")
                        rows.append(row)
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