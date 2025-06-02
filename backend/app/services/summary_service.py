import os
import logging
import aiohttp
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

async def process_opportunity_descriptions(opportunities):
    """
    Processes a list of opportunities to generate summaries for their descriptions.
    
    Args:
        opportunities (list): List of opportunity objects
        
    Returns:
        list: The same list with summaries added to each opportunity
    """
    try:
        logger.info(f"Processing {len(opportunities)} opportunities for summary generation")
        
        for opp in opportunities:
            # First try to get description from additional_description
            description = None
            if "additional_description" in opp and opp["additional_description"]:
                description = opp["additional_description"]
            # If no additional_description, try to fetch from SAM.gov API if description is a URL
            elif "description" in opp and opp["description"] and opp["description"].startswith("https://api.sam.gov/prod/opportunities/v1/noticedesc"):
                description = await fetch_description_from_sam(opp["description"])
            
            if description:
                # Generate summary
                summary = await generate_description_summary(description)
                
                # Add the summary to the opportunity object
                opp["summary"] = summary
            else:
                # If no description available from any source
                opp["summary"] = ("This opportunity currently lacks a detailed description, so specific information "
                    "about its objectives, eligibility criteria, and potential benefits is not yet available. "
                    "To learn more about what this opportunity entails, including its purpose, requirements, "
                    "and how it can impact you or your organization, please contact the opportunity provider "
                    "directly. Alternatively, check back on this page for updates as more details become available.")

        return opportunities
        
    except Exception as e:
        logger.error(f"Error processing opportunity descriptions: {str(e)}")
        return opportunities  # Return original opportunities if there's an error