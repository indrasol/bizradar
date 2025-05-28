import logging
import json
import os
import traceback
from typing import Dict, Any, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
# from openai import OpenAI, APIError
from services.doc_processing import format_document_context

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# # Check for OpenAI API key
# api_key = os.getenv("OPENAI_API_KEY")
# if not api_key:
#     logger.error("OPENAI_API_KEY environment variable not found")
# else:
#     logger.info("OPENAI_API_KEY environment variable found")

# # Initialize OpenAI client with error handling
# try:
#     openai_client = OpenAI(api_key=api_key)
#     logger.info("OpenAI client initialized successfully")
# except Exception as e:
#     logger.error(f"Failed to initialize OpenAI client: {str(e)}")
#     openai_client = None

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

def get_db_connection():
    """Create a connection to the Supabase PostgreSQL database with detailed error handling"""
    try:
        # Log DB connection parameters (without password)
        logger.info(f"Connecting to DB - Host: {os.getenv('DB_HOST')}, Port: {os.getenv('DB_PORT')}, DB: {os.getenv('DB_NAME')}, User: {os.getenv('DB_USER')}")
        
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        conn.autocommit = True
        logger.info("Database connection established successfully")
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        logger.error(traceback.format_exc())
        return None

async def get_opportunity_details(notice_id: str) -> Optional[Dict[str, Any]]:
    """Fetch opportunity details from the sam_gov table using notice_id"""
    if not notice_id:
        logger.warning("No notice ID provided, skipping opportunity details lookup")
        return None
    
    conn = None
    try:
        # Create a connection to the database
        conn = get_db_connection()
        if not conn:
            logger.error("Failed to connect to database for opportunity details")
            return None
        
        # Create a cursor
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Execute the query - make sure this matches your table structure
            logger.info(f"Executing query to fetch opportunity with notice_id: {notice_id}")
            cursor.execute("SELECT *, description AS detail_url, additional_description FROM sam_gov WHERE notice_id = %s", (notice_id,))
            
            # Fetch the result
            result = cursor.fetchone()
            
            if result:
                # Convert the result to a dictionary
                opportunity = dict(result)
                # Replace the old URL-based description with your richer details
                # (fall back to empty string if missing)
                opportunity["description"] = opportunity.get("additional_description", "")
                
                logger.info(f"Found opportunity details for notice ID: {notice_id}")
                logger.info(f"Opportunity title: {opportunity.get('title', 'N/A')}")
                return opportunity
            else:
                logger.warning(f"No opportunity found for notice ID: {notice_id}")
                return None
    except Exception as e:
        logger.error(f"Error fetching opportunity details: {str(e)}")
        logger.error(traceback.format_exc())
        return None
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed (opportunity details)")

async def get_company_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetch company profile from the companies table"""
    if not user_id:
        logger.warning("No user ID provided, skipping company profile lookup")
        return None
    
    conn = None
    try:
        # Create a connection to the database
        conn = get_db_connection()
        if not conn:
            logger.error("Failed to connect to database for company profile")
            return None
        
        # Create a cursor
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # First try to get company data from user_companies table
            logger.info(f"Looking up company for user_id: {user_id}")
            cursor.execute("SELECT company_id FROM user_companies WHERE user_id = %s", (user_id,))
            user_company = cursor.fetchone()
            
            if user_company and user_company.get('company_id'):
                company_id = user_company.get('company_id')
                logger.info(f"Found company_id: {company_id} for user_id: {user_id}")
                
                # Now get the company details
                cursor.execute("SELECT * FROM companies WHERE id = %s", (company_id,))
                company = cursor.fetchone()
                
                if company:
                    company_profile = dict(company)
                    logger.info(f"Found company profile: {company_profile.get('name', 'N/A')}")
                    return company_profile
                else:
                    logger.warning(f"No company found with id: {company_id}")
            else:
                logger.warning(f"No company_id found for user_id: {user_id}")
            
            return None
    except Exception as e:
        logger.error(f"Error fetching company profile: {str(e)}")
        logger.error(traceback.format_exc())
        return None
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed (company profile)")

def format_opportunity_context(opportunity: Dict[str, Any]) -> str:
    """Format opportunity details into a context string for the AI"""
    if not opportunity:
        return ""
    
    # Extract key fields from the opportunity
    context_parts = [
        "OPPORTUNITY DETAILS:",
        f"Title: {opportunity.get('title', 'N/A')}",
        f"Notice ID: {opportunity.get('notice_id', 'N/A')}",
        f"Agency: {opportunity.get('agency', 'N/A')}",
        f"NAICS Code: {opportunity.get('naics_code', 'N/A')}"
    ]
    
    # Add status if available
    if 'status' in opportunity:
        context_parts.append(f"Status: {opportunity.get('status', 'N/A')}")
    
    # Add due date if available
    if 'due_date' in opportunity:
        context_parts.append(f"Due Date: {opportunity.get('due_date', 'N/A')}")
    
    # Add description if available
    description = opportunity.get('description', '')
    if description:
        context_parts.append("\nDESCRIPTION:")
        context_parts.append(description[:1000] + "..." if len(description) > 1000 else description)
    
    return "\n".join(context_parts)

def format_company_context(company_profile: Dict[str, Any]) -> str:
    """Format company profile into a context string for the AI"""
    if not company_profile:
        return ""
    
    # Extract key fields from the company profile
    context_parts = [
        "COMPANY PROFILE:"
    ]
    
    # Add name if available
    if 'name' in company_profile:
        context_parts.append(f"Name: {company_profile.get('name', 'N/A')}")
    
    # Add URL if available
    if 'url' in company_profile:
        context_parts.append(f"URL: {company_profile.get('url', 'N/A')}")
    
    # Add company description if available
    description = company_profile.get('description', '')
    if description:
        context_parts.append("\nCOMPANY DESCRIPTION:")
        context_parts.append(description)
    
    return "\n".join(context_parts)

def format_pursuit_context(pursuit_context: Dict[str, Any]) -> str:
    """Format pursuit context into a context string for the AI"""
    if not pursuit_context:
        return ""
    
    # Extract key fields from the pursuit context
    context_parts = [
        "PURSUIT CONTEXT:",
        f"Title: {pursuit_context.get('title', 'N/A')}",
        f"Stage: {pursuit_context.get('stage', 'N/A')}"
    ]
    
    # Add due date if available
    if 'dueDate' in pursuit_context:
        context_parts.append(f"Due Date: {pursuit_context.get('dueDate', 'N/A')}")
    
    # Add NAICS code if available
    if 'naicsCode' in pursuit_context:
        context_parts.append(f"NAICS Code: {pursuit_context.get('naicsCode', 'N/A')}")
    
    # Add description if available
    description = pursuit_context.get('description', '')
    if description:
        context_parts.append("\nDESCRIPTION:")
        context_parts.append(description)
    
    return "\n".join(context_parts)

def generate_default_response():
    """Generate a fallback response when OpenAI API is not available"""
    return "I'm BizradarAI, your procurement assistant. I can help you analyze opportunities, understand requirements, and prepare better proposals. What would you like to know about this pursuit?"

async def process_bizradar_request(
    pursuit_id: str,
    notice_id: Optional[str],
    pursuit_context: Dict[str, Any],
    user_id: Optional[str] = None,
    user_query: Optional[str] = None,
    document_context: List[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Process a BizRadar AI request with job details and optional user query.
    
    Args:
        pursuit_id: The ID of the pursuit
        notice_id: The notice ID associated with the pursuit (may be None)
        pursuit_context: Dictionary containing the details of the pursuit
        user_id: The ID of the user (for fetching profile)
        user_query: The user's query to the AI assistant
        document_context: List of dictionaries containing document details
        
    Returns:
        Dict containing the processed results and AI response
    """
    # Log the received information
    logger.info("==========================================")
    logger.info("BizRadar AI Request Received")
    logger.info("==========================================")
    logger.info(f"Pursuit ID: {pursuit_id}")
    logger.info(f"Notice ID: {notice_id}")
    logger.info(f"User ID: {user_id}")
    logger.info("Pursuit Context:")
    logger.info(json.dumps(pursuit_context, indent=2) if pursuit_context else "None")
    logger.info("==========================================")
    
    try:
        # 1. Gather additional context information
        opportunity_details = None
        company_profile = None
        
        if notice_id:
            opportunity_details = await get_opportunity_details(notice_id)
        
        if user_id:
            company_profile = await get_company_profile(user_id)
        
        # 1. Format your PDF text into a single chunk
        doc_ctx_str = format_document_context(document_context) if document_context else ""

        # 2. Format the context for the AI
        pursuit_context_str = format_pursuit_context(pursuit_context)
        opportunity_context_str = format_opportunity_context(opportunity_details) if opportunity_details else ""
        company_context_str = format_company_context(company_profile) if company_profile else ""
        
        # 3. Combine all context information
        full_context = "\n\n".join(filter(None, [
            doc_ctx_str,
            pursuit_context_str,
            opportunity_context_str,
            company_context_str
        ]))
        
        logger.info("Context prepared for AI assistant:")
        logger.info(full_context[:500] + "..." if len(full_context) > 500 else full_context)
        
        # Check if OpenAI client is available
        openai_client = get_openai_client()
        if not openai_client:
            logger.error("OpenAI client not available. Using default response.")
            return {
                "status": "error",
                "message": "OpenAI client not available",
                "pursuit_id": pursuit_id,
                "notice_id": notice_id,
                "ai_response": generate_default_response()
            }
        
        if user_query:
            # Log that we're processing a user query
            logger.info(f"Processing user query: {user_query}")
            
            # Safely grab the detail_url (may be None)
            detail_url = None
            if opportunity_details and "detail_url" in opportunity_details:
                detail_url = opportunity_details["detail_url"]
            
            # Build the "View Details" snippet only if we have a URL
            details_snippet = f"\n\n[View Details]({detail_url})" if detail_url else ""
            
            # Construct the SAM.gov URL for the opportunity
            sam_gov_url = f"https://sam.gov/opp/{notice_id}/view" if notice_id else None
            
            # Prepare the system prompt with context
            system_prompt = f"""
You are BizradarAI, an expert procurement and RFP assistant. You have access to multiple context sources—document context, pursuit context, opportunity details, and company profile—and you must use all relevant information to answer user questions.

Your goals:
1. Read and internalize any provided context sections:
   - DOCUMENT CONTEXT: extracted text from user-uploaded files
   - PURSUIT CONTEXT: high-level details (title, stage, due date, NAICS, description)
   - OPPORTUNITY DETAILS: full record (title, notice ID, agency, NAICS, status, additional_description)
   - COMPANY PROFILE: company name, URL, and description

2. When the user asks a question:
   - Reference and synthesize the above contexts to give accurate, concise, and professional answers.
   - If the user supplies extra custom info or clarifications in their query, treat that as additional context and weave it into your response.
   - Clearly label any section you reference if it's helpful (e.g., "Based on the DOCUMENT CONTEXT…").

3. For casual conversational messages (like "hi", "hello", "thanks", "thank you"):
   - Respond in a friendly, professional manner that acknowledges their greeting.
   - Briefly remind them of what you can help with regarding the current opportunity.
   - Don't respond with errors or "I don't know" for these simple interactions.

4. Always verify whether you have a raw "View Details" URL for the opportunity:
   - If available, append a Markdown link at the end of **every** answer:  
     `[View Details]({detail_url})`
   - If no URL is present, omit it.

5. Tone and style:
   - Be helpful, direct, and professional.
   - Avoid filler; use bullet points for clarity when listing items.
   - If you don't have enough information to fully answer, be kind and encourage the user to break down or simplify their query, or suggest what additional information would be helpful.

System behavior:
- Always prioritize uploaded documents first, then pursuit/opportunity/company contexts.
- Respect token limits by trimming overly long context sections, but never drop an entire context source.
- Do not reveal internal logic or code; respond as the user's procurement AI assistant.
- Always provide a helpful response, even for casual greetings or thanks.



DOCUMENT CONTEXT:
{doc_ctx_str}

OTHER CONTEXT:
{pursuit_context_str}
{opportunity_context_str}
{company_context_str}

Answer the user's question concisely and professionally.{details_snippet}
"""
            
            try:
                # Call the OpenAI API
                logger.info("Calling OpenAI API...")
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_query}
                    ],
                    temperature=0.0,      # no randomness
                    max_tokens=500
                )
                
                # Extract the AI's response
                ai_response = response.choices[0].message.content
                logger.info("OpenAI API call successful")
                
                # Return the response with the SAM.gov button
                return {
                    "status": "success",
                    "message": "Processed BizRadar AI request with user query",
                    "pursuit_id": pursuit_id,
                    "notice_id": notice_id,
                    "ai_response": ai_response,
                    "sam_gov_url": sam_gov_url,  # Include the SAM.gov URL
                    "has_opportunity_details": opportunity_details is not None,
                    "has_company_profile": company_profile is not None
                }
            
            except Exception as e:
                # Log the error in detail
                logger.error(f"Error in OpenAI API call: {str(e)}")
                logger.error(traceback.format_exc())
                
                # Return a user-friendly error message
                return {
                    "status": "error",
                    "message": f"Error generating AI response: {str(e)}",
                    "pursuit_id": pursuit_id,
                    "notice_id": notice_id,
                    "ai_response": "I'm sorry, I encountered an error while processing your request. Please try again later."
                }
        else:
            # No user query, generate welcome message based on context
            welcome_message = f"I'm BizradarAI, your procurement assistant. I notice you're asking about the pursuit \"{pursuit_context.get('title', 'this opportunity')}\". I can help you analyze this opportunity, understand requirements, and prepare better proposals. What specific information do you need about this pursuit?"
            
            # Construct the SAM.gov URL for the opportunity
            sam_gov_url = f"https://sam.gov/opp/{notice_id}" if notice_id else None
            
            return {
                "status": "success",
                "message": "Processed BizRadar AI request without user query",
                "pursuit_id": pursuit_id,
                "notice_id": notice_id,
                "context_available": bool(full_context),
                "has_opportunity_details": opportunity_details is not None,
                "has_company_profile": company_profile is not None,
                "title": pursuit_context.get("title", "Unknown"),
                "ai_response": welcome_message,
                "sam_gov_url": sam_gov_url  # Include the SAM.gov URL
            }
    
    except Exception as e:
        logger.error(f"Error processing BizRadar AI request: {str(e)}")
        logger.error(traceback.format_exc())
        
        return {
            "status": "error",
            "message": f"Error processing request: {str(e)}",
            "pursuit_id": pursuit_id,
            "notice_id": notice_id,
            "ai_response": "I'm sorry, I encountered an error while processing your request. Please try again later."
        }