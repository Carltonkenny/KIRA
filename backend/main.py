import sys
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from database import db
from refiner import refine_prompt
from config import PORT, ENVIRONMENT

# Initialize FastAPI App
app = FastAPI(
    title="KIRA API",
    description="Context-Aware Prompt Refinement Engine Backend API",
    version="3.0.0"
)

# Enable CORS for frontend client routing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local MVP development simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event handler to verify database schema
@app.on_event("startup")
async def startup_event():
    try:
        await db.initialize_tables()
        print("KIRA INFO: FastAPI database schema successfully checked.")
    except Exception as e:
        print(f"KIRA ERROR: Database initialization failed at startup: {e}", file=sys.stderr)

# Shutdown event handler to clean connection pools
@app.on_event("shutdown")
async def shutdown_event():
    await db.close()
    print("KIRA INFO: Database connections closed.")

# --- Schema Definitions ---
class RefineRequest(BaseModel):
    prompt: str = Field(..., description="The raw prompt text to refine.")
    density: str = Field("short", description="Output density: 'short', 'medium', or 'detailed'.")
    session_id: str = Field(..., description="Unique chat session identifier.")

class ChatRequest(BaseModel):
    message: str = Field(..., description="Conversational feedback text.")
    session_id: str = Field(..., description="Unique chat session identifier.")

class MemoryRequest(BaseModel):
    category: str = Field("custom", description="Memory category: 'tech_stack', 'writing_style', etc.")
    fact: str = Field(..., description="Fact or constraint string to remember.")

class ProfileRequest(BaseModel):
    primary_use: str = Field("development", description="Core use case profile.")
    preferred_tone: str = Field("direct", description="Tone preference.")
    density_preference: str = Field("short", description="Default density.")

class MCPServerStatus(BaseModel):
    name: str
    command: str
    args: List[str]
    status: str  # "connected" or "disconnected"
    pid: Optional[int] = None

class MCPStatusResponse(BaseModel):
    servers: List[MCPServerStatus]

class MCPLogItem(BaseModel):
    id: str
    tool_name: str
    agent_name: Optional[str] = None
    arguments: str
    duration_ms: float
    status: str
    created_at: Any

# --- Helper Functions ---
import json
import subprocess
import os

def get_mcp_config() -> Dict[str, Any]:
    paths = [
        os.path.expanduser("~/.gemini/antigravity-ide/mcp_config.json"),
        r"C:\Users\user\.gemini\antigravity-ide\mcp_config.json"
    ]
    for path in paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f).get("mcpServers", {})
            except Exception as e:
                print(f"KIRA WARNING: Failed to read mcp_config from {path}: {e}", file=sys.stderr)
    return {}

def check_mcp_status() -> List[Dict[str, Any]]:
    config = get_mcp_config()
    if not config:
        return []

    running_procs = []
    try:
        result = subprocess.run(
            ['wmic', 'process', 'get', 'CommandLine,ProcessId'],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if lines:
                header = lines[0]
                pid_index = header.find("ProcessId")
                if pid_index != -1:
                    for line in lines[1:]:
                        if not line.strip():
                            continue
                        cmdline = line[:pid_index].strip()
                        pid_str = line[pid_index:].strip()
                        if cmdline and pid_str:
                            try:
                                running_procs.append({
                                    "cmdline": cmdline.lower(),
                                    "pid": int(pid_str)
                                })
                            except ValueError:
                                pass
    except Exception as e:
        print(f"KIRA WARNING: Error scanning processes: {e}", file=sys.stderr)

    status_list = []
    for name, server_info in config.items():
        cmd = server_info.get("command", "")
        args = server_info.get("args", [])
        server_url = server_info.get("serverUrl", "")

        connected = False
        pid = None

        if cmd:
            cmd_base = os.path.basename(cmd).lower().replace(".exe", "")
            for proc in running_procs:
                cmd_lower = proc["cmdline"]
                if cmd_base in cmd_lower:
                    matches_args = True
                    for arg in args:
                        if arg.lower() not in cmd_lower:
                            matches_args = False
                            break
                    if matches_args:
                        connected = True
                        pid = proc["pid"]
                        break
        elif server_url:
            connected = True

        status_list.append({
            "name": name,
            "command": cmd or server_url,
            "args": args,
            "status": "connected" if connected else "disconnected",
            "pid": pid
        })
    return status_list


# --- API Route Endpoints ---
@app.get("/health")
async def health_check():
    """Simple status endpoint to confirm service is running."""
    return {"status": "ok", "environment": ENVIRONMENT}

@app.post("/api/v1/refine")
async def api_refine(request: RefineRequest):
    """Refines a raw prompt utilizing stored user preferences and context."""
    user_id = "local_user"
    
    # 1. Fetch user profile & memory list
    profile = await db.get_profile(user_id)
    memories = await db.get_memories(user_id)
    
    # 2. Run prompt refinery
    result = refine_prompt(
        raw_prompt=request.prompt,
        profile=profile,
        memories=memories,
        density=request.density
    )
    
    # 3. Save auto-extracted memories
    for fact in result.new_memories:
        await db.add_memory(user_id, category="auto_learned", fact=fact)
        
    # 4. Save history
    await db.save_history(
        user_id=user_id,
        session_id=request.session_id,
        role="user",
        message=request.prompt,
        refined_prompt=result.refined_prompt
    )
    
    return {
        "refined_prompt": result.refined_prompt,
        "intent": result.intent,
        "domain": result.domain,
        "new_memories": result.new_memories,
        "quality_scores": result.quality_scores
    }

@app.post("/api/v1/chat")
async def api_chat(request: ChatRequest):
    """Performs stateful iterative refinements (follow-up corrections)."""
    user_id = "local_user"
    
    # Imports inside route to avoid circular dependency issues
    from mcp_server import forge_chat
    
    # Use the existing forge_chat logic to guarantee tool/api alignment
    response_text = await forge_chat(request.message, request.session_id)
    
    # Parse out the conversational reply and prompt from forge_chat output
    # Since forge_chat returns text, we split it by our delimiter "\n\n---\n\n"
    parts = response_text.split("\n\n---\n\n", 1)
    chat_reply = parts[0]
    refined_prompt = parts[1] if len(parts) > 1 else response_text
    
    return {
        "response": chat_reply,
        "refined_prompt": refined_prompt
    }

@app.get("/api/v1/memories")
async def api_get_memories():
    """Fetches all learned memories for the current local user."""
    return await db.get_memories("local_user")

@app.post("/api/v1/memories")
async def api_add_memory(request: MemoryRequest):
    """Manually adds a memory fact."""
    memory_id = await db.add_memory("local_user", request.category, request.fact)
    return {"id": memory_id, "status": "added"}

@app.delete("/api/v1/memories/{memory_id}")
async def api_delete_memory(memory_id: str):
    """Deletes a memory fact by its ID."""
    deleted = await db.delete_memory("local_user", memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory fact not found")
    return {"status": "deleted"}

@app.get("/api/v1/profile")
async def api_get_profile():
    """Fetches user preference profiles."""
    return await db.get_profile("local_user")

@app.post("/api/v1/profile")
async def api_save_profile(request: ProfileRequest):
    """Saves user style preferences."""
    profile_data = {
        "primary_use": request.primary_use,
        "preferred_tone": request.preferred_tone,
        "density_preference": request.density_preference
    }
    await db.save_profile("local_user", profile_data)
    return {"status": "saved"}

@app.get("/api/v1/mcp/status", response_model=MCPStatusResponse)
async def api_get_mcp_status():
    """Returns the current connection status of all configured MCP servers."""
    servers = check_mcp_status()
    return {"servers": servers}

@app.websocket("/api/v1/mcp/status/ws")
async def websocket_mcp_status(websocket: WebSocket):
    """WebSocket endpoint to stream live MCP server status."""
    await websocket.accept()
    try:
        while True:
            servers = check_mcp_status()
            await websocket.send_json({"servers": servers})
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"KIRA WARNING: WebSocket error: {e}", file=sys.stderr)

@app.get("/api/v1/mcp/logs")
async def api_get_mcp_logs(limit: int = 50):
    """Retrieves the recent MCP tool call trace logs from the database."""
    return await db.get_mcp_logs(limit=limit)

@app.get("/api/v1/history/all")
async def api_get_all_history(limit: int = 20):
    """Fetches global history of refined prompts with intent, domain, and quality scores."""
    if db.use_sqlite:
        return db._execute_sqlite(
            """
            SELECT id, session_id, role, message, refined_prompt, created_at 
            FROM chat_history 
            WHERE role = 'user' AND refined_prompt IS NOT NULL 
            ORDER BY created_at DESC 
            LIMIT $1
            """,
            (limit,)
        )
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, session_id, role, message, refined_prompt, created_at 
            FROM chat_history 
            WHERE role = 'user' AND refined_prompt IS NOT NULL 
            ORDER BY created_at DESC 
            LIMIT $1
            """,
            limit
        )
        return [dict(row) for row in rows]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)

