import os
import json
import hashlib
from utils.logger import get_logger
import math

from datetime import datetime, date
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Query, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, StreamingResponse

from services.open_ai_refiner import refine_query
from services.job_search import search_jobs, sort_job_results
from services.pdf_service import generate_rfp_pdf
from services.recommendations import generate_recommendations
from services.company_scraper import generate_company_markdown
from services.helper import json_serializable
from utils.openai_client import get_openai_client
from services.summary_service import process_opportunity_descriptions, fetch_description_from_sam
from utils.redis_connection import RedisClient
from utils.database import fetch_opportunities_from_db
from collections import deque
from services.filter_service import apply_filters_to_results, sort_results
import asyncio
from typing import List
# from utils.doc_generation import generate_merge_and_convert_report

# Configure logging
logger = get_logger(__name__)

# Initialize router, OpenAI client, and Redis
search_router = APIRouter()
redis_client = RedisClient()
CACHE_TTL = 60 * 60 * 24  # 24 hours cache time (1 day)
MAX_RECOMMENDATIONS = 2  # Limit to 2 recommendations per query

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

def get_cache_keys(query, user_id=None, include_filters=False, **filters):
    """
    Generate cache keys for a given query, with or without filters
    """
    # Basic cache key based just on the query
    query_key = query.lower().strip()
    basic_hash = hashlib.md5(query_key.encode()).hexdigest()
    
    # Use prefix for user-specific caching
    prefix = f"user:{user_id}:" if user_id else ""
    
    # Basic key (no filters)
    basic_key = f"{prefix}search:{basic_hash}"
    
    # If we don't need filter-specific keys, return the basic ones
    if not include_filters:
        return {
            "basic_key": basic_key,
            "all_results_key": f"{basic_key}:all_results",
            "refined_query_key": f"{basic_key}:refined_query"
        }
    
    # Create filter-specific keys if requested
    filter_params = {k: v for k, v in filters.items() if v is not None}
    filter_hash = hashlib.md5(json.dumps(filter_params, sort_keys=True).encode()).hexdigest()
    filter_key = f"{basic_key}:{filter_hash}"
    
    return {
        "basic_key": basic_key,
        "filter_key": filter_key,
        "all_results_key": f"{filter_key}:all_results",
        "refined_query_key": f"{filter_key}:refined_query"
    }

def get_or_generate_refined_query(query, contract_type, platform, user_id):
    """
    Utility to get the refined query from cache or generate and cache it if not present.
    """
    cache_key = f"search:{user_id}:{query.lower()}"
    redis_client = RedisClient()
    refined_query = ""
    if redis_client.exists(cache_key):
        cached_data = redis_client.get_json(cache_key)
        if cached_data:
            refined_query = cached_data.get('refined_query', "")
    if refined_query == "":
        refined_query = refine_query(query, contract_type, platform)
        redis_client.set_json(cache_key, {"refined_query": refined_query}, expiry=86400)
    return refined_query

@search_router.post("/process-documents")
async def process_documents(request: Request):
    """
    Process uploaded documents to extract text content for use as context
    in AI conversations.
    """
    try:
        logger.info("process-documents endpoint called")
        
        # Parse request data
        data = await request.json()
        logger.info(f"Request data parsed successfully, contains {len(data.get('files', []))} files")
        
        # Extract parameters from the request
        pursuit_id = data.get("pursuitId")
        notice_id = data.get("noticeId") 
        pursuit_context = data.get("pursuitContext", {})
        user_id = data.get("userId")
        files = data.get("files", [])
        
        if not files:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "No files provided"
                }
            )
        
        # Import the document processing service
        from services.doc_processing import process_multiple_files, get_file_icon
        logger.info("Successfully imported document processing service")
        
        # Process files using the service
        processed_files = process_multiple_files(files)
        
        if not processed_files:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Could not process any of the uploaded files"
                }
            )
        
        # Add icon information to each file
        for file in processed_files:
            file_ext = file.get("file_extension", "")
            file["icon"] = get_file_icon(file_ext)
        
        # Store processed files in Redis for later use
        redis_client = RedisClient()
        context_key = f"user:{user_id}:doc_context"
        redis_client.set_json(context_key, processed_files, expiry=86400)
        logger.info(f"Stored document context in Redis with key {context_key}")
        
        # Also store the file metadata (without the text content) for UI display
        ui_file_info = [{
            "file_name": file.get("file_name"),
            "file_type": file.get("file_type"),
            "file_extension": file.get("file_extension"),
            "icon": file.get("icon")
        } for file in processed_files]
        
        # Return the response with the actual extracted text
        return {
            "status": "success",
            "message": f"Successfully processed {len(processed_files)} document(s). I'll use them as context when answering your questions.",
            "file_count": len(processed_files),
            "files": processed_files,  # <-- now includes file_name, text, file_type, etc.
            "pursuit_id": pursuit_id,
            "notice_id": notice_id
        }
        
    except Exception as e:
        logger.error(f"Unhandled error in process-documents endpoint: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Error processing documents: {str(e)}",
            }
        )

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
async def search_job_opportunities(request: Request):
    """
    Search for job opportunities with Redis caching and real-time progress tracking.
    Uses original search_jobs function when cache is missing.
    """
    try:
        data = await request.json()
        query = data.get('query', '')
        user_id = data.get('user_id', 'anonymous')
        page = int(data.get('page', 1))
        page_size = int(data.get('page_size', 7))
        is_new_search = data.get('is_new_search', True)
        contract_type = data.get('contract_type')
        platform = data.get('platform')
        refined_query_param = data.get('refined_query')  # <-- Accept refined_query from frontend
        
        # Generate a unique search ID
        search_id = f"{user_id}_{int(datetime.now().timestamp())}"
        
        # Initialize progress tracking
        progress = {
            'stage': 'initializing',
            'message': 'Starting search process...',
            'percentage': 0,
            'search_id': search_id
        }
        
        # Initialize Redis client
        redis_client = RedisClient()
        
        # Store initial progress
        redis_client.set_json(f"search_progress:{search_id}", progress, expiry=300)  # 5 minutes expiry
        
        # Check if we should use cached results
        if not is_new_search:
            progress['stage'] = 'checking_cache'
            progress['message'] = 'Checking for cached results...'
            progress['percentage'] = 10
            redis_client.set_json(f"search_progress:{search_id}", progress)
            
            cache_key = f"search:{user_id}:{query.lower()}"
            if redis_client.exists(cache_key):
                cached_data = redis_client.get_json(cache_key)
                if cached_data:
                    progress['stage'] = 'using_cache'
                    progress['message'] = 'Using cached results...'
                    progress['percentage'] = 70
                    redis_client.set_json(f"search_progress:{search_id}", progress)
                    
                    # Extract just the paginated portion for this response
                    all_results = cached_data.get('results', [])   

                    # --- Inject improved title from Redis if available ---
                    for opp in all_results:
                        if 'id' in opp:
                            title_key = f"title:{opp['id']}"
                            cached_title = redis_client.get_json(title_key)
                            if cached_title:
                                opp['title'] = cached_title
                    # --- End inject ---
                    
                    progress['stage'] = 'sort'
                    progress['message'] = 'Sorting Results'
                    progress['percentage'] = 80
                    redis_client.set_json(f"search_progress:{search_id}", progress)                 
                    
                    all_results = sort_job_results(all_results, sort_by=data.get('sort_by', 'relevance'))
                    
                    json_safe_results = json_serializable(all_results)
                    
                    total_count = len(all_results)
                    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
                    
                    start_idx = (page - 1) * page_size
                    end_idx = min(start_idx + page_size, total_count)
                    paginated_results = all_results[start_idx:end_idx] if start_idx < total_count else []
                    
                    progress['stage'] = 'complete'
                    progress['message'] = 'Search complete'
                    progress['percentage'] = 100
                    redis_client.set_json(f"search_progress:{search_id}", progress)
                    
                    return {
                        'success': True,
                        'results': paginated_results,
                        'all_results': json_safe_results,
                        'total': total_count,
                        'total_pages': total_pages,
                        'page': page,
                        'refined_query': cached_data.get('refined_query', ''),
                        'progress': progress,
                        'search_id': search_id
                    }
        
        # This is a new search - perform query expansion/refinement
        refined_query = ""
        if is_new_search:
            progress['stage'] = 'refining_query'
            progress['message'] = 'Refining search query...'
            progress['percentage'] = 20
            redis_client.set_json(f"search_progress:{search_id}", progress)
            
            try:
                if refined_query_param:
                    # Use refined_query provided by frontend
                    refined_query = refined_query_param
                else:
                    refined_query = get_or_generate_refined_query(query, contract_type, platform, user_id)
                logger.info(f"Query expansion: '{query}' -> '{refined_query}'")
            except Exception as e:
                logger.error(f"Error refining query: {str(e)}")
                refined_query = query
        
        search_query = refined_query if refined_query else query
        
        progress['stage'] = 'searching'
        progress['message'] = 'Searching for opportunities...'
        progress['percentage'] = 40
        redis_client.set_json(f"search_progress:{search_id}", progress)
        
        search_results = search_jobs(
            query=search_query,
            contract_type=data.get('contract_type'),
            platform=data.get('platform'),
            due_date_filter=data.get('due_date_filter'),
            posted_date_filter=data.get('posted_date_filter'),
            naics_code=data.get('naics_code'),
            opportunity_type=data.get('opportunity_type'),
            user_id=user_id,
            sort_by=data.get('sort_by', 'relevance')
        )
        
        progress['stage'] = 'processing_results'
        progress['message'] = 'Processing search results...'
        progress['percentage'] = 60
        redis_client.set_json(f"search_progress:{search_id}", progress)
        
        if isinstance(search_results, list):
            all_results = search_results
        else:
            all_results = search_results.get('results', [])
            
        progress['stage'] = 'sort'
        progress['message'] = 'Sorting Results'
        progress['percentage'] = 80
        redis_client.set_json(f"search_progress:{search_id}", progress)
            
        all_results = sort_job_results(all_results, sort_by=data.get('sort_by', 'relevance'))
        
        json_safe_results = json_serializable(all_results)
        
        progress['stage'] = 'caching'
        progress['message'] = 'Caching results for future use...'
        progress['percentage'] = 90
        redis_client.set_json(f"search_progress:{search_id}", progress)
        
        if json_safe_results:
            cache_key = f"search:{user_id}:{query.lower()}"
            cache_data = {
                'results': json_safe_results,
                'refined_query': refined_query,
                'timestamp': datetime.now().isoformat(),
                'query': query
            }
            redis_client.set_json(cache_key, cache_data, expiry=86400)
        
        total_count = len(json_safe_results)
        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
        
        start_idx = (page - 1) * page_size
        end_idx = min(start_idx + page_size, total_count)
        paginated_results = json_safe_results[start_idx:end_idx] if start_idx < total_count else []
        
        progress['stage'] = 'complete'
        progress['message'] = 'Search complete'
        progress['percentage'] = 100
        redis_client.set_json(f"search_progress:{search_id}", progress)
        
        return {
            'success': True,
            'results': paginated_results,
            'all_results': json_safe_results,
            'total': total_count,
            'total_pages': total_pages,
            'page': page,
            'refined_query': refined_query,
            'progress': progress,
            'search_id': search_id
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_progress = {
            'stage': 'error',
            'message': f'Error occurred: {str(e)}',
            'percentage': 0,
            'search_id': search_id
        }
        redis_client.set_json(f"search_progress:{search_id}", error_progress)
        
        return {
            'success': False,
            'message': f"Error: {str(e)}",
            'results': [],
            'all_results': [],
            'total': 0,
            'total_pages': 0,
            'page': 1,
            'progress': error_progress,
            'search_id': search_id
        }

@search_router.post("/generate-recommendations")
async def generate_search_recommendations(request: Request):
    """
    Generate recommendations for a specific search query and opportunity.
    Limited to 2 recommendations per search query.
    """
    try:
        data = await request.json()
        user_id = data.get("user_id")
        query = data.get("query")
        refined_query = data.get("refined_query")
        opportunity_id = data.get("opportunity_id")
        opportunity = data.get("opportunity")
        
        if not user_id or not opportunity:
            return {"error": "Missing required parameters"}
        
        # Create cache keys
        cache_keys = get_cache_keys(query, user_id)
        
        # Check if we already have recommendations for this search
        recs_key = f"{cache_keys['basic_key']}:recommendations"
        existing_recs = redis_client.get_json(recs_key) or []
        
        # If we already have max recommendations, just return them
        if len(existing_recs) >= MAX_RECOMMENDATIONS:
            return {"recommendations": existing_recs, "max_reached": True}
        
        # If this specific opportunity already has a recommendation, return existing recs
        if any(rec.get("opportunity_id") == opportunity_id for rec in existing_recs):
            return {"recommendations": existing_recs, "already_exists": True}
        
        # We need to generate a new recommendation
        try:
            # Sanitize opportunity before passing to generate_recommendations
            sanitized_opp = sanitize(opportunity)
            
            # Generate recommendation
            rec_result = await generate_recommendations(
                company_url=None,
                company_description=refined_query or query,
                opportunities=[sanitized_opp]
            )
            
            if not rec_result or not isinstance(rec_result, dict) or "recommendations" not in rec_result:
                return {"error": "Failed to generate recommendation", "recommendations": existing_recs}
            
            rec_list = rec_result.get("recommendations", [])
            if not rec_list:
                return {"error": "No recommendations generated", "recommendations": existing_recs}
            
            # Take the first recommendation and add the opportunity ID
            new_rec = rec_list[0]
            new_rec["opportunity_id"] = opportunity_id
            
            # Add to existing recommendations (up to max)
            updated_recs = existing_recs + [new_rec]
            if len(updated_recs) > MAX_RECOMMENDATIONS:
                updated_recs = updated_recs[:MAX_RECOMMENDATIONS]
            
            # Cache the updated recommendations
            sanitized_recs = sanitize(updated_recs)
            if redis_client.get_client():
                redis_client.set_json(recs_key, sanitized_recs, expiry=CACHE_TTL)
            
            return {"recommendations": sanitized_recs, "success": True}
        
        except Exception as e:
            logger.error(f"Error generating recommendation: {str(e)}")
            return {"error": str(e), "recommendations": existing_recs}

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {"error": str(e)}

@search_router.post("/get-cached-recommendations")
async def get_cached_recommendations(request: Request):
    """Get cached recommendations for a search query"""
    try:
        data = await request.json()
        user_id = data.get("user_id")
        query = data.get("query")
        opportunity_ids = data.get("opportunity_ids", [])
        
        if not user_id:
            return {"recommendations": [], "cached": False}
        
        # Try to get recommendations by query first
        if query:
            cache_keys = get_cache_keys(query, user_id)
            recs_key = f"{cache_keys['basic_key']}:recommendations"
            
            cached_recs = redis_client.get_json(recs_key)
            if cached_recs:
                sanitized_recs = sanitize(cached_recs)
                return {"recommendations": sanitized_recs, "cached": True}
        
        # Fallback to opportunity_ids if available
        if opportunity_ids and redis_client.get_client():
            recs = []
            prefix = f"user:{user_id}:"
            
            for id_ in opportunity_ids:
                rec_key = f"{prefix}recommendation:{id_}"
                cached_rec = redis_client.get_json(rec_key)
                if cached_rec:
                    sanitized_rec = sanitize(cached_rec)
                    recs.append(sanitized_rec)
                    
                    # Only take the first 2 recommendations
                    if len(recs) >= MAX_RECOMMENDATIONS:
                        break
            
            return {"recommendations": recs, "cached": bool(recs)}
        
        return {"recommendations": [], "cached": False}

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {"error": str(e)}

@search_router.post("/get-opportunities-by-ids")
async def get_opportunities_by_ids(request: Request):
    """Get opportunities by IDs, using cache when available"""
    try:
        data = await request.json()
        ids = data.get("ids", [])
        user_id = data.get("user_id")
        prefix = f"user:{user_id}:" if user_id else ""
        results, missing = [], []
        
        # First try to get all opportunities from the all_results cache
        if user_id and redis_client.get_client():
            # Try all active searches for this user
            keys = []
            cursor = 0
            pattern = f"{prefix}search:*:all_results"
            
            try:
                while True:
                    cursor, partial_keys = redis_client.get_client().scan(cursor, match=pattern, count=100)
                    keys.extend(partial_keys)
                    if cursor == 0:
                        break
                        
                # Check all cached search results for the requested IDs
                for key in keys:
                    cached_results = redis_client.get_json(key) or []
                    
                    # Find matching opportunities
                    for cached_opp in cached_results:
                        if str(cached_opp.get("id")) in ids and str(cached_opp.get("id")) not in [str(r.get("id")) for r in results]:
                            sanitized_opp = sanitize(cached_opp)
                            results.append(sanitized_opp)
                            
                    # Break if we found all IDs
                    if len(results) == len(ids):
                        break
            except Exception as e:
                logger.error(f"Error scanning Redis keys: {e}")
        
        # For IDs not found in cache, mark them as missing
        found_ids = [str(r.get("id")) for r in results]
        missing = [id_ for id_ in ids if id_ not in found_ids]
        
        # If we have missing IDs, we would need to fetch them from the database
        # This implementation would depend on your database structure
        if missing:
            pass  # Implement database lookup for missing IDs
        
        # Re-order to match requested IDs
        order = {id_: idx for idx, id_ in enumerate(ids)}
        results.sort(key=lambda x: order.get(str(x.get("id")), 999999))
        
        return {"results": results}

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {"error": str(e)}

@search_router.post("/clear-cache")
async def clear_cache(request: Request):
    """Clear Redis cache for a user or all users"""
    try:
        data = await request.json()
        
        if not redis_client.get_client():
            raise HTTPException(503, "Redis unavailable")

        # Just flush all Redis keys
        redis_client.get_client().flushall()
        return {"cleared_all": True}

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(500, "Internal Server Error")

@search_router.post("/check-recommendations")
async def check_recommendations(request: Request):
    """Check if recommendations exist for a query or opportunity IDs without fetching them"""
    try:
        data = await request.json()
        search_query = data.get("searchQuery", "")
        user_id = data.get("user_id")
        opportunity_ids = data.get("opportunity_ids", [])
        check_only = data.get("checkOnly", True)
        
        # Check by search query first
        if search_query:
            # Create cache key
            rec_cache_key = f"rec:{hashlib.md5(search_query.encode()).hexdigest()}"
            if user_id:
                rec_cache_key = f"user:{user_id}:{rec_cache_key}"
            
            # Check if recommendations exist
            if redis_client.get_client():
                exists = redis_client.exists(rec_cache_key)
                
                # If they exist and we want the data
                if exists and not check_only:
                    cached_recs = redis_client.get_json(rec_cache_key)
                    return {"exists": True, "recommendations": cached_recs}
                
                # Just return existence check
                if exists:
                    return {"exists": True}
        
        # If no hit by search query, try opportunity IDs
        if opportunity_ids and user_id:
            # Check for any opportunity-specific recommendations
            for opp_id in opportunity_ids:
                opp_rec_key = f"user:{user_id}:opp_rec:{opp_id}"
                
                if redis_client.get_client() and redis_client.exists(opp_rec_key):
                    if check_only:
                        return {"exists": True}
                    else:
                        cached_recs = redis_client.get_json(opp_rec_key)
                        return {"exists": True, "recommendations": cached_recs}
        
        return {"exists": False}

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {"error": str(e)}

@search_router.post("/ai-recommendations")
async def get_ai_recommendations(request: Request):
    """
    Generate AI recommendations based on company profile and opportunities.
    Uses Redis caching based on search query.
    """
    try:
        data = await request.json()
        company_url = data.get("companyUrl", "")
        company_description = data.get("companyDescription", "")
        opportunities = data.get("opportunities", [])[:2]
        search_query = data.get("searchQuery", "")
        user_id = data.get("userId")

        logger.info(f"Received AI recommendations request with {len(opportunities)} opportunities")
        if not company_description:
            raise HTTPException(status_code=400, detail="Company description is required")

        # Check Redis cache for recommendations if we have a search query
        if search_query and redis_client.get_client():
            rec_cache_key = f"rec:{hashlib.md5(search_query.encode()).hexdigest()}"
            if user_id:
                rec_cache_key = f"user:{user_id}:{rec_cache_key}"
            
            cached_recs = redis_client.get_json(rec_cache_key)
            if cached_recs:
                logger.info(f"Returning cached recommendations for query: {search_query}")
                return {
                    "recommendations": cached_recs,
                    "fromCache": True,
                    "searchQuery": search_query
                }

        # Sanitize input
        sanitized_opportunities = sanitize(opportunities)

        # 1) Start recommendation generation as a task
        ai_task = asyncio.create_task(
            generate_recommendations(
                company_url=company_url,
                company_description=company_description,
                opportunities=sanitized_opportunities
            )
        )

        # 2) Poll for client disconnect and cancel if it occurs
        while not ai_task.done():
            if await request.is_disconnected():
                logger.info("Client disconnected, cancelling AI task")
                ai_task.cancel()
                break
            await asyncio.sleep(0.1)

        # 3) Await the task or handle cancellation
        try:
            recommendations = await ai_task
        except asyncio.CancelledError:
            # Client aborted -- return an HTTP 499
            return JSONResponse(status_code=499, content={"detail": "Client disconnected. Recommendation cancelled."})
        except Exception as e:
            logger.error(f"Error generating AI recommendations: {e}")
            recommendations = {"recommendations": []}

        # 4) Validate and enhance output
        if not isinstance(recommendations, dict) or 'recommendations' not in recommendations:
            logger.warning("Recommendations returned unexpected structure")
            recommendations = {"recommendations": []}

        rec_list = recommendations.get('recommendations', [])
        
        # Store in Redis cache for future use
        if search_query and redis_client.get_client() and rec_list:
            # Cache by search query
            rec_cache_key = f"rec:{hashlib.md5(search_query.encode()).hexdigest()}"
            if user_id:
                rec_cache_key = f"user:{user_id}:{rec_cache_key}"
            
            # Cache for 24 hours
            redis_client.set_json(rec_cache_key, rec_list, expiry=86400)
            
            # Also cache by opportunity IDs for faster lookups
            for rec in rec_list:
                if 'opportunityIndex' in rec and rec['opportunityIndex'] < len(opportunities):
                    opp = opportunities[rec['opportunityIndex']]
                    if 'id' in opp:
                        opp_rec_key = f"user:{user_id}:opp_rec:{opp['id']}"
                        redis_client.set_json(opp_rec_key, rec, expiry=86400)
        
        enhanced_recs = []
        for rec in rec_list:
            enhanced = rec.copy()
            idx = rec.get('opportunityIndex', 0)
            if 0 <= idx < len(opportunities):
                opp = opportunities[idx]
                enhanced['opportunityDetails'] = {
                    'title': opp.get('title', 'N/A'),
                    'agency': opp.get('agency', 'N/A'),
                    'naicsCode': opp.get('naicsCode', 'N/A'),
                    'description': opp.get('description', 'N/A')
                }
            enhanced_recs.append(enhanced)

        sanitized_recs = sanitize(enhanced_recs)
        return {
            "recommendations": sanitized_recs,
            "fromCache": False,
            "searchQuery": search_query
        }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {"error": str(e)}

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

        client = get_openai_client()
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
        client = get_openai_client()
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


# Filtering Cached results

@search_router.post("/filter-cached-results")
async def filter_cached_results(request: Request):
    try:
        data = await request.json()
        search_query = data.get('query', '')
        user_id = data.get('user_id', 'anonymous')
        filters = {
            'due_date_filter': data.get('due_date_filter'),
            'posted_date_filter': data.get('posted_date_filter'),
            'naics_code': data.get('naics_code'),
            'opportunity_type': data.get('opportunity_type')
        }
        sort_by = data.get('sort_by', 'relevance')
        page = int(data.get('page', 1))
        page_size = int(data.get('page_size', 7))
        
        # Get the cache key based on search query and user
        cache_key = f"search:{user_id}:{search_query.lower()}"
        
        # Initialize Redis client
        redis_client = RedisClient()
        
        # Get cached results from Redis
        cached_data = redis_client.get_json(cache_key)
        
        if not cached_data:
            return JSONResponse({
                'success': False,
                'message': 'No cached results found for this query. Please perform a new search.'
            }, status_code=404)
        
        try:
            # Extract the results from cached data
            all_results = cached_data.get('results', [])
            refined_query = cached_data.get('refined_query', '')

            # --- Inject improved title from Redis if available ---
            for i, opp in enumerate(all_results):
                if 'id' in opp:
                    title_key = f"title:{opp['id']}"
                    cached_title = redis_client.get_json(title_key)
                    if cached_title:
                        opp['title'] = cached_title
                        # Also update in cached_data['results'] to ensure consistency
                        cached_data['results'][i]['title'] = cached_title
            # --- End inject ---
            
            # Apply filters to the cached results - using the imported functions
            filtered_results = apply_filters_to_results(all_results, filters)
            
            # Apply sorting - using the imported functions
            sorted_results = sort_results(filtered_results, sort_by)
            
            # Make results JSON serializable (handle inf values)
            sorted_results = json_serializable(sorted_results)
        
            # Calculate pagination
            total_count = len(sorted_results)
            total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
            
            # Get the current page of results
            start_idx = (page - 1) * page_size
            end_idx = min(start_idx + page_size, total_count)
            paginated_results = sorted_results[start_idx:end_idx] if start_idx < total_count else []
            
            return {
                'success': True,
                'results': paginated_results,
                'total': total_count,
                'total_pages': total_pages,
                'page': page,
                'refined_query': refined_query
            }
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JSONResponse({
                'success': False,
                'message': f'Error processing cached results: {str(e)}'
            }, status_code=500)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({
            'success': False,
            'message': f'General error: {str(e)}'
        }, status_code=500)

@search_router.post("/ask-bizradar-ai")
async def ask_bizradar_ai(request: Request):
    """
    Backend endpoint to process BizRadar AI requests with pursuit context
    and answer user queries using multiple context sources.
    """
    try:
        # Log that the endpoint was called
        logger.info("ask-bizradar-ai endpoint called")
        
        # Parse request data with error handling
        try:
            data = await request.json()
            logger.info(f"Request data parsed successfully")
        except Exception as e:
            logger.error(f"Error parsing request data: {str(e)}")
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Invalid request format",
                    "ai_response": "I'm sorry, there was an issue processing your request. Please try again."
                }
            )
        
        # Extract parameters from the request
        pursuit_id = data.get("pursuitId")
        notice_id = data.get("noticeId") 
        pursuit_context = data.get("pursuitContext", {})
        user_id = data.get("userId")  # May be passed from the frontend
        user_query = data.get("userQuery")  # The user's question to the AI
        documents = data.get("documents", [])  # New: Extract documents from request
        
        # Log the received data for debugging
        logger.info(f"Ask BizRadar AI request received:")
        logger.info(f"- Pursuit ID: {pursuit_id}")
        logger.info(f"- Notice ID: {notice_id}")
        logger.info(f"- User ID: {user_id}")
        logger.info(f"- User Query: {user_query}")
        
        # Validate required parameters
        if not pursuit_id or not pursuit_context:
            logger.warning("Missing required parameters: pursuit_id or pursuit_context")
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Missing required parameters",
                    "ai_response": "I'm sorry, but I'm missing some essential information to process your request."
                }
            )
        
        # Import the askBizradar script with error handling
        try:
            from services.askBizradar import process_bizradar_request
            logger.info("Successfully imported process_bizradar_request function")
        except ImportError as e:
            logger.error(f"Error importing askBizradar module: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": "Server configuration error",
                    "ai_response": "I'm sorry, but I'm currently unavailable due to a server configuration issue. Please try again later."
                }
            )
        
        # Process the request using the enhanced script
        try:
            result = await process_bizradar_request(
                pursuit_id=pursuit_id,
                notice_id=notice_id,
                pursuit_context=pursuit_context,
                user_id=user_id,
                user_query=user_query,
                document_context=documents   # New: Pass documents to processing function
            )
            logger.info("Successfully processed BizRadar AI request")
            
            # Ensure there's always an ai_response in the result
            if "ai_response" not in result:
                result["ai_response"] = "I'm BizradarAI, your procurement assistant. How can I help you with this opportunity?"
            
            # Return the response from the processing function
            return result
            
        except Exception as e:
            logger.error(f"Error in process_bizradar_request: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Error processing request: {str(e)}",
                    "ai_response": "I'm sorry, I encountered an error while processing your request. Please try again later."
                }
            )

    except Exception as e:
        logger.error(f"Unhandled error in ask-bizradar-ai endpoint: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Server error: {str(e)}",
                "ai_response": "I'm sorry, but an unexpected error occurred. Please try again later."
            }
        )

from services.summary_service import process_opportunity_descriptions

@search_router.post("/summarize-descriptions")
async def summarize_descriptions(request: Request):
    """
    Endpoint that takes a list of opportunities and generates summaries for their descriptions.
    Also caches summaries in Redis for future use.
    """
    try:
        data = await request.json()
        opportunities = data.get("opportunities", [])
        
        if not opportunities:
            return {
                "success": False,
                "message": "No opportunities provided",
                "opportunities": []
            }
            
        # First, check Redis for already cached summaries
        if redis_client.get_client():
            for opp in opportunities:
                if "id" in opp:
                    summary_key = f"summary:{opp['id']}"
                    cached_summary = redis_client.get_json(summary_key)
                    
                    if cached_summary:
                        logger.info(f"Using cached summary for opportunity {opp['id']}")
                        opp["summary"] = cached_summary
                    # Also check for cached title
                    title_key = f"title:{opp['id']}"
                    cached_title = redis_client.get_json(title_key)
                    if cached_title:
                        logger.info(f"Using cached title for opportunity {opp['id']}")
                        opp["title"] = cached_title
        
        # Process only opportunities without cached summaries
        opportunities_to_process = [opp for opp in opportunities if "summary" not in opp]
        
        if opportunities_to_process:
            logger.info(f"Generating summaries for {len(opportunities_to_process)} opportunities")
            processed_opps = await process_opportunity_descriptions(opportunities_to_process)
            # Cache the new summaries and update the main opportunities list
            if redis_client.get_client():
                for processed_opp in processed_opps:
                    for opp in opportunities:
                        if opp.get("id") == processed_opp.get("id"):
                            if "summary" in processed_opp:
                                opp["summary"] = processed_opp["summary"]
                            if "title" in processed_opp:
                                opp["title"] = processed_opp["title"]
                    if "id" in processed_opp and "summary" in processed_opp:
                        summary_key = f"summary:{processed_opp['id']}"
                        redis_client.set_json(summary_key, processed_opp["summary"], expiry=86400) # 24 hours
                    if "id" in processed_opp and "title" in processed_opp:
                        title_key = f"title:{processed_opp['id']}"
                        redis_client.set_json(title_key, processed_opp["title"], expiry=86400) # 24 hours
        
        # Return the complete list of opportunities with summaries
        return {
            "success": True,
            "opportunities": opportunities
        }
        
    except Exception as e:
        logger.error(f"Error summarizing descriptions: {str(e)}")
        return {"success": False, "error": str(e), "opportunities": opportunities}

@search_router.get("/opportunities")
async def get_opportunities(page: int = Query(1), limit: int = Query(10)):
    # Fetch opportunities from the database or service
    opportunities = await fetch_opportunities_from_db()
    
    # Implement pagination logic
    start = (page - 1) * limit
    end = start + limit
    return {
        "results": opportunities[start:end],
        "total": len(opportunities),
        "total_pages": (len(opportunities) + limit - 1) // limit,  # Calculate total pages
    }

# Add this new endpoint for SSE progress updates
@search_router.get("/search-progress-stream/{search_id}")
async def search_progress(search_id: str):
    """
    Server-Sent Events endpoint for real-time search progress updates
    """
    async def event_generator():
        try:
            # Get the progress from Redis
            redis_client = RedisClient()
            progress_key = f"search_progress:{search_id}"
            
            while True:
                # Get current progress
                progress_data = redis_client.get_json(progress_key)
                
                if progress_data:
                    # Send the progress data
                    yield f"data: {json.dumps(progress_data)}\n\n"
                    
                    # If search is complete or error, end the stream
                    if progress_data.get('stage') in ['complete', 'error']:
                        break
                
                # Wait before next update
                await asyncio.sleep(0.5)
                
        except Exception as e:
            # Send error event
            error_data = {
                'stage': 'error',
                'message': str(e),
                'percentage': 0
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

@search_router.get("/search-progress/{search_id}")
async def get_search_progress(search_id: str):
    redis_client = RedisClient()
    progress = redis_client.get_json(f"search_progress:{search_id}")
    results = redis_client.get_json(f"search_results:{search_id}")

    if not progress:
        return {
            'stage': 'unknown',
            'message': 'No progress found',
            'percentage': 0,
            'search_id': search_id,
            'results': [],
            'total': 0,
            'total_pages': 0,
            'page': 1,
            'refined_query': '',
        }

    return {
        **progress,
        'results': results.get('results', []) if results else [],
        'total': results.get('total', 0) if results else 0,
        'total_pages': results.get('total_pages', 0) if results else 0,
        'page': results.get('page', 1) if results else 1,
        'refined_query': results.get('refined_query', '') if results else '',
    }

@search_router.get("/download/{file_type}/{filename}")
async def download_file(file_type: str, filename: str):
    """
    Download generated files (PDF or DOCX) by filename
    """
    try:
        # Validate file type
        if file_type not in ['pdf', 'docx']:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Construct the file path - look in temp directory
        import tempfile
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Determine content type
        content_type = "application/pdf" if file_type == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
        # Read and return the file
        with open(file_path, 'rb') as file:
            file_content = file.read()
        
        return Response(
            content=file_content,
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(file_content))
            }
        )
        
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

@search_router.post("/enhance-rfp-with-ai")
async def enhance_rfp_with_ai(request: Request):
    """
    Enhance RFP response with AI by processing the provided data and returning enhanced content
    """
    try:
        data = await request.json()
        logger.info("Enhance RFP with AI request received")
        
        # Extract the context data from the request
        company_context = data.get("company_context", {})
        proposal_context = data.get("proposal_context", {})
        
        logger.info(f"proposal context: {proposal_context}")
        
        pursuit_id = data.get("pursuitId")
        user_id = data.get("userId")
        
        if not company_context or not proposal_context:
            raise HTTPException(status_code=400, detail="Both company_context and proposal_context are required")
        
        # --- NEW: Replace proposal_description URL with actual description ---
        if (
            proposal_context.get("proposal_description") 
            and isinstance(proposal_context["proposal_description"], str)
            and proposal_context["proposal_description"].startswith("http")
        ):
            desc_url = proposal_context["proposal_description"]
            logger.info(f"Fetching actual description from SAM API: {desc_url}")
            actual_desc = await fetch_description_from_sam(desc_url)
            if actual_desc:
                proposal_context["proposal_description"] = actual_desc
                logger.info("Replaced proposal_description with actual description text.")
            else:
                logger.warning("Failed to fetch description from SAM API, leaving as URL.")
        # --- END NEW ---
        
        # --- Redis cache check ---
        # Create a unique hash for the context
        context_str = json.dumps({"company_context": company_context, "proposal_context": proposal_context}, sort_keys=True)
        context_hash = hashlib.md5(context_str.encode()).hexdigest()
        cache_key = f"enhanced_rfp:{user_id}:{pursuit_id}:{context_hash}"
        
        # Check Redis for cached enhanced RFP
        cached_result = redis_client.get_json(cache_key)
        if cached_result:
            logger.info(f"Returning cached enhanced RFP for pursuit ID: {pursuit_id}")
            return cached_result
        
        # Prepare the data structure for AI processing using the provided format
        current_dir = os.path.dirname(__file__)
        with open(os.path.join(current_dir, "context_prompt.json"), "r") as file:
            rfp_context_prompt = file.read()
        with open(os.path.join(current_dir, "context_example.json"), "r") as file:
            rfp_context_example = file.read()
        
        # Use OpenAI to enhance the content
        client = get_openai_client()
        
        # Create a comprehensive prompt for AI enhancement
        system_prompt = """You are an expert RFP (Request for Proposal) enhancement specialist. 
        You will receive RFP data and enhance it to create a professional, comprehensive proposal.
        
        Your task is to:
        1. Enhance existing content to be more professional and compelling
        2. Fill in missing sections with appropriate content based on the proposal type
        3. Ensure consistency in tone and style throughout the document
        4. Add relevant technical details and industry best practices
        5. Improve the overall structure and flow of the proposal
        
        Return the enhanced data in the same JSON structure as provided, with improved content."""
        
        user_prompt = f"""Please generate the following RFP data to create a professional, comprehensive proposal:
        
        {rfp_context_prompt}
        using the data provided in company data in {company_context} and proposal data in {proposal_context}
        Use the following example to guide your response:
        {rfp_context_example}
        
        Focus on:
        - Making the content more compelling and professional
        - Adding relevant technical details
        - Ensuring consistency across all sections
        - Improving the overall proposal structure
        
        Return the enhanced data in the same JSON format."""
        
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        enhanced_content = response.choices[0].message.content
        print("--------------------------------")
        print(enhanced_content)
        print("--------------------------------")
        
        # Try to parse the enhanced content as JSON
        try:
            # Extract JSON from the response if it's wrapped in markdown
            if "```json" in enhanced_content:
                enhanced_content = enhanced_content.split("```json")[1].split("```", 1)[0].strip()
            elif "```" in enhanced_content:
                enhanced_content = enhanced_content.split("```", 1)[1].strip()
            
            enhanced_data = json.loads(enhanced_content)
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw enhanced content
            enhanced_data = {"enhanced_content": enhanced_content}
        
        result = {
            "success": True,
            "enhanced_data": enhanced_data,
            "message": "RFP content enhanced successfully",
        }
        # --- Cache the result in Redis ---
        redis_client.set_json(cache_key, result, expiry=CACHE_TTL)
        return result
        
    except Exception as e:
        logger.error(f"Error enhancing RFP with AI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to enhance RFP: {str(e)}")

@search_router.post("/refine-query")
async def get_refined_query(request: Request):
    data = await request.json()
    query = data.get("query")
    contract_type = data.get("contract_type")
    platform = data.get("platform")
    user_id = data.get("user_id", "anonymous")  # Extract user_id, default to 'anonymous'
    if not query:
        return {"success": False, "message": "Query required"}
    try:
        refined_query = get_or_generate_refined_query(query, contract_type, platform, user_id)
        return {"success": True, "refined_query": refined_query}
    except Exception as e:
        return {"success": False, "message": str(e)}
