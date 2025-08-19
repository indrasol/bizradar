import os
from fastapi import FastAPI, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from routes.search_routes import search_router
# Import our new admin routes
from routes.admin_routes import router as admin_router
from routes.email_routes import router as email_router
from routes.webhooks import router as webhook_router
from utils.rec_queue import start_consumer_loop
from routes.payment_methods import router as payment_methods_router
from utils.subscription import get_subscription_status
from routes.checkout import router as checkout_router

app = FastAPI()

@app.on_event("startup")
async def on_startup_event():
    start_consumer_loop()


# Configure CORS - allow both local development and production frontend
origins = [
    "http://localhost:8080",  # Local React development server
    "http://localhost:5173",  # Vite default port
    "https://bizradar.netlify.app",  # Your production frontend domain
    "https://bizradar.netlify.app/",     # Include trailing slash version
    "http://bizradar.netlify.app",       # Include HTTP version
    "https://bizradarv1.netlify.app",  # Your production frontend domain
    "https://bizradarv1.netlify.app/",
    "http://bizradarv1.netlify.app", 
    # "*"  # Temporarily allow all origins during development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test endpoint
@app.get("/test")
async def test():
    return {"message": "Test endpoint is working!"}

# Include routers
app.include_router(search_router)
# Include admin routes
# Include all API routes with /api prefix
app.include_router(admin_router, prefix="/api", tags=["admin"])
app.include_router(email_router, prefix="/api", tags=["email"])
app.include_router(checkout_router, prefix="/api", tags=["checkout"])
app.include_router(payment_methods_router, prefix="/api", tags=["payment-methods"])

# Webhook endpoint - no /api prefix since it's called directly by Stripe
app.include_router(webhook_router, prefix="")

# Fallback/direct status route to ensure availability
@app.get("/api/subscription/status")
def subscription_status(user_id: str = Query(...)):
    return get_subscription_status(user_id, create_if_missing=True)

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 5000 for local development
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
