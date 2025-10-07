"""
Trackers service for managing tracker operations
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.database.supabase import get_supabase_client
from app.utils.logger import get_logger
def json_serializable(obj):
    """Simple JSON serialization helper"""
    return obj

logger = get_logger(__name__)

class TrackersService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.table_name = "trackers"

    async def get_trackers(self, user_id: str, is_submitted: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Get all trackers for a user"""
        try:
            query = self.supabase.table(self.table_name).select(
                "id, title, description, stage, created_at, updated_at, due_date, user_id, is_submitted, naicscode, opportunity_id"
            ).eq("user_id", user_id)
            
            if is_submitted is not None:
                query = query.eq("is_submitted", is_submitted)
                
            response = query.order("updated_at", desc=True).execute()
            
            if response.data:
                trackers = []
                for item in response.data:
                    tracker = {
                        "id": item.get("id"),
                        "title": item.get("title", ""),
                        "description": item.get("description", ""),
                        "stage": item.get("stage", "Assessment"),
                        "created_at": item["created_at"],
                        "updated_at": item["updated_at"],
                        "due_date": item.get("due_date"),
                        "user_id": item["user_id"],
                        "is_submitted": item.get("is_submitted", False),
                        "naicscode": item.get("naicscode"),
                        "opportunity_id": item.get("opportunity_id")
                    }
                    trackers.append(json_serializable(tracker))
                return trackers
            return []
        except Exception as e:
            # logger.error(f"Error fetching trackers for user {user_id}: {str(e)}")
            raise Exception(f"Failed to fetch trackers: {str(e)}")

    async def get_tracker_by_id(self, tracker_id: str, user_id: str) -> Dict[str, Any]:
        """Get a specific tracker by ID"""
        try:
            response = self.supabase.table(self.table_name).select(
                "id, title, description, stage, created_at, updated_at, due_date, user_id, is_submitted, naicscode, opportunity_id"
            ).eq("id", tracker_id).eq("user_id", user_id).single().execute()
            
            if response.data:
                tracker = {
                    "id": response.data.get("id"),
                    "title": response.data.get("title", ""),
                    "description": response.data.get("description", ""),
                    "stage": response.data.get("stage", "Assessment"),
                    "created_at": response.data["created_at"],
                    "updated_at": response.data["updated_at"],
                    "due_date": response.data.get("due_date"),
                    "user_id": response.data["user_id"],
                    "is_submitted": response.data.get("is_submitted", False),
                    "naicscode": response.data.get("naicscode"),
                    "opportunity_id": response.data.get("opportunity_id")
                }
                return json_serializable(tracker)
            raise Exception("Tracker not found")
        except Exception as e:
            # logger.error(f"Error fetching tracker {tracker_id} for user {user_id}: {str(e)}")
            raise Exception(f"Failed to fetch tracker: {str(e)}")

    async def get_tracker_by_opportunity(self, user_id: str, opportunity_id: int) -> Optional[Dict[str, Any]]:
        """Get a tracker by user_id and opportunity_id"""
        try:
            response = self.supabase.table(self.table_name).select(
                "id, title, description, stage, created_at, updated_at, due_date, user_id, is_submitted, naicscode, opportunity_id"
            ).eq("user_id", user_id).eq("opportunity_id", opportunity_id).maybe_single().execute()

            if response.data:
                tracker = {
                    "id": response.data.get("id"),
                    "title": response.data.get("title", ""),
                    "description": response.data.get("description", ""),
                    "stage": response.data.get("stage", "Assessment"),
                    "created_at": response.data["created_at"],
                    "updated_at": response.data["updated_at"],
                    "due_date": response.data.get("due_date"),
                    "user_id": response.data["user_id"],
                    "is_submitted": response.data.get("is_submitted", False),
                    "naicscode": response.data.get("naicscode"),
                    "opportunity_id": response.data.get("opportunity_id")
                }
                return json_serializable(tracker)
            return None
        except Exception as e:
            # logger.error(f"Error fetching tracker for user {user_id} and opportunity {opportunity_id}: {str(e)}")
            return None

    async def create_tracker(self, user_id: str, title: str, description: str = None, 
                           stage: str = "Assessment", due_date: str = None, 
                           naicscode: str = None, opportunity_id: int = None) -> Dict[str, Any]:
        """Create a new tracker"""
        try:
            # Generate UUID for tracker ID
            import uuid
            tracker_id = str(uuid.uuid4())
            
            tracker_data = {
                "id": tracker_id,
                "title": title,
                "description": description,
                "stage": stage,
                "user_id": user_id,
                "due_date": due_date,
                "naicscode": naicscode,
                "opportunity_id": opportunity_id,
                "is_submitted": False,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table(self.table_name).insert(tracker_data).execute()
            
            if response.data and len(response.data) > 0:
                data = response.data[0]
                created_tracker = {
                    "id": data.get("id"),
                    "title": data.get("title", ""),
                    "description": data.get("description", ""),
                    "stage": data.get("stage", "Assessment"),
                    "created_at": data["created_at"],
                    "updated_at": data["updated_at"],
                    "due_date": data.get("due_date"),
                    "user_id": data["user_id"],
                    "is_submitted": data.get("is_submitted", False),
                    "naicscode": data.get("naicscode"),
                    "opportunity_id": data.get("opportunity_id")
                }
                return json_serializable(created_tracker)
            raise Exception("No data returned from create operation")
        except Exception as e:
            logger.error(f"Error creating tracker for user {user_id}: {str(e)}")
            raise Exception(f"Failed to create tracker: {str(e)}")

    async def update_tracker(self, tracker_id: str, user_id: str, 
                           title: str = None, description: str = None, 
                           stage: str = None, due_date: str = None, 
                           naicscode: str = None, is_submitted: bool = None) -> Dict[str, Any]:
        """Update an existing tracker"""
        try:
            update_data = {
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if title is not None:
                update_data["title"] = title
            if description is not None:
                update_data["description"] = description
            if stage is not None:
                update_data["stage"] = stage
            if due_date is not None:
                update_data["due_date"] = due_date
            if naicscode is not None:
                update_data["naicscode"] = naicscode
            if is_submitted is not None:
                update_data["is_submitted"] = is_submitted
            
            # Execute the update (PostgREST may not return body without Prefer header)
            update_response = self.supabase.table(self.table_name).update(update_data).eq(
                "id", tracker_id
            ).eq("user_id", user_id).execute()

            # Regardless of body, fetch the updated record explicitly for consistency
            fetch_response = self.supabase.table(self.table_name).select(
                "id, title, description, stage, created_at, updated_at, due_date, user_id, is_submitted, naicscode"
            ).eq("id", tracker_id).eq("user_id", user_id).single().execute()
            
            if fetch_response.data:
                data = fetch_response.data
                updated_tracker = {
                    "id": data.get("id"),
                    "title": data.get("title", ""),
                    "description": data.get("description", ""),
                    "stage": data.get("stage", "Assessment"),
                    "created_at": data["created_at"],
                    "updated_at": data["updated_at"],
                    "due_date": data.get("due_date"),
                    "user_id": data["user_id"],
                    "is_submitted": data.get("is_submitted", False),
                    "naicscode": data.get("naicscode")
                }
                return json_serializable(updated_tracker)
            raise Exception("Failed to fetch updated tracker")
        except Exception as e:
            logger.error(f"Error updating tracker {tracker_id} for user {user_id}: {str(e)}")
            raise Exception(f"Failed to update tracker: {str(e)}")

    async def delete_tracker(self, tracker_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a tracker"""
        try:
            response = self.supabase.table(self.table_name).delete().eq(
                "id", tracker_id
            ).eq("user_id", user_id).execute()
            
            if response.data:
                return {"success": True, "message": "Tracker deleted successfully"}
            raise Exception("Tracker not found or already deleted")
        except Exception as e:
            logger.error(f"Error deleting tracker {tracker_id} for user {user_id}: {str(e)}")
            raise Exception(f"Failed to delete tracker: {str(e)}")

    async def toggle_submitted_status(self, tracker_id: str, user_id: str) -> Dict[str, Any]:
        """Toggle the submitted status of a tracker"""
        try:
            # First get current status
            current_tracker = await self.get_tracker_by_id(tracker_id, user_id)
            new_status = not current_tracker.get("is_submitted", False)
            
            # Update the status
            updated_tracker = await self.update_tracker(
                tracker_id, user_id, is_submitted=new_status
            )
            return updated_tracker
        except Exception as e:
            logger.error(f"Error toggling submitted status for tracker {tracker_id}: {str(e)}")
            raise Exception(f"Failed to toggle submitted status: {str(e)}")

    async def get_tracker_stats(self, user_id: str) -> Dict[str, Any]:
        """Get tracker statistics for a user"""
        try:
            response = self.supabase.table(self.table_name).select(
                "id, is_submitted, due_date, stage"
            ).eq("user_id", user_id).execute()
            
            if not response.data:
                return {
                    "total": 0,
                    "active": 0,
                    "submitted": 0,
                    "overdue": 0,
                    "due_this_week": 0
                }
            
            from datetime import datetime, timezone, timedelta
            now = datetime.now(timezone.utc)
            week_from_now = now + timedelta(days=7)
            
            total = len(response.data)
            submitted = sum(1 for t in response.data if t.get('is_submitted', False))
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
            
            return json_serializable(stats)
        except Exception as e:
            logger.error(f"Error getting tracker stats for user {user_id}: {str(e)}")
            raise Exception(f"Failed to get tracker stats: {str(e)}")
