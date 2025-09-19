from __future__ import annotations
from fastapi import APIRouter, Request, HTTPException, Depends
import stripe
import os
import sys
from config.settings import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from typing import Dict, Any, Optional
import calendar
import json
from datetime import datetime, timezone
import logging
from utils.db_utils import get_supabase_connection
from config import settings

router = APIRouter()
stripe.api_key = settings.get_stripe_secret_key()

# Configure logging
logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info(f"######################################################")
# Sanitize webhook secret to avoid trailing/leading whitespace issues
WEBHOOK_SECRET = (STRIPE_WEBHOOK_SECRET or "").strip()
masked_whsec = ("******" + WEBHOOK_SECRET[-4:]) if WEBHOOK_SECRET else "None"
logger.info(f"STRIPE_WEBHOOK_SECRET (masked): {masked_whsec}")
logger.info(f"######################################################")

def validate_stripe_config():
    """Validate that Stripe is properly configured"""
    if not stripe.api_key or stripe.api_key == '':
        logger.error("Stripe API key not configured")
        raise HTTPException(
            status_code=500, 
            detail="Stripe API key not configured. Please check environment variables."
        )


def hydrate_event_if_needed(event: Dict[str, Any]) -> Dict[str, Any]:
    """If the incoming event is a thin payload, attempt to hydrate it to a snapshot event.

    Strategy:
    - If event.object == 'event' and event.data exists, return as-is (already a snapshot)
    - Otherwise, try stripe.Event.retrieve(event.id) to fetch a full snapshot
    - If retrieval fails, return the original event so we can still safely no-op or log
    """
    try:
        obj_type = event.get("object") if isinstance(event, dict) else getattr(event, "object", None)
        has_data = False
        if isinstance(event, dict):
            has_data = isinstance(event.get("data"), dict) and "object" in (event.get("data") or {})
        else:
            data_val = getattr(event, "data", None)
            has_data = isinstance(data_val, dict) and "object" in data_val

        if obj_type == "event" and has_data:
            return event

        evt_id = event.get("id") if isinstance(event, dict) else getattr(event, "id", None)
        if evt_id:
            try:
                full_evt = stripe.Event.retrieve(evt_id)
                return full_evt
            except Exception as retrieve_error:
                logger.warning(f"Failed to hydrate thin event {evt_id}: {str(retrieve_error)}")
        return event
    except Exception as e:
        logger.warning(f"hydrate_event_if_needed error: {str(e)}")
        return event


def get_plan_by_price_id(price_id: str) -> Optional[Dict[str, Any]]:
    """Resolve plan by Stripe price_id from public.subscriptions, returns { 'id', 'plan_type', 'plan_period' }."""
    try:
        supabase = get_supabase_connection(use_service_key=True)
        res = (
            supabase
            .table('subscriptions')
            .select('id, plan_type, plan_period')
            .eq('price_id', price_id)
            .limit(1)
            .execute()
        )
        data = getattr(res, 'data', None) or []
        if data and isinstance(data, list):
            row = data[0]
            plan_type = row.get('plan_type')
            plan_id = row.get('id')
            plan_period = row.get('plan_period')
            if plan_type and plan_id:
                return { 'id': plan_id, 'plan_type': plan_type, 'plan_period': plan_period }
        logger.error(f"Unknown price ID in subscriptions: {price_id}")
        return None
    except Exception as e:
        logger.error(f"Error fetching plan for price_id {price_id}: {str(e)}")
        return None


def calculate_end_date_from_plan_period(plan_period: Optional[str]) -> Optional[str]:
    """Calculate end_date ISO based on plan_period: monthly -> +1 month, annual -> +1 year."""
    try:
        if not plan_period:
            return None
        now = datetime.now(timezone.utc)
        if plan_period.lower() == 'monthly':
            year = now.year
            month = now.month + 1
            if month > 12:
                month = 1
                year += 1
            last_day = calendar.monthrange(year, month)[1]
            day = min(now.day, last_day)
            end_dt = now.replace(year=year, month=month, day=day)
            return end_dt.isoformat()
        if plan_period.lower() == 'annual' or plan_period.lower() == 'yearly':
            year = now.year + 1
            month = now.month
            last_day = calendar.monthrange(year, month)[1]
            day = min(now.day, last_day)
            end_dt = now.replace(year=year, month=month, day=day)
            return end_dt.isoformat()
        return None
    except Exception:
        return None


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
    """Get user ID using Supabase via Stripe customer ID, with fallback linking."""
    try:
        supabase = get_supabase_connection(use_service_key=True)

        # Try direct match on profiles.stripe_customer_id
        res = supabase.table('profiles').select('id').eq('stripe_customer_id', customer_id).execute()
        data = getattr(res, 'data', None) or []
        if data:
            return data[0]['id']

        # Fallback: fetch from Stripe and link by metadata.user_id then by email
        try:
            customer = stripe.Customer.retrieve(customer_id)
            metadata_user_id = None
            if hasattr(customer, 'metadata') and isinstance(customer.metadata, dict):
                metadata_user_id = customer.metadata.get('user_id')

            if metadata_user_id:
                link_res = (
                    supabase
                    .table('profiles')
                    .update({'stripe_customer_id': customer_id})
                    .eq('id', metadata_user_id)
                    .execute()
                )
                link_data = getattr(link_res, 'data', None) or []
                if link_data:
                    logger.info(f"Linked Stripe customer {customer_id} to user {metadata_user_id} via metadata.user_id")
                    return metadata_user_id

            customer_email = getattr(customer, 'email', None)
            if customer_email:
                link_res = (
                    supabase
                    .table('profiles')
                    .update({'stripe_customer_id': customer_id})
                    .eq('email', customer_email)
                    .execute()
                )
                link_data = getattr(link_res, 'data', None) or []
                if link_data:
                    linked_id = link_data[0]['id']
                    logger.info(f"Linked Stripe customer {customer_id} to user {linked_id} via email {customer_email}")
                    return linked_id

            logger.error(f"No user found to link with Stripe customer ID: {customer_id}")
            raise HTTPException(status_code=400, detail="User not found")
        except Exception as e:
            logger.error(f"Error fetching customer from Stripe: {str(e)}")
            raise HTTPException(status_code=500, detail="Error processing webhook")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user ID from customer: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing webhook")


def update_user_subscription(
    user_id: str,
    plan_type: str,
    plan_id: Optional[str],
    status: str,
    subscription_id: str,
    current_period_end: int = None,
    plan_period: Optional[str] = None
) -> None:
    """Update or create user subscription using Supabase (new schema)."""
    try:
        supabase = get_supabase_connection(use_service_key=True)

        # Determine end_date ISO
        end_dt_iso = calculate_end_date_from_plan_period(plan_period)
        if not end_dt_iso and current_period_end:
            end_dt_iso = datetime.fromtimestamp(current_period_end, tz=timezone.utc).isoformat()

        # Check if a subscription already exists (unique on user_id)
        existing = (
            supabase
            .table('user_subscriptions')
            .select('id, current_subscription_plan, current_subscription_plan_id')
            .eq('user_id', user_id)
            .limit(1)
            .execute()
        )
        existing_data = getattr(existing, 'data', None) or []

        if existing_data:
            prev_plan_type = existing_data[0].get('current_subscription_plan')
            prev_plan_id = existing_data[0].get('current_subscription_plan_id')

            update_payload = {
                'current_subscription_plan': plan_type,
                'current_subscription_plan_id': plan_id,
                'status': status,
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'end_date': end_dt_iso,
                'stripe_subscription_id': subscription_id,
            }
            if prev_plan_type and prev_plan_type != plan_type:
                update_payload['prev_subscription_plan'] = prev_plan_type
                update_payload['prev_subscription_plan_id'] = prev_plan_id

            supabase.table('user_subscriptions').update(update_payload).eq('user_id', user_id).execute()
            logger.info(f"Updated existing subscription for user {user_id} to {plan_type} ({status})")
        else:
            now_iso = datetime.now(timezone.utc).isoformat()
            insert_payload = {
                'user_id': user_id,
                'current_subscription_plan': plan_type,
                'current_subscription_plan_id': plan_id,
                'status': status,
                'start_date': now_iso,
                'end_date': end_dt_iso,
                'stripe_subscription_id': subscription_id,
                'created_at': now_iso,
                'updated_at': now_iso,
                'ai_rfp_responses_used': 0,
            }
            supabase.table('user_subscriptions').upsert(insert_payload, on_conflict='user_id').execute()
            logger.info(f"Created new subscription for user {user_id} to {plan_type} ({status})")
    except Exception as e:
        logger.error(f"Error updating user subscription: {str(e)}")
        raise


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    content_type = request.headers.get("content-type")
    logger.info(f"Webhook received: content-type={content_type}, body_len={len(payload)}, sig_header_present={bool(sig_header)}")

    # Only require signature header if a webhook secret is configured
    if WEBHOOK_SECRET and not sig_header:
        logger.error("Missing Stripe-Signature header while secret is configured")
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")
    
    # Validate webhook secret is configured
    if not WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET is not configured")
        logger.warning("Attempting to parse webhook without signature verification")
        try:
            # Parse without signature verification (for development/testing)
            event = json.loads(payload.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse webhook payload as JSON: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload format")
    else:
        try:
            # Pass raw bytes. The library will handle encoding. This avoids subtle string mutations.
            event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
        except ValueError as e:
            # Invalid payload
            logger.error(f"Invalid payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            # Log short diagnostics to help differentiate bad secret vs altered body
            logger.error(f"Invalid signature: {str(e)} | body_len={len(payload)} | sig_prefix={(sig_header or '')[:16]}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Keep original for potential thin-payload helpers, then hydrate if possible
    original_event = event
    event = hydrate_event_if_needed(event)

    # Handle the event
    try:
        event_type = event["type"]
    except Exception:
        event_type = getattr(event, "type", None) or getattr(original_event, "type", None) or "unknown"
    logger.info(f"Received event: {event_type}")
    
    if event_type == "checkout.session.completed":
        # Prefer snapshot payload
        session = None
        try:
            session = event.get("data", {}).get("object")  # type: ignore[attr-defined]
        except Exception:
            pass

        # If thin payload, try to retrieve session via related_object
        if not session:
            try:
                related = None
                if isinstance(original_event, dict):
                    related = original_event.get("related_object")
                else:
                    related = getattr(original_event, "related_object", None)
                if isinstance(related, dict):
                    ro_type = (related.get("type") or "").lower()
                    ro_id = related.get("id")
                    if ro_id and "checkout.session" in ro_type:
                        session = stripe.checkout.Session.retrieve(ro_id)
            except Exception as e:
                logger.warning(f"Unable to hydrate checkout session from thin payload: {str(e)}")

        if not session:
            logger.error("Missing session data for checkout.session.completed")
            return {"status": "success"}
        await handle_checkout_session_completed(session)
    elif event_type in [
        "customer.subscription.updated", 
        "customer.subscription.deleted"
    ]:
        subscription = None
        try:
            subscription = event.get("data", {}).get("object")  # type: ignore[attr-defined]
        except Exception:
            pass

        # If thin payload, try to retrieve subscription via related_object
        if not subscription:
            try:
                related = None
                if isinstance(original_event, dict):
                    related = original_event.get("related_object")
                else:
                    related = getattr(original_event, "related_object", None)
                if isinstance(related, dict):
                    ro_type = (related.get("type") or "").lower()
                    ro_id = related.get("id")
                    if ro_id and "subscription" in ro_type:
                        subscription = stripe.Subscription.retrieve(ro_id)
            except Exception as e:
                logger.warning(f"Unable to hydrate subscription from thin payload: {str(e)}")

        if not subscription:
            logger.error(f"No subscription object available for event {event_type}")
            return {"status": "success"}
        await handle_subscription_updated(subscription)
    else:
        # Gracefully handle unrelated thin events (e.g., billing.meter) without failing
        obj_type = original_event.get("object") if isinstance(original_event, dict) else getattr(original_event, "object", None)
        if obj_type == "v2.core.event":
            logger.info(f"Thin event received and ignored (no handler): {event_type}")
        else:
            logger.info(f"Event received and ignored (no handler): {event_type}")
    
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
    
    # Map price ID to plan via DB lookup
    plan = get_plan_by_price_id(price_id)
    if not plan:
        logger.error(f"Unknown price ID: {price_id}")
        return
    plan_type = plan['plan_type']
    plan_id = plan['id']
    plan_period = plan.get('plan_period')
    
    # Map status
    status = STATUS_MAPPING.get(subscription["status"].lower(), "expired")
    
    # Get the user ID from the customer ID
    try:
        user_id = get_user_id_from_customer(customer_id)
        
        # Update the user's subscription in the database
        update_user_subscription(
            user_id=user_id,
            plan_type=plan_type,
            plan_id=plan_id,
            status=status,
            subscription_id=subscription["id"],
            current_period_end=subscription.get("current_period_end"),
            plan_period=plan_period
        )
        
        logger.info(f"Successfully updated subscription for user {user_id} to {plan_type} ({status})")
    except HTTPException as e:
        logger.error(f"HTTP error updating subscription: {e.detail}")
    except Exception as e:
        logger.error(f"Error updating subscription: {str(e)}")

@router.get("/api/stripe/price-id")
def get_stripe_price_id(plan_type: str, billing_cycle: str = "monthly"):
    """Resolve Stripe price_id (and plan_id) for a given plan_type and billing_cycle from public.subscriptions."""
    try:
        normalized_plan = (plan_type or "").lower().strip()
        if normalized_plan == "basic":
            normalized_plan = "pro"
        normalized_cycle = (billing_cycle or "monthly").lower().strip()
        if normalized_cycle not in ["monthly", "annual", "yearly"]:
            raise HTTPException(status_code=400, detail="Invalid billing cycle")

        supabase = get_supabase_connection(use_service_key=True)
        cycle_value = 'annual' if normalized_cycle == 'yearly' else normalized_cycle
        res = (
            supabase
            .table('subscriptions')
            .select('id, price_id, plan_type, plan_period')
            .eq('plan_type', normalized_plan)
            .eq('plan_period', cycle_value)
            .limit(1)
            .execute()
        )
        data = getattr(res, 'data', None) or []
        if not data:
            raise HTTPException(status_code=404, detail="Price not configured")
        row = data[0]
        return { "price_id": row.get('price_id'), "plan_id": row.get('id'), "plan_period": row.get('plan_period') }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving Stripe price id: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resolve price id")

@router.get("/api/stripe/billing-history")
def get_billing_history(user_id: str):
    """Return up to 3 recent Stripe invoices for the given user_id."""
    try:
        validate_stripe_config()
        supabase = get_supabase_connection(use_service_key=True)
        print(f"Getting billing history for user {user_id}")
        prof = supabase.table('profiles').select('stripe_customer_id').eq('id', user_id).limit(1).execute()
        print(f"Profile: {prof}")
        data = getattr(prof, 'data', None) or []
        if not data or not data[0].get('stripe_customer_id'):
            raise HTTPException(status_code=404, detail="Stripe customer not found for user")
        customer_id = data[0]['stripe_customer_id']
        print(f"Customer ID: {customer_id}")
        invoices = stripe.Invoice.list(customer=customer_id, limit=3)
        items = []
        for inv in invoices.data:
            print(f"Invoice: {inv}")
            items.append({
                "id": inv.id,
                "number": getattr(inv, 'number', None),
                "created": getattr(inv, 'created', None),
                "amount_paid": getattr(inv, 'amount_paid', 0),
                "amount_due": getattr(inv, 'amount_due', 0),
                "status": getattr(inv, 'status', None),
                "hosted_invoice_url": getattr(inv, 'hosted_invoice_url', None),
                "invoice_pdf": getattr(inv, 'invoice_pdf', None),
                "currency": getattr(inv, 'currency', 'usd')
            })
        print(f"Items: {items}")
        return { "invoices": items }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching billing history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch billing history")
