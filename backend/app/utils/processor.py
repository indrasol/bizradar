import asyncio
import json
from typing import List, Dict
from utils.redis_connection import RedisClient
from utils.logger import get_logger
from utils.tasks import is_task_active, remove_task

from services.recommendations import generate_recommendations  # Your existing service

logger = get_logger(__name__)

async def process_recommendations(search_id: str, opp_ids: List, user_profile: dict, user_id: str):
    redis_conn = RedisClient.get_client()
    
    try:
        logger.info(f"Processing recommendations for search {search_id}")

        # Convert opp_ids to opportunity dicts
        opportunities = [{"id": opp_id} if isinstance(opp_id, (int, str)) else opp_id for opp_id in opp_ids]

        batch_size = 3
        for i in range(0, len(opportunities), batch_size):
            if not await is_task_active(user_id, search_id):
                logger.info(f"Task for search {search_id} no longer active, stopping.")
                return

            batch = opportunities[i:i+batch_size]
            try:
                logger.info(f"Processing batch of {len(batch)} for search {search_id}")
                recs = await generate_recommendations(
                    company_url=user_profile.get("company_url", ""),
                    company_description=user_profile.get("company_description", ""),
                    opportunities=batch
                )

                if not await is_task_active(user_id, search_id):
                    logger.info(f"Task for search {search_id} no longer active after batch, stopping.")
                    return

                if redis_conn:
                    key = f"recs:{search_id}"
                    recommendations = []

                    if isinstance(recs, dict) and "recommendations" in recs:
                        recommendations = recs["recommendations"]
                    elif isinstance(recs, list):
                        recommendations = recs

                    # Adjust opportunityIndex for batch offset
                    for r in recommendations:
                        if "opportunityIndex" in r:
                            r["opportunityIndex"] += i

                    # Push all recommendations at once for performance
                    json_recs = [json.dumps(r) for r in recommendations]
                    if json_recs:
                        await redis_conn.rpush(key, *json_recs)
                        await redis_conn.expire(key, 4 * 3600)
                        logger.info(f"Stored batch of {len(recommendations)} recommendations for search {search_id}")

            except asyncio.CancelledError:
                logger.info(f"Batch processing for search {search_id} was cancelled")
                raise
            except Exception as e:
                logger.error(f"Error processing batch for search {search_id}: {e}", exc_info=True)

    except asyncio.CancelledError:
        logger.info(f"Recommendation processing for search {search_id} was cancelled")
        raise
    except Exception as e:
        logger.error(f"Error processing recommendations for search {search_id}: {e}", exc_info=True)
    finally:
        await remove_task(user_id, search_id)
