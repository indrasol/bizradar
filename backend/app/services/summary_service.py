import asyncio
import os
from utils.db_utils import get_db_connection
from utils.logger import get_logger
import aiohttp
from typing import List
import psycopg2
from utils.openai_client import get_openai_client
import json

# Configure logging
logger = get_logger(__name__)

def normalize_bulleted_summary(text: str) -> str:
    """
    Normalize a summary into exactly three newline-separated bullets.
    If normalization fails, return DEFAULT_SUMMARY.
    """
    try:
        if not text or not isinstance(text, str):
            return DEFAULT_SUMMARY
        summary = text.strip()
        # Try split by lines first
        bullets = [line for line in summary.splitlines() if line.strip()]
        if len(bullets) < 3:
            # Attempt to split inline bullets like "- one - two - three"
            inline = summary
            if inline.startswith("- "):
                inline = inline[2:]
            parts = [p.strip() for p in inline.split(" - ") if p.strip()]
            if len(parts) >= 3:
                summary = "- " + "\n- ".join(parts[:3])
                bullets = [line for line in summary.splitlines() if line.strip()]
        # Strip common labels and semicolons, ensure exactly three bullets, each starting with "- ";
        # replace vague "Not specified" outputs with neutral, useful guidance.
        cleaned = []
        for line in bullets:
            l = line.strip()
            # Remove common label prefixes if present
            for label in (
                "Overview:", "Main:", "Budget:", "Funding:", "Budget/Funding:",
                "Commercials:", "Commercials/Eligibility:", "Eligibility:",
                "Timeline:", "Timeline/Key Info:", "Dates:", "Key Info:"
            ):
                if l.lower().startswith(label.lower()):
                    l = l[len(label):].strip()
            # Replace semicolons with commas to avoid run-on feel
            l = l.replace(";", ",")
            if not l.startswith("-"):
                l = "- " + l.lstrip("-").strip()
            elif not l.startswith("- "):
                l = "- " + l[1:].strip()
            cleaned.append(l)
            if len(cleaned) == 3:
                break
        if len(cleaned) == 3:
            adjusted = []
            for idx, l in enumerate(cleaned):
                core = l[2:].strip() if l.startswith("- ") else l
                lower_core = core.lower()
                if lower_core == "not specified" or lower_core.startswith("not specified") or "not specified in detail" in lower_core:
                    if idx == 0:
                        core = "Review the opportunity notice for scope and the offering agency."
                    elif idx == 1:
                        core = "Refer to the solicitation for financial terms, contract structure, and eligibility specifics."
                    else:
                        core = "Check the notice for submission deadlines and other key requirements."
                    l = "- " + core
                adjusted.append(l)
            return "\n".join(adjusted)
        return DEFAULT_SUMMARY
    except Exception:
        return DEFAULT_SUMMARY

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
        logger.info("OpenAI client initialized successfully")
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert government contract analyst. Write a concise summary as EXACTLY three bullet points for a business audience.\n"
                        "Formatting requirements:\n"
                        "- Use simple, plain language that is easy to understand at a glance.\n"
                        "- Output must be exactly three lines, each beginning with '- ' (dash + space).\n"
                        "- Each bullet MUST be on its own line separated by a newline. Do not place multiple bullets on a single line.\n"
                        "- Keep each bullet to a single sentence (aim for \u2264 25 words).\n"
                        "- Do NOT include labels like 'Overview:', 'Budget:', or 'Timeline:'. Write natural sentences without prefixes.\n"
                        "Content requirements (in order):\n"
                        "1) Overview: What the opportunity is and who is offering it (and who it's for if relevant).\n"
                        "2) Commercials/Eligibility or Key Facts: Include budget/funding/ceiling/pricing model, contract type/vehicle, eligibility/set-aside/NAICS, agency, or place of performance if present. If not, include another concrete, verifiable detail from the description (e.g., scope, deliverables, performance locations). Do not write 'Not specified'.\n"
                        "3) Timeline/Key Info: Due/submission date, performance period, anticipated award, site visit, or other critical requirements. If no dates are given, include another concrete requirement or write a neutral guidance such as 'See the notice for submission details and key requirements.'\n"
                        "Do not include headings or extra commentary."
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
        summary = normalize_bulleted_summary(summary)
        
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
            return {
                "title": opportunity_title or "Untitled Opportunity",
                "summary": (
                    "- Limited public details are available; please review the full notice for specifics.\n"
                    "- Refer to the solicitation for financial terms, contract structure, and eligibility specifics.\n"
                    "- Check the notice for submission deadlines and other key requirements."
                )
            }
        # Truncate very long descriptions
        if len(description_text) > 6000:
            description_text = description_text[:6000] + "..."
        client = get_openai_client()
        logger.info("OpenAI client initialized successfully")
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert government contract analyst. Return ONLY a JSON object with two fields: 'title' and 'summary'.\n"
                        "- title: A clear, glanceable title (6–12 words), easy to understand without jargon. If the provided title is unclear or missing, generate one from the description. Focus on what it is and for whom.\n"
                        "- summary: A single string formatted as EXACTLY three bullet points, each on its own line beginning with '- '. Each bullet MUST be on its own line separated by a newline; do not combine bullets on one line. Avoid labels like 'Overview:'; write natural sentences.\n"
                        "  Bullet 1 (Overview): What the opportunity is and who is offering it (and who it's for if relevant).\n"
                        "  Bullet 2 (Commercials/Eligibility or Key Facts): Include budget/funding/ceiling/pricing model, contract type/vehicle, eligibility/set-aside/NAICS, agency, or place of performance if present. If not, include another concrete, verifiable detail from the description (e.g., scope, deliverables, performance locations). Do not write 'Not specified'.\n"
                        "  Bullet 3 (Timeline/Key Info): Due/submission date, performance period, anticipated award, site visit, or other critical requirements (certifications, compliance, contact method). If no dates are given, include another concrete requirement or write a neutral guidance such as 'See the notice for submission details and key requirements.'\n"
                        "Do not include any extra text besides the JSON object."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Original Title: {opportunity_title or 'N/A'}\n\n"
                        f"Description: {description_text}\n\n"
                        "Return ONLY the JSON object with 'title' and 'summary' (3 bullets)."
                    )
                }
            ],
            temperature=0.2,
            max_tokens=max_length,
            n=1
        )
        logger.info("OpenAI response received")
        content = response.choices[0].message.content.strip()
        # Extract JSON if wrapped in markdown
        if content.startswith("```json"):
            content = content.split("```json")[1].split("```", 1)[0].strip()
        result = json.loads(content)
        # Fallbacks
        title = result.get("title", opportunity_title or "Untitled Opportunity")
        summary = result.get(
            "summary",
            "- Limited public details are available; please review the full notice for specifics.\n"
            "- Refer to the solicitation for financial terms, contract structure, and eligibility specifics.\n"
            "- Check the notice for submission deadlines and other key requirements."
        )
        # Normalize possible inline bullets into separate lines
        if isinstance(summary, str):
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
    
DEFAULT_SUMMARY = (
    "- Limited public details are available; please review the full notice for specifics.\n"
    "- Refer to the solicitation for financial terms, contract structure, and eligibility specifics.\n"
    "- Check the notice for submission deadlines and other key requirements."
)

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
