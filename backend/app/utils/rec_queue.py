import asyncio
import json
from app.utils.processor import process_recommendations
from app.utils.logger import get_logger
from typing import NamedTuple, List, Dict, Optional
# from services.recommendations import generate_recommendations
from app.utils.redis_connection import RedisClient
from app.utils.tasks import add_task, cancel_old_tasks

# Configure logger
logger = get_logger(__name__)

# Task payload
class RecTask(NamedTuple):
    search_id: str
    opp_ids: List[int]
    user_profile: dict

# Track active tasks by user and search ID
active_tasks: Dict[str, Dict[str, asyncio.Task]] = {}
task_lock = asyncio.Lock()

# Keep the original queue for backward compatibility
queue = asyncio.Queue()

# Dummy value for backward compatibility
active_search = None

async def start_consumer_loop():
    """Backward compatibility method - does nothing in this implementation"""
    # logger.info("Using new recommendation processing system - no consumer needed")

async def put(task: RecTask):
    """Backward compatibility method for the original queue"""
    await add_recommendation_task(
        search_id=task.search_id,
        opp_ids=task.opp_ids,
        user_profile=task.user_profile
    )

async def add_recommendation_task(search_id: str, opp_ids: List, user_profile: dict):
    """Add a new recommendation task, cancelling any existing ones for the same user"""
    # Extract user ID from search ID
    user_id = search_id.split(':')[0] if ':' in search_id else "anon"
    
    logger.info(f"Adding new recommendation task for user {user_id}, search {search_id}")
    
    # Cancel existing tasks
    await cancel_old_tasks(user_id, except_search_id=search_id)

    # Create a new task for processing recommendations
    process_task = asyncio.create_task(
        process_recommendations(
            search_id=search_id,
            opp_ids=opp_ids,
            user_profile=user_profile,
            user_id=user_id
        )
    )
    
    await add_task(user_id, search_id, process_task)
    
    logger.info(f"Created new recommendation task for search {search_id}")

async def get_latest_recommendations(search_id: str) -> Optional[List[dict]]:
    redis_conn = RedisClient.get_client()
    key = f"recs:{search_id}"
    try:
        recs_json = await redis_conn.lrange(key, 0, -1)
        recommendations = [json.loads(r) for r in recs_json]
        return recommendations
    except Exception as e:
        logger.error(f"Failed to fetch recommendations for {search_id}: {e}", exc_info=True)
        return None

# async def process_recommendations(search_id: str, opp_ids: List, user_profile: dict, user_id: str):
#     """Process recommendations with cancellation support"""
#     redis_client = RedisClient()
#     redis_conn = redis_client.get_client()
    
#     try:
#         logger.info(f"Processing recommendations for search {search_id}")
        
#         # Process opportunities in batches
#         opportunities = []
#         for opp_id in opp_ids:
#             if isinstance(opp_id, (int, str)):
#                 opportunities.append({"id": opp_id})
#             else:
#                 opportunities.append(opp_id)
        
#         # Process in batches of 3
#         batch_size = 3
#         for i in range(0, len(opportunities), batch_size):
#             # Check if task is still active
#             async with task_lock:
#                 if (user_id not in active_tasks or 
#                     search_id not in active_tasks[user_id] or
#                     active_tasks[user_id][search_id].done()):
#                     logger.info(f"Task for search {search_id} is no longer active, stopping")
#                     return
            
#             batch = opportunities[i:i+batch_size]
#             try:
#                 # Process batch
#                 logger.info(f"Processing batch of {len(batch)} opportunities for search {search_id}")
#                 recs = await generate_recommendations(
#                     company_url=user_profile.get("company_url", ""),
#                     company_description=user_profile.get("company_description", ""),
#                     opportunities=batch
#                 )
                
#                 # Check again if still active
#                 async with task_lock:
#                     if (user_id not in active_tasks or 
#                         search_id not in active_tasks[user_id] or
#                         active_tasks[user_id][search_id].done()):
#                         logger.info(f"Task for search {search_id} is no longer active after batch, stopping")
#                         return
                
#                 # Store in Redis
#                 if redis_conn:
#                     key = f"recs:{search_id}"
#                     recommendations = []
                    
#                     if isinstance(recs, dict) and "recommendations" in recs:
#                         recommendations = recs["recommendations"]
#                     elif isinstance(recs, list):
#                         recommendations = recs
                    
#                     for r in recommendations:
#                         # Adjust opportunity index for the batch
#                         if "opportunityIndex" in r:
#                             r["opportunityIndex"] += i
                        
#                         try:
#                             redis_conn.rpush(key, json.dumps(r))
#                         except Exception as e:
#                             logger.error(f"Error storing recommendation in Redis: {str(e)}")
                    
#                     redis_conn.expire(key, 4 * 3600)
#                     logger.info(f"Stored batch of {len(recommendations)} recommendations for search {search_id}")
                
#             except asyncio.CancelledError:
#                 logger.info(f"Batch processing for search {search_id} was cancelled")
#                 raise
#             except Exception as e:
#                 logger.error(f"Error processing batch for search {search_id}: {str(e)}")
#                 import traceback
#                 logger.error(traceback.format_exc())
    
#     except asyncio.CancelledError:
#         logger.info(f"Recommendation processing for search {search_id} was cancelled")
#         raise
#     except Exception as e:
#         logger.error(f"Error processing recommendations for search {search_id}: {str(e)}")
#         import traceback
#         logger.error(traceback.format_exc())
#     finally:
#         # Clean up task tracking
#         async with task_lock:
#             if user_id in active_tasks and search_id in active_tasks[user_id]:
#                 active_tasks[user_id].pop(search_id, None)
#                 if not active_tasks[user_id]:
#                     active_tasks.pop(user_id, None)

# async def enqueue_recommendation_task(search_id, opp_ids, user_profile):
#     """Add a recommendation task to the queue"""
#     try:
#         # Extract user ID from search ID
#         user_id = search_id.split(':')[0] if ':' in search_id else None
        
#         # Cancel any existing task for this user
#         if user_id:
#             async with task_lock:
#                 if user_id in active_tasks:
#                     old_task = active_tasks.get(user_id)
#                     if old_task and not old_task.done():
#                         logger.info(f"Cancelling previous recommendation task for user {user_id}")
#                         old_task.cancel()
            
#         # Create a new task
#         task = asyncio.create_task(
#             process_recommendations(
#                 search_id=search_id,
#                 opp_ids=opp_ids,
#                 user_profile=user_profile
#             )
#         )
        
#         # Store the task 
#         if user_id:
#             async with task_lock:
#                 active_tasks[user_id] = task
        
#         logger.info(f"Enqueued recommendation task for {search_id}")
#     except Exception as e:
#         logger.error(f"Error enqueuing recommendation task: {e}")