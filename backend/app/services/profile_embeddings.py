from typing import Dict, Any, List, Optional

from app.utils.logger import get_logger
from app.utils.openai_client import get_openai_client


logger = get_logger(__name__)


EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMENSIONS = 1536


def _coerce_text(value: Optional[Any]) -> str:
    if value is None:
        return ""
    try:
        if isinstance(value, (dict, list)):
            # Compact JSON-like serialization
            return str(value)
        return str(value)
    except Exception:
        return ""


def build_embedding_text_from_profile(profile: Dict[str, Any]) -> str:
    """
    Build a single text blob representing the full profile row for embedding.
    Caps length to keep within model-friendly limits.
    """
    parts: List[str] = []

    parts.append(f"id: {_coerce_text(profile.get('id'))}")
    parts.append(f"full_name: {_coerce_text(profile.get('full_name'))}")
    parts.append(f"first_name: {_coerce_text(profile.get('first_name'))}")
    parts.append(f"last_name: {_coerce_text(profile.get('last_name'))}")
    parts.append(f"email: {_coerce_text(profile.get('email'))}")
    parts.append(f"role: {_coerce_text(profile.get('role') or profile.get('user_role'))}")

    parts.append(f"company_name: {_coerce_text(profile.get('company_name'))}")
    parts.append(f"company_url: {_coerce_text(profile.get('company_url'))}")
    parts.append(f"company_description: {_coerce_text(profile.get('company_description'))}")
    parts.append(f"company_size: {_coerce_text(profile.get('company_size'))}")
    parts.append(f"industry: {_coerce_text(profile.get('industry'))}")

    # Rich fields
    if profile.get("company_markdown"):
        parts.append("company_markdown:\n" + _coerce_text(profile.get("company_markdown")))
    if profile.get("company_data"):
        parts.append("company_data:\n" + _coerce_text(profile.get("company_data")))

    text = "\n".join([p for p in parts if p.strip()])
    # Safety cap
    return text[:20000]


def generate_embedding(text: str) -> List[float]:
    client = get_openai_client()
    if not client:
        raise RuntimeError("OpenAI client not configured")
    resp = client.embeddings.create(model=EMBED_MODEL, input=text)
    return resp.data[0].embedding


def update_profile_embedding(supabase, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch the latest profile, build embedding text, generate embedding,
    and persist embedding fields. Returns the updated row on success.
    """
    try:
        sel = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        profile = sel.data or {}
        text = build_embedding_text_from_profile(profile)
        if not text.strip():
            logger.info(f"Skipping embedding update for user {user_id}: empty text")
            return None

        vector = generate_embedding(text)

        upd = supabase.table("profiles").update({
            "embedding_text": text,
            "embedding": vector,
            "embedding_model": EMBED_MODEL,
            "embedding_version": 1,
        }).eq("id", user_id).execute()

        if upd.data:
            return upd.data[0]
        return None
    except Exception as e:
        logger.error(f"Failed to update profile embedding for {user_id}: {e}")
        return None


