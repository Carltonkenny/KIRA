"""Reusable decorators for MCP tool functions."""

import asyncio
import functools
import json
import time
from typing import Callable, Any

from database import db


def traced_tool(tool_name: str, agent_field: str = "agent_name"):
    """
    Decorator that wraps an async MCP tool function with execution timing
    and automatic logging to the mcp_logs database table.

    Args:
        tool_name: The name recorded in the log (e.g. "kira_enhance").
        agent_field: The keyword argument name that contains the calling agent identifier.
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            start_t = time.perf_counter()
            status = "success"
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                status = f"error: {str(e)}"
                raise
            finally:
                duration = (time.perf_counter() - start_t) * 1000.0
                agent = kwargs.get(agent_field, "unknown")
                if not agent:
                    agent = "unknown"
                # Serialize all kwargs for the log (skip very large values)
                safe_kwargs = {}
                for k, v in kwargs.items():
                    str_val = str(v)
                    safe_kwargs[k] = str_val if len(str_val) < 2000 else str_val[:2000] + "..."
                args_str = json.dumps(safe_kwargs, default=str)
                asyncio.create_task(db.save_mcp_log(
                    tool_name=tool_name,
                    agent_name=agent,
                    arguments=args_str,
                    duration_ms=duration,
                    status=status
                ))
        return wrapper
    return decorator
