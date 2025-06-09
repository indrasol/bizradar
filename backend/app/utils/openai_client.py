import os
from dotenv import load_dotenv
load_dotenv()

from utils.logger import get_logger
logger = get_logger(__name__)


def get_openai_client():
    try:
        # api_key = os.getenv("OPENAI_API_KEY")
        from config.settings import OPENAI_API_KEY as api_key
        if not api_key:
            logger.warning("OPENAI_API_KEY environment variable not set")
        else:
            logger.info("OPENAI_API_KEY environment variable found")
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            logger.info("OpenAI client initialized successfully")
            return client
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    return None