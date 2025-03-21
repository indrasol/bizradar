from sentence_transformers import SentenceTransformer
import psycopg2
from openai import OpenAI
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv
import logging

# Load environment variables from .env
load_dotenv()

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Instead of initializing at module level, create a function to get the client
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY environment variable not set")
    return OpenAI(api_key=api_key)

def refine_query(query: str, contract_type: Optional[str] = None, platform: Optional[str] = None) -> str:
    """Refine the user query using OpenAI with improved domain understanding"""
    try:
        # Initialize the client only when needed
        openai_client = get_openai_client()
        
        filters = []
        if contract_type:
            filters.append(f"Contract Type: {contract_type}")
        if platform:
            filters.append(f"Platform: {platform}")
        
        filters_str = ", ".join(filters) if filters else "No filters provided"
        logger.info(f"Refining query: '{query}' with filters: {filters_str}")

        prompt = f"""
        You are an expert in technical domain mapping for government contracting searches. Transform this user query: '{query}'

        YOUR TASK:
        1. First, identify the core technical domain from the user's query, accounting for:
           - Casual language (e.g., "get me", "find", "show")
           - Abbreviations (e.g., "cyber sec", "AI", "ML", "IT")
           - Typos and misspellings (e.g., "opportunitites", "securityt")
           - Informal expressions (e.g., "stuff", "things", "jobs")

        2. Once you identify the core domain (e.g., "cybersecurity", "machine learning", "software development"):
           - Generate a comprehensive set of synonyms and related technical terms
           - Include ALL relevant subdisciplines within that domain
           - Include industry-standard terminology and certifications
           - Include relevant technologies and frameworks
           - Consider both technical and functional terms professionals would use

        3. Structure the query using appropriate boolean operators:
           - Use OR between related terms within the same domain
           - Use AND for required constraints (e.g., "government contract")
           - Add domain-specific qualifiers where appropriate
           - Include "site:sam.gov" if searching government opportunities

        4. Exclude terms that lead to irrelevant results:
           - For cybersecurity: exclude physical security guard positions
           - For AI/ML: exclude non-technical marketing roles
           - For development: exclude construction/real estate development

        EXAMPLES:
        "get me cyber sec opp" → "cybersecurity OR network security OR penetration testing OR vulnerability assessment OR information security OR cloud security OR zero trust architecture OR CISSP OR security operations OR SOC OR incident response AND government contract site:sam.gov"
        
        "ML jobs" → "machine learning OR artificial intelligence OR deep learning OR neural networks OR NLP OR computer vision OR data science OR predictive analytics OR MLOps AND government contract site:sam.gov"
        
        "software dev" → "software development OR software engineering OR application development OR full stack OR back end OR front end OR DevOps OR CI/CD OR API development OR microservices AND government contract site:sam.gov"

        Additional filters: {filters_str}

        Return ONLY the expanded search query string. No explanations, bullets, or commentary.
        """

        response = openai_client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a technical domain expert specializing in government IT contracts with deep knowledge of terminology across cybersecurity, software development, data science, cloud computing, telecommunications, and other technical fields."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.2
        )
        
        refined_query = response.choices[0].message.content.strip()
        logger.info(f"Original query: '{query}' → Refined: '{refined_query}'")
        
        return refined_query

    except Exception as e:
        logger.error(f"Query refinement error: {str(e)}")
        return query