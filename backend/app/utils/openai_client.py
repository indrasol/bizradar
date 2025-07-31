import os
from dotenv import load_dotenv
load_dotenv()
from config.settings import OPENAI_API_KEY as api_key
from utils.logger import get_logger
from openai import OpenAI

logger = get_logger(__name__)


def get_openai_client():
    try:
        if not api_key:
            logger.warning("OPENAI_API_KEY environment variable not set")
        else:
            logger.info("OPENAI_API_KEY environment variable found")
            client = OpenAI(api_key=api_key)
            logger.info("OpenAI client initialized successfully")
            return client
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    return None