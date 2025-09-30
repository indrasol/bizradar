from fastapi import APIRouter, Request, HTTPException
from typing import Any, Dict, List, Optional

from app.utils.logger import get_logger
from app.utils.openai_client import get_openai_client
from app.utils.db_utils import get_supabase_connection
from app.config.settings import SEARCH_RESULT_LIMIT, PRO_SEARCH_RESULT_LIMIT
 


router = APIRouter()
logger = get_logger(__name__)


def _strip_embeddings(obj: Dict[str, Any]) -> Dict[str, Any]:
    obj.pop("embedding", None)
    obj.pop("embeddings", None)
    obj.pop("search_tsv", None)
    obj.pop("embedding_text", None)
    obj.pop("embedding_model", None)
    obj.pop("embedding_version", None)
    return obj

def _get_user_plan_and_max_results(user_id: Optional[str]) -> tuple[str, int]:
    plan = "free"
    max_results = SEARCH_RESULT_LIMIT
    try:
        if user_id:
            supabase = get_supabase_connection(use_service_key=True)
            res = (
                supabase
                .table("user_subscriptions")
                .select("current_subscription_plan,status")
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            row = (res.data or {}) if hasattr(res, "data") else {}
            if row and (row.get("status") or "").lower() == "active":
                plan = (row.get("current_subscription_plan") or "free").lower()
        max_results = max_results if "free" in plan.lower() else PRO_SEARCH_RESULT_LIMIT
    except Exception:
        pass
    return plan, max_results


@router.post("/enhanced/vector-search")
async def enhanced_vector_search(request: Request):
    """
    Perform a vector search using Supabase RPC and return the full doc JSON for each result.

    Request JSON:
      - query: str (required)
      - k | top_k | limit: int (optional, default 20)
      - only_active: bool (optional, default False)

    Response JSON:
      {
        "results": [ { ...doc without embeddings... }, ... ],
        "count": number
      }
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    query: Optional[str] = data.get("query")
    if not query or not isinstance(query, str) or not query.strip():
        raise HTTPException(status_code=400, detail="Field 'query' is required")

    # Accept several aliases for k
    k = data.get("k") or data.get("top_k") or data.get("limit") or 20
    try:
        k = int(k)
    except Exception:
        k = 20
    only_active = bool(data.get("only_active", False))

    # Clamp k by user plan
    user_id = data.get("user_id") or data.get("userId")
    plan, max_results = _get_user_plan_and_max_results(user_id)
    k = min(k, max_results)

    # No user gating for this endpoint

    client = get_openai_client()
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI client not configured")

    try:
        emb_resp = client.embeddings.create(model="text-embedding-3-small", input=query)
        embedding: List[float] = emb_resp.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create query embedding")

    try:
        supabase = get_supabase_connection(use_service_key=True)
    except Exception as e:
        logger.error(f"Supabase init error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize database client")

    rows: List[Dict[str, Any]] = []
    # Try primary RPC first, then fallback (both exist per migrations) [[memory:8156808]]
    try:
        res = supabase.rpc(
            "match_ai_enhanced_opps_all",
            {"query_embedding": embedding, "match_count": k, "only_active": bool(only_active)},
        ).execute()
        rows = res.data or []
    except Exception as e1:
        logger.warning(f"RPC match_ai_enhanced_opps_all failed, trying fallback. Error: {e1}")
        try:
            res = supabase.rpc(
                "match_ai_enhanced_opps",
                {"query_embedding": embedding, "match_count": k, "only_active": bool(only_active)},
            ).execute()
            rows = res.data or []
        except Exception as e2:
            logger.error(f"RPC error: {e2}")
            raise HTTPException(status_code=500, detail="Vector search RPC failed")

    # Extract docs and strip any embedding fields
    docs: List[Dict[str, Any]] = []
    for r in rows:
        doc = r.get("doc") if isinstance(r, dict) else None
        if isinstance(doc, dict):
            docs.append(_strip_embeddings(doc))
        elif isinstance(r, dict):
            # In case RPC returns full row instead of keyed doc
            docs.append(_strip_embeddings(r))

    return {"results": docs, "count": len(docs), "limit": max_results, "plan": plan}


