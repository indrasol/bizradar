from sentence_transformers import SentenceTransformer
# import pinecone
import psycopg2
from openai import OpenAI
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv
import logging  # Add logging instead of console.log

# Load environment variables from .env
load_dotenv()

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the OpenAI API client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def refine_query(query: str, contract_type: Optional[str] = None, platform: Optional[str] = None) -> str:
    """
    Refine the user query using OpenAI, incorporating filters (contract_type and platform).
    Returns a concise, natural language query optimized for vector search.
    """
    # Construct the prompt for OpenAI with given filters and query
    filters = []
    if contract_type:
        filters.append(f"Contract Type: {contract_type}")
    if platform:
        filters.append(f"Platform: {platform}")
    
    filters_str = ", ".join(filters)
    logger.info(f"Filters: {filters_str}")   # Use logger instead of console.log

    # Building the prompt
    prompt = f"""
    Refine this query for a job search: '{query}'.
    Incorporate the following filters if provided: {filters_str}.
    Return a concise, natural language query optimized by understanding the intent for finding relevant job opportunities.
    """

    # Call OpenAI to refine the query
    try: 
        response = openai_client.chat.completions.create(
            model="gpt-4",  # Changed from gpt-4-mini to gpt-4
            messages=[
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": ""}  # Fixed assistant message format
            ],
            max_tokens=50,  # Added missing comma
            temperature=0.3  # Added missing comma
        )
        refined_query = response.choices[0].message.content
        logger.info(f"Refined query: {refined_query}")  # Use logger instead of console.log
        return refined_query
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")  # Added error logging
        raise Exception(f"OpenAI API error: {str(e)}")
