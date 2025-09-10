from fastapi import APIRouter, Request, Query, HTTPException
from pydantic import BaseModel
import os
import stripe
from config.settings import STRIPE_SECRET_KEY as stripe_api_key
from utils.db_utils import get_supabase_connection
import json

router = APIRouter()
stripe.api_key = stripe_api_key

def get_user_by_id(user_id: str):
    supabase = get_supabase_connection(use_service_key=True)
    res = supabase.table('profiles').select('id, email, stripe_customer_id').eq('id', user_id).limit(1).execute()
    data = getattr(res, 'data', None) or []
    class User:
        pass
    user = User()
    user.id = user_id
    user.email = data[0]['email'] if data else None
    user.stripe_customer_id = data[0]['stripe_customer_id'] if data else None
    return user

# Helper to get or create Stripe customer for user
def get_or_create_stripe_customer(user):
    supabase = get_supabase_connection(use_service_key=True)
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(email=user.email) if user.email else stripe.Customer.create()
        supabase.table('profiles').update({'stripe_customer_id': customer.id}).eq('id', user.id).execute()
        return customer.id
    return user.stripe_customer_id

class AddPaymentMethodRequest(BaseModel):
    payment_method_id: str
    user_id: str

@router.get('/payment-methods')
def list_payment_methods(user_id: str = Query(...)):
    user = get_user_by_id(user_id)
    customer_id = get_or_create_stripe_customer(user)
    methods = stripe.PaymentMethod.list(customer=customer_id, type="card")
    return {"payment_methods": methods['data']}

@router.post('/payment-methods')
def add_payment_method(body: AddPaymentMethodRequest):
    user = get_user_by_id(body.user_id)
    customer_id = get_or_create_stripe_customer(user)
    pm = stripe.PaymentMethod.attach(body.payment_method_id, customer=customer_id)
    stripe.Customer.modify(customer_id, invoice_settings={"default_payment_method": body.payment_method_id})
    return {"payment_method": pm}

@router.delete('/payment-methods/{payment_method_id}')
def remove_payment_method(payment_method_id: str, user_id: str = Query(...)):
    user = get_user_by_id(user_id)
    customer_id = get_or_create_stripe_customer(user)
    pm = stripe.PaymentMethod.detach(payment_method_id)
    return {"removed": True}

@router.post('/payment-methods/{payment_method_id}/set-default')
def set_default_payment_method(payment_method_id: str, user_id: str = Query(...)):
    user = get_user_by_id(user_id)
    customer_id = get_or_create_stripe_customer(user)
    stripe.Customer.modify(customer_id, invoice_settings={"default_payment_method": payment_method_id})
    return {"default_set": True}

class SetupIntentRequest(BaseModel):
    user_id: str

@router.post('/create-setup-intent')
def create_setup_intent(body: SetupIntentRequest):
    user = get_user_by_id(body.user_id)
    customer_id = get_or_create_stripe_customer(user)
    intent = stripe.SetupIntent.create(customer=customer_id)
    return {"client_secret": intent.client_secret}

class SubscriptionCheckoutRequest(BaseModel):
    user_id: str
    plan_type: str

@router.post('/subscription/checkout-session')
def create_checkout_session(body: SubscriptionCheckoutRequest):
    user = get_user_by_id(body.user_id)
    customer_id = get_or_create_stripe_customer(user)
    # Replace basic->pro and fetch price ids from subscriptions table
    requested_plan = 'pro' if body.plan_type == 'basic' else body.plan_type
    if requested_plan not in ['pro', 'premium']:
        raise HTTPException(status_code=400, detail='Invalid plan type')
    supabase = get_supabase_connection(use_service_key=True)
    # Default to monthly for checkout
    price_row = (
        supabase.table('subscriptions')
        .select('price_id')
        .eq('plan_type', requested_plan)
        .eq('plan_period', 'monthly')
        .limit(1)
        .execute()
    )
    price_data = getattr(price_row, 'data', None) or []
    if not price_data:
        raise HTTPException(status_code=400, detail='Price not configured')
    stripe_price_id = price_data[0]['price_id']
    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{ 'price': stripe_price_id, 'quantity': 1 }],
            mode='subscription',
            success_url=os.getenv('FRONTEND_URL', 'http://localhost:5173') + '/dashboard?payment=success',
            cancel_url=os.getenv('FRONTEND_URL', 'http://localhost:5173') + '/dashboard?payment=cancel',
        )
        return {'url': session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SubscriptionPaymentIntentRequest(BaseModel):
    user_id: str
    plan_type: str

@router.post('/subscription/payment-intent')
def create_subscription_payment_intent(body: SubscriptionPaymentIntentRequest):
    user = get_user_by_id(body.user_id)
    customer_id = get_or_create_stripe_customer(user)
    # Replace basic->pro and fetch price for one-time intent (fallback to 2999 for premium, 999 for pro)
    requested_plan = 'pro' if body.plan_type == 'basic' else body.plan_type
    if requested_plan not in ['pro', 'premium']:
        raise HTTPException(status_code=400, detail='Invalid plan type')
    default_amount = 999 if requested_plan == 'pro' else 2999
    try:
        intent = stripe.PaymentIntent.create(
            amount=default_amount,
            currency='usd',
            customer=customer_id,
            setup_future_usage='off_session',
            metadata={'plan_type': requested_plan},
        )
        return {'client_secret': intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/stripe/verify-session')
def verify_stripe_session(session_id: str = Query(...)):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session['payment_status'] == 'paid' and session['status'] == 'complete':
            customer_id = session.get('customer')
            plan_type = None
            if 'metadata' in session and 'plan_type' in session['metadata']:
                plan_type = session['metadata']['plan_type']
            else:
                # Try to infer from line_items if needed (not implemented here)
                pass
            # Find user by Stripe customer ID
            supabase = get_supabase_connection(use_service_key=True)
            prof = supabase.table('profiles').select('id').eq('stripe_customer_id', customer_id).limit(1).execute()
            prof_data = getattr(prof, 'data', None) or []
            if prof_data and plan_type:
                user_id = prof_data[0]['id']
                from datetime import datetime, timedelta, timezone
                start_date = datetime.now(timezone.utc).isoformat()
                end_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                # map plan_type basic->pro just in case
                plan_type = 'pro' if plan_type == 'basic' else plan_type
                payload = {
                    'user_id': user_id,
                    'current_subscription_plan': plan_type,
                    'status': 'active',
                    'start_date': start_date,
                    'end_date': end_date,
                    'updated_at': start_date,
                }
                supabase.table('user_subscriptions').upsert(payload, on_conflict='user_id').execute()
                return {"success": True, "message": f"Subscription updated for user {user_id} to plan {plan_type}"}
            else:
                return {"success": False, "message": "User or plan_type not found."}
        else:
            return {"success": False, "message": "Session not paid or not complete."}
    except Exception as e:
        return {"success": False, "message": str(e)}

# @router.post('/stripe/webhook')
# async def stripe_webhook(request: Request):
#     payload = await request.body()
#     sig_header = request.headers.get('stripe-signature')
#     webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
#     event = None
#     try:
#         if webhook_secret:
#             event = stripe.Webhook.construct_event(
#                 payload, sig_header, webhook_secret
#             )
#         else:
#             event = json.loads(payload)
#     except Exception as e:
#         print(f"⚠️  Webhook error: {e}")
#         return {"status": "error", "message": str(e)}
#
#     # Handle the event
#     if event['type'] == 'checkout.session.completed':
#         session = event['data']['object']
#         customer_id = session.get('customer')
#         # If you set plan_type in metadata, use it; otherwise, parse from line_items
#         plan_type = None
#         if 'metadata' in session and 'plan_type' in session['metadata']:
#             plan_type = session['metadata']['plan_type']
#         else:
#             # Try to infer from line_items if needed (not implemented here)
#             pass
#         # Find user by Stripe customer ID
#         conn = get_db_connection()
#         try:
#             with conn.cursor() as cursor:
#                 cursor.execute('SELECT id FROM profiles WHERE stripe_customer_id = %s', (customer_id,))
#                 row = cursor.fetchone()
#                 if row and plan_type:
#                     user_id = row[0]
#                     # Upsert subscription in user_subscriptions
#                     from datetime import datetime, timedelta
#                     start_date = datetime.utcnow()
#                     end_date = start_date + timedelta(days=30)
#                     cursor.execute('''
#                         INSERT INTO user_subscriptions (user_id, plan_type, status, start_date, end_date)
#                         VALUES (%s, %s, %s, %s, %s)
#                         ON CONFLICT (user_id) DO UPDATE SET plan_type = EXCLUDED.plan_type, status = EXCLUDED.status, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date
#                     ''', (user_id, plan_type, 'active', start_date.isoformat(), end_date.isoformat()))
#                     conn.commit()
#                     print(f"✅ Subscription updated for user {user_id} to plan {plan_type}")
#         finally:
#             conn.close()
#     else:
#         print(f"Unhandled event type {event['type']}")
#     return {"status": "success"} 