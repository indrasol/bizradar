
from typing import Optional, Dict, Any
from app.services.trackers_service import TrackersService
from app.services.reports_service import reports_service
from app.utils.logger import get_logger


class ResponsesService:
    """Coordinates updates across trackers and reports."""

    def __init__(self):
        self.logger = get_logger(__name__)
        self.trackers_service = TrackersService()

    async def put_response(
        self,
        response_id: str,
        user_id: str,
        stage: Optional[str],
        content: Optional[Dict[str, Any]],
        completion_percentage: Optional[int],
        is_submitted: Optional[bool],
        opportunity_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Conditions for Saving :
        - If tracker exists and tracker_stage provided, update tracker.stage first
        - Upsert report with provided fields
        - Return dict with updated report and optional tracker
        """
        updated_tracker: Optional[Dict[str, Any]] = None

        # Update tracker stage if user_id, opportunity_id, and stage are provided
        self.logger.info(f"🔍 Tracker Update Debug: user_id={user_id}, opportunity_id={opportunity_id}, stage={stage}")
        if user_id and opportunity_id and stage:
            try:
                # Find tracker by user_id and opportunity_id
                self.logger.info(f"🔍 Looking for tracker with user_id={user_id}, opportunity_id={opportunity_id}")
                tracker = await self.trackers_service.get_tracker_by_opportunity(user_id, opportunity_id)
                self.logger.info(f"🔍 Tracker found: {tracker is not None}")
                if tracker:
                    updated_tracker = await self.trackers_service.update_tracker(
                        tracker_id=tracker["id"],
                        user_id=user_id,
                        title=None,
                        description=None,
                        stage=stage,
                        due_date=None,
                        naicscode=None,
                        is_submitted=None,
                    )
                    self.logger.info(
                        f"Updated tracker {tracker['id']} stage to {stage} for user {user_id} and opportunity {opportunity_id}"
                    )
                else:
                    # No tracker exists for this user/opportunity combo - skip tracker update
                    self.logger.info(
                        f"No tracker found for user {user_id} and opportunity {opportunity_id} - skipping tracker update"
                    )
            except Exception as e:
                # Error occurred while trying to update tracker
                self.logger.warning(
                    f"Failed to update tracker for user {user_id} and opportunity {opportunity_id}: {str(e)}"
                )

        # Always save the latest response in the reports table
        report_payload = content or {}
        updated_report = await reports_service.upsert_report(
            response_id=response_id,
            user_id=user_id,
            content=report_payload,
            completion_percentage=completion_percentage or 0,
            is_submitted=is_submitted or False,
            opportunity_id=opportunity_id,
        )

        return {"report": updated_report, "tracker": updated_tracker}


# Singleton instance used by routes
responses_service = ResponsesService()


