import os
import json
import hashlib
import logging
import math
from datetime import datetime, date
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from openai import OpenAI
from services.open_ai_refiner import refine_query
from services.job_search import search_jobs  # Keep your original search_jobs function
from services.pdf_service import generate_rfp_pdf
from services.recommendations import generate_recommendations
from services.company_scraper import generate_company_markdown
from utils.redis_connection import RedisClient
from utils.database import get_connection
from collections import deque
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router, OpenAI client, and Redis
search_router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
redis_client = RedisClient()
CACHE_TTL = 60 * 60 * 24  # 24 hours cache time (1 day)

# Recommendation queue for prioritization
recommendation_queue = deque()
recommendation_lock = asyncio.Lock()

def sanitize(obj):
    """
    Recursively walk a Python structure, converting dates to ISO strings
    and handling non-serializable types like inf/nan.
    """
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    elif isinstance(obj, float):
        if math.isinf(obj) or math.isnan(obj):
            return None  # Replace inf/nan with None for JSON compatibility
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize(v) for v in obj]
    elif isinstance(obj, tuple):
        return [sanitize(v) for v in obj]
    return obj

@search_router.post("/test-redis")
async def test_redis_connection(request: Request):
    """Test Redis connection and basic operations"""
    try:
        test_key = "test:connection"
        test_value = {"status": "success", "timestamp": str(datetime.now()), "message": "Redis connection is working!"}
        success = redis_client.set_json(test_key, test_value)
        data = redis_client.get_json(test_key)
        return {
            "connection_status": "success" if redis_client.get_client() else "failed",
            "set_operation": "success" if success else "failed",
            "get_operation": "success" if data else "failed",
            "retrieved_value": data,
            "timestamp": str(datetime.now())
        }
    except Exception as e:
        logger.error(f"Redis test error: {e}")
        return {"connection_status": "failed", "error": str(e), "timestamp": str(datetime.now())}

@search_router.post("/search-opportunities")
async def search_job_opportunities(request: Request, background_tasks: BackgroundTasks):
    """
    Search for job opportunities with Redis caching.
    Uses original search_jobs function when cache is missing.
    """
    data = await request.json()
    query               = data.get("query", "")
    contract_type       = data.get("contract_type")
    platform            = data.get("platform")
    page                = int(data.get("page", 1))
    page_size           = int(data.get("page_size", 7))
    sort_by             = data.get("sort_by", "relevance")
    due_date_filter     = data.get("due_date_filter")
    posted_date_filter  = data.get("posted_date_filter")
    naics_code          = data.get("naics_code")
    opportunity_type    = data.get("opportunity_type")
    user_id             = data.get("user_id")
    is_new_search       = data.get("is_new_search", False)
    existing_refined    = data.get("existing_refined_query")

    # Make sure we have a query
    if not query.strip():
        empty = {"results": [], "total": 0, "page": 1, "page_size": page_size, "total_pages": 0}
        return JSONResponse(content=jsonable_encoder(empty))

    # Build cache keys based on all search parameters
    cache_params = {
        "query": query, 
        "contract_type": contract_type, 
        "platform": platform,
        "due_date_filter": due_date_filter, 
        "posted_date_filter": posted_date_filter,
        "naics_code": naics_code, 
        "opportunity_type": opportunity_type, 
        "sort_by": sort_by
    }
    
    # Create a unique hash based on all parameters
    base_key = hashlib.md5(json.dumps(cache_params, sort_keys=True).encode()).hexdigest()
    
    # Use prefix for user-specific caching
    prefix   = f"user:{user_id}:" if user_id else ""
    page_key = f"{prefix}search:{base_key}:page:{page}"
    ids_key  = f"{prefix}search:{base_key}:all_ids"
    refined_key = f"{prefix}search:{base_key}:refined_query"

    # FIX 1: Log the exact cache key for debugging
    logger.info(f"Looking for cache with key: {page_key}")

    # Try serving from cache if this is not a new search
    if redis_client.get_client() and not is_new_search:
        cached = redis_client.get_json(page_key)
        if cached:
            logger.info(f"Cache hit for key: {page_key}")
            # IMPORTANT: Sanitize the cached data before returning it
            sanitized_cached = sanitize(cached)
            return JSONResponse(content=jsonable_encoder(sanitized_cached))
        else:
            logger.info(f"Cache miss for key: {page_key}")

    # Try to get refined query from cache if it exists
    refined = None
    if redis_client.get_client() and not is_new_search and not existing_refined:
        refined = redis_client.get_json(refined_key)
        logger.info(f"Checking for cached refined query: {'Found' if refined else 'Not found'}")

    # Use provided refined query if available
    if existing_refined:
        refined = existing_refined
        
    # Refine query if needed
    if is_new_search or not refined:
        refined = refine_query(query, contract_type, platform)
        if refined and redis_client.get_client():
            # Cache the refined query
            redis_client.set_json(refined_key, refined, expiry=CACHE_TTL)
            logger.info(f"Cached new refined query for key: {refined_key}")

    if not refined:
        empty = {"results": [], "total": 0, "page": 1, "page_size": page_size, "total_pages": 0}
        return JSONResponse(content=jsonable_encoder(empty))

    # Use your original search_jobs function - this is the critical part!
    all_results = search_jobs(
        refined, contract_type, platform,
        due_date_filter, posted_date_filter,
        naics_code, opportunity_type, user_id, sort_by
    )
    
    # Handle pagination
    total       = len(all_results)
    total_pages = (total + page_size - 1) // page_size if total else 0
    if page > total_pages > 0:
        page = 1
    start, end   = (page - 1) * page_size, min(page * page_size, total)
    page_results = all_results[start:end]

    # Fix for infinite values - sanitize results before creating the response
    sanitized_results = sanitize(page_results)
    
    # Prepare response
    response = {
        "results": sanitized_results,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "refined_query": refined
    }

    # Cache the results if we have a Redis client and results
    if redis_client.get_client() and page_results:
        try:
            # FIX 2: Use consistent cache TTL strategy
            # Set shorter TTL for user-specific data (4 hours instead of 24)
            user_cache_ttl = 60 * 60 * 4  # 4 hours 
            cache_expiry = user_cache_ttl if user_id else CACHE_TTL
            
            # Response is already sanitized
            # FIX 3: Add better error handling for Redis
            try:
                result = redis_client.set_json(page_key, response, expiry=cache_expiry)
                logger.info(f"Cache set for key {page_key}: {'Success' if result else 'Failed'}")
            except Exception as redis_err:
                logger.error(f"Redis set error: {str(redis_err)}")
            
            # Also cache the IDs for potential use later
            result_ids = [str(r.get("id")) for r in page_results]
            redis_client.set_json(ids_key, result_ids, expiry=cache_expiry)
            
            # Add to recommendation queue with priority (at the front)
            task_data = {
                "user_id": user_id, 
                "refined": refined, 
                "results": page_results,
                "timestamp": datetime.now().isoformat()
            }
            
            # Add the task to the front of the queue for priority processing
            background_tasks.add_task(add_to_recommendation_queue, task_data)
            
            logger.info(f"Cached results for key: {page_key}")
        except Exception as e:
            logger.error(f"Failed to write cache: {str(e)}")

    # Return the response
    return JSONResponse(content=jsonable_encoder(response))

async def add_to_recommendation_queue(task_data):
    """Add a task to the recommendation queue with priority"""
    async with recommendation_lock:
        # Add new task to the front of the queue (higher priority)
        recommendation_queue.appendleft(task_data)
        
        # If this is the only task, start processing
        if len(recommendation_queue) == 1:
            asyncio.create_task(process_recommendation_queue())

async def process_recommendation_queue():
    """Process recommendation queue, prioritizing newest searches"""
    async with recommendation_lock:
        if not recommendation_queue:
            return
            
        # Get the most recent task (from the left of the deque)
        task = recommendation_queue.popleft()
    
    # Process this task
    user_id = task.get("user_id")
    refined = task.get("refined")
    results = task.get("results")
    
    if not user_id or not results:
        # Recursively process next item if needed
        async with recommendation_lock:
            if recommendation_queue:
                asyncio.create_task(process_recommendation_queue())
        return
        
    for opp in results:
        try:
            # Sanitize opportunity before passing to generate_recommendations
            sanitized_opp = sanitize(opp)
            
            # Skip if no ID in the opportunity
            if not sanitized_opp.get('id'):
                continue
                
            rec = await generate_recommendations(
                company_url=None,
                company_description=refined,
                opportunities=[sanitized_opp]
            )
            
            if not rec:
                continue
                
            key = f"user:{user_id}:recommendation:{sanitized_opp.get('id')}"
            
            # Sanitize recommendations before caching
            if redis_client.get_client():
                try:
                    sanitized_rec = sanitize(rec)
                    # Use shorter TTL for user-specific recommendations
                    user_cache_ttl = 60 * 60 * 4  # 4 hours
                    cache_expiry = user_cache_ttl if user_id else CACHE_TTL
                    redis_client.set_json(key, sanitized_rec, expiry=cache_expiry)
                    logger.info(f"Cached recommendation for key: {key}")
                except Exception as e:
                    logger.error(f"Failed to cache recommendation: {e}")
        except Exception as e:
            logger.error(f"Error generating recommendation: {e}")
    
    # Process the next item in the queue if there is one
    async with recommendation_lock:
        if recommendation_queue:
            # Create a new task for the next item
            asyncio.create_task(process_recommendation_queue())

@search_router.post("/get-cached-recommendations")
async def get_cached_recommendations(request: Request):
    """Get cached recommendations for opportunity IDs"""
    data    = await request.json()
    user_id = data.get("user_id")
    ids     = data.get("opportunity_ids", [])
    prefix  = f"user:{user_id}:" if user_id else ""
    recs    = []

    if not redis_client.get_client():
        return {"recommendations": [], "cached": False}

    for id_ in ids:
        c = redis_client.get_json(f"{prefix}recommendation:{id_}")
        if c:
            # Sanitize cached recommendations before returning
            sanitized_rec = sanitize(c)
            recs.append(sanitized_rec)

    return {"recommendations": recs, "cached": bool(recs)}

@search_router.post("/get-opportunities-by-ids")
async def get_opportunities_by_ids(request: Request):
    """Get opportunities by IDs, using cache when available"""
    data    = await request.json()
    ids     = data.get("ids", [])
    user_id = data.get("user_id")
    prefix  = f"user:{user_id}:" if user_id else ""
    results, missing = [], []

    for id_ in ids:
        cached = redis_client.get_json(f"{prefix}result:{id_}")
        if cached:
            # Sanitize cached results
            sanitized_cached = sanitize(cached)
            results.append(sanitized_cached)
        else:
            missing.append(id_)

    if missing:
        # Fetch missing opportunities from database
        # This would need to be implemented based on your DB structure
        pass

    # Re‑order to match requested IDs
    order = {id_: idx for idx, id_ in enumerate(ids)}
    results.sort(key=lambda x: order.get(str(x.get("id")), 999999))

    return {"results": results}

@search_router.post("/clear-cache")
async def clear_cache(request: Request):
    """Clear Redis cache for a user or all users"""
    data    = await request.json()
    user_id = data.get("user_id")

    if not redis_client.get_client():
        raise HTTPException(503, "Redis unavailable")

    if not user_id:
        redis_client.get_client().flushall()
        return {"cleared_all": True}

    pattern = f"user:{user_id}:*"
    cursor, keys = 0, []
    while True:
        cursor, ks = redis_client.get_client().scan(cursor, match=pattern, count=100)
        keys.extend(ks)
        if cursor == 0:
            break

    if keys:
        redis_client.get_client().delete(*keys)

    return {"cleared_keys": len(keys)}

@search_router.post("/clear-user-cache")
async def clear_user_cache(request: Request):
    """Clear Redis cache for a user - called during logout"""
    data = await request.json()
    user_id = data.get("user_id")
    
    if not user_id:
        raise HTTPException(400, "User ID is required")
        
    if not redis_client.get_client():
        # FIX: Don't raise an exception, just log and return
        logger.warning("Redis unavailable for cache clearing")
        return {"cleared_keys": 0, "status": "redis_unavailable"}

    # FIX: Improved key deletion with retry logic
    try:
        # Clear all user-specific cache entries
        pattern = f"user:{user_id}:*"
        cursor, keys = 0, []
        
        # Scan in multiple attempts with batches
        for attempt in range(3):  # Try up to 3 times
            try:
                all_keys = []
                cursor = 0
                
                # Get all keys matching pattern
                while True:
                    cursor, batch = redis_client.get_client().scan(cursor, match=pattern, count=100)
                    all_keys.extend(batch)
                    if cursor == 0:
                        break
                
                # Delete in reasonable batches
                deleted_count = 0
                for i in range(0, len(all_keys), 50):  # Process 50 at a time
                    batch = all_keys[i:i+50]
                    if batch:
                        redis_client.get_client().delete(*batch)
                        deleted_count += len(batch)
                
                logger.info(f"Successfully cleared {deleted_count} keys for user {user_id}")
                return {"cleared_keys": deleted_count, "status": "success"}
            
            except Exception as e:
                logger.error(f"Cache clearing attempt {attempt+1} failed: {str(e)}")
                if attempt == 2:  # Last attempt failed
                    raise
    except Exception as e:
        logger.error(f"Failed to clear user cache: {str(e)}")
        return {"cleared_keys": 0, "status": "error", "message": str(e)}

# Keep your original endpoints from the old file
@search_router.post("/ai-recommendations")
async def get_ai_recommendations(request: Request):
    """
    Generate AI recommendations based on company profile and opportunities.
    Provides detailed, context-aware recommendations.
    """
    try:
        data = await request.json()
        company_url = data.get("companyUrl", "")
        company_description = data.get("companyDescription", "")
        opportunities = data.get("opportunities", [])

        logger.info(f"Received AI recommendations request with {len(opportunities)} opportunities")
        
        if not company_description:
            raise HTTPException(status_code=400, detail="Company description is required")
        
        # Sanitize opportunities before passing to generate_recommendations
        sanitized_opportunities = sanitize(opportunities)
        
        # Call the service function to generate recommendations
        recommendations = await generate_recommendations(
            company_url=company_url,
            company_description=company_description,
            opportunities=sanitized_opportunities
        )
        
        # Check if recommendations has the expected structure
        if not isinstance(recommendations, dict) or 'recommendations' not in recommendations:
            logger.warning("Recommendations returned unexpected structure")
            recommendations = {"recommendations": []}
        
        # Get the recommendations array from the result
        recommendation_list = recommendations.get('recommendations', [])
        
        # Enhance recommendations with detailed context
        enhanced_recommendations = []
        for rec in recommendation_list:
            enhanced_rec = rec.copy()
            
            # If an opportunity is associated, add more context
            if 'opportunityIndex' in rec and 0 <= rec['opportunityIndex'] < len(opportunities):
                opp = opportunities[rec['opportunityIndex']]
                enhanced_rec['opportunityDetails'] = {
                    'title': opp.get('title', 'N/A'),
                    'agency': opp.get('agency', 'N/A'),
                    'naicsCode': opp.get('naicsCode', 'N/A'),
                    'description': opp.get('description', 'N/A')
                }
            
            enhanced_recommendations.append(enhanced_rec)
        
        # Sanitize recommendations before returning
        sanitized_recommendations = sanitize(enhanced_recommendations)
        return {"recommendations": sanitized_recommendations}
            
    except Exception as e:
        logger.error(f"Error in AI recommendations endpoint: {str(e)}")
        return {"recommendations": [
            {
                "id": "error-rec-1",
                "title": "Recommendation Generation Error",
                "description": "We encountered an issue generating personalized recommendations. Our team is working to resolve this.",
                "matchScore": 50,
                "fallbackReason": str(e)
            }
        ]}

# Keep the rest of your original endpoints (generate-rfp, ask-ai, etc.)

@search_router.post("/generate-rfp/{contract_id}")
async def generate_rfp(contract_id: str, request: Request):
    """
    Generate RFP (Request for Proposal) for a specific contract
    with enhanced error handling and flexible path resolution
    """
    print("Generating RFP")
    try:
        # Create output directory with robust path handling
        output_dir = os.path.join(os.path.dirname(__file__), "..", "services", "generated_rfps")
        os.makedirs(output_dir, exist_ok=True)
        
        # Define paths with comprehensive error handling
        output_path = os.path.join(output_dir, f"{contract_id}_rfp.pdf")
        
        # Advanced logo path resolution
        logo_paths = [
            os.path.join(os.path.dirname(__file__), "..", "static", "logo.jpg"),
            os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "logo.jpg"),
            os.path.join(os.path.dirname(__file__), "..", "public", "logo.jpg"),
            "/app/frontend/public/logo.jpg"
        ]
        
        logo_path = next((path for path in logo_paths if os.path.exists(path)), None)
        
        if not logo_path:
            print("Warning: No logo found. Proceeding without logo.")
        
        # Robust data parsing
        data = await request.json()
        
        # Flexible date parsing
        due_date_str = data.get('dueDate', '2025-01-01')
        try:
            due_date = datetime.strptime(due_date_str.split('T')[0], '%Y-%m-%d')
        except (ValueError, IndexError):
            print(f"Invalid date format: {due_date_str}. Using default.")
            due_date = datetime.now()
        
        # Safe value parsing
        try:
            value = int(data.get('value', 0))
        except (ValueError, TypeError):
            value = 0
        
        # Generate PDF with robust error handling
        pdf_path = generate_rfp_pdf(
            contract_id=contract_id,
            title=data.get('title', 'Default Title'),
            agency=data.get('agency', 'Default Agency'),
            platform=data.get('platform', 'Default Platform'),
            value=value,
            due_date=due_date,
            status=data.get('status', 'Open'),
            naics_code=data.get('naicsCode', '000000'),
            output_path=output_path,
            logo_path=logo_path
        )
        
        return {
            "message": "RFP generated successfully", 
            "file": pdf_path,
            "details": {
                "contract_id": contract_id,
                "title": data.get('title', 'Default Title'),
                "generated_at": datetime.now().isoformat()
            }
        }

    except Exception as e:
        print(f"Comprehensive error in generate_rfp: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "RFP Generation Failed",
                "message": str(e),
                "trace": traceback.format_exc()
            }
        )

@search_router.post("/ask-ai")
async def ask_ai(request: Request):
    """
    AI-powered conversation assistant for RFP-related queries
    """
    try:
        data = await request.json()
        messages = data.get("messages", [])
        document_content = data.get("documentContent")

        # Create the document context separately
        document_context = f'Here is the current RFP document content for context:\\n\\n{document_content}' if document_content else ''
        
        # Then use it in the main string
        system_prompt = f"""You are an AI assistant helping with RFP (Request for Proposal) related queries. 
{document_context}

Please provide clear, concise, and professional responses focused on helping users understand and work with RFP documents."""

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                *messages
            ],
            temperature=0.7,
            max_tokens=500
        )

        return {
            "response": response.choices[0].message.content,
            "tokens_used": response.usage.total_tokens if response.usage else None
        }

    except Exception as e:
        print(f"Error in ask-ai endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@search_router.post("/process-document")
async def process_document(request: Request):
    """
    Process and validate document content
    """
    try:
        data = await request.json()
        html_content = data.get("content", "")
        
        if not html_content:
            raise HTTPException(status_code=400, detail="Document content is required")
        
        # Use OpenAI to process document with enhanced validation
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system", 
                    "content": """You are an AI document validator. 
                    Regenerate HTML document content exactly as provided. 
                    Do not modify structure, content, or formatting. 
                    Ensure document integrity."""
                },
                {"role": "user", "content": f"Validate and regenerate this HTML document:\n\n{html_content}"}
            ],
            temperature=0.0,  # Maximum determinism
            max_tokens=4000
        )
        
        processed_content = response.choices[0].message.content
        
        # Strip any potential markdown code blocks
        if processed_content.startswith("```html"):
            processed_content = processed_content.replace("```html", "", 1)
        if processed_content.endswith("```"):
            processed_content = processed_content[:-3]
        
        return {
            "processedContent": processed_content.strip(),
            "contentLength": len(processed_content),
            "validationTimestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"Comprehensive document processing error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Document Processing Failed",
                "message": str(e)
            }
        )

@search_router.post("/generate-company-markdown")
async def generate_company_markdown_endpoint(request: Request):
    """
    Endpoint to trigger markdown generation for a given company URL.
    Returns the generated markdown as text.
    """
    try:
        data = await request.json()
        company_url = data.get("companyUrl", "")

        if not company_url:
            raise HTTPException(status_code=400, detail="Missing 'companyUrl' in request body")

        logger.info(f"Generating markdown for company: {company_url}")
        
        markdown = await generate_company_markdown(company_url)

        return {"markdown": markdown}

    except Exception as e:
        logger.error(f"Error generating markdown: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))