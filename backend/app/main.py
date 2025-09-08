import os, sys
# BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
# if BASE_DIR not in sys.path:
#     sys.path.insert(0, BASE_DIR)
from fastapi import FastAPI, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.routes.search_routes import search_router
# Import our new admin routes
from app.routes.admin_routes import router as admin_router
from app.routes.email_routes import router as email_router
from app.routes.webhooks import router as webhook_router
from contextlib import asynccontextmanager
from app.utils.rec_queue import start_consumer_loop
from app.routes.payment_methods import router as payment_methods_router
from app.utils.supabase_subscription import subscription_manager
from app.routes.checkout import router as checkout_router
from app.routes.subscription_routes import router as subscription_router
from app.routes.company_routes import router as company_router
from app.routes.pursuit_routes import router as pursuit_router
from app.routes.tracker_routes import router as tracker_router
from app.routes.profile_routes import router as profile_router
from app.config.settings import title, description, version
from app.routes.enhanced_search import router as enhanced_search_router
from app.routes.profiles import router as profiles_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await start_consumer_loop()
        yield
    finally:
        # Cleanup resources in finally block to ensure they run even on errors
        # await session_manager.disconnect()  # Disconnect from Redis
        # log_info("disconnected redis session manager...")
        pass


app = FastAPI(
    title=title,
    description=description,
    version=version,
    lifespan=lifespan,
    debug=True,
    redirect_slashes=False
)


# Configure CORS - allow both local development and production frontend
origins = [
    "http://localhost:8080",  # Local React development server
    "http://localhost:5173",  # Vite default port
    "https://bizradar.netlify.app",  # Your production frontend domain
    "https://bizradar.netlify.app/",     # Include trailing slash version
    "http://bizradar.netlify.app",       # Include HTTP version
    "https://bizradar1.netlify.app",  # Your production frontend domain
    "https://dev-bizradar1.netlify.app/",
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
app.include_router(enhanced_search_router, prefix="/api", tags=["enhanced-search"])
# Include admin routes
# Include all API routes with /api prefix
app.include_router(admin_router, prefix="/api", tags=["admin"])
app.include_router(email_router, prefix="/api", tags=["email"])
app.include_router(checkout_router, prefix="/api", tags=["checkout"])
app.include_router(payment_methods_router, prefix="/api", tags=["payment-methods"])
app.include_router(subscription_router, prefix="/api/subscription", tags=["subscription"])
app.include_router(company_router, prefix="/api/company", tags=["company"])
app.include_router(pursuit_router, prefix="/api/pursuits", tags=["pursuits"])
app.include_router(tracker_router, prefix="/api/trackers", tags=["trackers"])
app.include_router(profile_router, prefix="/api/profile", tags=["profile"])
app.include_router(profiles_router, prefix="/api", tags=["profiles"])

# Webhook endpoint - no /api prefix since it's called directly by Stripe
app.include_router(webhook_router, prefix="")

# Note: Subscription status endpoint is now handled by subscription_routes.py

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 5000 for local development
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
