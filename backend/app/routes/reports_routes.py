"""
Reports routes for RFP response management
Handles CRUD operations for reports 
"""
import uuid
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, List
from app.services.reports_service import reports_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

class ReportContent(BaseModel):
    logo: Optional[str] = None
    companyName: Optional[str] = None
    companyWebsite: Optional[str] = None
    letterhead: Optional[str] = None
    phone: Optional[str] = None
    rfpTitle: Optional[str] = None
    rfpNumber: Optional[str] = None
    naicsCode: Optional[str] = None
    solicitationNumber: Optional[str] = None
    issuedDate: Optional[str] = None
    submittedBy: Optional[str] = None
    theme: Optional[str] = None
    sections: Optional[List[Any]] = []
    isSubmitted: Optional[bool] = False
    dueDate: Optional[str] = None

class CreateReportRequest(BaseModel):
    response_id: str
    opportunity_id: Optional[int] = None
    content: ReportContent
    completion_percentage: Optional[int] = 0
    is_submitted: Optional[bool] = False
    
    @validator('response_id')
    def validate_response_id(cls, v):
        if not v:
            raise ValueError('response_id is required')
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError('response_id must be a valid UUID')
    
    @validator('completion_percentage')
    def validate_completion_percentage(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('completion_percentage must be between 0 and 100')
        return v

class UpdateReportRequest(BaseModel):
    content: Optional[ReportContent] = None
    completion_percentage: Optional[int] = None
    is_submitted: Optional[bool] = None

class ReportResponse(BaseModel):
    id: Optional[str] = None
    response_id: str
    user_id: str
    opportunity_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    content: Dict[str, Any]
    completion_percentage: int
    is_submitted: bool
    stage: Optional[str] = None
    created_at: str
    updated_at: str

class ReportsListResponse(BaseModel):
    success: bool
    reports: List[ReportResponse]
    count: int

@router.get("/reports", response_model=ReportsListResponse)
async def get_reports(
    user_id: str = Query(..., description="User ID to filter reports"),
    is_submitted: bool = Query(False, description="Filter by submission status")
):
    """Get all reports for a user"""
    try:
        # logger.info(f"GET /reports - user_id: {user_id}, is_submitted: {is_submitted}")
        
        reports = await reports_service.get_reports(user_id, is_submitted)
        
        return ReportsListResponse(
            success=True,
            reports=reports,
            count=len(reports)
        )
        
    except Exception as e:
        # logger.error(f"Error in GET /reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")

@router.get("/reports/{response_id}", response_model=ReportResponse)
async def get_report_by_response_id(
    response_id: str,
    user_id: str = Query(..., description="User ID owning the report")
):
    """Get a specific report by response ID"""
    try:
        # logger.info(f"GET /reports/{response_id} - user_id: {user_id}")
        
        report = await reports_service.get_report_by_response_id(response_id, user_id)
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return ReportResponse(**report)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in GET /reports/{response_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch report: {str(e)}")

@router.post("/reports", response_model=ReportResponse)
async def create_report(
    request: CreateReportRequest,
    user_id: str = Query(..., description="User ID creating the report")
):
    """Create a new report"""
    try:
        # logger.info(f"POST /reports - response_id: {request.response_id}, user_id: {user_id}")
        
        report = await reports_service.create_report(
            response_id=request.response_id,
            user_id=user_id,
            content=request.content.dict(),
            completion_percentage=request.completion_percentage,
            is_submitted=request.is_submitted
        )
        
        return ReportResponse(**report)
        
    except Exception as e:
        # logger.error(f"Error in POST /reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")

@router.put("/reports/{response_id}", response_model=ReportResponse)
async def update_report(
    response_id: str,
    request: UpdateReportRequest,
    user_id: str = Query(..., description="User ID owning the report")
):
    """Update an existing report"""
    try:
        logger.info(f"PUT /reports/{response_id} - user_id: {user_id}")
        
        content_dict = request.content.dict() if request.content else None
        
        report = await reports_service.update_report(
            response_id=response_id,
            user_id=user_id,
            content=content_dict,
            completion_percentage=request.completion_percentage,
            is_submitted=request.is_submitted
        )
        
        return ReportResponse(**report)
        
    except Exception as e:
        logger.error(f"Error in PUT /reports/{response_id}: {str(e)}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Report not found")
        raise HTTPException(status_code=500, detail=f"Failed to update report: {str(e)}")

@router.post("/reports/upsert", response_model=ReportResponse)
async def upsert_report(
    request: CreateReportRequest,
    user_id: str = Query(..., description="User ID for the report")
):
    """Create or update a report (upsert operation)"""
    try:
        # Validate user_id is a valid UUID
        if not user_id:
            raise HTTPException(status_code=422, detail="user_id is required")
        try:
            uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="user_id must be a valid UUID")
            
        # logger.info(f"POST /reports/upsert - response_id: {request.response_id}, user_id: {user_id}")
        
        report = await reports_service.upsert_report(
            response_id=request.response_id,
            user_id=user_id,
            content=request.content.dict(),
            completion_percentage=request.completion_percentage or 0,
            is_submitted=request.is_submitted or False,
            opportunity_id=request.opportunity_id
        )
        
        return ReportResponse(**report)
        
    except HTTPException:
        raise
    except ValueError as ve:
        # logger.error(f"Validation error in POST /reports/upsert: {str(ve)}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        # logger.error(f"Error in POST /reports/upsert: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upsert report: {str(e)}")

@router.delete("/reports/{response_id}")
async def delete_report(
    response_id: str,
    user_id: str = Query(..., description="User ID owning the report")
):
    """Delete a report"""
    try:
        # logger.info(f"DELETE /reports/{response_id} - user_id: {user_id}")
        
        success = await reports_service.delete_report(response_id, user_id)
        
        return {"success": success, "message": "Report deleted successfully"}
        
    except Exception as e:
        # logger.error(f"Error in DELETE /reports/{response_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")

@router.post("/reports/{response_id}/toggle-submitted", response_model=ReportResponse)
async def toggle_submitted_status(
    response_id: str,
    user_id: str = Query(..., description="User ID owning the report")
):
    """Toggle the submitted status of a report"""
    try:
        # logger.info(f"POST /reports/{response_id}/toggle-submitted - user_id: {user_id}")
        
        report = await reports_service.toggle_submitted_status(response_id, user_id)
        
        return ReportResponse(**report)
        
    except Exception as e:
        # logger.error(f"Error in POST /reports/{response_id}/toggle-submitted: {str(e)}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Report not found")
        if "must be 100% complete" in str(e).lower():
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to toggle submitted status: {str(e)}")
