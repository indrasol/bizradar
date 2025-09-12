import json
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from app.utils.logger import get_logger
from app.utils.db_utils import get_supabase_connection


logger = get_logger(__name__)

event_router = APIRouter()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


async def _sweep_idle_sessions():
    """
    Opportunistic sweeper: end sessions with 3 missed heartbeats.
    This runs on write-paths (start, last_seen, end, event) to keep logic simple
    without a dedicated scheduler. If no sessions are idle, it is a no-op.
    """
    try:
        supabase = get_supabase_connection(use_service_key=True)
    except Exception as e:
        logger.warning(f"Supabase init failed in sweeper: {e}")
        return

    try:
        res = supabase.from_("user_sessions").select(
            "id,user_id,last_seen_at,heartbeat_interval_seconds,status,session_ended_at"
        ).eq("status", "active").is_("session_ended_at", None).execute()

        sessions = res.data or []
        if not isinstance(sessions, list):
            return

        now = _now_utc()
        to_end = []
        for s in sessions:
            try:
                last_seen = s.get("last_seen_at")
                interval = s.get("heartbeat_interval_seconds") or 600
                if last_seen is None:
                    # Treat missing last_seen as stale if started long ago
                    # We'll rely on DB default/updates elsewhere; skip here
                    continue
                # Parse last_seen which may be a string
                if isinstance(last_seen, str):
                    try:
                        last_seen_dt = datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
                    except Exception:
                        # Fallback: skip unparsable entries
                        continue
                else:
                    last_seen_dt = last_seen

                if now - last_seen_dt >= timedelta(seconds=interval * 3):
                    to_end.append({
                        "id": s.get("id"),
                        "user_id": s.get("user_id")
                    })
            except Exception:
                continue

        for sess in to_end:
            try:
                supabase.from_("user_sessions").update({
                    "status": "ended",
                    "session_ended_at": _now_utc().isoformat(),
                    "ended_reason": "timeout"
                }).eq("id", sess.get("id")).execute()

                # Log session_end event
                supabase.from_("events").insert({
                    "event_name": "session_end",
                    "event_type": "system",
                    "user_id": sess.get("user_id"),
                    "extra_data": {"reason": "timeout"}
                }).execute()
            except Exception as e:
                logger.warning(f"Failed ending idle session {sess.get('id')}: {e}")
    except Exception as e:
        logger.warning(f"Sweeper error: {e}")


@event_router.post("/session/start")
async def session_start(request: Request):
    """
    Start a user session and log a session start event.
    Body: { user_id, event_name: 'login'|'signup', geo?: {...}, user_agent?: string }
    Returns: { session_id }
    """
    try:
        data = await request.json()
        user_id = data.get("user_id") or data.get("userId")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        event_name = data.get("event_name") or data.get("eventName") or "login"
        geo = data.get("geo") or {}
        user_agent = data.get("user_agent") or request.headers.get("user-agent")
        client_ip = request.client.host if request.client else None

        supabase = get_supabase_connection(use_service_key=True)

        insert_payload = {
            "user_id": user_id,
            "status": "active",
            "session_started_at": _now_utc().isoformat(),
            "last_seen_at": _now_utc().isoformat(),
            "start_ip": client_ip,
            "start_user_agent": user_agent,
            "start_geo": geo,
            "consecutive_misses": 0,
        }

        ins_res = supabase.from_("user_sessions").insert(insert_payload).execute()
        session_id = None
        try:
            # supabase-py v2 may or may not return data
            if ins_res and getattr(ins_res, "data", None):
                ins_data = ins_res.data
                if isinstance(ins_data, list) and ins_data:
                    session_id = ins_data[0].get("id")
                elif isinstance(ins_data, dict):
                    session_id = ins_data.get("id")
        except Exception:
            pass

        if not session_id:
            # Fallback: get the most recent active session for this user that matches start time/ip/ua
            sel_res = supabase.from_("user_sessions").select("id").eq("user_id", user_id).eq("status", "active").order("created_at", desc=True).limit(1).execute()
            if sel_res and getattr(sel_res, "data", None):
                rows = sel_res.data
                if isinstance(rows, list) and rows:
                    session_id = rows[0].get("id")

        # Log events row
        supabase.from_("events").insert({
            "event_name": event_name,
            "event_type": "btn_click",
            "user_id": user_id,
            "extra_data": {
                "geo": geo,
                "ip": client_ip,
                "user_agent": user_agent,
                "session_id": session_id
            }
        }).execute()

        # Opportunistic sweep for stale sessions
        await _sweep_idle_sessions()

        return {"session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"session_start error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@event_router.post("/log")
async def event_handler(request: Request):
    """
    Store an arbitrary event from the frontend into events table.
    Body: { user_id, event_name, event_type, extra_data?, session_id? }
    """
    try:
        data = await request.json()
        user_id = data.get("user_id") or data.get("userId")
        event_name = data.get("event_name") or data.get("eventName")
        event_type = data.get("event_type") or data.get("eventType")
        extra_data = data.get("extra_data") or data.get("extraData") or {}
        session_id = data.get("session_id") or data.get("sessionId")

        if not event_name or not event_type:
            raise HTTPException(status_code=400, detail="event_name and event_type are required")

        supabase = get_supabase_connection(use_service_key=True)

        payload = {
            "event_name": event_name,
            "event_type": event_type,
            "user_id": user_id,
            "extra_data": {**extra_data, **({"session_id": session_id} if session_id else {})}
        }
        supabase.from_("events").insert(payload).execute()

        # Opportunistic sweep for stale sessions
        await _sweep_idle_sessions()

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"event_handler error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@event_router.post("/session/last-seen")
async def last_seen(request: Request):
    """
    Heartbeat ping from frontend every 10 minutes.
    Body: { user_id, session_id }
    Resets consecutive_misses to 0 and updates last_seen_at.
    """
    try:
        data = await request.json()
        user_id = data.get("user_id") or data.get("userId")
        session_id = data.get("session_id") or data.get("sessionId")
        if not user_id or not session_id:
            raise HTTPException(status_code=400, detail="user_id and session_id are required")

        supabase = get_supabase_connection(use_service_key=True)

        supabase.from_("user_sessions").update({
            "last_seen_at": _now_utc().isoformat(),
            "consecutive_misses": 0
        }).eq("id", session_id).eq("user_id", user_id).eq("status", "active").execute()

        # Opportunistic sweep for stale sessions
        await _sweep_idle_sessions()

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"last_seen error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@event_router.post("/session/end")
async def session_end(request: Request):
    """
    End a user session and log a session_end event.
    Body: { user_id, session_id, geo?: {...}, reason?: string }
    """
    try:
        data = await request.json()
        user_id = data.get("user_id") or data.get("userId")
        session_id = data.get("session_id") or data.get("sessionId")
        geo = data.get("geo") or {}
        reason = data.get("reason") or "manual"
        if not user_id or not session_id:
            raise HTTPException(status_code=400, detail="user_id and session_id are required")

        supabase = get_supabase_connection(use_service_key=True)

        # Update session row
        supabase.from_("user_sessions").update({
            "status": "ended",
            "session_ended_at": _now_utc().isoformat(),
            "end_geo": geo,
            "ended_reason": reason
        }).eq("id", session_id).eq("user_id", user_id).execute()

        # Log event
        supabase.from_("events").insert({
            "event_name": "session_end",
            "event_type": "system",
            "user_id": user_id,
            "extra_data": {"geo": geo, "session_id": session_id, "reason": reason}
        }).execute()

        # Opportunistic sweep (usually no-op right after ending)
        await _sweep_idle_sessions()

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"session_end error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


