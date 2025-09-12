from fastapi import APIRouter, Request, Query, HTTPException
from pydantic import BaseModel
import os
import stripe
from config.settings import STRIPE_SECRET_KEY as stripe_api_key
from utils.db_utils import get_db_connection
from supabase import create_client, Client
import json

router = APIRouter()
stripe.api_key = stripe_api_key

# Helper to fetch user from DB by user_id (now str)
def get_user_by_id(user_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT id, email, stripe_customer_id FROM profiles WHERE id = %s', (user_id,))
            row = cursor.fetchone()
            if not row:
                raise Exception(f"User with id {user_id} not found")
            class User:
                pass
            user = User()
            user.id = row[0]
            user.email = row[1]
            user.stripe_customer_id = row[2]
            return user
    finally:
        conn.close()

# Helper to get or create Stripe customer for user
def get_or_create_stripe_customer(user):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if not user.stripe_customer_id:
                customer = stripe.Customer.create(email=user.email)
                cursor.execute('UPDATE profiles SET stripe_customer_id = %s WHERE id = %s', (customer.id, user.id))
                conn.commit()
                return customer.id
            return user.stripe_customer_id
    finally:
        conn.close()

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
    # Define plan prices (should match frontend)
    plan_prices = {
        'basic': 999,        # $9.99
        'premium': 2999,     # $29.99
        'enterprise': 9999   # $99.99
    }
    if body.plan_type not in plan_prices:
        raise HTTPException(status_code=400, detail='Invalid plan type')
    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{body.plan_type.capitalize()} Plan Subscription',
                    },
                    'unit_amount': plan_prices[body.plan_type],
                    'recurring': {'interval': 'month'},
                },
                'quantity': 1,
            }],
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
    plan_prices = {
        'basic': 999,        # $9.99
        'premium': 2999,     # $29.99
        'enterprise': 9999   # $99.99
    }
    if body.plan_type not in plan_prices:
        raise HTTPException(status_code=400, detail='Invalid plan type')
    try:
        intent = stripe.PaymentIntent.create(
            amount=plan_prices[body.plan_type],
            currency='usd',
            customer=customer_id,
            setup_future_usage='off_session',
            metadata={'plan_type': body.plan_type},
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
            conn = get_db_connection()
            try:
                with conn.cursor() as cursor:
                    cursor.execute('SELECT id FROM profiles WHERE stripe_customer_id = %s', (customer_id,))
                    row = cursor.fetchone()
                    if row and plan_type:
                        user_id = row[0]
                        from datetime import datetime, timedelta
                        start_date = datetime.utcnow()
                        end_date = start_date + timedelta(days=30)
                        cursor.execute('''
                            INSERT INTO user_subscriptions (user_id, plan_type, status, start_date, end_date)
                            VALUES (%s, %s, %s, %s, %s)
                            ON CONFLICT (user_id) DO UPDATE SET plan_type = EXCLUDED.plan_type, status = EXCLUDED.status, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date
                        ''', (user_id, plan_type, 'active', start_date.isoformat(), end_date.isoformat()))
                        conn.commit()
                        return {"success": True, "message": f"Subscription updated for user {user_id} to plan {plan_type}"}
                    else:
                        return {"success": False, "message": "User or plan_type not found."}
            finally:
                conn.close()
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