"""
Server-side subscription management routes
Handles all subscription operations including tier management
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal
from app.utils.supabase_subscription import subscription_manager, TIER_CONFIGS
from app.utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)

router = APIRouter()

class SubscriptionUpgradeRequest(BaseModel):
    plan_type: Literal["free", "pro", "premium"]
    stripe_subscription_id: Optional[str] = None

class UsageIncrementRequest(BaseModel):
    usage_type: Literal["search", "ai_rfp"]

@router.get("/status")
def get_subscription_status(user_id: str = Query(...)):
    """Get comprehensive subscription status for a user"""
    try:
        return subscription_manager.get_subscription_status(user_id, create_if_missing=True)
    except Exception as e:
        logger.error(f"Error getting subscription status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get subscription status")

@router.get("/tiers")
def get_available_tiers():
    """Get all available subscription tiers and their configurations"""
    return {
        "tiers": TIER_CONFIGS,
        "current_tiers": ["free", "pro", "premium"]
    }

@router.post("/upgrade")
def upgrade_subscription(request: SubscriptionUpgradeRequest, user_id: str = Query(...)):
    """Upgrade user subscription to a new tier"""
    try:
        result = subscription_manager.upgrade_subscription(
            user_id=user_id,
            new_tier=request.plan_type,
            stripe_subscription_id=request.stripe_subscription_id
        )
        
        logger.info(f"User {user_id} upgraded to {request.plan_type}")
        return {
            "success": True,
            "message": f"Successfully upgraded to {request.plan_type} tier",
            "subscription": result
        }
    except Exception as e:
        logger.error(f"Error upgrading subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upgrade subscription")

@router.post("/cancel")
def cancel_subscription(user_id: str = Query(...)):
    """Cancel subscription and downgrade to free tier"""
    try:
        result = subscription_manager.cancel_subscription(user_id)
        
        logger.info(f"User {user_id} cancelled subscription")
        return {
            "success": True,
            "message": "Subscription cancelled successfully. Downgraded to free tier.",
            "subscription": result
        }
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")

@router.post("/trial")
def start_trial(user_id: str = Query(...)):
    """Start a trial subscription for the user"""
    try:
        result = subscription_manager.create_trial_subscription(user_id)
        
        logger.info(f"User {user_id} started trial")
        return {
            "success": True,
            "message": "Trial started successfully",
            "subscription": result
        }
    except Exception as e:
        logger.error(f"Error starting trial: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start trial")

@router.get("/usage")
def get_usage_stats(user_id: str = Query(...)):
    """Get current usage statistics for the user"""
    try:
        status = subscription_manager.get_subscription_status(user_id)
        return {
            "usage": status.get("usage", {}),
            "tier_config": status.get("tier_config", {}),
            "plan_type": status.get("plan_type", "free")
        }
    except Exception as e:
        logger.error(f"Error getting usage stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get usage statistics")

@router.post("/usage/increment")
def increment_usage(request: UsageIncrementRequest, user_id: str = Query(...)):
    """Increment usage counter and check limits"""
    try:
        success = subscription_manager.increment_usage(user_id, request.usage_type)
        
        if not success:
            # Get current status to provide detailed limit info
            status = subscription_manager.get_subscription_status(user_id)
            usage = status.get("usage", {})
            tier_config = status.get("tier_config", {})
            
            if request.usage_type == "search":
                limit = tier_config.get("monthly_searches", 0)
                used = usage.get("monthly_searches_used", 0)
                raise HTTPException(
                    status_code=402,
                    detail=f"Monthly search limit reached ({used}/{limit}). Please upgrade your plan."
                )
            elif request.usage_type == "ai_rfp":
                limit = tier_config.get("ai_rfp_responses", 0)
                used = usage.get("ai_rfp_responses_used", 0)
                raise HTTPException(
                    status_code=402,
                    detail=f"Monthly AI RFP response limit reached ({used}/{limit}). Please upgrade your plan."
                )
        
        return {
            "success": True,
            "message": f"{request.usage_type} usage incremented successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error incrementing usage: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to increment usage")

@router.get("/feature-access/{feature}")
def check_feature_access(feature: str, user_id: str = Query(...)):
    """Check if user has access to a specific feature"""
    try:
        has_access = subscription_manager.check_feature_access(user_id, feature)
        
        return {
            "has_access": has_access,
            "feature": feature,
            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Error checking feature access: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check feature access")

@router.post("/usage/reset")
def reset_monthly_usage(user_id: str = Query(...)):
    """Reset monthly usage counters (admin/cron use)"""
    try:
        success = subscription_manager.reset_monthly_usage(user_id)
        
        if success:
            return {
                "success": True,
                "message": "Monthly usage reset successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to reset usage")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting usage: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset usage")

# Middleware for checking subscription access
def require_subscription_access(user_id: str, feature: str = "basic_search"):
    """Middleware to check if user has access to a feature"""
    has_access = subscription_manager.check_feature_access(user_id, feature)
    if not has_access:
        status = subscription_manager.get_subscription_status(user_id)
        plan_type = status.get("plan_type", "free")
        raise HTTPException(
            status_code=402,
            detail=f"Feature '{feature}' not available in {plan_type} tier. Please upgrade your plan."
        )
    return True

# Helper function for usage-based features
def check_and_increment_usage(user_id: str, usage_type: Literal["search", "ai_rfp"]):
    """Check limits and increment usage in one operation"""
    success = subscription_manager.increment_usage(user_id, usage_type)
    if not success:
        status = subscription_manager.get_subscription_status(user_id)
        usage = status.get("usage", {})
        tier_config = status.get("tier_config", {})
        
        if usage_type == "search":
            limit = tier_config.get("monthly_searches", 0)
            used = usage.get("monthly_searches_used", 0)
            raise HTTPException(
                status_code=402,
                detail=f"Monthly search limit reached ({used}/{limit}). Please upgrade your plan."
            )
        elif usage_type == "ai_rfp":
            limit = tier_config.get("ai_rfp_responses", 0)
            used = usage.get("ai_rfp_responses_used", 0)
            raise HTTPException(
                status_code=402,
                detail=f"Monthly AI RFP response limit reached ({used}/{limit}). Please upgrade your plan."
            )
    
    return True

@router.post("/addon/rfp-boost")
async def add_rfp_boost_pack(user_id: str = Query(...)):
    """Add RFP Boost Pack add-on for a user"""
    try:
        result = subscription_manager.add_rfp_boost_pack(user_id)
        return {
            "success": True,
            "message": "RFP Boost Pack added successfully",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error adding RFP Boost Pack for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/addon/rfp-boost")
async def remove_rfp_boost_pack(user_id: str = Query(...)):
    """Remove RFP Boost Pack add-on for a user"""
    try:
        success = subscription_manager.remove_rfp_boost_pack(user_id)
        if success:
            return {
                "success": True,
                "message": "RFP Boost Pack removed successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="RFP Boost Pack not found or already cancelled")
    except Exception as e:
        logger.error(f"Error removing RFP Boost Pack for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/addons")
async def get_user_addons(user_id: str = Query(...)):
    """Get all active add-ons for a user"""
    try:
        addons = subscription_manager.get_user_addons(user_id)
        return {
            "success": True,
            "data": addons
        }
    except Exception as e:
        logger.error(f"Error fetching add-ons for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
