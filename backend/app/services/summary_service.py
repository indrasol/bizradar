import os
import logging
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
            # Check if the opportunity has a description to summarize
            if "additional_description" in opp and opp["additional_description"]:
                # Generate summary
                summary = await generate_description_summary(opp["additional_description"])
                
                # Add the summary to the opportunity object
                opp["summary"] = summary
            else:
                opp["summary"] = "No description available."
                
        return opportunities
        
    except Exception as e:
        logger.error(f"Error processing opportunity descriptions: {str(e)}")
        return opportunities  # Return original opportunities if there's an error