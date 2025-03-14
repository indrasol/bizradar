import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.search_routes import search_router

app = FastAPI()

# Use the environment variable for the base URL
BASE_API_URL = os.getenv("VITE_BASE_API_URL")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[BASE_API_URL],  # Allow requests from the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(search_router)

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 5000 for local development
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)