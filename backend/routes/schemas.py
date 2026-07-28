"""Pydantic schema definitions shared across all KIRA route modules."""

from pydantic import BaseModel, Field
from typing import List, Optional, Any


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
