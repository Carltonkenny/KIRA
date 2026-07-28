"""KIRA API — Context-Aware Prompt Refinement Engine Backend."""

import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import db
from config import PORT, ENVIRONMENT
from routes.refine import router as refine_router
from routes.memories import router as memories_router
from routes.profile import router as profile_router
from routes.mcp import router as mcp_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — replaces deprecated on_event decorators."""
    try:
        await db.initialize_tables()
        print("KIRA INFO: FastAPI database schema successfully checked.")
    except Exception as e:
        print(f"KIRA ERROR: Database initialization failed at startup: {e}", file=sys.stderr)
    yield
    await db.close()
    print("KIRA INFO: Database connections closed.")


# Initialize FastAPI App
app = FastAPI(
    title="KIRA API",
    description="Context-Aware Prompt Refinement Engine Backend API",
    version="3.0.0",
    lifespan=lifespan
)

# Enable CORS — restricted to local dev frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
    """Simple status endpoint to confirm service is running."""
    return {"status": "ok", "environment": ENVIRONMENT}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
