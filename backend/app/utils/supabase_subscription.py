"""
Server-side subscription management using Supabase
Handles tier-based subscriptions: Free, Pro, Premium
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Literal
from fastapi import HTTPException
from app.database.supabase import get_supabase_client
from app.config.settings import TRIAL_DURATION_MINUTES
from app.utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)

# Define subscription tiers
SubscriptionTier = Literal["free", "pro", "premium"]
SubscriptionStatus = Literal["active", "expired", "cancelled", "trial"]

# Tier configurations
TIER_CONFIGS = {
    "free": {
        "name": "Free Plan",
        "monthly_searches": -1,  # Unlimited
        "ai_rfp_responses": 2,
        "features": [
            "Unlimited opportunity searches",
            "Basic tracking",
            "Basic dashboard",
            "2 AI-assisted RFP drafts per month"
        ],
        "price": 0
    },
    "pro": {
        "name": "Pro Plan", 
        "monthly_searches": -1,  # Unlimited
        "ai_rfp_responses": 5,
        "features": [
            "Unlimited opportunity searches",
            "Bizradar AI Assistant",
            "Radar Matches+ — daily AI-picked opportunities with priority alerts for your company",
            "Analytics dashboard",
            "5 AI-assisted RFP drafts per month"
        ],
        "price": 29.99
    },
    "premium": {
        "name": "Premium Plan",
        "monthly_searches": -1,  # Unlimited
        "ai_rfp_responses": 10,
        "features": [
            "Unlimited opportunity searches",
            "Bizradar AI Assistant",
            "Radar Matches+ — daily AI-picked opportunities with priority alerts for your company",
            "Tracking alerts — deadlines updates",
            "Analytics dashboard",
            "10 AI-assisted RFP drafts per month"
        ],
        "price": 99.99
    }
}

class SubscriptionManager:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def get_user_addons(self, user_id: str) -> list:
        """Get active add-ons for a user"""
        try:
            result = self.supabase.table('user_addons').select('*').eq('user_id', user_id).eq('status', 'active').execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching add-ons for user {user_id}: {str(e)}")
            return []
    
    def add_rfp_boost_pack(self, user_id: str, stripe_subscription_id: Optional[str] = None) -> Dict[str, Any]:
        """Add RFP Boost Pack add-on for a user"""
        try:
            now = datetime.now(timezone.utc)
            
            addon_data = {
                "user_id": user_id,
                "addon_type": "rfp_boost_pack",
                "status": "active",
                "start_date": now.isoformat(),
                "stripe_subscription_id": stripe_subscription_id,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            
            # Try to create the add-on, handling missing table gracefully
            try:
                result = self.supabase.table('user_addons').upsert(addon_data, on_conflict='user_id,addon_type').execute()
                
                if result.data:
                    logger.info(f"Added RFP Boost Pack for user {user_id}")
                    return result.data[0]
                else:
                    raise Exception("Failed to create add-on")
                    
            except Exception as table_error:
                # If table doesn't exist, we'll track it in the subscription record for now
                logger.warning(f"user_addons table not found, tracking add-on in subscription: {str(table_error)}")
                
                # Update the user's subscription to include add-on info
                subscription = self.get_user_subscription(user_id)
                if subscription:
                    addon_info = subscription.get('addon_info', {})
                    addon_info['rfp_boost_pack'] = {
                        'active': True,
                        'start_date': now.isoformat(),
                        'stripe_subscription_id': stripe_subscription_id
                    }
                    
                    update_result = self.supabase.table('user_subscriptions').update({
                        'addon_info': addon_info,
                        'updated_at': now.isoformat()
                    }).eq('user_id', user_id).execute()
                    
                    if update_result.data:
                        logger.info(f"Added RFP Boost Pack to subscription record for user {user_id}")
                        return {
                            "user_id": user_id,
                            "addon_type": "rfp_boost_pack",
                            "status": "active",
                            "start_date": now.isoformat()
                        }
                
                raise Exception("Failed to add RFP Boost Pack")
                
        except Exception as e:
            logger.error(f"Error adding RFP Boost Pack for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to add RFP Boost Pack")
    
    def remove_rfp_boost_pack(self, user_id: str) -> bool:
        """Remove RFP Boost Pack add-on for a user"""
        try:
            now = datetime.now(timezone.utc)
            
            # Try to update in user_addons table first
            try:
                result = self.supabase.table('user_addons').update({
                    'status': 'cancelled',
                    'updated_at': now.isoformat()
                }).eq('user_id', user_id).eq('addon_type', 'rfp_boost_pack').execute()
                
                if result.data:
                    logger.info(f"Cancelled RFP Boost Pack for user {user_id}")
                    return True
                    
            except Exception:
                # Fall back to subscription record
                subscription = self.get_user_subscription(user_id)
                if subscription:
                    addon_info = subscription.get('addon_info', {})
                    if 'rfp_boost_pack' in addon_info:
                        addon_info['rfp_boost_pack']['active'] = False
                        addon_info['rfp_boost_pack']['cancelled_at'] = now.isoformat()
                        
                        update_result = self.supabase.table('user_subscriptions').update({
                            'addon_info': addon_info,
                            'updated_at': now.isoformat()
                        }).eq('user_id', user_id).execute()
                        
                        if update_result.data:
                            logger.info(f"Cancelled RFP Boost Pack in subscription record for user {user_id}")
                            return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error removing RFP Boost Pack for user {user_id}: {str(e)}")
            return False
    
    def get_user_subscription(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get current subscription for a user"""
        try:
            result = self.supabase.table('user_subscriptions').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(1).execute()
            
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching subscription for user {user_id}: {str(e)}")
            return None
    
    def create_free_tier_subscription(self, user_id: str) -> Dict[str, Any]:
        """Create a free tier subscription for new users"""
        try:
            # Base subscription data that should always exist
            subscription_data = {
                "user_id": user_id,
                "plan_type": "free",
                "status": "active",
                "start_date": datetime.now(timezone.utc).isoformat(),
                "end_date": None,  # Free tier doesn't expire
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Try to add usage columns if they exist
            # This approach is more robust and handles missing columns gracefully
            try:
                # First attempt with all columns
                full_data = {
                    **subscription_data,
                    "monthly_searches_used": 0,
                    "ai_rfp_responses_used": 0
                }
                result = self.supabase.table('user_subscriptions').upsert(full_data, on_conflict='user_id').execute()
                
                if result.data:
                    logger.info(f"Created free tier subscription for user {user_id} with usage tracking")
                    return result.data[0]
                    
            except Exception as usage_error:
                usage_error_msg = str(usage_error)
                logger.warning(f"Failed to create subscription with usage columns: {usage_error_msg}")
                
                # If usage columns don't exist, try with just ai_rfp_responses_used
                if "monthly_searches_used" in usage_error_msg:
                    try:
                        partial_data = {
                            **subscription_data,
                            "ai_rfp_responses_used": 0
                        }
                        result = self.supabase.table('user_subscriptions').upsert(partial_data, on_conflict='user_id').execute()
                        
                        if result.data:
                            logger.info(f"Created free tier subscription for user {user_id} with partial usage tracking")
                            return result.data[0]
                            
                    except Exception as partial_error:
                        logger.warning(f"Failed with partial usage columns: {str(partial_error)}")
                
                # If all usage columns fail, try with just basic data
                try:
                    result = self.supabase.table('user_subscriptions').upsert(subscription_data, on_conflict='user_id').execute()
                    
                    if result.data:
                        logger.info(f"Created free tier subscription for user {user_id} without usage tracking")
                        return result.data[0]
                        
                except Exception as basic_error:
                    logger.error(f"Failed to create basic subscription: {str(basic_error)}")
                    raise basic_error
            
            raise Exception("Failed to create subscription - no successful path")
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error creating free tier subscription for user {user_id}: {error_msg}")
            
            # Provide more specific error messages for common issues
            if "ai_rfp_responses_used" in error_msg or "monthly_searches_used" in error_msg:
                detail = "Database schema missing some usage tracking columns. Subscription created with available columns."
            else:
                detail = f"Failed to create subscription: {error_msg}"
            
            raise HTTPException(status_code=500, detail=detail)
    
    def create_trial_subscription(self, user_id: str) -> Dict[str, Any]:
        """Create a trial subscription (Pro tier for trial period)"""
        try:
            now = datetime.now(timezone.utc)
            trial_end = now + timedelta(minutes=TRIAL_DURATION_MINUTES)
            
            subscription_data = {
                "user_id": user_id,
                "plan_type": "pro",
                "status": "trial", 
                "start_date": now.isoformat(),
                "end_date": trial_end.isoformat(),
                "monthly_searches_used": 0,
                "ai_rfp_responses_used": 0,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            
            result = self.supabase.table('user_subscriptions').upsert(subscription_data, on_conflict='user_id').execute()
            
            if result.data:
                logger.info(f"Created trial subscription for user {user_id}")
                return result.data[0]
            else:
                raise Exception("Failed to create trial subscription")
                
        except Exception as e:
            logger.error(f"Error creating trial subscription for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create trial subscription")
    
    def upgrade_subscription(self, user_id: str, new_tier: SubscriptionTier, stripe_subscription_id: Optional[str] = None) -> Dict[str, Any]:
        """Upgrade user to a paid tier"""
        try:
            now = datetime.now(timezone.utc)
            
            subscription_data = {
                "user_id": user_id,
                "plan_type": new_tier,
                "status": "active",
                "start_date": now.isoformat(),
                "end_date": None,  # Paid subscriptions don't expire unless cancelled
                "stripe_subscription_id": stripe_subscription_id,
                "monthly_searches_used": 0,  # Reset usage on upgrade
                "ai_rfp_responses_used": 0,
                "updated_at": now.isoformat()
            }
            
            result = self.supabase.table('user_subscriptions').upsert(subscription_data, on_conflict='user_id').execute()
            
            if result.data:
                logger.info(f"Upgraded user {user_id} to {new_tier} tier")
                return result.data[0]
            else:
                raise Exception("Failed to upgrade subscription")
                
        except Exception as e:
            logger.error(f"Error upgrading subscription for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upgrade subscription")
    
    def cancel_subscription(self, user_id: str) -> Dict[str, Any]:
        """Cancel subscription and downgrade to free tier"""
        try:
            now = datetime.now(timezone.utc)
            
            subscription_data = {
                "user_id": user_id,
                "plan_type": "free",
                "status": "active",
                "start_date": now.isoformat(),
                "end_date": None,
                "stripe_subscription_id": None,
                "monthly_searches_used": 0,  # Reset usage
                "ai_rfp_responses_used": 0,
                "updated_at": now.isoformat()
            }
            
            result = self.supabase.table('user_subscriptions').upsert(subscription_data, on_conflict='user_id').execute()
            
            if result.data:
                logger.info(f"Cancelled subscription for user {user_id}, downgraded to free tier")
                return result.data[0]
            else:
                raise Exception("Failed to cancel subscription")
                
        except Exception as e:
            logger.error(f"Error cancelling subscription for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")
    
    def get_subscription_status(self, user_id: str, create_if_missing: bool = True) -> Dict[str, Any]:
        """Get comprehensive subscription status"""
        try:
            subscription = self.get_user_subscription(user_id)
            
            if not subscription and create_if_missing:
                # Create free tier for new users
                subscription = self.create_free_tier_subscription(user_id)
            
            if not subscription:
                return {
                    "plan_type": None,
                    "status": "none",
                    "start_date": None,
                    "end_date": None,
                    "remaining_days": 0,
                    "is_trial": False,
                    "expired": True,
                    "tier_config": None,
                    "usage": {
                        "monthly_searches_used": 0,
                        "ai_rfp_responses_used": 0,
                        "monthly_searches_limit": 0,
                        "ai_rfp_responses_limit": 0
                    }
                }
            
            plan_type = subscription.get("plan_type", "free")
            status = subscription.get("status", "active")
            end_date_str = subscription.get("end_date")
            
            # Parse end date
            end_date = None
            if end_date_str:
                try:
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                except:
                    pass
            
            # Calculate remaining days and expiry
            now = datetime.now(timezone.utc)
            remaining_days = 0
            expired = False
            
            if end_date:
                delta = end_date - now
                remaining_days = max(0, delta.days)
                expired = delta.total_seconds() < 0
                
                # Auto-expire trial subscriptions
                if status == "trial" and expired:
                    self.cancel_subscription(user_id)
                    status = "active"
                    plan_type = "free"
                    expired = False
            
            # Get tier configuration
            tier_config = TIER_CONFIGS.get(plan_type, TIER_CONFIGS["free"])
            
            # Get add-on information
            addons = self.get_user_addons(user_id)
            addon_info = subscription.get('addon_info', {})
            
            # Check for RFP Boost Pack
            has_rfp_boost = False
            rfp_boost_extra = 0
            
            # Check in addons table first
            for addon in addons:
                if addon.get('addon_type') == 'rfp_boost_pack' and addon.get('status') == 'active':
                    has_rfp_boost = True
                    rfp_boost_extra = 5
                    break
            
            # Fall back to subscription record
            if not has_rfp_boost and addon_info.get('rfp_boost_pack', {}).get('active', False):
                has_rfp_boost = True
                rfp_boost_extra = 5
            
            # Get usage information with add-on adjustments
            base_rfp_limit = tier_config["ai_rfp_responses"]
            total_rfp_limit = base_rfp_limit + rfp_boost_extra if base_rfp_limit != -1 else -1
            
            usage = {
                "monthly_searches_used": subscription.get("monthly_searches_used", 0),
                "ai_rfp_responses_used": subscription.get("ai_rfp_responses_used", 0),
                "monthly_searches_limit": tier_config["monthly_searches"],
                "ai_rfp_responses_limit": total_rfp_limit,
                "base_ai_rfp_responses_limit": base_rfp_limit,
                "rfp_boost_extra": rfp_boost_extra
            }
            
            return {
                "plan_type": plan_type,
                "status": status,
                "start_date": subscription.get("start_date"),
                "end_date": subscription.get("end_date"),
                "remaining_days": remaining_days,
                "is_trial": status == "trial",
                "expired": expired,
                "tier_config": tier_config,
                "usage": usage,
                "stripe_subscription_id": subscription.get("stripe_subscription_id"),
                "addons": {
                    "rfp_boost_pack": has_rfp_boost
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting subscription status for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to get subscription status")
    
    def check_feature_access(self, user_id: str, feature: str) -> bool:
        """Check if user has access to a specific feature"""
        try:
            status = self.get_subscription_status(user_id)
            plan_type = status.get("plan_type", "free")
            
            # Define feature access by tier
            feature_access = {
                "free": ["basic_search", "basic_analytics"],
                "pro": ["basic_search", "basic_analytics", "advanced_search", "ai_rfp", "priority_support"],
                "premium": ["basic_search", "basic_analytics", "advanced_search", "ai_rfp", "priority_support", "team_collaboration", "custom_integrations"]
            }
            
            return feature in feature_access.get(plan_type, [])
            
        except Exception as e:
            logger.error(f"Error checking feature access for user {user_id}: {str(e)}")
            return False
    
    def increment_usage(self, user_id: str, usage_type: Literal["search", "ai_rfp"]) -> bool:
        """Increment usage counter and check limits"""
        try:
            subscription = self.get_user_subscription(user_id)
            if not subscription:
                return False
            
            plan_type = subscription.get("plan_type", "free")
            tier_config = TIER_CONFIGS.get(plan_type, TIER_CONFIGS["free"])
            
            current_searches = subscription.get("monthly_searches_used", 0)
            current_rfp = subscription.get("ai_rfp_responses_used", 0)
            
            if usage_type == "search":
                limit = tier_config["monthly_searches"]
                if limit != -1 and current_searches >= limit:
                    return False
                
                # Increment search count (handle missing column gracefully)
                try:
                    self.supabase.table('user_subscriptions').update({
                        "monthly_searches_used": current_searches + 1,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }).eq('user_id', user_id).execute()
                except Exception as e:
                    if "monthly_searches_used" in str(e):
                        logger.warning(f"monthly_searches_used column not found, skipping search usage tracking for user {user_id}")
                        # Still return True since searches are unlimited anyway
                        return True
                    else:
                        raise e
                
            elif usage_type == "ai_rfp":
                limit = tier_config["ai_rfp_responses"]
                if limit != -1 and current_rfp >= limit:
                    return False
                
                # Increment RFP count (handle missing column gracefully)
                try:
                    self.supabase.table('user_subscriptions').update({
                        "ai_rfp_responses_used": current_rfp + 1,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }).eq('user_id', user_id).execute()
                except Exception as e:
                    if "ai_rfp_responses_used" in str(e):
                        logger.warning(f"ai_rfp_responses_used column not found, cannot track RFP usage for user {user_id}")
                        # For RFP responses, we need to track usage, so return False if we can't
                        return False
                    else:
                        raise e
            
            return True
            
        except Exception as e:
            logger.error(f"Error incrementing usage for user {user_id}: {str(e)}")
            return False
    
    def reset_monthly_usage(self, user_id: str) -> bool:
        """Reset monthly usage counters (called by cron job)"""
        try:
            # Try to reset all usage columns, handling missing columns gracefully
            update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
            
            # Try with all columns first
            try:
                full_update = {
                    **update_data,
                    "monthly_searches_used": 0,
                    "ai_rfp_responses_used": 0
                }
                self.supabase.table('user_subscriptions').update(full_update).eq('user_id', user_id).execute()
                logger.info(f"Reset all monthly usage for user {user_id}")
                return True
                
            except Exception as full_error:
                if "monthly_searches_used" in str(full_error):
                    # Try with just ai_rfp_responses_used
                    try:
                        partial_update = {
                            **update_data,
                            "ai_rfp_responses_used": 0
                        }
                        self.supabase.table('user_subscriptions').update(partial_update).eq('user_id', user_id).execute()
                        logger.info(f"Reset AI RFP usage for user {user_id} (monthly_searches_used column not available)")
                        return True
                        
                    except Exception as partial_error:
                        logger.warning(f"Could not reset any usage columns for user {user_id}: {str(partial_error)}")
                        return False
                else:
                    raise full_error
            
        except Exception as e:
            logger.error(f"Error resetting usage for user {user_id}: {str(e)}")
            return False

# Global instance
subscription_manager = SubscriptionManager()
