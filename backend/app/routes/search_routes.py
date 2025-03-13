import os
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from services.open_ai_refiner import refine_query
from services.job_search import search_jobs
from services.pdf_service import generate_rfp_pdf
from services.recommendations import generate_recommendations
from openai import OpenAI
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

search_router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@search_router.post("/search-opportunities")
async def search_job_opportunities(request: Request):
    """
    Search for job opportunities based on query and optional filters.
    Returns paginated job results.
    """
    try:
        data = await request.json()
        query = data.get("query", "")
        contract_type = data.get("contract_type", None)
        platform = data.get("platform", None)
        page = data.get("page", 1)
        results_per_page = data.get("results_per_page", 5)

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # Search for jobs
        refined_query = refine_query(query, contract_type, platform)
        job_results = search_jobs(refined_query, contract_type, platform)
        
        # Implement pagination
        start_index = (page - 1) * results_per_page
        end_index = start_index + results_per_page
        paginated_results = job_results[start_index:end_index]
        
        return {
            "results": paginated_results,
            "total_results": len(job_results),
            "page": page,
            "total_pages": (len(job_results) + results_per_page - 1) // results_per_page
        }

    except Exception as e:
        logger.error(f"Error in search opportunities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@search_router.post("/ai-recommendations")
async def get_ai_recommendations(request: Request):
    """
    Generate AI recommendations based on company profile and opportunities.
    Provides detailed, context-aware recommendations.
    """
    try:
        data = await request.json()
        company_url = data.get("companyUrl", "")
        company_description = data.get("companyDescription", "")
        opportunities = data.get("opportunities", [])

        logger.info(f"Received AI recommendations request with {len(opportunities)} opportunities")
        
        if not company_description:
            raise HTTPException(status_code=400, detail="Company description is required")
        
        # Call the service function to generate recommendations
        # FIXED: Added 'await' keyword here
        recommendations = await generate_recommendations(
            company_url=company_url,
            company_description=company_description,
            opportunities=opportunities
        )
        
        # Check if recommendations has the expected structure
        if not isinstance(recommendations, dict) or 'recommendations' not in recommendations:
            logger.warning("Recommendations returned unexpected structure")
            recommendations = {"recommendations": []}
        
        # Get the recommendations array from the result
        recommendation_list = recommendations.get('recommendations', [])
        
        # Enhance recommendations with detailed context
        enhanced_recommendations = []
        for rec in recommendation_list:
            enhanced_rec = rec.copy()
            
            # If an opportunity is associated, add more context
            if 'opportunityIndex' in rec and 0 <= rec['opportunityIndex'] < len(opportunities):
                opp = opportunities[rec['opportunityIndex']]
                enhanced_rec['opportunityDetails'] = {
                    'title': opp.get('title', 'N/A'),
                    'agency': opp.get('agency', 'N/A'),
                    'naicsCode': opp.get('naicsCode', 'N/A'),
                    'description': opp.get('description', 'N/A')
                }
            
            enhanced_recommendations.append(enhanced_rec)
        
        return {"recommendations": enhanced_recommendations}
            
    except Exception as e:
        logger.error(f"Error in AI recommendations endpoint: {str(e)}")
        return {"recommendations": [
            {
                "id": "error-rec-1",
                "title": "Recommendation Generation Error",
                "description": "We encountered an issue generating personalized recommendations. Our team is working to resolve this.",
                "matchScore": 50,
                "fallbackReason": str(e)
            }
        ]}

@search_router.post("/generate-rfp/{contract_id}")
async def generate_rfp(contract_id: str, request: Request):
    """
    Generate RFP (Request for Proposal) for a specific contract
    with enhanced error handling and flexible path resolution
    """
    print("Generating RFP")
    try:
        # Create output directory with robust path handling
        output_dir = os.path.join(os.path.dirname(__file__), "..", "services", "generated_rfps")
        os.makedirs(output_dir, exist_ok=True)
        
        # Define paths with comprehensive error handling
        output_path = os.path.join(output_dir, f"{contract_id}_rfp.pdf")
        
        # Advanced logo path resolution
        logo_paths = [
            os.path.join(os.path.dirname(__file__), "..", "static", "logo.jpg"),
            os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "logo.jpg"),
            os.path.join(os.path.dirname(__file__), "..", "public", "logo.jpg"),
            "/app/frontend/public/logo.jpg"
        ]
        
        logo_path = next((path for path in logo_paths if os.path.exists(path)), None)
        
        if not logo_path:
            print("Warning: No logo found. Proceeding without logo.")
        
        # Robust data parsing
        data = await request.json()
        
        # Flexible date parsing
        due_date_str = data.get('dueDate', '2025-01-01')
        try:
            due_date = datetime.strptime(due_date_str.split('T')[0], '%Y-%m-%d')
        except (ValueError, IndexError):
            print(f"Invalid date format: {due_date_str}. Using default.")
            due_date = datetime.now()
        
        # Safe value parsing
        try:
            value = int(data.get('value', 0))
        except (ValueError, TypeError):
            value = 0
        
        # Generate PDF with robust error handling
        pdf_path = generate_rfp_pdf(
            contract_id=contract_id,
            title=data.get('title', 'Default Title'),
            agency=data.get('agency', 'Default Agency'),
            platform=data.get('platform', 'Default Platform'),
            value=value,
            due_date=due_date,
            status=data.get('status', 'Open'),
            naics_code=data.get('naicsCode', '000000'),
            output_path=output_path,
            logo_path=logo_path
        )
        
        return {
            "message": "RFP generated successfully", 
            "file": pdf_path,
            "details": {
                "contract_id": contract_id,
                "title": data.get('title', 'Default Title'),
                "generated_at": datetime.now().isoformat()
            }
        }

    except Exception as e:
        print(f"Comprehensive error in generate_rfp: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "RFP Generation Failed",
                "message": str(e),
                "trace": traceback.format_exc()
            }
        )

@search_router.post("/ask-ai")
async def ask_ai(request: Request):
    """
    AI-powered conversation assistant for RFP-related queries
    """
    try:
        data = await request.json()
        messages = data.get("messages", [])
        document_content = data.get("documentContent")

        system_prompt = f"""You are an AI assistant helping with RFP (Request for Proposal) related queries. 
        {f'Here is the current RFP document content for context:\n\n{document_content}' if document_content else ''}
        
        Please provide clear, concise, and professional responses focused on helping users understand and work with RFP documents."""

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                *messages
            ],
            temperature=0.7,
            max_tokens=500
        )

        return {
            "response": response.choices[0].message.content,
            "tokens_used": response.usage.total_tokens if response.usage else None
        }

    except Exception as e:
        print(f"Error in ask-ai endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@search_router.post("/process-document")
async def process_document(request: Request):
    """
    Process and validate document content
    """
    try:
        data = await request.json()
        html_content = data.get("content", "")
        
        if not html_content:
            raise HTTPException(status_code=400, detail="Document content is required")
        
        # Use OpenAI to process document with enhanced validation
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system", 
                    "content": """You are an AI document validator. 
                    Regenerate HTML document content exactly as provided. 
                    Do not modify structure, content, or formatting. 
                    Ensure document integrity."""
                },
                {"role": "user", "content": f"Validate and regenerate this HTML document:\n\n{html_content}"}
            ],
            temperature=0.0,  # Maximum determinism
            max_tokens=4000
        )
        
        processed_content = response.choices[0].message.content
        
        # Strip any potential markdown code blocks
        if processed_content.startswith("```html"):
            processed_content = processed_content.replace("```html", "", 1)
        if processed_content.endswith("```"):
            processed_content = processed_content[:-3]
        
        return {
            "processedContent": processed_content.strip(),
            "contentLength": len(processed_content),
            "validationTimestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"Comprehensive document processing error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Document Processing Failed",
                "message": str(e)
            }
        )