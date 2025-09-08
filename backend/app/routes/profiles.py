from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import JSONResponse

from app.utils.logger import get_logger
from app.utils.subscription import ensure_active_access
from app.database.supabase import get_supabase_client


router = APIRouter()
logger = get_logger(__name__)


@router.post("/company/setup")
async def update_profile_company(request: Request):
    """
    Update a user's profile with company information in the Bizradar dev schema.

    Request JSON body:
      - user_id | userId: str (required)
      - company_name | name: str (required) -> maps to profiles.company_name
      - company_url | url: str (required) -> maps to profiles.company_url
      - company_description | description: str (optional) -> maps to profiles.company_description
      - user_role | role: str (optional) -> maps to profiles.role

    Returns:
      { success: bool, profile: { ...updated row... } }
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    user_id = data.get("user_id") or data.get("userId")
    name = data.get("company_name") or data.get("name")
    url = data.get("company_url") or data.get("url")
    description = data.get("company_description") or data.get("description", "")
    role = data.get("user_role") or data.get("role")

    # Best-effort subscription/trial access (do not block company setup on failure)
    try:
        ensure_active_access(user_id)
    except Exception as sub_err:
        logger.warning(f"Subscription check failed or unavailable; proceeding with update. Details: {sub_err}")

    # Basic validation
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    if not name or not isinstance(name, str) or not name.strip():
        raise HTTPException(status_code=400, detail="name is required")
    if not url or not isinstance(url, str) or not url.strip():
        raise HTTPException(status_code=400, detail="url is required")

    try:
        supabase = get_supabase_client()
    except Exception as e:
        logger.error(f"Supabase init error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize database client")

    try:
        payload = {
            "id": user_id,
            "company_name": name,
            "company_url": url,
            "company_description": description,
        }
        if role:
            payload["role"] = role

        # IMPORTANT: Profiles.email is NOT NULL in dev branch. Do NOT insert/upsert without email.
        # Update only; if no existing row, return 404 so the caller can ensure auth-created profile exists.
        res = (
            supabase
            .table("profiles")
            .update(payload)
            .eq("id", user_id)
            .execute()
        )

        data = getattr(res, "data", None) or []
        if not data:
            # No row updated; profile doesn't exist yet
            raise HTTPException(status_code=404, detail="Profile not found for user. Ensure the user signs up via Supabase Auth first.")

        # Return the updated row
        profile = data[0]

        return {"success": True, "profile": profile}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile company info: {e}")
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})



@router.get("/company/profile")
async def get_company_profile(user_id: str = Query(...)):
    """
    Get a user's company profile from the profiles table using user_id.

    Query params:
      - user_id: str (required)

    Returns:
      { success: bool, data: { id, name, url, description, role, markdown_content, is_primary }, message? }
    """
    if not user_id or not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")

    try:
        supabase = get_supabase_client()
    except Exception as e:
        logger.error(f"Supabase init error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize database client")

    try:
        result = (
            supabase
            .table("profiles")
            .select("id, company_name, company_url, company_description, role, company_markdown")
            .eq("id", user_id)
            .single()
            .execute()
        )

        profile = getattr(result, "data", None)
        if not profile:
            return {"success": False, "data": None, "message": "User profile not found"}

        if not profile.get("company_name"):
            return {"success": True, "data": None, "message": "User has no company setup"}

        company_data = {
            "id": profile.get("id"),
            "name": profile.get("company_name", ""),
            "url": profile.get("company_url", ""),
            "description": profile.get("company_description", ""),
            "role": profile.get("role", "user"),
            "is_primary": True,
            "markdown_content": profile.get("company_markdown", ""),
        }

        return {"success": True, "data": company_data}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching company profile for user {user_id}: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

