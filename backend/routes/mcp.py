"""MCP status monitoring, trace logs, and history route handlers."""

import sys
import json
import os
import subprocess
import asyncio
import time
from typing import Dict, List, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database import db
from routes.schemas import MCPStatusResponse

router = APIRouter(prefix="/api/v1", tags=["mcp"])

# --- Process scan cache to avoid spawning wmic every 2 seconds ---
_status_cache: Dict[str, Any] = {"data": [], "timestamp": 0.0}
_CACHE_TTL_SECONDS = 3.0


def get_mcp_config() -> Dict[str, Any]:
    """Reads the MCP server configuration from the IDE config file."""
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
    """Scans OS processes to match configured MCP servers. Results are cached for 3 seconds."""
    now = time.monotonic()
    if (now - _status_cache["timestamp"]) < _CACHE_TTL_SECONDS and _status_cache["data"]:
        return _status_cache["data"]

    config = get_mcp_config()
    if not config:
        return []

    running_procs: List[Dict[str, Any]] = []
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

    status_list: List[Dict[str, Any]] = []
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
                    matches_args = all(arg.lower() in cmd_lower for arg in args)
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

    _status_cache["data"] = status_list
    _status_cache["timestamp"] = now
    return status_list


# --- Route Handlers ---

@router.get("/mcp/status", response_model=MCPStatusResponse)
async def api_get_mcp_status() -> dict:
    """Returns the current connection status of all configured MCP servers."""
    servers = check_mcp_status()
    return {"servers": servers}


@router.websocket("/mcp/status/ws")
async def websocket_mcp_status(websocket: WebSocket) -> None:
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


@router.get("/mcp/logs")
async def api_get_mcp_logs(limit: int = 50) -> list:
    """Retrieves the recent MCP tool call trace logs from the database."""
    return await db.get_mcp_logs(limit=limit)


@router.get("/history/all")
async def api_get_all_history(limit: int = 20) -> list:
    """Fetches global history of refined prompts."""
    return await db.get_all_history(limit=limit)
