"""
Company setup and management routes
Handles company profile updates and subscription initialization using only the profiles table
"""
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.database.supabase import get_supabase_client
from app.utils.supabase_subscription import subscription_manager
from app.utils.logger import get_logger
from app.services.company_scraper import generate_company_markdown

# Initialize logger
logger = get_logger(__name__)

router = APIRouter()

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
    3. Generate company markdown if URL provided
    """
    try:
        supabase = get_supabase_client()
        user_id = request.user_id
        
        logger.info(f"Starting company setup for user {user_id}")
        
        # Step 1: Update user profile with all information
        profile_updates = {
            "company_name": request.company_name,
            "company_url": request.company_url or "",
            "company_description": request.company_description or "",
            "role": request.user_role or "user"
        }
        
        # Add names if provided
        if request.first_name:
            profile_updates["first_name"] = request.first_name
        if request.last_name:
            profile_updates["last_name"] = request.last_name
        
        logger.info(f"Updating profile for user {user_id} with company data: {list(profile_updates.keys())}")
        
        profile_result = supabase.table('profiles').update(profile_updates).eq('id', user_id).execute()
        
        if not profile_result.data:
            logger.error(f"Failed to update profile for user {user_id}")
            raise HTTPException(status_code=500, detail="Failed to update user profile with company information")
        
        logger.info(f"Successfully updated profile for user {user_id}")
        
        # Step 2: Initialize free tier subscription
        subscription = None
        try:
            subscription = subscription_manager.create_free_tier_subscription(user_id)
            logger.info(f"Created free tier subscription for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to create subscription for user {user_id}: {str(e)}")
            # Don't fail the entire setup if subscription creation fails
            subscription = {"error": str(e)}
        
        # Step 3: Generate company markdown if URL provided (background task)
        markdown_content = None
        markdown_generated = False
        if request.company_url:
            try:
                logger.info(f"Generating markdown for company URL: {request.company_url}")
                markdown_content = await generate_company_markdown(request.company_url)
                
                # Update profile with markdown content
                markdown_update = supabase.table('profiles').update({
                    "company_markdown": markdown_content
                }).eq('id', user_id).execute()
                
                if markdown_update.data:
                    logger.info(f"Updated profile for user {user_id} with markdown content")
                    markdown_generated = True
                else:
                    logger.warning(f"Failed to update profile for user {user_id} with markdown")
                    
            except Exception as e:
                logger.error(f"Failed to generate markdown for {request.company_url}: {str(e)}")
                # Don't fail setup if markdown generation fails
        
        # Get the updated profile to return
        updated_profile = profile_result.data[0] if profile_result.data else {}
        
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
                "markdown_generated": markdown_generated,
                "profile": updated_profile
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in company setup for user {request.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Company setup failed: {str(e)}")

@router.get("/profile")
async def get_company_profile(user_id: str = Query(...)):
    """Get user's company profile information from profiles table"""
    try:
        supabase = get_supabase_client()
        
        # Get user profile with company information
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
        
        return {
            "success": True,
            "data": company_data
        }
        
    except Exception as e:
        logger.error(f"Error fetching company profile for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch company profile")

@router.put("/update")
async def update_company(request: CompanySetupRequest):
    """Update existing company information in profiles table"""
    try:
        supabase = get_supabase_client()
        user_id = request.user_id
        
        logger.info(f"Updating company information for user {user_id}")
        
        # Update profile with company information
        profile_updates = {
            "company_name": request.company_name,
            "company_url": request.company_url or "",
            "company_description": request.company_description or "",
            "user_role": request.user_role or "user"
        }
        
        # Add names if provided
        if request.first_name:
            profile_updates["first_name"] = request.first_name
        if request.last_name:
            profile_updates["last_name"] = request.last_name
        
        profile_result = supabase.table('profiles').update(profile_updates).eq('id', user_id).execute()
        
        if not profile_result.data:
            raise HTTPException(status_code=500, detail="Failed to update company information")
        
        logger.info(f"Successfully updated company information for user {user_id}")
        
        # Generate new markdown if URL provided
        markdown_generated = False
        if request.company_url:
            try:
                logger.info(f"Generating new markdown for URL: {request.company_url}")
                markdown_content = await generate_company_markdown(request.company_url)
                
                markdown_update = supabase.table('profiles').update({
                    "company_markdown": markdown_content
                }).eq('id', user_id).execute()
                
                if markdown_update.data:
                    logger.info(f"Updated markdown for user {user_id}")
                    markdown_generated = True
                else:
                    logger.warning(f"Failed to update markdown for user {user_id}")
                    
            except Exception as e:
                logger.error(f"Failed to generate markdown for {request.company_url}: {str(e)}")
        
        # Get updated profile to return
        updated_profile = profile_result.data[0] if profile_result.data else {}
        
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
                "markdown_generated": markdown_generated,
                "profile": updated_profile
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating company for user {request.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update company: {str(e)}")
