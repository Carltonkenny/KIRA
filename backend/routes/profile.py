"""User profile route handlers."""

from fastapi import APIRouter
from database import db
from routes.schemas import ProfileRequest

router = APIRouter(prefix="/api/v1", tags=["profile"])


@router.get("/profile")
async def api_get_profile() -> dict:
    """Fetches user preference profiles."""
    return await db.get_profile("local_user")


@router.post("/profile")
async def api_save_profile(request: ProfileRequest) -> dict:
    """Saves user style preferences."""
    profile_data = {
        "primary_use": request.primary_use,
        "preferred_tone": request.preferred_tone,
        "density_preference": request.density_preference
    }
    await db.save_profile("local_user", profile_data)
    return {"status": "saved"}
