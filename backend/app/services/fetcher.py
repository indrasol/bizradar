from typing import Dict, Any
import aiohttp
import os
import logging

logger = logging.getLogger(__name__)

async def fetch_opportunities(platform: str, query_data: dict) -> Dict[str, Any]:
    """Fetch opportunities from various platforms based on keywords."""
    try:
        # Dynamically get the API key from environment variables
        api_key = os.getenv("SAM_GOV_API_KEY")
        if not api_key:
            logger.error(f"{platform} API key not found in environment variables.")
            return {"source": platform, "count": 0, "jobs": [], "url": f"https://{platform}.gov"}

        keywords = query_data.get('keywords', '').replace(' OR ', ' ')
        
        # Define base URLs and parameters based on the platform
        if platform == "sam.gov":
            base_url = "https://api.sam.gov/opportunities/v2/search"
            params = {
                'api_key': api_key,
                'limit': '2',
                'postedFrom': '12/01/2024',
                'postedTo': '02/04/2025',
                'keyword': keywords,
                'active': 'true',
                'latest': 'true',
                'responseType': 'json',
                'sortBy': 'relevance',
                'order': 'desc',
                'naics': '541519'
            }
        elif platform == "fpds":
            base_url = "https://api.fpds.gov/opportunities/v2/search"  # Example URL
            params = {
                'api_key': api_key,
                'keyword': keywords,
                'limit': '2',
                'active': 'true',
                'responseType': 'json'
            }
        else:
            logger.error(f"Unsupported platform: {platform}")
            return {"source": platform, "count": 0, "jobs": [], "url": f"https://{platform}.gov"}

        async with aiohttp.ClientSession() as session:
            async with session.get(base_url, params=params, ssl=False) as response:
                if response.status == 200:
                    data = await response.json()
                    total_records = data.get('totalRecords', 0)
                    opportunities = data.get('opportunitiesData', [])
                    
                    logger.info(f"{platform} Count: {total_records}")
                    for opp in opportunities[:2]:  # Log top 2 opportunities
                        logger.info(f"Sample Opportunity: {opp.get('title', 'No title')} - {opp.get('noticeId')}")
                    
                    return {
                        "source": platform,
                        "count": total_records,
                        "jobs": opportunities,
                        "url": f"https://{platform}.gov/search/?keywords={keywords}&sort=-relevance"
                    }

                return {"source": platform, "count": 0, "jobs": [], "url": f"https://{platform}.gov"}

    except Exception as e:
        logger.error(f"Error fetching from {platform}: {str(e)}")
        return {"source": platform, "count": 0, "jobs": [], "url": f"https://{platform}.gov"}

def fetch_data(query, platform):
    # Implement fetching logic based on the platform
    if platform == "sam.gov":
        return {"source": "sam.gov", "data": "Fetched data from sam.gov"}
    elif platform == "freelancer":
        return {"source": "freelancer", "data": "Fetched data from freelancer.com"} 