"""User profile route handlers."""

from typing import Optional
from fastapi import APIRouter
from database import db, LOCAL_USER_ID
from routes.schemas import ProfileRequest

router = APIRouter(prefix="/api/v1", tags=["profile"])


@router.get("/profile")
async def api_get_profile(user_id: Optional[str] = None) -> dict:
    """Fetches user preference profiles, scoped to user_id."""
    target_user = user_id or LOCAL_USER_ID
    return await db.get_profile(target_user)


@router.post("/profile")
async def api_save_profile(request: ProfileRequest) -> dict:
    """Saves user style preferences, scoped to user_id."""
    target_user = request.user_id or LOCAL_USER_ID
    profile_data = {
        "primary_use": request.primary_use,
        "preferred_tone": request.preferred_tone,
        "density_preference": request.density_preference
    }
    await db.save_profile(target_user, profile_data)
    return {"status": "saved", "user_id": target_user}
