# backend/app/routes/admin_routes.py
from fastapi import APIRouter, HTTPException, Request, Body
from typing import Optional, Dict, Any
import logging
from services.etl_service import ETLService  # Fix the typo "ETLServic" -> "ETLService"
from utils.db_utils import initialize_tables  # Use absolute import

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize database tables when the application starts
initialize_tables()

@router.post("/admin/trigger-workflow")
async def trigger_workflow(request: Dict[str, Any] = Body(...)):
    """
    Trigger GitHub Actions workflow to collect data from external sources
    
    Body parameters:
    - job_type: Type of job to run (freelancer, sam_gov, or empty for all)
    """
    try:
        job_type = request.get("job_type", "")
        result = await ETLService.trigger_workflow(job_type)
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in trigger_workflow: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/admin/etl-records")
async def get_etl_records(
    request: Request,
    page: int = 1, 
    limit: int = 50, 
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """
    Get ETL job history records with optional filtering and pagination
    
    This endpoint retrieves the history of data collection runs including:
    - Total records collected
    - Counts from each data source (SAM.gov and Freelancer)
    - New record counts (records not seen before)
    - Collection status and timestamp
    
    Query parameters:
    - page: Page number (default 1)
    - limit: Number of records per page (default 50)
    - status: Filter by status
    - search: Search query string
    """
    try:
        result = ETLService.get_etl_records(page, limit, status, search)
        return result
    except Exception as e:
        logger.error(f"Error in get_etl_records: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch ETL records")

@router.get("/admin/table-counts")
async def get_table_counts(request: Request):
    """
    Get current counts of records in the main data tables
    
    This endpoint retrieves the current count of records in:
    - SAM.gov table
    - Freelancer projects table
    - Total records across both tables
    
    Used for displaying real-time record counts on the admin dashboard.
    """
    try:
        result = ETLService.get_table_counts()
        return result
    except Exception as e:
        logger.error(f"Error in get_table_counts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch table counts")