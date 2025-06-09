import os
import redis
import json
from utils.logger import get_logger
from dotenv import load_dotenv
from typing import Optional, Any
from datetime import date, datetime

# Load environment variables
load_dotenv()

# Configure module-level logger
logger = get_logger(__name__)

class RedisClient:
    """
    Singleton Redis client using host, port, and username/password for ACL auth.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            try:
                # Read connection parameters from environment
                try:
                    from config.settings import REDIS_HOST as redis_host, REDIS_PORT as redis_port, REDIS_USERNAME as redis_username, REDIS_PASSWORD as redis_password
                except ImportError:
                    redis_port = None
                logger.info(redis_host,redis_port,redis_username,redis_password)
                # redis_host     = os.getenv("REDIS_HOST")
                # redis_port     = int(os.getenv("REDIS_PORT", 6379))
                # redis_username = os.getenv("REDIS_USERNAME")
                # redis_password = os.getenv("REDIS_PASSWORD")

                if not (redis_host and redis_username and redis_password):
                    logger.warning("Missing Redis credentials (host, username, or password)")
                    cls._instance.client = None
                    return cls._instance

                # Initialize Redis client with ACL username/password
                cls._instance.client = redis.Redis(
                    host=redis_host,
                    port=redis_port or 6379,
                    username=redis_username,
                    password=redis_password,
                    decode_responses=True
                )
                logger.info(f"Connecting to Redis at {redis_host}:{redis_port} as user '{redis_username}'")

                # Test connection
                cls._instance.client.ping()
                logger.info("Successfully connected to Redis")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                cls._instance.client = None
        return cls._instance

    def get_client(self) -> Optional[redis.Redis]:
        """Get the Redis client instance."""
        return self.client

    def set_json(self, key: str, data: Any, expiry: int = 3600) -> bool:
        """Store JSON serializable data in Redis with automatic date handling."""
        if not self.client:
            return False
        try:
            # Sanitize data for JSON serialization
            sanitized_data = self._sanitize_for_json(data)
            serialized = json.dumps(sanitized_data)
            result = self.client.setex(key, expiry, serialized)
            if result:
                logger.debug(f"Successfully set Redis key '{key}' (TTL: {expiry}s)")
            return bool(result)
        except Exception as e:
            logger.error(f"Error setting Redis key '{key}': {e}")
            return False

    def get_json(self, key: str) -> Optional[Any]:
        """Retrieve and deserialize JSON data from Redis."""
        if not self.client:
            return None
        try:
            raw = self.client.get(key)
            if raw:
                logger.debug(f"Successfully retrieved Redis key '{key}'")
                return json.loads(raw)
            logger.debug(f"Redis key '{key}' not found")
            return None
        except Exception as e:
            logger.error(f"Error getting Redis key '{key}': {e}")
            return None

    def delete(self, key: str) -> bool:
        """Delete a key from Redis."""
        if not self.client:
            return False
        try:
            result = self.client.delete(key)
            if result:
                logger.debug(f"Successfully deleted Redis key '{key}'")
            return bool(result)
        except Exception as e:
            logger.error(f"Error deleting Redis key '{key}': {e}")
            return False

    def exists(self, key: str) -> bool:
        """Check if a key exists in Redis."""
        if not self.client:
            return False
        try:
            result = self.client.exists(key)
            return bool(result)
        except Exception as e:
            logger.error(f"Error checking Redis key '{key}': {e}")
            return False
            
    def _sanitize_for_json(self, obj: Any) -> Any:
        """
        Recursively sanitize an object to make it JSON serializable.
        Handles date/datetime objects, database records, and other non-serializable types.
        """
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: self._sanitize_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._sanitize_for_json(item) for item in obj]
        elif isinstance(obj, tuple):
            return [self._sanitize_for_json(item) for item in obj]
        elif isinstance(obj, (int, float, str, bool, type(None))):
            return obj
        else:
            # Try to convert to string for unknown types
            try:
                return str(obj)
            except:
                return None