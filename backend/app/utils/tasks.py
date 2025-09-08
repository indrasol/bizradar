import asyncio
from typing import Dict
from app.utils.logger import get_logger

logger = get_logger(__name__)

active_tasks: Dict[str, Dict[str, asyncio.Task]] = {}
task_lock = asyncio.Lock()

async def cancel_old_tasks(user_id: str, except_search_id: str):
    """Cancel all old tasks for user except the new search ID."""
    async with task_lock:
        if user_id in active_tasks:
            for old_search_id, task in list(active_tasks[user_id].items()):
                if old_search_id != except_search_id and not task.done():
                    logger.info(f"Cancelling task for search {old_search_id}")
                    task.cancel()
                    try:
                        await asyncio.wait_for(task, timeout=0.1)
                    except (asyncio.CancelledError, asyncio.TimeoutError):
                        pass
            active_tasks[user_id] = {}

async def add_task(user_id: str, search_id: str, task: asyncio.Task):
    """Add a new task for a user and search."""
    async with task_lock:
        if user_id not in active_tasks:
            active_tasks[user_id] = {}
        active_tasks[user_id][search_id] = task

async def remove_task(user_id: str, search_id: str):
    async with task_lock:
        if user_id in active_tasks and search_id in active_tasks[user_id]:
            active_tasks[user_id].pop(search_id, None)
            if not active_tasks[user_id]:
                active_tasks.pop(user_id, None)

async def is_task_active(user_id: str, search_id: str) -> bool:
    async with task_lock:
        return user_id in active_tasks and search_id in active_tasks[user_id] and not active_tasks[user_id][search_id].done()
