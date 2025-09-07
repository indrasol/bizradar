import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# Load environment variables
load_dotenv()

from app.utils.logger import get_logger

logger = get_logger(__name__)

try:
    from app.config.settings import EMBEDDING_MODEL
except ImportError:
    EMBEDDING_MODEL = None

_model = None
model_name = EMBEDDING_MODEL or "all-MiniLM-L6-v2" # 'paraphrase-MiniLM-L3-v2'
_model = SentenceTransformer(model_name)

def get_model():
    return _model