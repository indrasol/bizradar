import os
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Depends
from services.open_ai_refiner import refine_query
from services.job_search import search_jobs
from services.pdf_service import generate_rfp_pdf

search_router = APIRouter()

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
        
        # Define paths
        output_path = os.path.join(output_dir, f"{contract_id}_rfp.pdf")
        logo_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "logo.jpg")
        
        data = await request.json()
        
        # Fix date parsing
        due_date_str = data.get('dueDate', '2025-01-01')
        # Remove time component if present
        due_date_str = due_date_str.split('T')[0]
        due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
        
        pdf_path = generate_rfp_pdf(
            contract_id=contract_id,
            title=data.get('title', 'Default Title'),
            agency=data.get('agency', 'Default Agency'),
            platform=data.get('platform', 'Default Platform'),
            value=int(data.get('value', 0)),
            due_date=due_date,
            status=data.get('status', 'Open'),
            naics_code=data.get('naicsCode', '000000'),
            output_path=output_path,
            logo_path=logo_path
        )
        return {"message": "RFP generated successfully", "file": pdf_path}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
