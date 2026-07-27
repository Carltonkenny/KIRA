import os
import sys
from typing import List, Dict, Any, Optional
from config import MEM0_API_KEY

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
        print(f"KIRA WARNING: Failed to initialize Mem0Client. Error: {e}", file=sys.stderr)
        return None

async def remember(fact: str, user_id: str = "local_user", agent_name: str = "") -> None:
    """Saves a fact to Mem0 cloud, falling back to local database if unavailable or unconfigured."""
    client = get_mem0_client()
    if client:
        try:
            metadata = {"category": "auto_learned"}
            client.add(fact, user_id=user_id, agent_id=agent_name if agent_name else None, metadata=metadata)
            return
        except Exception as e:
            print(f"KIRA WARNING: Mem0 add memory failed. Error: {e}. Falling back to DB.", file=sys.stderr)
            
    # Fallback to SQLite/Postgres DB
    from database import db
    await db.add_memory(user_id, category="auto_learned", fact=fact)

async def recall(query: str, user_id: str = "local_user", agent_name: str = "") -> List[Dict[str, Any]]:
    """Retrieves relevant memories from Mem0 cloud, falling back to local database."""
    client = get_mem0_client()
    if client:
        try:
            filters = {"user_id": user_id}
            if agent_name:
                filters["agent_id"] = agent_name
            response = client.search(query, filters=filters)
            results = response.get("results", [])
            normalized = []
            for res in results:
                normalized.append({
                    "fact": res.get("memory", ""),
                    "category": "auto_learned",
                    "score": res.get("score", 1.0)
                })
            return normalized
        except Exception as e:
            print(f"KIRA WARNING: Mem0 search memory failed. Error: {e}. Falling back to DB.", file=sys.stderr)
            
    # Fallback to SQLite/Postgres DB
    from database import db
    db_memories = await db.get_memories(user_id)
    return db_memories

async def get_all_memories(user_id: str = "local_user", agent_name: str = "") -> List[Dict[str, Any]]:
    """Retrieves all memories from Mem0 cloud, falling back to local database."""
    client = get_mem0_client()
    if client:
        try:
            filters = {"user_id": user_id}
            if agent_name:
                filters["agent_id"] = agent_name
            response = client.get_all(filters=filters)
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
        except Exception as e:
            print(f"KIRA WARNING: Mem0 get_all memory failed. Error: {e}. Falling back to DB.", file=sys.stderr)
            
    # Fallback to SQLite/Postgres DB
    from database import db
    return await db.get_memories(user_id)
