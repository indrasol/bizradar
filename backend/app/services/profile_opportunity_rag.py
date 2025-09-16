from typing import Any, Dict, List, Optional

from app.database.supabase import get_supabase_client
from app.utils.logger import get_logger


logger = get_logger(__name__)


def get_top_matches_for_profile(user_id: str, top_n: int = 20, only_active: bool = True) -> List[Dict[str, Any]]:
    """
    Call Supabase RPC to get the top-N opportunities most similar to the
    given profile's embedding.

    Returns list of docs (opportunity rows) ordered by similarity desc.
    """
    supabase = get_supabase_client()
    try:
        res = supabase.rpc(
            "match_opportunities_for_profile",
            {
                "profile_id": user_id,
                "match_count": int(top_n),
                "only_active": bool(only_active),
            },
        ).execute()
        rows = res.data or []
        # RPC returns rows with keys: doc, similarity
        # We sort by similarity desc just in case
        rows = sorted(rows, key=lambda r: r.get("similarity", 0), reverse=True)
        # Extract docs only
        docs: List[Dict[str, Any]] = []
        for r in rows:
            doc = r.get("doc") if isinstance(r, dict) else None
            if isinstance(doc, dict):
                docs.append(doc)
            elif isinstance(r, dict):
                docs.append(r)
        return docs[: int(top_n)]
    except Exception as e:
        logger.error(f"RPC match_opportunities_for_profile failed for user {user_id}: {e}")
        return []


