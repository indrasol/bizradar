"""
Provides a single PUT endpoint to update both tracker and report in one request
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
from app.services.responses_service import responses_service
from app.utils.logger import get_logger


# Initialize logger and router
logger = get_logger(__name__)
router = APIRouter()


class OrchestratedReportContent(BaseModel):
    """
    Minimal report content model matching the structure used by the editor.
    We intentionally accept a free-form dict for sections and other fields.
    """
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
    sections: Optional[Any] = None
    isSubmitted: Optional[bool] = False
    dueDate: Optional[str] = None


class PutResponseRequest(BaseModel):
    """
    Request payload for orchestrated PUT update.
    - tracker_stage: optional stage to set on tracker if tracker exists
    - content/completion_percentage/is_submitted: fields to update on report
    """
    stage: Optional[str] = None
    content: Optional[OrchestratedReportContent] = None
    completion_percentage: Optional[int] = None
    is_submitted: Optional[bool] = None
    opportunity_id: Optional[int] = None

    @validator("completion_percentage")
    def validate_completion_percentage(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("completion_percentage must be between 0 and 100")
        return v


class PutResponseResult(BaseModel):
    """Unified response containing the updated report and (optionally) tracker."""
    success: bool
    report: Dict[str, Any]
    tracker: Optional[Dict[str, Any]] = None



@router.put("/responses/{response_id}", response_model=PutResponseResult)
async def put_orchestrated_response(
    response_id: str,
    request: PutResponseRequest,
    user_id: str = Query(..., description="User ID performing the update")
):
    """
    Conditional update the tracker stage if change occurs and save the latest response in the reports table
    """
    try:
        # Tries to identify whether a change occured or not
        has_report_change = (
            (request.content is not None)
            or (request.completion_percentage is not None)
            or (request.is_submitted is not None)
        )
        # Use the defined 'stage' field; 'tracker_stage' does not exist on the model
        if not has_report_change and not request.stage:
            raise HTTPException(status_code=400, detail="Nothing to update")

        logger.info(f"response_id: {response_id}")
        logger.info(f"user_id: {user_id}")
        result = await responses_service.put_response(
            response_id=response_id,
            user_id=user_id,
            stage=request.stage,
            content=(request.content.dict() if request.content else None),
            completion_percentage=request.completion_percentage,
            is_submitted=request.is_submitted,
            opportunity_id=request.opportunity_id,
        )

        return PutResponseResult(success=True, report=result["report"], tracker=result.get("tracker"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed orchestrated PUT for response {response_id}, user {user_id}: {str(e)}"
        )
        raise HTTPException(status_code=500, detail=f"Failed to update response: {str(e)}")


