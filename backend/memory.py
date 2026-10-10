"""KIRA Memory Manager — Mem0 Cloud API integration with local SQLite project-scoped fallbacks."""

import logging
from typing import List, Dict, Any, Optional
import httpx
from config import MEM0_API_KEY
from database import db, LOCAL_USER_ID, CATEGORY_AUTO

logger = logging.getLogger("kira.memory")

MEM0_API_BASE = "https://api.mem0.ai/v1"


def _get_headers() -> Optional[Dict[str, str]]:
    if not MEM0_API_KEY or MEM0_API_KEY.strip() == "" or "your-api-key" in MEM0_API_KEY:
        return None
    return {
        "Authorization": f"Token {MEM0_API_KEY.strip()}",
        "Content-Type": "application/json"
    }


async def remember(
    fact: str,
    user_id: str = "local_user",
    agent_name: str = "",
    project_id: str = "default"
) -> None:
    """Saves a fact to Mem0 cloud, always writing to local SQLite for instant retrieval and project scoping."""
    # 1. Always save to local SQLite for guaranteed local performance and project scoping
    await db.add_memory(user_id or LOCAL_USER_ID, category=CATEGORY_AUTO, fact=fact, project_id=project_id)

    # 2. Asynchronously sync to Mem0 Cloud if configured
    headers = _get_headers()
    if headers:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                payload = {
                    "messages": [{"role": "user", "content": fact}],
                    "user_id": user_id,
                    "metadata": {
                        "category": "auto_learned",
                        "agent_name": agent_name,
                        "project_id": project_id
                    }
                }
                res = await client.post(f"{MEM0_API_BASE}/memories/", json=payload, headers=headers)
                if res.status_code in (200, 201):
                    logger.debug(f"Synced fact to Mem0 cloud for project {project_id}")
        except Exception as e:
            logger.debug(f"Mem0 cloud sync skipped/failed: {e}")


async def recall(
    query: str,
    user_id: str = "local_user",
    agent_name: str = "",
    project_id: str = "default"
) -> List[Dict[str, Any]]:
    """Retrieves project-scoped and global memories from Mem0 cloud or local SQLite fallback."""
    headers = _get_headers()
    if headers:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                payload = {
                    "query": query,
                    "user_id": user_id,
                    "filters": {"project_id": project_id} if project_id and project_id != "default" else None
                }
                res = await client.post(f"{MEM0_API_BASE}/memories/search/", json=payload, headers=headers)
                if res.status_code == 200:
                    results = res.json()
                    mem_list = results if isinstance(results, list) else results.get("results", [])
                    if mem_list:
                        return [
                            {
                                "fact": m.get("memory", ""),
                                "category": "auto_learned",
                                "project_id": project_id,
                                "score": m.get("score", 1.0)
                            }
                            for m in mem_list
                        ]
        except Exception as e:
            logger.debug(f"Mem0 search fallback to SQLite: {e}")

    # Primary reliable fallback: Local SQLite scoped by project
    return await db.get_memories(user_id or LOCAL_USER_ID, project_id=project_id)


async def get_all_memories(
    user_id: str = "local_user",
    agent_name: str = "",
    project_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Retrieves all memories scoped by project."""
    return await db.get_memories(user_id or LOCAL_USER_ID, project_id=project_id)
