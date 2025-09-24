import asyncio
from typing import Dict, Callable, Any
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Track ongoing requests to prevent duplicates
ongoing_requests: Dict[str, asyncio.Event] = {}
request_lock = asyncio.Lock()

async def deduplicate_request(request_key: str, operation: Callable) -> Any:
    """Prevent duplicate requests for the same operation"""
    async with request_lock:
        if request_key in ongoing_requests:
            # Wait for the existing request to complete
            logger.info(f"Request {request_key} already in progress, waiting...")
            await ongoing_requests[request_key].wait()
            return None
        
        # Mark this request as ongoing
        ongoing_requests[request_key] = asyncio.Event()
    
    try:
        # Execute the operation
        result = await operation()
        return result
    finally:
        # Mark request as complete and clean up
        async with request_lock:
            if request_key in ongoing_requests:
                ongoing_requests[request_key].set()
                del ongoing_requests[request_key]

def generate_request_key(operation: str, **kwargs) -> str:
    """Generate a unique key for request deduplication"""
    # Create a deterministic key based on operation and parameters
    key_parts = [operation]
    for k, v in sorted(kwargs.items()):
        if v is not None:
            key_parts.append(f"{k}={v}")
    return "_".join(key_parts)
