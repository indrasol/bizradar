import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.utils.logger import get_logger
from app.utils.db_utils import get_supabase_connection


logger = get_logger(__name__)

event_router = APIRouter()


class EventPayload(BaseModel):
    session_id: Optional[UUID] = None
    event_name: str
    event_type: str
    created_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


def _safe_utc(dt: Optional[datetime]) -> datetime:
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _get_client_ip_and_ua(request: Request) -> Dict[str, Optional[str]]:
    # Prefer X-Forwarded-For when behind proxies
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else None)
    user_agent = request.headers.get("user-agent")
    return {"ip": client_ip, "user_agent": user_agent}


@event_router.post("/log")
async def event_handler(request: Request):
    """
    Accepts an event payload and stores it in the `events` table.
    Input schema:
    {
        "session_id": " ",
        "event_name": " ",
        "event_type": " ",
        "created_at": " ",
        "metadata": {
            "latitude": "  ",
            " longitude ": "  ",
            "search_query": "  ",
            "opportunity_id": " ",
            "title": " ",
            "naics_code": " "
        }
    }
    """
    try:
        body = await request.json()
        payload = EventPayload(**body)

        supabase = get_supabase_connection()

        created_at = _safe_utc(payload.created_at)
        client = _get_client_ip_and_ua(request)

        metadata = payload.metadata or {}
        # Handle possible key with spaces like " longitude " by normalizing keys
        normalized_metadata: Dict[str, Any] = {}
        for k, v in metadata.items():
            if isinstance(k, str):
                normalized_metadata[k.strip()] = v
            else:
                normalized_metadata[k] = v

        latitude = normalized_metadata.get("latitude")
        longitude = normalized_metadata.get("longitude")

        # Insert into events table
        event_record: Dict[str, Any] = {
            "event_name": payload.event_name,
            "event_type": payload.event_type,
            "created_at": created_at.isoformat(),
            # user_id may not be available from this endpoint; leave null
            "extra_data": {
                "session_id": str(payload.session_id) if payload.session_id else None,
                "metadata": normalized_metadata,
                "client": client,
            },
        }

        # Remove None values from extra_data
        event_record["extra_data"] = {k: v for k, v in event_record["extra_data"].items() if v is not None}

        insert_resp = supabase.table("events").insert(event_record).execute()
        if getattr(insert_resp, "error", None):
            raise HTTPException(status_code=500, detail=str(insert_resp.error))

        # Session handling
        if payload.session_id and payload.event_name in {"login_success", "logout_success"}:
            session_id_str = str(payload.session_id)

            if payload.event_name == "login_success":
                session_record: Dict[str, Any] = {
                    "id": session_id_str,
                    "session_started_at": created_at.isoformat(),
                    "last_seen_at": created_at.isoformat(),
                    "status": "active",
                    "start_ip": client["ip"],
                    "start_user_agent": client["user_agent"],
                    "start_geo": {"latitude": latitude, "longitude": longitude},
                }
                # Upsert by primary key id
                session_upsert = supabase.table("user_sessions").upsert(session_record, on_conflict="id").execute()
                if getattr(session_upsert, "error", None):
                    logger.error(f"user_sessions upsert (login_success) failed: {session_upsert.error}")

            elif payload.event_name == "logout_success":
                session_record: Dict[str, Any] = {
                    "id": session_id_str,
                    "session_ended_at": created_at.isoformat(),
                    "last_seen_at": created_at.isoformat(),
                    "status": "ended",
                    "ended_reason": "logout_success",
                    "end_geo": {"latitude": latitude, "longitude": longitude},
                }
                session_upsert = supabase.table("user_sessions").upsert(session_record, on_conflict="id").execute()
                if getattr(session_upsert, "error", None):
                    logger.error(f"user_sessions upsert (logout_success) failed: {session_upsert.error}")

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"event_handler error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
