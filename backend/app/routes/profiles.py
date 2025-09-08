from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from app.utils.logger import get_logger
from app.utils.subscription import ensure_active_access
from app.utils.db_utils import get_supabase_connection


router = APIRouter()
logger = get_logger(__name__)


@router.post("/profiles/update-company")
async def update_profile_company(request: Request):
    """
    Update a user's profile with company information in the Bizradar dev schema.

    Request JSON body:
      - user_id | userId: str (required)
      - name: str (required) -> maps to profiles.company_name
      - url: str (required) -> maps to profiles.company_domain_url
      - description: str (optional) -> maps to profiles.company_description

    Returns:
      { success: bool, profile: { ...updated row... } }
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    user_id = data.get("user_id") or data.get("userId")
    name = data.get("name")
    url = data.get("url")
    description = data.get("description", "")

    # Enforce subscription/trial access
    ensure_active_access(user_id)

    # Basic validation
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    if not name or not isinstance(name, str) or not name.strip():
        raise HTTPException(status_code=400, detail="name is required")
    if not url or not isinstance(url, str) or not url.strip():
        raise HTTPException(status_code=400, detail="url is required")

    try:
        supabase = get_supabase_connection(use_service_key=True)
    except Exception as e:
        logger.error(f"Supabase init error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize database client")

    try:
        payload = {
            "id": user_id,
            "company_name": name,
            "company_domain_url": url,
            "company_description": description,
        }

        # Upsert to ensure the row exists even if profile wasn't pre-created
        res = (
            supabase
            .table("profiles")
            .upsert(payload, on_conflict="id")
            .select("*")
            .execute()
        )

        rows = getattr(res, "data", None) or []
        profile = rows[0] if rows else None
        if not profile:
            raise HTTPException(status_code=500, detail="Failed to upsert profile")

        return {"success": True, "profile": profile}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile company info: {e}")
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


