from fastapi import APIRouter, Query
from services.ai_services import refine_query, search_jobs

# Router for searching Job-Opportunities
seaarch_router = APIRouter()

@search_router.get("/search-opportunities", response_model=List[Dict])
async def search_job_opportunities(
    request: Request
):
    """
    Search for job opportunities based on a POST request with query and filters.
    Returns a list of relevant job records.
    """
    # Parse the request body
    try: 
        data=await request.json()
    except Exception as e: 
        return {"error": "Invalid JSON payload"}, 400

    # Extract parameters from the JSON data
    query = data.get("query", "")
    contract_type = data.get("contract_type", None)
    platform = data.get("platform", None)

    # Validate query is provided
    if not query:
        return {"error": "Query is required"}, 400

    try:
    # Refine the query using OpenAI and generate a solid query
    refined_query = refine_query(query, contract_type, platform)
        
    # Search jobs using the refined query and filters using AI vectrorisation
    job_results = search_jobs(refined_query, contract_type, platform)
        
        return job_results
    except Exception as e:
        return {"error": str(e)}, 500