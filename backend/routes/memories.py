"""Memory CRUD route handlers."""

from typing import Optional
from fastapi import APIRouter, HTTPException
from database import db, LOCAL_USER_ID
from routes.schemas import MemoryRequest

router = APIRouter(prefix="/api/v1", tags=["memories"])


@router.get("/memories")
async def api_get_memories(project_id: Optional[str] = None, user_id: Optional[str] = None) -> list:
    """Fetches all learned memories for the specified user, optionally filtered by project_id."""
    target_user = user_id or LOCAL_USER_ID
    return await db.get_memories(target_user, project_id=project_id)


@router.post("/memories")
async def api_add_memory(request: MemoryRequest) -> dict:
    """Manually adds a memory fact scoped to a user and project."""
    target_user = request.user_id or LOCAL_USER_ID
    memory_id = await db.add_memory(
        target_user, request.category, request.fact, project_id=request.project_id or "default"
    )
    return {"id": memory_id, "status": "added", "user_id": target_user}


@router.delete("/memories/{memory_id}")
async def api_delete_memory(memory_id: str, user_id: Optional[str] = None) -> dict:
    """Deletes a memory fact by its ID for the specified user."""
    target_user = user_id or LOCAL_USER_ID
    deleted = await db.delete_memory(target_user, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory fact not found")
    return {"status": "deleted", "user_id": target_user}
