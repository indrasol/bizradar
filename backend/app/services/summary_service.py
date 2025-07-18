import asyncio
import os
from utils.db_utils import get_db_connection
from utils.logger import get_logger
import aiohttp
from typing import List
import psycopg2
from utils.openai_client import get_openai_client

# Configure logging
logger = get_logger(__name__)

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
        # api_key = os.getenv("SAM_API_KEY")
        from config.settings import SAM_API_KEY as api_key
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
                    "content": (
                        "You are an expert government contract analyst. Your job is to write a summary that is:\n"
                        "- Clear, concise, and easy to understand for a business audience\n"
                        "- Free of jargon and technical language\n"
                        "- Focused on the most important details for a potential bidder\n"
                        "- No longer than 5 sentences\n"
                        "Highlight:\n"
                        "• The main goal of the contract\n"
                        "• Who is offering it\n"
                        "• What makes this opportunity unique or important\n"
                        "• Any special requirements or deadlines\n"
                        "• Why a business should consider applying\n"
                        "Do not include formal headers or restate the prompt. Write in plain, direct language."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "Summarize this government contract opportunity for a business audience:\n\n"
                        f"{description_text}"
                    )
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

async def generate_title_and_summary(opportunity_title, description_text, max_length=400):
    """
    Generates an improved title (based on the original title and description) and a summary for a contract opportunity.
    Returns a dict: {"title": ..., "summary": ...}
    """
    try:
        if not description_text or description_text.strip() == "":
            return {"title": opportunity_title or "Untitled Opportunity", "summary": "No description available."}
        # Truncate very long descriptions
        if len(description_text) > 6000:
            description_text = description_text[:6000] + "..."
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert government contract analyst. For each contract opportunity, return a JSON object with two fields:\n"
                        "1. 'title': Improve or clarify the provided title for a business audience. If the title is missing or unclear, generate a concise, clear, and engaging title (max 12 words) using the description for context.\n"
                        "2. 'summary': A concise summary (max 5 sentences) highlighting the main goal, who is offering it, what makes it unique, any special requirements or deadlines, and why a business should consider applying.\n"
                        "Do not include any extra text, only the JSON object."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Original Title: {opportunity_title or 'N/A'}\n\n"
                        f"Description: {description_text}\n\n"
                        "Return the improved title and summary as a JSON object."
                    )
                }
            ],
            temperature=0.2,
            max_tokens=max_length
        )
        import json
        content = response.choices[0].message.content.strip()
        # Extract JSON if wrapped in markdown
        if content.startswith("```json"):
            content = content.split("```json")[1].split("```", 1)[0].strip()
        result = json.loads(content)
        # Fallbacks
        title = result.get("title", opportunity_title or "Untitled Opportunity")
        summary = result.get("summary", "No description available.")
        return {"title": title, "summary": summary}
    except Exception as e:
        logger.error(f"Title/Summary generation error: {str(e)}")
        return {"title": opportunity_title or "Untitled Opportunity", "summary": "No description available."}

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
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query the sam_gov_csv table for notice_ids
        query = "SELECT notice_id, description FROM sam_gov_csv WHERE notice_id IN %s"
        # execute_values(cursor, query, [(nid,) for nid in notice_ids], fetch=True)
        # results = cursor.fetchall()
        cursor.execute(query, (tuple(notice_ids),))  # pass a single tuple as parameter
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
    Processes a list of opportunities to generate summaries and improved titles for their descriptions.
    """
    try:
        logger.info(f"Processing {len(opportunities)} opportunities for summary and title generation")

        async def summarize_opportunity(opp):
            description = opp.get("additional_description")
            orig_title = opp.get("title") or opp.get("opportunity_title") or ""
            if description:
                try:
                    result = await generate_title_and_summary(orig_title, description)
                    opp["title"] = result["title"]
                    opp["summary"] = result["summary"]
                except Exception as e:
                    logger.warning(f"Failed to generate title/summary for Notice ID {opp.get('noticeid')}: {e}")
                    opp["title"] = orig_title or "Untitled Opportunity"
                    opp["summary"] = DEFAULT_SUMMARY
            else:
                opp["title"] = orig_title or "Untitled Opportunity"
                opp["summary"] = DEFAULT_SUMMARY

        await asyncio.gather(*(summarize_opportunity(opp) for opp in opportunities))
        return opportunities

    except Exception as e:
        logger.error(f"Error processing opportunity summaries: {str(e)}")
        return opportunities # Return original opportunities if there's an error