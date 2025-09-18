from fastapi import APIRouter, HTTPException, Depends, Request, Header, status
import os
import stripe
import jwt
from config import settings
from pydantic import BaseModel
from utils.db_utils import get_supabase_connection
import logging
from typing import Dict, Any, Optional

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Stripe with the API key from settings
stripe.api_key = settings.get_stripe_secret_key()
logger.info(f"Stripe API key initialized (first 5 chars): {settings.get_stripe_secret_key()[:5]}...")

# Import other settings after stripe is initialized
from config.settings import JWT_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY

def validate_stripe_config():
    """Validate that Stripe is properly configured"""
    if not stripe.api_key or stripe.api_key == '':
        raise HTTPException(
            status_code=500, 
            detail="Stripe API key not configured. Please check environment variables."
        )

# Add a test endpoint to verify Stripe connection
@router.get("/test-stripe")
async def test_stripe():
    try:
        validate_stripe_config()
        
        # Debug information
        debug_info = {
            "stripe_api_key_set": bool(stripe.api_key),
            "stripe_api_key_prefix": stripe.api_key[:5] + '...' if stripe.api_key else None,
            "settings_stripe_key_available": bool(settings.get_stripe_secret_key()),
            "settings_stripe_key_prefix": settings.get_stripe_secret_key()[:5] + '...' if settings.get_stripe_secret_key() else None,
            "environment_check": {
                "STRIPE_SECRET_KEY_BIZ": bool(os.getenv('STRIPE_SECRET_KEY_BIZ')),
                "STRIPE_SECRET_KEY": bool(os.getenv('STRIPE_SECRET_KEY'))
            }
        }
        
        # Try to list customers (limit 1 to minimize API calls)
        customers = stripe.Customer.list(limit=1)
        return {
            "status": "success",
            "message": "Successfully connected to Stripe",
            "customer_count": len(customers.data),
            "debug": debug_info
        }
    except Exception as e:
        logger.error(f"Stripe test failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Stripe connection failed: {str(e)}",
            "debug": debug_info if 'debug_info' in locals() else None
        }

@router.get("/stripe/publishable-key")
async def get_stripe_publishable_key():
    """Return the Stripe publishable key for frontend use."""
    from config.settings import STRIPE_PUBLISHABLE_KEY
    
    if not STRIPE_PUBLISHABLE_KEY:
        raise HTTPException(status_code=500, detail="Stripe publishable key not configured")
    
    return {"publishable_key": STRIPE_PUBLISHABLE_KEY}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CreateCheckoutSessionRequest(BaseModel):
    priceId: str
    planType: str

async def get_current_user(authorization: Optional[str] = Header(None, description="JWT token")) -> Dict[str, Any]:
    """Extract and validate user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        logger.error("No or invalid Authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = authorization.split(" ")[1]
    try:
        # Log the token for debugging (don't log the full token in production)
        logger.info(f"JWT token received (first 10 chars): {token[:10]}...")
        logger.info(f"Using JWT_SECRET (first 5 chars): {JWT_SECRET[:5]}...")
        
        # Decode the JWT token with audience claim
        # Get your project reference from Supabase URL (e.g., 'abc123' from 'https://abc123.supabase.co')
        project_ref = SUPABASE_URL.split('//')[-1].split('.')[0] if '//' in SUPABASE_URL else 'your-project-ref'
        
        # Decode with audience claim
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            audience='authenticated',  # Supabase default audience
            options={"verify_aud": True}
        )
        logger.info(f"Decoded JWT payload: {payload}")
        
        user_id = payload.get("sub")
        logger.info(f"Extracted user_id from token: {user_id}")
        
        if not user_id:
            logger.error("No user ID in token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no user ID",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # Get user from Supabase
        supabase = get_supabase_connection(use_service_key=True)
        res = supabase.table('profiles').select('id, email, stripe_customer_id').eq('id', user_id).limit(1).execute()
        data = getattr(res, 'data', None) or []
        if data:
            row = data[0]
            return {
                'id': row.get('id'),
                'email': row.get('email'),
                'stripe_customer_id': row.get('stripe_customer_id')
            }
        # Graceful fallback when profile is missing
        logger.warning(f"User not found in profiles table: {user_id}. Falling back to JWT payload.")
        return {
            'id': user_id,
            'email': payload.get('email'),
            'stripe_customer_id': None
        }
            
    except jwt.ExpiredSignatureError:
        logger.error("Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except HTTPException as e:
        # Propagate explicit HTTP errors without converting them to 500s
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a Stripe Checkout Session"""
    logger.info(f"Creating checkout session for user {user['id']}, plan: {request.planType}")
    
    try:
        # Get or create Stripe customer
        customer_id = await get_or_create_stripe_customer(user)
        
        # Create a checkout session
        logger.info(f"Creating Stripe checkout session for customer {customer_id}")
        try:
            # Create the checkout session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                line_items=[{
                    'price': request.priceId,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:8080')}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:8080')}/pricing?cancelled=true",
                metadata={
                    'plan_type': request.planType,
                    'user_id': user['id']
                },
                subscription_data={
                    'metadata': {
                        'plan_type': request.planType,
                        'user_id': user['id']
                    },
                    'payment_behavior': 'allow_incomplete'
                },
                payment_method_types=['card'],
                payment_method_options={
                    'card': {
                        'request_three_d_secure': 'automatic'
                    }
                },
                automatic_tax={
                    'enabled': False
                },
                allow_promotion_codes=True,
                submit_type='auto'
            )
            
            logger.info(f"Created checkout session: {session.id}")
            return {"sessionId": session.id, "url": session.url}
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error in create_checkout_session: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to create checkout session: {str(e)}"
            )
        
        logger.info(f"Created checkout session: {session.id}")
        return {"sessionId": session.id}
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error in create_checkout_session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Payment service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in create_checkout_session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating your checkout session"
        )

async def get_or_create_stripe_customer(user: Dict[str, Any]) -> str:
    """Get or create a Stripe customer for the user"""
    if not user.get('email'):
        logger.error("No email in user object")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email is required"
        )
        
    try:
        # Check if user already has a Stripe customer ID
        if user.get('stripe_customer_id'):
            try:
                # Verify the customer exists in Stripe and is not deleted
                customer = stripe.Customer.retrieve(user['stripe_customer_id'])
                if hasattr(customer, 'deleted') and customer.deleted:
                    logger.info(f"Stripe customer {customer.id} was deleted, creating a new one")
                else:
                    logger.info(f"Using existing Stripe customer: {customer.id}")
                    return customer.id
            except stripe.error.InvalidRequestError as e:
                if 'No such customer' in str(e):
                    logger.warning(f"Stripe customer not found, creating new one: {str(e)}")
                else:
                    logger.error(f"Error retrieving Stripe customer: {str(e)}")
                    raise
        
        # Create a new Stripe customer
        logger.info(f"Creating new Stripe customer for user {user['id']}")
        customer = stripe.Customer.create(
            email=user['email'],
            metadata={
                'user_id': user['id']
            }
        )
        
        # Update the user's Stripe customer ID in Supabase
        try:
            supabase = get_supabase_connection(use_service_key=True)
            supabase.table('profiles').update({ 'stripe_customer_id': customer.id }).eq('id', user['id']).execute()
            logger.info(f"Updated user {user['id']} with Stripe customer ID: {customer.id}")
        except Exception as db_error:
            logger.error(f"Supabase error updating Stripe customer ID: {str(db_error)}")
            # Don't fail the request if we can't update the database; Stripe customer is created
        return customer.id
            
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error in get_or_create_stripe_customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Payment service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_or_create_stripe_customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while setting up your payment method"
        )
