"""
Tracker management routes
Handles all tracker operations including deadlines
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timezone, timedelta
from app.database.supabase import get_supabase_client, safe_supabase_operation
from app.utils.logger import get_logger
from app.services.trackers_service import TrackersService

# Initialize logger
logger = get_logger(__name__)

router = APIRouter()

# Initialize service
trackers_service = TrackersService()

class DeadlineItem(BaseModel):
    oppId: str
    title: str
    agency: Optional[str] = None
    solicitation: Optional[str] = None
    type: Literal["proposal", "qa", "amendment", "site_visit", "all"]
    dueAt: str  # ISO string
    daysLeft: int
    stage: str
    owner: Optional[Dict[str, Any]] = None

class DeadlinesResponse(BaseModel):
    success: bool
    deadlines: List[DeadlineItem]
    total_count: int
    message: Optional[str] = None

class MarkSubmittedRequest(BaseModel):
    tracker_id: str

# Pydantic models for CRUD operations
class CreateTrackerRequest(BaseModel):
    title: str
    description: Optional[str] = None
    stage: Optional[str] = "Assessment"
    due_date: Optional[str] = None
    naicscode: Optional[str] = None
    opportunity_id: Optional[int] = None

class UpdateTrackerRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[str] = None
    due_date: Optional[str] = None
    naicscode: Optional[str] = None
    is_submitted: Optional[bool] = None

class TrackerResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    stage: str
    created_at: str
    updated_at: str
    due_date: Optional[str] = None
    user_id: str
    is_submitted: bool
    naicscode: Optional[str] = None
    opportunity_id: Optional[int] = None

class TrackersListResponse(BaseModel):
    success: bool
    trackers: List[TrackerResponse]
    total_count: int
    message: Optional[str] = None

def calculate_days_left(due_date: str) -> int:
    """Calculate days left until due date"""
    try:
        if not due_date or due_date.strip() == '':
            return 0
        due = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        diff = due - now
        return max(-999, min(999, int(diff.total_seconds() / (24 * 3600))))
    except (ValueError, TypeError, AttributeError) as e:
        logger.warning(f"Error parsing due date '{due_date}': {str(e)}")
        return 0

@router.get("/deadlines", response_model=DeadlinesResponse)
async def get_deadlines(
    user_id: str = Query(..., description="User ID to fetch deadlines for"),
    days: int = Query(7, description="Number of days to look ahead", ge=1, le=365)
):
    """Get upcoming deadlines from user's trackers (no stage filtering)"""
    # Validate user_id first, before try block
    if not user_id or user_id.strip() == '':
        raise HTTPException(
            status_code=400,
            detail="User ID is required and cannot be empty"
        )
    
    try:
        
        supabase = get_supabase_client()
        
        # Calculate date range
        now = datetime.now(timezone.utc)
        future_date = now + timedelta(days=days)
        
        # Format dates for query
        future_date_str = future_date.isoformat()
        
        logger.info(f"Fetching deadlines for user {user_id}, next {days} days")
        
        # Directly fetch trackers for deadlines
        try:
            response = supabase.table('trackers').select(
                'id, title, stage, due_date, is_submitted, description, naicscode'
            ).eq('user_id', user_id).eq('is_submitted', False).lte('due_date', future_date_str).order('due_date', desc=False).execute()
        except Exception as e:
            logger.error(f"Error fetching deadlines for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch deadlines: {str(e)}")
        
        if not response.data:
            logger.info(f"No deadlines found for user {user_id}")
            return DeadlinesResponse(success=True, deadlines=[], total_count=0, message="No upcoming deadlines found")
        
        # Transform and filter data
        deadlines = []
        for tracker in response.data:
            try:
                # Skip trackers without due_date
                if not tracker.get('due_date'):
                    continue
                    
                days_left = calculate_days_left(tracker['due_date'])
                
                # Filter by days range (include overdue items)
                if days_left > days:
                    continue
                
                # Create deadline item (no stage filtering)
                deadline = DeadlineItem(
                    oppId=tracker['id'],
                    title=tracker['title'],
                    agency="Federal Agency",  # Default since trackers don't have agency
                    solicitation=f"NAICS-{tracker['naicscode']}" if tracker.get('naicscode') else f"REF-{tracker['id'][-8:]}",
                    type="proposal",  # Default type since we're removing stage filtering
                    dueAt=tracker['due_date'],
                    daysLeft=days_left,
                    stage=tracker['stage'],
                    owner={
                        "id": user_id,
                        "name": "You"  # Default owner name
                    }
                )
                
                deadlines.append(deadline)
                
            except Exception as e:
                logger.warning(f"Error processing tracker {tracker.get('id', 'unknown')}: {str(e)}")
                continue
        
        logger.info(f"Found {len(deadlines)} deadlines for user {user_id}")
        
        return DeadlinesResponse(success=True, deadlines=deadlines, total_count=len(deadlines), message=f"Found {len(deadlines)} upcoming deadlines")
        
    except Exception as e:
        logger.error(f"Error fetching deadlines for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch deadlines: {str(e)}"
        )

@router.post("/mark-submitted")
async def mark_tracker_submitted(
    request: MarkSubmittedRequest,
    user_id: str = Query(..., description="User ID")
):
    """Mark a tracker as submitted"""
    try:
        supabase = get_supabase_client()
        
        logger.info(f"Marking tracker {request.tracker_id} as submitted for user {user_id}")
        
        # Define the Supabase operation as a proper function
        def execute_update():
            update_query = supabase.table('trackers').update({
                'is_submitted': True,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', request.tracker_id).eq('user_id', user_id)
            return update_query.execute()
        
        # Execute update using safe operation
        response = await safe_supabase_operation(
            execute_update,
            error_message=f"Failed to update tracker {request.tracker_id}"
        )
        
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Tracker not found or you don't have permission to update it"
            )
        
        logger.info(f"Successfully marked tracker {request.tracker_id} as submitted")
        
        return {
            "success": True,
            "message": "Tracker marked as submitted successfully",
            "tracker_id": request.tracker_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking tracker as submitted: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark tracker as submitted: {str(e)}"
        )

@router.get("/stats")
async def get_tracker_stats(user_id: str = Query(..., description="User ID")):
    """Get tracker statistics for the user"""
    try:
        supabase = get_supabase_client()
        
        logger.info(f"Fetching tracker stats for user {user_id}")
        
        # Directly execute Supabase query synchronously
        response = supabase.table('trackers').select(
            'id, is_submitted, due_date, stage'
        ).eq('user_id', user_id).execute()
        
        if not response.data:
            return {
                "success": True,
                "stats": {
                    "total": 0,
                    "active": 0,
                    "submitted": 0,
                    "overdue": 0,
                    "due_this_week": 0
                }
            }
        
        # Calculate stats
        now = datetime.now(timezone.utc)
        week_from_now = now + timedelta(days=7)
        
        total = len(response.data)
        submitted = sum(1 for p in response.data if p.get('is_submitted', False))
        active = total - submitted
        
        overdue = 0
        due_this_week = 0
        
        for tracker in response.data:
            if tracker.get('is_submitted', False) or not tracker.get('due_date'):
                continue
                
            try:
                due_date = datetime.fromisoformat(tracker['due_date'].replace('Z', '+00:00'))
                if due_date < now:
                    overdue += 1
                elif due_date <= week_from_now:
                    due_this_week += 1
            except Exception:
                continue
        
        stats = {
            "total": total,
            "active": active,
            "submitted": submitted,
            "overdue": overdue,
            "due_this_week": due_this_week
        }
        
        logger.info(f"Tracker stats for user {user_id}: {stats}")
        
        return {
            "success": True,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error fetching tracker stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch tracker stats: {str(e)}"
        )

# CRUD Operations

@router.get("", response_model=TrackersListResponse)
async def get_trackers(
    user_id: str = Query(..., description="User ID to fetch trackers for"),
    is_submitted: Optional[bool] = Query(None, description="Filter by submission status")
):
    """Get all trackers for a user"""
    try:
        logger.info(f"GET /trackers - user_id: {user_id}, is_submitted: {is_submitted}")
        trackers = await trackers_service.get_trackers(user_id, is_submitted)
        
        tracker_responses = [TrackerResponse(**tracker) for tracker in trackers]
        
        return TrackersListResponse(
            success=True,
            trackers=tracker_responses,
            total_count=len(tracker_responses),
            message=f"Found {len(tracker_responses)} trackers"
        )
    except Exception as e:
        logger.error(f"Error in GET /trackers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch trackers: {str(e)}")

@router.get("/{tracker_id}", response_model=TrackerResponse)
async def get_tracker_by_id(
    tracker_id: str,
    user_id: str = Query(..., description="User ID for the tracker")
):
    """Get a specific tracker by ID"""
    try:
        logger.info(f"GET /trackers/{tracker_id} - user_id: {user_id}")
        tracker = await trackers_service.get_tracker_by_id(tracker_id, user_id)
        return TrackerResponse(**tracker)
    except Exception as e:
        logger.error(f"Error in GET /trackers/{tracker_id}: {str(e)}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Tracker not found: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch tracker: {str(e)}")

@router.post("", response_model=TrackerResponse)
async def create_tracker(
    request: CreateTrackerRequest,
    user_id: str = Query(..., description="User ID for the tracker")
):
    """Create a new tracker"""
    try:
        logger.info(f"POST /trackers - user_id: {user_id}, title: {request.title}")
        tracker = await trackers_service.create_tracker(
            user_id=user_id,
            title=request.title,
            description=request.description,
            stage=request.stage,
            due_date=request.due_date,
            naicscode=request.naicscode,
            opportunity_id=request.opportunity_id
        )
        return TrackerResponse(**tracker)
    except Exception as e:
        logger.error(f"Error in POST /trackers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create tracker: {str(e)}")

@router.put("/{tracker_id}", response_model=TrackerResponse)
async def update_tracker(
    tracker_id: str,
    request: UpdateTrackerRequest,
    user_id: str = Query(..., description="User ID for the tracker")
):
    """Update an existing tracker"""
    try:
        logger.info(f"PUT /trackers/{tracker_id} - user_id: {user_id}")
        tracker = await trackers_service.update_tracker(
            tracker_id=tracker_id,
            user_id=user_id,
            title=request.title,
            description=request.description,
            stage=request.stage,
            due_date=request.due_date,
            naicscode=request.naicscode,
            is_submitted=request.is_submitted
        )
        return TrackerResponse(**tracker)
    except Exception as e:
        logger.error(f"Error in PUT /trackers/{tracker_id}: {str(e)}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Tracker not found: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update tracker: {str(e)}")

@router.delete("/{tracker_id}")
async def delete_tracker(
    tracker_id: str,
    user_id: str = Query(..., description="User ID for the tracker")
):
    """Delete a tracker"""
    try:
        logger.info(f"DELETE /trackers/{tracker_id} - user_id: {user_id}")
        result = await trackers_service.delete_tracker(tracker_id, user_id)
        return result
    except Exception as e:
        logger.error(f"Error in DELETE /trackers/{tracker_id}: {str(e)}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Tracker not found: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete tracker: {str(e)}")

@router.post("/{tracker_id}/toggle-submitted", response_model=TrackerResponse)
async def toggle_tracker_submitted(
    tracker_id: str,
    user_id: str = Query(..., description="User ID for the tracker")
):
    """Toggle the submitted status of a tracker"""
    try:
        logger.info(f"POST /trackers/{tracker_id}/toggle-submitted - user_id: {user_id}")
        tracker = await trackers_service.toggle_submitted_status(tracker_id, user_id)
        return TrackerResponse(**tracker)
    except Exception as e:
        logger.error(f"Error in POST /trackers/{tracker_id}/toggle-submitted: {str(e)}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Tracker not found: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle submitted status: {str(e)}")
