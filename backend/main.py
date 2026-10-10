"""KIRA API — Context-Aware Prompt Refinement Engine Backend."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import db
from config import PORT, ENVIRONMENT, ALLOWED_ORIGINS
from routes.refine import router as refine_router
from routes.memories import router as memories_router
from routes.profile import router as profile_router
from routes.mcp import router as mcp_router

logger = logging.getLogger("kira.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — replaces deprecated on_event decorators."""
    try:
        await db.initialize_tables()
        logger.info("FastAPI database schema successfully checked.")
    except Exception as e:
        logger.error(f"Database initialization failed at startup: {e}")
    yield
    await db.close()
    logger.info("Database connections closed.")


# Initialize FastAPI App
app = FastAPI(
    title="KIRA API",
    description="Context-Aware Prompt Refinement Engine Backend API",
    version="3.0.0",
    lifespan=lifespan
)

# Enable CORS — origins controlled via ALLOWED_ORIGINS env variable
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modular routers
app.include_router(refine_router)
app.include_router(memories_router)
app.include_router(profile_router)
app.include_router(mcp_router)


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for uptime monitors (Railway, UptimeRobot, etc.)."""
    return {
        "status": "ok",
        "environment": ENVIRONMENT,
        "version": "3.0.0",
        "allowed_origins": ALLOWED_ORIGINS,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
