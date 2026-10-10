"""End-to-End API Integration Tests for KIRA FastAPI Server.
Verifies all routes: health, profile, memories, MCP status, MCP logs, and refine.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from main import app
from refiner import RefinerResponse


@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "allowed_origins" in data


@pytest.mark.asyncio
async def test_profile_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get profile
        get_res = await client.get("/api/v1/profile")
        assert get_res.status_code == 200
        initial_data = get_res.json()
        assert "primary_use" in initial_data

        # Update profile
        update_res = await client.post(
            "/api/v1/profile",
            json={
                "primary_use": "fullstack_engineering",
                "preferred_tone": "concise",
                "density_preference": "short"
            }
        )
        assert update_res.status_code == 200
        assert update_res.json() == {"status": "saved"}

        # Verify updated profile
        verify_res = await client.get("/api/v1/profile")
        assert verify_res.status_code == 200
        assert verify_res.json()["primary_use"] == "fullstack_engineering"
        assert verify_res.json()["preferred_tone"] == "concise"


@pytest.mark.asyncio
async def test_memories_crud_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Add memory
        add_res = await client.post(
            "/api/v1/memories",
            json={"category": "tech_stack", "fact": "Uses TypeScript strict mode"}
        )
        assert add_res.status_code == 200
        mem_id = add_res.json()["id"]
        assert mem_id.startswith("mem-")

        # Get memories
        get_res = await client.get("/api/v1/memories")
        assert get_res.status_code == 200
        mems = get_res.json()
        matched = [m for m in mems if m.get("id") == mem_id or m.get("fact") == "Uses TypeScript strict mode"]
        assert len(matched) > 0

        # Delete memory
        del_res = await client.delete(f"/api/v1/memories/{mem_id}")
        assert del_res.status_code == 200
        assert del_res.json() == {"status": "deleted"}


@pytest.mark.asyncio
async def test_mcp_status_and_logs():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # MCP status (runs psutil scanner without crashing)
        status_res = await client.get("/api/v1/mcp/status")
        assert status_res.status_code == 200
        assert "servers" in status_res.json()

        # MCP logs
        logs_res = await client.get("/api/v1/mcp/logs")
        assert logs_res.status_code == 200
        assert isinstance(logs_res.json(), list)


@pytest.mark.asyncio
@patch("routes.refine.refine_prompt")
async def test_refine_api_endpoint(mock_refine_prompt):
    mock_refine_prompt.return_value = RefinerResponse(
        refined_prompt="# Refined API Architecture\nImplement endpoints.",
        intent="refinement",
        domain="backend_architecture",
        new_memories=["Uses FastAPI v0.115"],
        quality_scores={"specificity": 4.8, "clarity": 4.9, "actionability": 4.7}
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/refine",
            json={
                "prompt": "build auth microservice",
                "density": "short",
                "session_id": "test-e2e-session"
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "refinement"
        assert data["domain"] == "backend_architecture"
        assert "Refined API Architecture" in data["refined_prompt"]
