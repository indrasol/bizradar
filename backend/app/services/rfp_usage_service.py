from datetime import datetime
from typing import Dict, Any, Optional, Tuple

from ..database.supabase import get_supabase_client
from ..utils.logger import get_logger
# Import the subscription service
# Note: Adjust this import based on the actual subscription service in your codebase
from ..utils.supabase_subscription import subscription_manager


class RfpUsageService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.logger = get_logger(__name__)
        self.table_name = "user_rfp_usage"

    async def get_current_month_year(self) -> str:
        """Get the current month-year string in YYYY-MM format"""
        return datetime.now().strftime("%Y-%m")

    async def get_monthly_limit(self, user_id: str) -> int:
        """Get the monthly RFP generation limit for a user based on their subscription tier"""
        self.logger.info(f"Getting monthly limit for user {user_id}")
        
        try:
            # Get the user's subscription status from the subscription manager
            # Note: subscription_manager APIs are synchronous
            status = subscription_manager.get_subscription_status(user_id)
            tier = (
                status.get("plan_type")
                or status.get("current_subscription_plan")
                or "free"
            )
            
            # Define limits based on tier
            limits = {
                "free": 2,
                "pro": 5,
                "premium": 10
                # "enterprise": 25  # Assuming enterprise tier has a higher limit
            }
            
            # Default to free tier limit if tier not found
            limit = limits.get(str(tier).lower(), limits["free"])
            self.logger.info(f"User {user_id} has tier {tier} with monthly limit of {limit} reports")
            return limit
        except Exception as e:
            self.logger.error(f"Error getting subscription tier for user {user_id}: {str(e)}")
            # Default to free tier limit on error
            return 2

    async def get_usage_count(self, user_id: str, month_year: str) -> int:
        """Get the number of unique opportunities a user has generated reports for in a given month"""
        self.logger.info(f"Getting usage count for user {user_id} for {month_year}")
        
        try:
            response = self.supabase.table(self.table_name) \
                .select("opportunity_id") \
                .eq("user_id", user_id) \
                .eq("month_year", month_year) \
                .execute()
            
            if not response.data:
                self.logger.info(f"No usage records found for user {user_id} in {month_year}")
                return 0
            
            # Count unique opportunity_ids
            unique_opportunities = set(record.get("opportunity_id") for record in response.data)
            count = len(unique_opportunities)
            
            self.logger.info(f"User {user_id} has used {count} reports in {month_year}")
            return count
        except Exception as e:
            self.logger.error(f"Error getting usage count: {str(e)}")
            # Default to 0 on error to avoid blocking users
            return 0

    async def has_generated_report(self, user_id: str, opportunity_id: int, month_year: Optional[str] = None) -> bool:
        """Check if a user has already generated a report for a specific opportunity in the given month"""
        if month_year is None:
            month_year = await self.get_current_month_year()
        
        self.logger.info(f"Checking if user {user_id} has generated report for opportunity {opportunity_id} in {month_year}")
        
        try:
            response = self.supabase.table(self.table_name) \
                .select("id") \
                .eq("user_id", user_id) \
                .eq("opportunity_id", opportunity_id) \
                .eq("month_year", month_year) \
                .execute()
            
            exists = len(response.data) > 0
            self.logger.info(f"Report exists: {exists}")
            return exists
        except Exception as e:
            self.logger.error(f"Error checking if report exists: {str(e)}")
            # Default to False on error to avoid blocking users
            return False

    async def record_report_generation(self, user_id: str, opportunity_id: int) -> bool:
        """Record that a user has generated a report for a specific opportunity"""
        month_year = await self.get_current_month_year()
        self.logger.info(f"Recording report generation for user {user_id}, opportunity {opportunity_id} in {month_year}")
        
        try:
            # Use upsert to handle both new records and updates
            response = self.supabase.table(self.table_name) \
                .upsert({
                    "user_id": user_id,
                    "opportunity_id": opportunity_id,
                    "month_year": month_year,
                    "created_at": datetime.now().isoformat()
                }) \
                .execute()
            
            success = len(response.data) > 0
            self.logger.info(f"Report generation recorded: {success}")
            return success
        except Exception as e:
            self.logger.error(f"Error recording report generation: {str(e)}")
            return False

    async def can_generate_report(self, user_id: str, opportunity_id: int) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if a user can generate a report for a specific opportunity
        
        Returns:
            Tuple containing:
            - Boolean indicating if the user can generate a report
            - Dict with status information including:
                - monthly_limit: The user's monthly limit
                - current_usage: Current number of reports generated this month
                - remaining: Number of reports remaining
                - limit_reached: Whether the limit has been reached
                - message: A user-friendly message
                - reason: One of 'under_limit', 'existing_report', or 'limit_reached'
        """
        month_year = await self.get_current_month_year()
        self.logger.info(f"Checking if user {user_id} can generate report for opportunity {opportunity_id}")
        
        # Check if the user has already generated a report for this opportunity
        already_generated = await self.has_generated_report(user_id, opportunity_id, month_year)
        if already_generated:
            self.logger.info(f"User {user_id} has already generated a report for opportunity {opportunity_id}")
            return True, {
                "monthly_limit": await self.get_monthly_limit(user_id),
                "current_usage": await self.get_usage_count(user_id, month_year),
                "remaining": 0,  # Not relevant for existing reports
                "limit_reached": False,
                "message": "You can continue editing your existing report",
                "reason": "existing_report"
            }
        
        # Get the user's monthly limit and current usage
        monthly_limit = await self.get_monthly_limit(user_id)
        current_usage = await self.get_usage_count(user_id, month_year)
        remaining = max(0, monthly_limit - current_usage)
        
        # Check if the user has reached their limit
        if current_usage >= monthly_limit:
            self.logger.info(f"User {user_id} has reached their monthly limit of {monthly_limit} reports")
            return False, {
                "monthly_limit": monthly_limit,
                "current_usage": current_usage,
                "remaining": 0,
                "limit_reached": True,
                "message": f"You've reached your monthly limit of {monthly_limit} RFP reports. Upgrade your plan to generate more reports.",
                "reason": "limit_reached"
            }
        
        self.logger.info(f"User {user_id} can generate report for opportunity {opportunity_id} ({current_usage}/{monthly_limit} used)")
        return True, {
            "monthly_limit": monthly_limit,
            "current_usage": current_usage,
            "remaining": remaining,
            "limit_reached": False,
            "message": f"You can generate {remaining} more RFP report(s) this month",
            "reason": "under_limit"
        }
