from fastapi import APIRouter, Request, HTTPException
from typing import Dict, List
from services.open_ai_refiner import refine_query
from services.job_search import search_jobs

search_router = APIRouter()

@search_router.post("/search-opportunities")
async def search_job_opportunities(request: Request):
    """
    Search for job opportunities based on a POST request with query and filters.
    """
    try:
        data = await request.json()
        query = data.get("query", "")
        contract_type = data.get("contract_type", None)
        platform = data.get("platform", None)

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        refined_query = refine_query(query, contract_type, platform)
        print(f"Refined Query: {refined_query}")  # Debug logging

        job_results = search_jobs(refined_query, contract_type, platform)
        return {"results": job_results}  # Return a dictionary instead of a list
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))