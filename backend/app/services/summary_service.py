import asyncio
import os
import logging
from pathlib import Path
import aiohttp
from typing import List
import psycopg2
from psycopg2.extras import execute_values
import pandas as pd
# from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_openai_client():
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY environment variable not set")
        else:
            logger.info("OPENAI_API_KEY environment variable found")
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            logger.info("OpenAI client initialized successfully")
            return client
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    return None

async def fetch_description_from_sam(description_url):
    """
    Fetches the description from SAM.gov API.
    
    Args:
        description_url (str): The URL to fetch the description from
        
    Returns:
        str: The description text or None if failed
    """
    try:
        # Get SAM.gov API key from environment variable
        api_key = os.getenv("SAM_API_KEY")
        if not api_key:
            logger.error("SAM.gov API key not found in environment variables")
            return None

        # Add API key to URL
        separator = "&" if "?" in description_url else "?"
        url_with_key = f"{description_url}{separator}api_key={api_key}"

        async with aiohttp.ClientSession() as session:
            async with session.get(url_with_key) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('description', '')
                else:
                    logger.error(f"Failed to fetch description from SAM.gov: {response.status}")
                    return None
    except Exception as e:
        logger.error(f"Error fetching description from SAM.gov: {str(e)}")
        return None

async def generate_description_summary(description_text, max_length=300):
    """
    Generates a clear, engaging summary of a contract description.
    
    Args:
        description_text (str): The original contract description text
        max_length (int): Maximum token length for the summary
        
    Returns:
        str: A clear, concise summary capturing key essentials
    """
    try:
        if not description_text or description_text.strip() == "":
            return "No description available."
            
        # Truncate very long descriptions
        if len(description_text) > 6000:
            description_text = description_text[:6000] + "..."

        client = get_openai_client()   
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system", 
                    "content": """You are a professional contract analyst creating a clear, engaging summary.

Craft the summary to sound like a concise brief:
- Skip formal headers
- Use a conversational yet professional tone
- Focus on key points that matter to potential bidders
- Highlight unique aspects of the opportunity
- Avoid academic or overly technical language

Key Elements to Cover:
- What's the core purpose?
- Who's behind the contract?
- What makes this opportunity distinctive?
- What are the critical requirements?
- Why should a business be interested?

Tone: Direct, informative, and slightly compelling"""
                },
                {
                    "role": "user", 
                    "content": f"Create a compelling, straightforward summary of this government contract opportunity:\n\n{description_text}"
                }
            ],
            temperature=0.2, 
            max_tokens=max_length
        )
        
        summary = response.choices[0].message.content.strip()
        
        # Ensure meaningful summary
        if not summary or len(summary.split()) < 40:
            summary = "Key details of this opportunity require a closer look. Recommended: review the full description."
        
        logger.info(f"Generated concise summary of {len(summary)} chars")
        return summary
        
    except Exception as e:
        logger.error(f"Summary generation error: {str(e)}")
        return "Unable to generate a summary. Direct review of the description is recommended."

# CSV_URL = "https://s3.amazonaws.com/falextracts/Contract%20Opportunities/datagov/ContractOpportunitiesFullCSV.csv"
NOTICE_ID_COL = "NoticeId"
DESCRIPTION_COL = "Description"

def find_descriptions_by_notice_ids(notice_ids: List[str], chunksize: int = 5000) -> List[dict]:
    # if not notice_ids:
    #     return []

    # notice_id_set = set(notice_ids)
    # found_map = {}

    # try:
    #     csv_path = Path(__file__).resolve().parents[2] / "public" / "ContractOpportunitiesFullCSV.csv"

    #     # for chunk in pd.read_csv(CSV_URL, chunksize=chunksize, usecols=[NOTICE_ID_COL, DESCRIPTION_COL], dtype=str, encoding="cp1252"):
    #     for chunk in pd.read_csv(csv_path, chunksize=chunksize, usecols=[NOTICE_ID_COL, DESCRIPTION_COL], dtype=str, encoding="cp1252"):

    #         chunk_filtered = chunk[chunk[NOTICE_ID_COL].isin(notice_id_set)]
    #         for _, row in chunk_filtered.iterrows():
    #             nid = row[NOTICE_ID_COL]
    #             if nid not in found_map:
    #                 found_map[nid] = row[DESCRIPTION_COL]
    #             if len(found_map) == len(notice_id_set):
    #                 break
    #     return [{NOTICE_ID_COL: nid, DESCRIPTION_COL: desc} for nid, desc in found_map.items()]
    # except Exception as e:
    #     logger.error(f"Error processing CSV: {str(e)}")
    #     return []

    """
    Retrieve descriptions for given notice IDs from the sam_gov_csv table.

    Args:
        notice_ids: List of notice IDs to search for.

    Returns:
        List of dictionaries containing notice IDs and their descriptions.
        Format: [{"NoticeId": str, "Description": str}, ...]
    """
    if not notice_ids:
        logger.info("No notice IDs provided, returning empty list")
        return []

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

        # Query the sam_gov_csv table for notice_ids
        query = "SELECT notice_id, description FROM sam_gov_csv WHERE notice_id IN %s"
        execute_values(cursor, query, [(nid,) for nid in notice_ids], fetch=True)
        results = cursor.fetchall()

        # Map results to the required format
        found_map = {row[0]: row[1] for row in results}
        result = [
            {NOTICE_ID_COL: nid, DESCRIPTION_COL: found_map.get(nid, "")}
            for nid in notice_ids
        ]

        cursor.close()
        conn.close()

        logger.info(f"Retrieved {len(found_map)} descriptions for {len(notice_ids)} notice IDs")
        return result

    except psycopg2.Error as e:
        logger.error(f"Database error while fetching descriptions: {str(e)}")
        return [{NOTICE_ID_COL: nid, DESCRIPTION_COL: ""} for nid in notice_ids]
    except Exception as e:
        logger.error(f"Unexpected error while fetching descriptions: {str(e)}")
        return [{NOTICE_ID_COL: nid, DESCRIPTION_COL: ""} for nid in notice_ids]

async def process_opportunity_descriptions(opportunities):
    """
    Processes a list of opportunities to generate summaries for their descriptions.
    """
    try:
        logger.info(f"Processing {len(opportunities)} opportunities for summary generation")

        # Get missing notice IDs that need additional descriptions
        missing_notice_ids = [opp["notice_id"] for opp in opportunities
                              if opp.get("notice_id") and not opp.get("additional_description")]

        # Fetch missing descriptions
        found_descriptions = find_descriptions_by_notice_ids(missing_notice_ids)
        desc_map = {item[NOTICE_ID_COL]: item[DESCRIPTION_COL] for item in found_descriptions}

        # Attach additional descriptions
        for opp in opportunities:
            nid = opp.get("notice_id")
            if nid and not opp.get("additional_description"):
                opp["additional_description"] = desc_map.get(nid, "")

        return await process_opportunity_summaries(opportunities)

    except Exception as e:
        logger.error(f"Error processing opportunity descriptions: {str(e)}")
        return opportunities
    
DEFAULT_SUMMARY = (
    "This opportunity currently lacks a detailed description, so specific information "
    "about its objectives, eligibility criteria, and potential benefits is not yet available. "
    "To learn more about what this opportunity entails, including its purpose, requirements, "
    "and how it can impact you or your organization, please contact the opportunity provider "
    "directly. Alternatively, check back on this page for updates as more details become available."
)

async def process_opportunity_summaries(opportunities):
    """
    Processes a list of opportunities to generate summaries for their descriptions.
    """
    try:
        logger.info(f"Processing {len(opportunities)} opportunities for summary generation")

        async def summarize_opportunity(opp):
            description = opp.get("additional_description")
            if description:
                try:
                    opp["summary"] = await generate_description_summary(description)
                except Exception as e:
                    logger.warning(f"Failed to summarize description for Notice ID {opp.get('noticeid')}: {e}")
                    opp["summary"] = DEFAULT_SUMMARY
            else:
                opp["summary"] = DEFAULT_SUMMARY

        await asyncio.gather(*(summarize_opportunity(opp) for opp in opportunities))
        return opportunities

    except Exception as e:
        logger.error(f"Error processing opportunity summaries: {str(e)}")
        return opportunities # Return original opportunities if there's an error