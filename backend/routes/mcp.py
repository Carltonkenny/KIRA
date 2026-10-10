"""MCP status monitoring, trace logs, and history route handlers."""

import json
import os
import time
import logging
from typing import Dict, List, Any

import psutil
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database import db
from routes.schemas import MCPStatusResponse

logger = logging.getLogger("kira.routes.mcp")

router = APIRouter(prefix="/api/v1", tags=["mcp"])

# Process scan cache — avoids scanning on every status poll
_status_cache: Dict[str, Any] = {"data": [], "timestamp": 0.0}
_CACHE_TTL_SECONDS = 3.0


def get_mcp_config() -> Dict[str, Any]:
    """Reads MCP server configuration. Checks common IDE config paths."""
    candidates = [
        os.path.expanduser("~/.gemini/antigravity-ide/mcp_config.json"),
        os.path.expanduser("~/.cursor/mcp.json"),
        os.path.expanduser("~/.config/claude/claude_desktop_config.json"),
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("mcpServers", {})
            except Exception as e:
                logger.warning(f"Failed to read mcp_config from {path}: {e}")
    return {}


def _get_running_cmdlines() -> List[str]:
    """Returns lowercased cmdline strings for all running processes via psutil."""
    cmdlines = []
    for proc in psutil.process_iter(["cmdline"]):
        try:
            cmdline = proc.info.get("cmdline") or []
            if cmdline:
                cmdlines.append(" ".join(cmdline).lower())
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return cmdlines


def check_mcp_status() -> List[Dict[str, Any]]:
    """Scans running processes to match configured MCP servers. Results cached for 3s."""
    now = time.monotonic()
    if (now - _status_cache["timestamp"]) < _CACHE_TTL_SECONDS and _status_cache["data"]:
        return _status_cache["data"]

    config = get_mcp_config()
    if not config:
        return []

    running_cmdlines = _get_running_cmdlines()

    status_list: List[Dict[str, Any]] = []
    for name, server_info in config.items():
        cmd = server_info.get("command", "")
        args = server_info.get("args", [])
        server_url = server_info.get("serverUrl", "")

        connected = False

        if cmd:
            cmd_base = os.path.basename(cmd).lower().replace(".exe", "")
            for cmdline in running_cmdlines:
                if cmd_base in cmdline:
                    if all(str(arg).lower() in cmdline for arg in args):
                        connected = True
                        break
        elif server_url:
            connected = True

        status_list.append({
            "name": name,
            "command": cmd or server_url,
            "args": args,
            "status": "connected" if connected else "disconnected",
            "pid": None,
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
    """WebSocket endpoint to stream live MCP server status updates."""
    import asyncio
    await websocket.accept()
    try:
        while True:
            servers = check_mcp_status()
            await websocket.send_json({"servers": servers})
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")


@router.get("/mcp/logs")
async def api_get_mcp_logs(limit: int = 50) -> list:
    """Retrieves the recent MCP tool call trace logs from the database."""
    return await db.get_mcp_logs(limit=limit)


@router.get("/history/all")
async def api_get_all_history(limit: int = 20) -> list:
    """Fetches global history of refined prompts."""
    return await db.get_all_history(limit=limit)
