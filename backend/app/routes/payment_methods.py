from fastapi import APIRouter, Request, Query
from pydantic import BaseModel
import os
import stripe
from config.settings import STRIPE_SECRET_KEY as stripe_api_key
from utils.db_utils import get_db_connection
from supabase import create_client, Client

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