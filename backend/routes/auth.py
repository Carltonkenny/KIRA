"""KIRA Authentication & Session Management Router."""

import uuid
import logging
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from fastapi import APIRouter
from database import db

logger = logging.getLogger("kira.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: str
    password: Optional[str] = None


@router.post("/session")
async def api_auth_session(request: AuthRequest) -> Dict[str, Any]:
    """
    Authenticates a user by email against Neon PostgreSQL:
    - If user exists: retrieves their profile & existing memories, generating a new session.
    - If user does NOT exist: provisions a new profile in Neon DB with defaults and returns a new session.
    """
    email = request.email.strip().lower()
    user_id = email

    # 1. Check if user exists in database
    existing_profile = await db.get_profile(user_id)
    
    # Check if this user has any custom profile or memories in Neon DB
    memories = await db.get_memories(user_id, project_id="all")
    is_existing = len(memories) > 0 or existing_profile.get("primary_use") != "development"

    session_id = f"sess-{uuid.uuid4().hex[:8]}"

    if not is_existing:
        # First-time registration in Neon DB
        default_profile = {
            "primary_use": "development",
            "preferred_tone": "direct",
            "density_preference": "short"
        }
        await db.save_profile(user_id, default_profile)
        logger.info(f"Created new user session & profile in Neon DB for: {user_id}")
        return {
            "user_id": user_id,
            "email": email,
            "is_new": True,
            "session_id": session_id,
            "profile": default_profile,
            "memories_count": 0,
            "status": "authenticated_new_user"
        }
    else:
        logger.info(f"Loaded existing user profile from Neon DB for: {user_id} ({len(memories)} memories)")
        return {
            "user_id": user_id,
            "email": email,
            "is_new": False,
            "session_id": session_id,
            "profile": existing_profile,
            "memories_count": len(memories),
            "status": "authenticated_existing_user"
        }


@router.get("/me")
async def api_get_me(user_id: str) -> Dict[str, Any]:
    """Returns current user status and memory count."""
    profile = await db.get_profile(user_id)
    memories = await db.get_memories(user_id, project_id="all")
    return {
        "user_id": user_id,
        "profile": profile,
        "memories_count": len(memories)
    }
