import asyncio
import os
try:
    from app.utils.db_utils import get_db_connection
    from app.utils.logger import get_logger
    from app.utils.openai_client import get_openai_client
except:
    from utils.db_utils import get_db_connection
    from utils.logger import get_logger
    from utils.openai_client import get_openai_client
import aiohttp
from typing import List
import psycopg2

import json

# Configure logging
logger = get_logger(__name__)


def normalize_bulleted_summary(summary: dict) -> str:
    """
    Normalize a summary into a structured format with specific fields.
    If normalization fails, return DEFAULT_SUMMARY.
    """
    try:
        if not summary or not isinstance(summary, dict):
            return normalize_bulleted_summary(DEFAULT_SUMMARY)
        headers = ["Sponsor", "Objective", "Goal", "Eligibility", "Key Facts", "Contact information", "Due Date"]
        head_keys = ["sponsor", "objective", "goal", "eligibility", "key_facts", "contact_info", "due_date"]
        bullets = []
        for header, key in zip(headers, head_keys):
            if key in summary and "Not specified" not in summary[key]:
                bullets.append(f"*   **{header}**: {summary[key]}")
        return "\n".join(bullets) if bullets else normalize_bulleted_summary(DEFAULT_SUMMARY)
    except Exception:
        return normalize_bulleted_summary(DEFAULT_SUMMARY)

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
                elif response.status == 429:
                    logger.error("Rate limit exceeded. Sleeping for 1 hour.")
                    await asyncio.sleep(3600)
                    return await fetch_description_from_sam(description_url)
                else:
                    logger.error(f"Failed to fetch description from SAM.gov: {response.status}")
                    return ""
    except Exception as e:
        logger.error(f"Error fetching description from SAM.gov: {str(e)}")
        return ""

SUMMARY_TEMPLATE = """
   "summary":{
  "sponsor": "Full precise complete name of the sponsoring organization",
  "objective": "Main purpose or objective of the opportunity in 1 sentence",
  "goal": "Primary goal or intended outcome in 1-2 sentences",
  "eligibility": "Eligibility criteria for applicants",
  "key_facts": "Important details like budget, timeline, or special requirements missed out in other fields",
  "due_date": "Application or submission deadline in YYYY-MM-DD format",
  "budget": "Estimated budget for the opportunity"
}
"""

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
        logger.info("OpenAI client initialized successfully")
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            response_format={ "type": "json_object" },
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert government contract analyst. Write a concise summary for a business audience.\n"
                    "Please analyze this opportunity and return a JSON object with the following structure:\n"
                    "{\n"
                    "   " + SUMMARY_TEMPLATE + "\n}\n"
                    "If any information is not available in the description, use 'Not specified' as the value.\n"
                    "For contact information and due date, leave as empty string if not specified."
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
            max_tokens=max_length,
            n=1
        )
        logger.info("OpenAI response received")
        summary = response.choices[0].message.content.strip()
        
        # Ensure bullet list formatting
        # summary = normalize_bulleted_summary(summary)
        
        # logger.info(f"Generated concise summary of {len(summary)} chars")
        summary = json.loads(summary)
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
            return {
                "title": opportunity_title or "Untitled Opportunity",
                "summary": DEFAULT_SUMMARY
            }
            
        # Truncate very long descriptions to avoid excessive token usage
        truncated_desc = description_text #[:4000] if len(description_text) > 4000 else description_text
        
        client = get_openai_client()
        
        # Generate structured data in JSON format
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": (
                    "You are an expert at analyzing government contract opportunities. "
                    "Generate a clear, engaging title and structured summary based on the provided description. "
                    "Extract key details that would be most relevant to potential bidders and return them in a structured JSON format."
                )},
                {"role": "user", "content": (
                    f"Original Title: {opportunity_title}\n\n"
                    f"Description:\n{truncated_desc}\n\n"
                    "Please analyze this opportunity and return a JSON object with the following structure:\n"
                    "{\n"
                    "  \"title\": \"Improved, concise title (max 120 chars)\",\n"
                    "   " + SUMMARY_TEMPLATE + "\n}\n"
                    "If any information is not available in the description, use 'Not specified' as the value.\n"
                    "For contact information and due date, leave as empty string if not specified."
                )}
            ],
            temperature=0.2,
            max_tokens=max_length,
            n=1
        )
        
        # Parse the JSON response
        logger.info("OpenAI response received")
        content = response.choices[0].message.content.strip()
        # Extract JSON if wrapped in markdown
        if content.startswith("```json"):
            content = content.split("```json")[1].split("```", 1)[0].strip()
        result = json.loads(content)
        # Fallbacks
        title = result.get("title", opportunity_title or "Untitled Opportunity")
        summary = result.get("summary", DEFAULT_SUMMARY)
        # Normalize possible inline bullets into separate lines
        if isinstance(summary, dict):
            summary = normalize_bulleted_summary(summary)
        return {"title": title, "summary": summary}
    except Exception as e:
        logger.error(f"Title/Summary generation error: {str(e)}")
        return {
            "title": opportunity_title or "Untitled Opportunity",
            "summary": (
                "- Limited public details are available; please review the full notice for specifics.\n"
                "- Refer to the solicitation for financial terms, contract structure, and eligibility specifics.\n"
                "- Check the notice for submission deadlines and other key requirements."
            )
        }

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

async def process_opportunity_descriptions(opportunity: dict):
    """
    Processes a list of opportunities to generate summaries for their descriptions.
    """
    try:
        logger.info(f"Processing opportunity for summary generation")

        # Attach additional descriptions
        nid = opportunity.get("notice_id")
        if nid and not opportunity.get("additional_description"):
            opportunity["additional_description"] = find_descriptions_by_notice_ids([nid])[0][DESCRIPTION_COL] 
        opportunity = await process_opportunity_summaries(opportunity)
        return opportunity

    except Exception as e:
        logger.error(f"Error processing opportunity description: {str(e)}")
        return opportunity
    
DEFAULT_SUMMARY = {
    "sponsor": "Not specified\n",
    "objective": "Not specified\n",
    "goal": "Not specified\n",
    "eligibility": "Not specified\n",
    "key_facts": "Not specified\n",
    "contact_info": "\n",
    "due_date": "\n"
}

async def process_opportunity_summaries(opportunity):
    """
    Processes a list of opportunities to generate summaries and improved titles for their descriptions.
    """
    try:
        logger.info(f"Processing opportunity for summary and title generation")

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

        # async for opp in asyncio.as_completed((summarize_opportunity(opp) for opp in opportunities)):
        #     yield opp
        await summarize_opportunity(opportunity)
        return opportunity

    except Exception as e:
        logger.error(f"Error processing opportunity summaries: {str(e)}")
        return opportunity
