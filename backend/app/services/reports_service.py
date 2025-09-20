# services/reports_service.py
"""
Reports service for handling RFP response operations
Maps frontend 'reports' to database 'rfp_responses' table
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.database.supabase import get_supabase_client
from app.utils.logger import get_logger
from app.services.helper import json_serializable

logger = get_logger(__name__)

class ReportsService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.table_name = "reports"  # Use our new reports table
    
    async def get_reports(self, user_id: str, is_submitted: bool = False) -> List[Dict[str, Any]]:
        """Get all reports for a user filtered by submission status"""
        try:
            logger.info(f"Fetching reports for user {user_id}, is_submitted: {is_submitted}")
            
            response = self.supabase.table(self.table_name).select(
                "id, response_id, user_id, title, description, content, completion_percentage, is_submitted, stage, created_at, updated_at"
            ).eq("user_id", user_id).eq("is_submitted", is_submitted).order("updated_at", desc=True).execute()
            
            if response.data:
                # Transform to match frontend expectations (rfp_responses -> reports format)
                reports = []
                for item in response.data:
                    report = {
                        "id": item.get("id"),
                        "response_id": item["response_id"],
                        "user_id": item["user_id"], 
                        "title": item.get("title", ""),
                        "description": item.get("description", ""),
                        "content": item["content"],
                        "completion_percentage": item["completion_percentage"] or 0,
                        "is_submitted": item["is_submitted"],
                        "stage": item.get("stage", "draft"),
                        "updated_at": item["updated_at"],
                        "created_at": item["created_at"]
                    }
                    reports.append(json_serializable(report))
                
                logger.info(f"Found {len(reports)} reports for user {user_id}")
                return reports
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching reports for user {user_id}: {str(e)}")
            raise Exception(f"Failed to fetch reports: {str(e)}")
    
    async def get_report_by_response_id(self, response_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific report by response_id and user_id"""
        try:
            logger.info(f"Fetching report for response {response_id}, user {user_id}")
            
            # Use .execute() instead of .maybe_single().execute() to avoid Supabase errors
            response = self.supabase.table(self.table_name).select(
                "id, response_id, user_id, title, description, content, completion_percentage, is_submitted, stage, created_at, updated_at"
            ).eq("response_id", response_id).eq("user_id", user_id).execute()
            
            # Check if we have data
            if response.data and len(response.data) > 0:
                data = response.data[0]  # Get the first (and should be only) result
                report = {
                    "id": data.get("id"),
                    "response_id": data["response_id"],
                    "user_id": data["user_id"],
                    "title": data.get("title", ""),
                    "description": data.get("description", ""),
                    "content": data["content"],
                    "completion_percentage": data["completion_percentage"] or 0,
                    "is_submitted": data["is_submitted"],
                    "stage": data.get("stage", "draft"),
                    "updated_at": data["updated_at"],
                    "created_at": data["created_at"]
                }
                logger.info(f"Successfully fetched report for response {response_id}")
                return json_serializable(report)
            
            # No data found - this is normal for new RFPs
            logger.info(f"No report found for response {response_id}, user {user_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching report {response_id}: {str(e)}")
            # Don't re-raise the exception for common "not found" cases
            if ("Missing response" in str(e) or "204" in str(e) or "PGRST116" in str(e) or 
                "invalid input syntax for type uuid" in str(e) or "22P02" in str(e)):
                logger.info(f"Report not found for response {response_id} (expected for new RFPs or invalid UUID)")
                return None
            raise Exception(f"Failed to fetch report: {str(e)}")
    
    async def create_report(self, response_id: str, user_id: str, content: Dict[str, Any], 
                          completion_percentage: int = 0, is_submitted: bool = False) -> Dict[str, Any]:
        """Create a new report"""
        try:
            logger.info(f"Creating report for response {response_id}, user {user_id}")
            
            # Extract title from content if available
            title = content.get("rfpTitle", "Untitled Report") if isinstance(content, dict) else "Untitled Report"
            
            report_data = {
                "response_id": response_id,
                "user_id": user_id,
                "title": title,
                "content": content,
                "completion_percentage": completion_percentage,
                "is_submitted": is_submitted,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table(self.table_name).insert(report_data).select().single().execute()
            
            if response.data:
                created_report = {
                    "id": response.data.get("id"),
                    "response_id": response.data["response_id"],
                    "user_id": response.data["user_id"],
                    "title": response.data.get("title", ""),
                    "description": response.data.get("description", ""),
                    "content": response.data["content"],
                    "completion_percentage": response.data["completion_percentage"],
                    "is_submitted": response.data["is_submitted"],
                    "stage": "draft",  # Default stage
                    "updated_at": response.data["updated_at"],
                    "created_at": response.data["created_at"]
                }
                logger.info(f"Successfully created report for response {response_id}")
                return json_serializable(created_report)
            
            raise Exception("No data returned from insert operation")
            
        except Exception as e:
            logger.error(f"Error creating report for response {response_id}: {str(e)}")
            raise Exception(f"Failed to create report: {str(e)}")
    
    async def update_report(self, response_id: str, user_id: str, content: Optional[Dict[str, Any]] = None,
                          completion_percentage: Optional[int] = None, is_submitted: Optional[bool] = None) -> Dict[str, Any]:
        """Update an existing report"""
        try:
            logger.info(f"Updating report for response {response_id}, user {user_id}")
            
            update_data = {
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if content is not None:
                update_data["content"] = content
            if completion_percentage is not None:
                update_data["completion_percentage"] = completion_percentage
            if is_submitted is not None:
                update_data["is_submitted"] = is_submitted
            
            response = self.supabase.table(self.table_name).update(update_data).eq(
                "response_id", response_id
            ).eq("user_id", user_id).execute()
            
            # Supabase update doesn't return data by default, so we need to fetch the updated record
            if response.data is not None:  # Update was successful
                # Fetch the updated record
                updated_response = self.supabase.table(self.table_name).select(
                    "id, response_id, user_id, title, description, content, completion_percentage, is_submitted, stage, created_at, updated_at"
                ).eq("response_id", response_id).eq("user_id", user_id).execute()
                
                if updated_response.data and len(updated_response.data) > 0:
                    data = updated_response.data[0]
                    updated_report = {
                        "id": data.get("id"),
                        "response_id": data["response_id"],
                        "user_id": data["user_id"],
                        "title": data.get("title", ""),
                        "description": data.get("description", ""),
                        "content": data["content"],
                        "completion_percentage": data["completion_percentage"],
                        "is_submitted": data["is_submitted"],
                        "stage": data.get("stage", "draft"),
                        "updated_at": data["updated_at"],
                        "created_at": data["created_at"]
                    }
                    logger.info(f"Successfully updated report for response {response_id}")
                    return json_serializable(updated_report)
            
            raise Exception("Report not found or update failed")
            
        except Exception as e:
            logger.error(f"Error updating report for response {response_id}: {str(e)}")
            raise Exception(f"Failed to update report: {str(e)}")
    
    async def upsert_report(self, response_id: str, user_id: str, content: Dict[str, Any],
                          completion_percentage: int = 0, is_submitted: bool = False) -> Dict[str, Any]:
        """Create or update a report (upsert operation)"""
        try:
            logger.info(f"Upserting report for response {response_id}, user {user_id}")
            
            # Extract title from content if available
            title = content.get("rfpTitle", "Untitled Report") if isinstance(content, dict) else "Untitled Report"
            
            report_data = {
                "response_id": response_id,
                "user_id": user_id,
                "title": title,
                "content": content,
                "completion_percentage": completion_percentage,
                "is_submitted": is_submitted,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Try upsert with conflict resolution on unique constraint (user_id, response_id)
            response = self.supabase.table(self.table_name).upsert(
                report_data, on_conflict="user_id,response_id"
            ).execute()
            
            if response.data and len(response.data) > 0:
                data = response.data[0]  # upsert returns an array
                upserted_report = {
                    "id": data.get("id"),
                    "response_id": data["response_id"],
                    "user_id": data["user_id"],
                    "title": data.get("title", ""),
                    "description": data.get("description", ""),
                    "content": data["content"],
                    "completion_percentage": data["completion_percentage"],
                    "is_submitted": data["is_submitted"],
                    "stage": data.get("stage", "draft"),
                    "updated_at": data["updated_at"],
                    "created_at": data["created_at"]
                }
                logger.info(f"Successfully upserted report for response {response_id}")
                return json_serializable(upserted_report)
            
            raise Exception("No data returned from upsert operation")
            
        except Exception as e:
            logger.error(f"Error upserting report for response {response_id}: {str(e)}")
            # Handle UUID validation errors gracefully
            if "invalid input syntax for type uuid" in str(e) or "22P02" in str(e):
                raise Exception(f"Invalid UUID format for response_id or user_id: {str(e)}")
            raise Exception(f"Failed to upsert report: {str(e)}")
    
    async def delete_report(self, response_id: str, user_id: str) -> bool:
        """Delete a report"""
        try:
            logger.info(f"Deleting report for response {response_id}, user {user_id}")
            
            response = self.supabase.table(self.table_name).delete().eq(
                "response_id", response_id
            ).eq("user_id", user_id).execute()
            
            logger.info(f"Successfully deleted report for response {response_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting report for response {response_id}: {str(e)}")
            raise Exception(f"Failed to delete report: {str(e)}")
    
    async def toggle_submitted_status(self, response_id: str, user_id: str) -> Dict[str, Any]:
        """Toggle the submitted status of a report"""
        try:
            logger.info(f"Toggling submitted status for response {response_id}, user {user_id}")
            
            # First get current status
            current_report = await self.get_report_by_response_id(response_id, user_id)
            if not current_report:
                raise Exception("Report not found")
            
            new_status = not current_report["is_submitted"]
            
            # Only allow setting to submitted if completion is 100%
            if new_status and current_report["completion_percentage"] < 100:
                raise Exception("Report must be 100% complete to be marked as submitted")
            
            # Update the status
            updated_report = await self.update_report(
                response_id, user_id, is_submitted=new_status
            )
            
            logger.info(f"Successfully toggled submitted status to {new_status} for response {response_id}")
            return updated_report
            
        except Exception as e:
            logger.error(f"Error toggling submitted status for response {response_id}: {str(e)}")
            raise Exception(f"Failed to toggle submitted status: {str(e)}")

# Create service instance
reports_service = ReportsService()
