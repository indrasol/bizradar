import os
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Depends
from services.open_ai_refiner import refine_query
from services.job_search import search_jobs
from services.pdf_service import generate_rfp_pdf
from openai import OpenAI

search_router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@search_router.post("/search-opportunities")
async def search_job_opportunities(request: Request):
    try:
        data = await request.json()
        query = data.get("query", "")
        contract_type = data.get("contract_type", None)
        platform = data.get("platform", None)

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        refined_query = refine_query(query, contract_type, platform)
        job_results = search_jobs(refined_query, contract_type, platform)
        return {"results": job_results}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@search_router.post("/generate-rfp/{contract_id}")
async def generate_rfp(contract_id: str, request: Request):
    print("Generating RFP")
    try:
        # Create output directory if it doesn't exist
        output_dir = os.path.join(os.path.dirname(__file__), "..", "services", "generated_rfps")
        os.makedirs(output_dir, exist_ok=True)
        
        # Define paths with proper error handling
        output_path = os.path.join(output_dir, f"{contract_id}_rfp.pdf")
        
        # Use a relative path that's more likely to exist or provide a fallback
        logo_path = os.path.join(os.path.dirname(__file__), "..", "static", "logo.jpg")
        # Check if logo exists, if not, set to None
        if not os.path.exists(logo_path):
            print(f"Warning: Logo not found at {logo_path}")
            # Try alternative locations
            alt_logo_paths = [
                os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "logo.jpg"),
                os.path.join(os.path.dirname(__file__), "..", "public", "logo.jpg"),
                "/app/frontend/public/logo.jpg"  # Docker container path
            ]
            
            for alt_path in alt_logo_paths:
                if os.path.exists(alt_path):
                    logo_path = alt_path
                    print(f"Found logo at alternative path: {logo_path}")
                    break
            else:
                print("Logo not found in any location, proceeding without logo")
                logo_path = None
        
        data = await request.json()
        
        # Fix date parsing with better error handling
        due_date_str = data.get('dueDate', '2025-01-01')
        # Remove time component if present
        if 'T' in due_date_str:
            due_date_str = due_date_str.split('T')[0]
        try:
            due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
        except ValueError:
            print(f"Invalid date format: {due_date_str}, using default")
            due_date = datetime.now()
        
        # Parse value with error handling
        try:
            value = int(data.get('value', 0))
        except (ValueError, TypeError):
            value = 0
        
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
        return {"message": "RFP generated successfully", "file": pdf_path}

    except Exception as e:
        print(f"Error in generate_rfp: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@search_router.post("/ask-ai")
async def ask_ai(request: Request):
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

        return {"response": response.choices[0].message.content}

    except Exception as e:
        print(f"Error in ask-ai endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@search_router.post("/process-document")
async def process_document(request: Request):
    try:
        data = await request.json()
        html_content = data.get("content", "")
        
        if not html_content:
            raise HTTPException(status_code=400, detail="Document content is required")
        
        # Use the OpenAI client to process the HTML content
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": """You are an AI assistant tasked with regenerating HTML document content exactly as provided. 
                Do not modify the structure, content, or formatting of the document unless explicitly instructed. 
                Return the complete HTML content as is."""},
                {"role": "user", "content": f"Please regenerate this HTML document exactly as it is:\n\n{html_content}"}
            ],
            temperature=0.0,  # Set to 0 for maximum determinism
            max_tokens=4000   # Adjust based on your document size
        )
        
        processed_content = response.choices[0].message.content
        
        # Strip any markdown code blocks that might have been added by the LLM
        if processed_content.startswith("```html"):
            processed_content = processed_content.replace("```html", "", 1)
            if processed_content.endswith("```"):
                processed_content = processed_content[:-3]
        
        return {"processedContent": processed_content.strip()}

    except Exception as e:
        print(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))