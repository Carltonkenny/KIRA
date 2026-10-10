"""Memory CRUD route handlers."""

from fastapi import APIRouter, HTTPException
from database import db, LOCAL_USER_ID
from routes.schemas import MemoryRequest

router = APIRouter(prefix="/api/v1", tags=["memories"])


@router.get("/memories")
async def api_get_memories(project_id: str = None) -> list:
    """Fetches all learned memories for the current local user, optionally filtered by project_id."""
    return await db.get_memories(LOCAL_USER_ID, project_id=project_id)


@router.post("/memories")
async def api_add_memory(request: MemoryRequest) -> dict:
    """Manually adds a memory fact scoped to a project."""
    memory_id = await db.add_memory(
        LOCAL_USER_ID, request.category, request.fact, project_id=request.project_id or "default"
    )
    return {"id": memory_id, "status": "added"}


@router.delete("/memories/{memory_id}")
async def api_delete_memory(memory_id: str) -> dict:
    """Deletes a memory fact by its ID."""
    deleted = await db.delete_memory(LOCAL_USER_ID, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory fact not found")
    return {"status": "deleted"}
