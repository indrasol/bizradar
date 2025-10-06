"""
User Profile Management Routes
Handles all user profile operations including personal and company information
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.database.supabase import get_supabase_client, safe_supabase_operation
from app.utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)

router = APIRouter()

class PersonalInfo(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    phone_verified: Optional[bool] = False

class CompanyInfo(BaseModel):
    company_name: Optional[str] = None
    company_url: Optional[str] = None
    company_description: Optional[str] = None
    role: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    personal_info: PersonalInfo
    company_info: CompanyInfo
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class UpdatePersonalInfoRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None

    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v is not None and len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        return v.strip() if v else None

    @validator('phone_number')
    def validate_phone(cls, v):
        if v is not None and len(v.strip()) == 0:
            return None
        return v.strip() if v else None

class UpdateCompanyInfoRequest(BaseModel):
    company_name: Optional[str] = None
    company_url: Optional[str] = None
    company_description: Optional[str] = None
    role: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None

    @validator('company_url')
    def validate_url(cls, v):
        if v is not None and len(v.strip()) > 0:
            # Basic URL validation
            if not (v.startswith('http://') or v.startswith('https://')):
                v = 'https://' + v
        return v.strip() if v else None

@router.get("", response_model=UserProfile)
async def get_user_profile(
    user_id: str = Query(..., description="User ID to fetch profile for")
):
    """Get complete user profile including personal and company information"""
    
    # Validate user_id
    if not user_id or user_id.strip() == '':
        raise HTTPException(
            status_code=400,
            detail="User ID is required and cannot be empty"
        )
    
    try:
        supabase = get_supabase_client()
        
        logger.info(f"Fetching profile for user {user_id}")
        
        # Define the Supabase operation
        def execute_query():
            try:
                query = supabase.table('profiles').select(
                    'id, email, first_name, last_name, full_name, phone_number, phone_verified, '
                    'company_name, company_url, company_description, role, industry, '
                    'company_size, created_at, updated_at'
                ).eq('id', user_id)
                result = query.execute()
                logger.debug(f"Profile query executed successfully for user {user_id}")
                return result
            except Exception as e:
                logger.error(f"Error executing profile query: {str(e)}")
                raise
        
        # Execute query using safe operation
        response = await safe_supabase_operation(
            execute_query,
            error_message=f"Failed to fetch profile for user {user_id}"
        )
        
        if not response.data or len(response.data) == 0:
            logger.warning(f"No profile found for user {user_id}")
            raise HTTPException(
                status_code=404,
                detail="User profile not found"
            )
        
        profile_data = response.data[0]
        
        # Construct full name if not present but first/last names are available
        full_name = profile_data.get('full_name')
        if not full_name and (profile_data.get('first_name') or profile_data.get('last_name')):
            first = profile_data.get('first_name', '').strip()
            last = profile_data.get('last_name', '').strip()
            full_name = f"{first} {last}".strip()
        
        # Build response
        user_profile = UserProfile(
            id=profile_data['id'],
            personal_info=PersonalInfo(
                full_name=full_name,
                first_name=profile_data.get('first_name'),
                last_name=profile_data.get('last_name'),
                email=profile_data.get('email'),
                phone_number=profile_data.get('phone_number'),
                phone_verified=profile_data.get('phone_verified', False)
            ),
            company_info=CompanyInfo(
                company_name=profile_data.get('company_name'),
                company_url=profile_data.get('company_url'),
                company_description=profile_data.get('company_description'),
                role=profile_data.get('role'),
                industry=profile_data.get('industry'),
                company_size=profile_data.get('company_size')
            ),
            created_at=profile_data.get('created_at'),
            updated_at=profile_data.get('updated_at')
        )
        
        # logger.info(f"Successfully fetched profile for user {user_id}")
        
        return user_profile
        
    except HTTPException:
        raise
    except Exception as e:
        # logger.error(f"Error fetching user profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user profile: {str(e)}"
        )

@router.put("/personal")
async def update_personal_info(
    request: UpdatePersonalInfoRequest,
    user_id: str = Query(..., description="User ID")
):
    """Update user's personal information"""
    
    if not user_id or user_id.strip() == '':
        raise HTTPException(
            status_code=400,
            detail="User ID is required and cannot be empty"
        )
    
    try:
        supabase = get_supabase_client()
        
        # logger.info(f"Updating personal info for user {user_id}")
        
        # Prepare update data (only include non-None values)
        # Note: full_name is a generated column and cannot be updated directly
        update_data = {}
        if request.first_name is not None:
            update_data['first_name'] = request.first_name
        if request.last_name is not None:
            update_data['last_name'] = request.last_name
        if request.phone_number is not None:
            update_data['phone_number'] = request.phone_number
        
        # Add updated timestamp
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        if not update_data or len(update_data) == 1:  # Only timestamp
            raise HTTPException(
                status_code=400,
                detail="No valid fields provided for update"
            )
        
        # Define the Supabase operation
        def execute_update():
            try:
                update_query = supabase.table('profiles').update(update_data).eq('id', user_id)
                result = update_query.execute()
                # logger.debug(f"Personal info update executed successfully for user {user_id}")
                return result
            except Exception as e:
                # logger.error(f"Error executing personal info update: {str(e)}")
                raise
        
        # Execute update using safe operation
        response = await safe_supabase_operation(
            execute_update,
            error_message=f"Failed to update personal info for user {user_id}"
        )
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="User profile not found or no changes made"
            )
        
        # logger.info(f"Successfully updated personal info for user {user_id}")
        
        return {
            "success": True,
            "message": "Personal information updated successfully",
            "updated_fields": list(update_data.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating personal info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update personal information: {str(e)}"
        )

@router.put("/company")
async def update_company_info(
    request: UpdateCompanyInfoRequest,
    user_id: str = Query(..., description="User ID")
):
    """Update user's company information"""
    
    if not user_id or user_id.strip() == '':
        raise HTTPException(
            status_code=400,
            detail="User ID is required and cannot be empty"
        )
    
    try:
        supabase = get_supabase_client()
        
        # logger.info(f"Updating company info for user {user_id}")
        
        # Prepare update data (only include non-None values)
        update_data = {}
        if request.company_name is not None:
            update_data['company_name'] = request.company_name
        if request.company_url is not None:
            update_data['company_url'] = request.company_url
        if request.company_description is not None:
            update_data['company_description'] = request.company_description
        if request.role is not None:
            update_data['role'] = request.role
        if request.industry is not None:
            update_data['industry'] = request.industry
        if request.company_size is not None:
            update_data['company_size'] = request.company_size
        
        # Add updated timestamp
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        if not update_data or len(update_data) == 1:  # Only timestamp
            raise HTTPException(
                status_code=400,
                detail="No valid fields provided for update"
            )
        
        # Define the Supabase operation
        def execute_update():
            try:
                update_query = supabase.table('profiles').update(update_data).eq('id', user_id)
                result = update_query.execute()
                # logger.debug(f"Company info update executed successfully for user {user_id}")
                return result
            except Exception as e:
                # logger.error(f"Error executing company info update: {str(e)}")
                raise
        
        # Execute update using safe operation
        response = await safe_supabase_operation(
            execute_update,
            error_message=f"Failed to update company info for user {user_id}"
        )
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="User profile not found or no changes made"
            )
        
        # logger.info(f"Successfully updated company info for user {user_id}")
        
        return {
            "success": True,
            "message": "Company information updated successfully",
            "updated_fields": list(update_data.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # logger.error(f"Error updating company info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update company information: {str(e)}"
        )

@router.get("/summary")
async def get_profile_summary(
    user_id: str = Query(..., description="User ID")
):
    """Get a summary of user profile for quick display"""
    
    if not user_id or user_id.strip() == '':
        raise HTTPException(
            status_code=400,
            detail="User ID is required and cannot be empty"
        )
    
    try:
        supabase = get_supabase_client()
        
        # logger.info(f"Fetching profile summary for user {user_id}")
        
        # Define the Supabase operation
        def execute_query():
            try:
                query = supabase.table('profiles').select(
                    'id, email, first_name, last_name, company_name, role'
                ).eq('id', user_id)
                result = query.execute()
                return result
            except Exception as e:
                # logger.error(f"Error executing profile summary query: {str(e)}")
                raise
        
        # Execute query using safe operation
        response = await safe_supabase_operation(
            execute_query,
            error_message=f"Failed to fetch profile summary for user {user_id}"
        )
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="User profile not found"
            )
        
        profile_data = response.data[0]
        
        # Build summary
        full_name = None
        if profile_data.get('first_name') or profile_data.get('last_name'):
            first = profile_data.get('first_name', '').strip()
            last = profile_data.get('last_name', '').strip()
            full_name = f"{first} {last}".strip()
        
        summary = {
            "id": profile_data['id'],
            "full_name": full_name,
            "email": profile_data.get('email'),
            "company_name": profile_data.get('company_name'),
            "role": profile_data.get('role')
        }
        
        # logger.info(f"Successfully fetched profile summary for user {user_id}")
        
        return {
            "success": True,
            "profile": summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # logger.error(f"Error fetching profile summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch profile summary: {str(e)}"
        )
