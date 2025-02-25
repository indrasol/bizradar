from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.search_route import search_router

#Initialize FastAPI app
app = FastAPI(title="Job Search API", description="API to search for job opportunities", version="1.0")

#Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registewr the search routes
app.include_router(search_router, prefix="/search-opportunities", tags=["search-opportunities"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)  # Run on port 5000 with hot-reload for development