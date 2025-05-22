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

        # prompt = f"""
        # You are a technical domain expert specializing in government contracting. Transform this user query: '{query}' by:
        
        # 1. Identifying the core technical domain (e.g., cybersecurity, machine learning, software development).
        # 2. Expanding the domain by including related terms, synonyms, subdomains, and industry-standard terminology. For example, if 'ML' is used, treat it as 'Machine Learning' and avoid irrelevant academic or research interpretations.
        # 3. Ensuring the query is specific to government contracting opportunities (include 'AND government contract' or 'site:sam.gov' as needed).
        # 4. Applying appropriate boolean operators to combine related terms and excluding irrelevant results.
        # 5. Incorporating any additional user filters such as 'Contract Type' or 'Platform'.
        
        # Example refinement scenarios:
        # - "cyber sec" → "cybersecurity OR network security OR penetration testing OR vulnerability assessment OR information security AND government contract site:sam.gov"
        # - "ML jobs" → "machine learning OR artificial intelligence OR deep learning OR data science OR predictive analytics AND government contract site:sam.gov"
        # - "software dev" → "software development OR application development OR full stack OR DevOps AND government contract site:sam.gov"
        
        # Additional filters: {filters_str}
        
        # Return ONLY the refined query string without extra explanations.
        # """

        # prompt = f"""
        # You are an expert in government contracting, specializing in precise and direct technical domain searches. Transform the following user query: '{query}' by:

        # 1. **Identifying the exact technical domain** (e.g., machine learning, software development, artificial intelligence, cybersecurity).
        # 2. **Generating a straightforward and unambiguous query** that matches the user's request exactly without introducing unrelated terms or variations:
        #    - Focus directly on terms that are **widely recognized** and commonly used in government contracting opportunities (e.g., "machine learning," "software development," "cybersecurity").
        #    - **Avoid using synonyms or broad terms** that could lead to ambiguity.
        #    - **Do not include intelligence-related terms** like "counterintelligence," "intelligence," or references to intelligence agencies (e.g., DCSA, CIA, NSA).
        # 3. **Ensure the query is specific and aligned with government contracting** by including "AND government contract" or "site:sam.gov" where applicable.

        # Example refined queries:
        # - "cyber sec" → "cybersecurity AND government contract site:sam.gov"
        # - "ML jobs" → "machine learning AND government contract site:sam.gov"
        # - "software dev" → "software development AND government contract site:sam.gov"
        
        # Additional filters: {filters_str}
        
        # Return ONLY the **exact** refined query string without extra explanations or modifications.
        # """

        # prompt = f"""
        # You are a technical domain expert specializing in government contracting, with deep knowledge of industry-standard terminology across multiple technical fields. Transform the following user query: '{query}' by:

        # 1. **Identifying the core technical domain** (e.g., machine learning, software development, cybersecurity, cloud computing, artificial intelligence).
        # 2. **Expanding the domain** by including industry-standard related terms, synonyms, subdomains, and commonly used terminology:
        #    - Include formal and informal terms professionals in the field would recognize (e.g., AI, ML, DevOps, Cloud, neural networks).
        #    - Use recognized certifications (e.g., AWS Certified Solutions Architect, CISSP) and frameworks (e.g., Agile, ITIL).
        # 3. **Explicitly exclude any intelligence-related terms** or references to **intelligence agencies**:
        #    - Do **not** include terms like "counterintelligence," "intelligence," or references to specific intelligence agencies (e.g., DCSA, CIA, NSA).
        # 4. **Focusing on government contracting**: Add terms like "AND government contract" or "site:sam.gov" to ensure the query aligns with government procurement opportunities.
        # 5. **Minimizing highly specialized terms**: Avoid terms that are too specific or unrelated to the core technical domain (e.g., "Learning Management Ecosystem") if they do not align with government IT contracting.
        # 6. **Generating a straightforward and unambiguous query** that matches the user's request exactly without introducing unrelated terms or variations:
                        
        # Example refined queries:
        # - "cyber sec" → "cybersecurity OR network security OR penetration testing OR vulnerability assessment OR information security OR cloud security OR zero trust architecture OR CISSP OR security operations OR SOC OR incident response AND government contract site:sam.gov"
        # - "ML jobs" → "machine learning OR artificial intelligence OR deep learning OR neural networks OR NLP OR computer vision OR data science OR predictive analytics OR MLOps AND government contract site:sam.gov"
        # - "software dev" → "software development OR application development OR full stack OR DevOps OR CI/CD OR microservices OR API development OR back end OR front end OR cloud development AND government contract site:sam.gov"
        
        # Additional filters: {filters_str}
        
        # Return ONLY the refined query string without extra explanations.
        # """

        prompt =f"""
        You are a government contracting expert. Refine the following user query: '{query}' by:

1. **Identifying the Core Technical Domain**: Determine the main technical field (e.g., cybersecurity, software development).

2. **Expanding the Domain**: Include relevant terms, certifications (e.g., AWS, CISSP), job titles (e.g., software engineer, cybersecurity analyst), and descriptions commonly found in SAM.gov job postings. Add “AND government contract” or “site:sam.gov” to focus on government opportunities.

3. **Excluding Intelligence Terms**: Avoid terms like "intelligence" or references to intelligence agencies.

4. **Avoiding Overly Specialized Terms**: Exclude niche terms unless they are directly related to government IT contracting.

5. **Generating a Clear Query**: Create a precise query that matches the user’s intent.

6. **Apply Filters** (if provided): Include filters: {filters_str}.

Example Refined Queries:
- "cyber sec" → "cybersecurity OR network security OR penetration testing OR vulnerability assessment OR CISSP"
- "ML jobs" → "machine learning OR AI OR data science OR MLOps"
- "software dev" → "software development OR DevOps OR full stack OR cloud development"

Return ONLY the refined query string, with no extra explanations.

        """
        
        # Request from OpenAI API
        response = openai_client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[{
                "role": "system", 
                "content": "You are a technical domain expert specializing in government IT contracts with deep knowledge of terminology across multiple technical fields."
            }, {
                "role": "user", 
                "content": prompt
            }],
            max_tokens=200,
            temperature=0.2
        )
        
        refined_query = response.choices[0].message.content.strip()
        logger.info(f"Original query: '{query}' → Refined: '{refined_query}'")
        
        return refined_query

    except Exception as e:
        logger.error(f"Query refinement error: {str(e)}")
        return query
