# Stripe Integration Setup Guide

This document provides instructions for setting up the Stripe integration for the subscription flow.

## Environment Variables

### Backend (.env)

```
# Stripe API Keys
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000  # Update with your frontend URL
```

### Frontend (.env.local)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
NEXT_PUBLIC_API_URL=http://localhost:5000  # Update with your backend URL
```

## Webhook Setup

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-api-url.com/webhooks/stripe`
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the webhook signing secret and add it to your backend `.env` file as `STRIPE_WEBHOOK_SECRET`

## Testing

### Test Cards

Use these test card numbers in Stripe test mode:

- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Decline after authentication: `4000 0000 0000 3220`
- Insufficient funds: `4000 0000 0000 9995`

### Testing Webhooks Locally

Use the Stripe CLI to forward webhooks to your local development server:

```bash
stripe listen --forward-to localhost:5000/webhooks/stripe
```

## Security Considerations

1. Never commit `.env` files to version control
2. Keep your Stripe secret keys secure and never expose them in client-side code
3. Use environment variables for all sensitive configuration
4. Enable CORS on your API to only allow requests from trusted domains
5. Implement rate limiting on your API endpoints
6. Use HTTPS in production

## Troubleshooting

- If webhooks are not being received, check the Stripe Dashboard for delivery attempts
- Verify that your webhook signing secret matches between Stripe and your `.env` file
- Check server logs for errors when processing webhooks
- Ensure your server's clock is synchronized (NTP) as webhook verification is time-sensitive
