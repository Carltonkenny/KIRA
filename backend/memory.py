"""KIRA Memory Manager — Mem0 cloud integration with local database fallbacks."""

import logging
from typing import List, Dict, Any
from config import MEM0_API_KEY

logger = logging.getLogger("kira.memory")

_client = None


def get_mem0_client():
    global _client
    if _client is not None:
        return _client

    if not MEM0_API_KEY or MEM0_API_KEY.strip() == "" or "your-api-key" in MEM0_API_KEY:
        return None

    try:
        from mem0 import MemoryClient
        _client = MemoryClient(api_key=MEM0_API_KEY)
        return _client
    except Exception as e:
        logger.warning(f"Failed to initialize Mem0Client: {e}")
        return None


def _try_mem0(method_name: str, *args, **kwargs):
    """Executes a Mem0 client method, catching any exceptions and returning the result or None."""
    client = get_mem0_client()
    if client:
        try:
            method = getattr(client, method_name)
            return method(*args, **kwargs)
        except Exception as e:
            logger.warning(f"Mem0 client.{method_name} failed: {e}. Falling back to local DB.")
    return None


async def remember(fact: str, user_id: str = "local_user", agent_name: str = "") -> None:
    """Saves a fact to Mem0 cloud, falling back to local database if unavailable or unconfigured."""
    metadata = {"category": "auto_learned"}
    result = _try_mem0(
        "add",
        fact,
        user_id=user_id,
        agent_id=agent_name if agent_name else None,
        metadata=metadata
    )
    if result is not None:
        return

    # Fallback to SQLite DB
    from database import db, LOCAL_USER_ID, CATEGORY_AUTO
    await db.add_memory(user_id or LOCAL_USER_ID, category=CATEGORY_AUTO, fact=fact)


async def recall(query: str, user_id: str = "local_user", agent_name: str = "") -> List[Dict[str, Any]]:
    """Retrieves relevant memories from Mem0 cloud, falling back to local database."""
    filters = {"user_id": user_id}
    response = _try_mem0("search", query, filters=filters)
    if response is not None:
        results = response.get("results", [])
        normalized = []
        for res in results:
            normalized.append({
                "fact": res.get("memory", ""),
                "category": "auto_learned",
                "score": res.get("score", 1.0)
            })
        return normalized

    # Fallback to SQLite DB
    from database import db, LOCAL_USER_ID
    return await db.get_memories(user_id or LOCAL_USER_ID)


async def get_all_memories(user_id: str = "local_user", agent_name: str = "") -> List[Dict[str, Any]]:
    """Retrieves all memories from Mem0 cloud, falling back to local database."""
    filters = {"user_id": user_id}
    response = _try_mem0("get_all", filters=filters)
    if response is not None:
        results = response.get("results", [])
        normalized = []
        for res in results:
            normalized.append({
                "id": res.get("id", ""),
                "fact": res.get("memory", ""),
                "category": "auto_learned",
                "created_at": res.get("created_at", "")
            })
        return normalized

    # Fallback to SQLite DB
    from database import db, LOCAL_USER_ID
    return await db.get_memories(user_id or LOCAL_USER_ID)
