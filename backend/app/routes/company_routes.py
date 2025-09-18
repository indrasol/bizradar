"""
Company setup and management routes
Handles company profile updates and subscription initialization using only the profiles table
"""
from fastapi import APIRouter, HTTPException, Request, Query
import json
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.database.supabase import get_supabase_client
from app.utils.supabase_subscription import subscription_manager
from app.utils.logger import get_logger
from app.services.parse_website import parse_company_website_mcp
from app.services.profile_embeddings import update_profile_embedding
from app.services.profile_opportunity_rag import get_top_matches_for_profile

# Initialize logger
logger = get_logger(__name__)

router = APIRouter()

def _strip_embeddings(obj: Dict[str, Any]) -> Dict[str, Any]:
    obj.pop("embedding", None)
    obj.pop("embeddings", None)
    obj.pop("search_tsv", None)
    obj.pop("embedding_text", None)
    obj.pop("embedding_model", None)
    obj.pop("embedding_version", None)
    return obj

class CompanySetupRequest(BaseModel):
    user_id: str
    company_name: str
    company_url: Optional[str] = None
    company_description: Optional[str] = None
    user_role: Optional[str] = "user"
    first_name: Optional[str] = None
    last_name: Optional[str] = None

@router.post("/setup")
async def setup_company(request: CompanySetupRequest):
    """
    Complete company setup flow using only profiles table:
    1. Update user profile with company information and names
    2. Initialize free tier subscription
    3. Optionally parse company website (if URL provided) to populate structured company_data
    """
    try:
        supabase = get_supabase_client()
        user_id = request.user_id
        
        logger.info(f"/company/setup: start user_id={user_id} company_name={request.company_name} url={request.company_url}")
        
        # Step 1: Update user profile with all information
        profile_updates = {
            "company_name": request.company_name,
            "company_url": request.company_url or "",
            "company_description": request.company_description or "",
            "role": request.user_role or "user"
        }
        
        # If URL provided, parse website via MCP and store structured data
        company_data = None
        if request.company_url:
            try:
                logger.info(f"/company/setup: parsing company URL via MCP url={request.company_url}")
                company_data = await parse_company_website_mcp(request.company_url)
                profile_updates["company_data"] = company_data
                if isinstance(company_data, dict):
                    logger.info(f"/company/setup: MCP parse succeeded keys={list(company_data.keys())[:10]}")
                else:
                    logger.info("/company/setup: MCP parse returned non-dict payload")
            except Exception as e:
                logger.exception(f"/company/setup: MCP parse failed url={request.company_url} error={str(e)}")
        
        # Add names if provided
        if request.first_name:
            profile_updates["first_name"] = request.first_name
        if request.last_name:
            profile_updates["last_name"] = request.last_name
        
        logger.info(f"/company/setup: updating profile id={user_id} fields={list(profile_updates.keys())}")

        # Ensure company_data matches DB type (character varying) by JSON-stringifying objects
        if isinstance(profile_updates.get("company_data"), (dict, list)):
            profile_updates["company_data"] = json.dumps(profile_updates["company_data"], ensure_ascii=False)

        # Update only; do not insert missing rows (email is NOT NULL in DB)
        try:
            supabase.table('profiles').update(profile_updates).eq('id', user_id).execute()
        except Exception as e:
            logger.exception(f"/company/setup: profile update failed id={user_id} error={str(e)}")
            raise

        # Fetch the row to confirm write and existence
        sel = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
        if not sel or not sel.data:
            logger.error(f"Profile row not found for user {user_id}; cannot create because email is NOT NULL")
            raise HTTPException(status_code=400, detail="User profile not found. Please sign in to create a profile or include required fields (e.g., email).")
        logger.info(f"/company/setup: profile updated id={user_id}")
        
        # Step 2: Initialize free tier subscription
        subscription = None
        try:
            subscription = subscription_manager.create_free_tier_subscription(user_id)
            logger.info(f"/company/setup: free tier subscription created id={user_id}")
        except Exception as e:
            logger.exception(f"/company/setup: subscription creation failed id={user_id} error={str(e)}")
            # Don't fail the entire setup if subscription creation fails
            subscription = {"error": str(e)}
        
        # Update embeddings after all profile updates
        try:
            logger.info(f"/company/setup: updating profile embedding id={user_id}")
            updated_row = update_profile_embedding(supabase, user_id)
        except Exception as e:
            logger.exception(f"/company/setup: embedding update failed id={user_id} error={str(e)}")
            updated_row = None

        # Get the updated profile to return
        updated_profile = (updated_row or sel.data)
        
        return {
            "success": True,
            "message": "Company setup completed successfully! Free Tier activated.",
            "data": {
                "company": {
                    "name": request.company_name,
                    "url": request.company_url,
                    "description": request.company_description,
                    "role": request.user_role
                },
                "subscription": subscription,
                "company_data": company_data,
                "profile": updated_profile
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"/company/setup: unexpected error user_id={request.user_id} error={str(e)}")
        raise HTTPException(status_code=500, detail=f"Company setup failed: {str(e)}")

@router.get("/profile")
async def get_company_profile(user_id: str = Query(...)):
    """Get user's company profile information from profiles table"""
    try:
        supabase = get_supabase_client()
        
        # Get user profile with company information
        logger.info(f"/company/profile: fetching profile id={user_id}")
        profile_result = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
        
        if not profile_result.data:
            return {
                "success": False,
                "data": None,
                "message": "User profile not found"
            }
        
        profile = profile_result.data
        
        # Check if user has company setup
        if not profile.get('company_name'):
            return {
                "success": True,
                "data": None,
                "message": "User has no company setup"
            }
        
        # Return company information from profile
        company_data = {
            "id": user_id,  # Use user_id as company identifier
            "name": profile.get('company_name', ''),
            "url": profile.get('company_url', ''),
            "description": profile.get('company_description', ''),
            "role": profile.get('user_role', 'user'),
            "is_primary": True,
            "markdown_content": profile.get('company_markdown', '')
        }
        
        logger.info(f"/company/profile: success id={user_id}")
        return {
            "success": True,
            "data": company_data
        }
        
    except Exception as e:
        logger.exception(f"/company/profile: error id={user_id} error={str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch company profile")

@router.put("/update")
async def update_company(request: CompanySetupRequest):
    """Update existing company information in profiles table"""
    try:
        supabase = get_supabase_client()
        user_id = request.user_id
        
        logger.info(f"/company/update: start user_id={user_id} company_name={request.company_name} url={request.company_url}")
        
        # Update profile with company information
        profile_updates = {
            "company_name": request.company_name,
            "company_url": request.company_url or "",
            "company_description": request.company_description or "",
            "role": request.user_role or "user"
        }
        company_data = None
        if request.company_url:
            try:
                logger.info(f"/company/update: parsing company URL via MCP url={request.company_url}")
                company_data = await parse_company_website_mcp(request.company_url)
                profile_updates["company_data"] = company_data
                logger.info("/company/update: MCP parse completed")
            except Exception as e:
                logger.exception(f"/company/update: MCP parse failed url={request.company_url} error={str(e)}")

        
        # Add names if provided
        if request.first_name:
            profile_updates["first_name"] = request.first_name
        if request.last_name:
            profile_updates["last_name"] = request.last_name
        
        try:
            profile_result = supabase.table('profiles').update(profile_updates).eq('id', user_id).execute()
        except Exception as e:
            logger.exception(f"/company/update: profile update failed id={user_id} error={str(e)}")
            raise

        
        if not profile_result.data:
            raise HTTPException(status_code=500, detail="Failed to update company information")
        
        logger.info(f"/company/update: profile updated id={user_id}")
        
        # Update embeddings after profile changes
        try:
            logger.info(f"/company/update: updating profile embedding id={user_id}")
            updated_row = update_profile_embedding(supabase, user_id)
        except Exception as e:
            logger.exception(f"/company/update: embedding update failed id={user_id} error={str(e)}")
            updated_row = None

        # Get updated profile to return
        updated_profile = (updated_row or (profile_result.data[0] if profile_result.data else {}))
        
        return {
            "success": True,
            "message": "Company information updated successfully",
            "data": {
                "company": {
                    "name": request.company_name,
                    "url": request.company_url,
                    "description": request.company_description,
                    "role": request.user_role
                },
                "markdown_generated": company_data,
                "profile": updated_profile
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"/company/update: unexpected error user_id={request.user_id} error={str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update company: {str(e)}")



@router.get("/recommendations")
async def get_recommendations(user_id: str = Query(...), limit: int = Query(5)):
    try:
        limit = int(limit) if isinstance(limit, int) else 5
        if limit <= 0:
            limit = 5
        logger.info(f"/company/recommendations: computing matches id={user_id} limit={limit}")
        matches = get_top_matches_for_profile(user_id=user_id, top_n=limit, only_active=True)
        results = [_strip_embeddings(doc) for doc in matches][:limit]
        logger.info(f"/company/recommendations: success id={user_id} count={len(results)}")
        return {"results": results, "count": len(results)}
    except Exception as e:
        logger.exception(f"/company/recommendations: error id={user_id} error={str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")


