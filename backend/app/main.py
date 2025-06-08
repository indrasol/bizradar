import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.search_routes import search_router
# Import our new admin routes
from app.routes.admin_routes import router as admin_router
from app.utils.rec_queue import start_consumer_loop

bizapp = FastAPI()

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
    # "*"  # Temporarily allow all origins during development
]

bizapp.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
bizapp.include_router(search_router)
# Include admin routes
bizapp.include_router(admin_router)

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 5000 for local development
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
