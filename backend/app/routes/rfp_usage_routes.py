from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, Any, Optional

from ..services.rfp_usage_service import RfpUsageService
from ..utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Initialize the RFP usage service
rfp_usage_service = RfpUsageService()

@router.get("/rfp-usage/status")
async def get_usage_status(
    user_id: str = Query(..., description="User ID to get usage status for")
):
    """
    Get the current RFP usage status for a user
    """
    # logger.info(f"🔍 GET request received for RFP usage status for user {user_id}")
    try:
        month_year = await rfp_usage_service.get_current_month_year()
        monthly_limit = await rfp_usage_service.get_monthly_limit(user_id)
        current_usage = await rfp_usage_service.get_usage_count(user_id, month_year)
        remaining = max(0, monthly_limit - current_usage)
        limit_reached = current_usage >= monthly_limit
        
        return {
            "monthly_limit": monthly_limit,
            "current_usage": current_usage,
            "remaining": remaining,
            "limit_reached": limit_reached,
            "message": f"You've used {current_usage} of {monthly_limit} RFP reports this month" if not limit_reached else
                      f"You've reached your monthly limit of {monthly_limit} RFP reports. Upgrade your plan to generate more reports."
        }
    except Exception as e:
        # logger.error(f"❌ Error getting usage status for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get usage status")

@router.get("/rfp-usage/check-opportunity/{opportunity_id}")
async def check_opportunity_status(
    opportunity_id: int,
    user_id: str = Query(..., description="User ID to check opportunity for")
):
    """
    Check if a user can generate a report for a specific opportunity
    """
    # logger.info(f"🔍 GET request received to check opportunity {opportunity_id} for user {user_id}")
    try:
        can_generate, status_info = await rfp_usage_service.can_generate_report(user_id, opportunity_id)
        return {
            "can_generate": can_generate,
            "reason": status_info.get("reason"),
            "status": status_info
        }
    except Exception as e:
        # logger.error(f"❌ Error checking opportunity {opportunity_id} for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check opportunity status")

@router.post("/rfp-usage/record/{opportunity_id}")
async def record_usage(
    opportunity_id: int,
    user_id: str = Query(..., description="User ID to record usage for")
):
    """
    Record usage for a specific opportunity after checking limits
    """
    # logger.info(f"🔍 POST request received to record usage for user {user_id}, opportunity {opportunity_id}")
    try:
        # First check if the user can generate a report
        can_generate, status_info = await rfp_usage_service.can_generate_report(user_id, opportunity_id)
        
        if not can_generate:
            # logger.warning(f"❌ User {user_id} cannot generate report for opportunity {opportunity_id}: {status_info.get('message')}")
            return {
                "success": False,
                "message": status_info.get("message"),
                "status": status_info
            }
        
        # If the reason is "under_limit", record the usage
        if status_info.get("reason") == "under_limit":
            success = await rfp_usage_service.record_report_generation(user_id, opportunity_id)
            
            if success:
                # logger.info(f"✅ Successfully recorded usage for user {user_id}, opportunity {opportunity_id}")
                return {
                    "success": True,
                    "message": "Usage recorded successfully",
                    "status": {
                        **status_info,
                        "current_usage": status_info.get("current_usage", 0) + 1,
                        "remaining": max(0, status_info.get("remaining", 0) - 1)
                    }
                }
            else:
                # logger.error(f"❌ Failed to record usage for user {user_id}, opportunity {opportunity_id}")
                raise HTTPException(status_code=500, detail="Failed to record usage")
        
        # If the reason is "existing_report", no need to record usage
        # logger.info(f"ℹ️ No need to record usage for user {user_id}, opportunity {opportunity_id}: {status_info.get('reason')}")
        return {
            "success": True,
            "message": status_info.get("message"),
            "status": status_info
        }
    except Exception as e:
        # logger.error(f"❌ Error recording usage for user {user_id}, opportunity {opportunity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record usage")

