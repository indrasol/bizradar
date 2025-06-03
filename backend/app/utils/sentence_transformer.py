import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from utils.logger import get_logger

logger = get_logger(__name__)

_model = None

def get_model():
    global _model
    if _model is None:
        try:
            model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2") # 'paraphrase-MiniLM-L3-v2'
            from sentence_transformers import SentenceTransformer
            logger.info("Loading SentenceTransformer...")
            _model = SentenceTransformer(model_name)
            logger.info("SentenceTransformer Loaded Successfully")
        except Exception as e:
            logger.error(f"Error loading embedding model: {e}")
            _model = None
    return _model