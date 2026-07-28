"""Memory CRUD route handlers."""

from fastapi import APIRouter, HTTPException
from database import db
from routes.schemas import MemoryRequest

router = APIRouter(prefix="/api/v1", tags=["memories"])


@router.get("/memories")
async def api_get_memories() -> list:
    """Fetches all learned memories for the current local user."""
    return await db.get_memories("local_user")


@router.post("/memories")
async def api_add_memory(request: MemoryRequest) -> dict:
    """Manually adds a memory fact."""
    memory_id = await db.add_memory("local_user", request.category, request.fact)
    return {"id": memory_id, "status": "added"}


@router.delete("/memories/{memory_id}")
async def api_delete_memory(memory_id: str) -> dict:
    """Deletes a memory fact by its ID."""
    deleted = await db.delete_memory("local_user", memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory fact not found")
    return {"status": "deleted"}
