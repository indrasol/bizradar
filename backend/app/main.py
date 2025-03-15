import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.search_routes import search_router

app = FastAPI()

# Configure CORS - allow both local development and production frontend
origins = [
    "http://localhost:8080",  # Local React development server
    "http://localhost:5173",  # Vite default port
    "https://bizradar.netlify.app",  # Your production frontend domain
    "https://bizradar.netlify.app/",     # Include trailing slash version
    "http://bizradar.netlify.app",       # Include HTTP version
    # "*"  # Temporarily allow all origins during development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(search_router)

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 5000 for local development
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)