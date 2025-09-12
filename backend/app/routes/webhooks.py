from fastapi import APIRouter, Request, HTTPException, Depends
import stripe
import os
from config.settings import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from typing import Dict, Any
import json
from datetime import datetime, timezone
import logging
from utils.db_utils import get_db_connection
from config import settings

router = APIRouter()
stripe.api_key = settings.get_stripe_secret_key()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Stripe price IDs from the environment or use the provided ones
STRIPE_PRICES = {
    "basic_monthly": "price_1RqIaWFKTK8ICUprZJJh44Hc",
    "basic_annual": "price_1RqIcWFKTK8ICUprtagiVbzf",
    "premium_monthly": "price_1RqIdGFKTK8ICUprDEo5P7AB",
    "premium_annual": "price_1RqIdxFKTK8ICUprSgy50avW",
    "enterprise_monthly": "price_1RqIebFKTK8ICUpr6QN0hZ9a",
    "enterprise_annual": "price_1RqIewFKTK8ICUprSvBvDwvg",
}

# Map Stripe price IDs to our plan types
PRICE_TO_PLAN = {
    "price_1RqIaWFKTK8ICUprZJJh44Hc": "basic",
    "price_1RqIcWFKTK8ICUprtagiVbzf": "basic",
    "price_1RqIdGFKTK8ICUprDEo5P7AB": "premium",
    "price_1RqIdxFKTK8ICUprSgy50avW": "premium",
    "price_1RqIebFKTK8ICUpr6QN0hZ9a": "enterprise",
    "price_1RqIewFKTK8ICUprSvBvDwvg": "enterprise",
}

# Map Stripe subscription status to our status
STATUS_MAPPING = {
    "active": "active",
    "trialing": "active",
    "past_due": "active",  # Still active but payment is due
    "canceled": "cancelled",
    "unpaid": "expired",
    "incomplete": "expired",
    "incomplete_expired": "expired",
    "paused": "paused",
}


def get_user_id_from_customer(customer_id: str) -> str:
    """Get user ID from the database using Stripe customer ID"""
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                'SELECT id FROM profiles WHERE stripe_customer_id = %s', (customer_id,)
            )
            result = cursor.fetchone()
            if not result:
                logger.error(f"No user found with Stripe customer ID: {customer_id}")
                raise HTTPException(status_code=400, detail="User not found")
            return result[0]
    except Exception as e:
        logger.error(f"Error fetching user ID from customer: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing webhook")
    finally:
        if conn:
            conn.close()


def update_user_subscription(
    user_id: str, plan_type: str, status: str, subscription_id: str, current_period_end: int = None
) -> None:
    """Update or create user subscription in the database"""
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Check if user already has a subscription
            cursor.execute(
                """
                SELECT id FROM user_subscriptions 
                WHERE user_id = %s
                """,
                (user_id,)
            )
            existing_sub = cursor.fetchone()
            
            end_date = datetime.fromtimestamp(current_period_end, tz=timezone.utc) if current_period_end else None
            
            if existing_sub:
                # Update existing subscription
                cursor.execute(
                    """
                    UPDATE user_subscriptions 
                    SET plan_type = %s,
                        status = %s,
                        updated_at = NOW(),
                        end_date = %s,
                        stripe_subscription_id = %s
                    WHERE user_id = %s
                    RETURNING id
                    """,
                    (
                        plan_type,
                        status,
                        end_date,
                        subscription_id,
                        user_id
                    )
                )
                logger.info(f"Updated existing subscription for user {user_id} to {plan_type} ({status})")
            else:
                # Insert new subscription
                cursor.execute(
                    """
                    INSERT INTO user_subscriptions 
                    (user_id, plan_type, status, start_date, end_date, stripe_subscription_id)
                    VALUES (%s, %s, %s, NOW(), %s, %s)
                    RETURNING id
                    """,
                    (
                        user_id,
                        plan_type,
                        status,
                        end_date,
                        subscription_id
                    )
                )
                logger.info(f"Created new subscription for user {user_id} to {plan_type} ({status})")
                
            conn.commit()
    except Exception as e:
        logger.error(f"Error updating user subscription: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        logger.error(f"Invalid payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        logger.error(f"Invalid signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    event_type = event["type"]
    logger.info(f"Received event: {event_type}")
    
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        await handle_checkout_session_completed(session)
    elif event_type in [
        "customer.subscription.updated", 
        "customer.subscription.deleted"
    ]:
        subscription = event["data"]["object"]
        await handle_subscription_updated(subscription)
    
    return {"status": "success"}


async def handle_checkout_session_completed(session: Dict[str, Any]) -> None:
    """Handle successful checkout session"""
    logger.info(f"Processing checkout.session.completed for session: {session['id']}")
    
    # Get the customer ID and subscription ID from the session
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    
    if not customer_id or not subscription_id:
        logger.error("Missing customer_id or subscription_id in session")
        return
    
    # Retrieve the subscription to get the plan details
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        await handle_subscription_updated(subscription)
    except Exception as e:
        logger.error(f"Error retrieving subscription {subscription_id}: {str(e)}")


async def handle_subscription_updated(subscription: Dict[str, Any]) -> None:
    """Handle subscription created/updated events"""
    logger.info(f"Processing subscription update: {subscription['id']}")
    
    customer_id = subscription.get("customer")
    if not customer_id:
        logger.error("No customer ID in subscription")
        return
    
    # Get the price ID from the subscription
    price_id = None
    if subscription.get("items", {}).get("data"):
        price_id = subscription["items"]["data"][0].get("price", {}).get("id")
    
    if not price_id:
        logger.error(f"No price ID found in subscription {subscription['id']}")
        return
    
    # Map price ID to plan type
    plan_type = PRICE_TO_PLAN.get(price_id)
    if not plan_type:
        logger.error(f"Unknown price ID: {price_id}")
        return
    
    # Map status
    status = STATUS_MAPPING.get(subscription["status"].lower(), "expired")
    
    # Get the user ID from the customer ID
    try:
        user_id = get_user_id_from_customer(customer_id)
        
        # Update the user's subscription in the database
        update_user_subscription(
            user_id=user_id,
            plan_type=plan_type,
            status=status,
            subscription_id=subscription["id"],
            current_period_end=subscription.get("current_period_end")
        )
        
        logger.info(f"Successfully updated subscription for user {user_id} to {plan_type} ({status})")
    except HTTPException as e:
        logger.error(f"HTTP error updating subscription: {e.detail}")
    except Exception as e:
        logger.error(f"Error updating subscription: {str(e)}")
