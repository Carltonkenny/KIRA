import pytest
from unittest.mock import patch, MagicMock
from mcp_server import kira_enhance, get_kira_memories
from refiner import RefinerResponse

@pytest.mark.asyncio
async def test_kira_enhance_pass_through():
    # "git push" is less than 5 words and in SHELL_COMMANDS -> should pass through
    res = await kira_enhance("git push")
    assert res == "git push"

@pytest.mark.asyncio
@patch("mcp_server.refine_prompt")
@patch("mcp_server.memory.recall")
@patch("mcp_server.memory.remember")
@patch("mcp_server.db.get_profile")
@patch("mcp_server.db.save_history")
async def test_kira_enhance_refine(
    mock_save_history,
    mock_get_profile,
    mock_remember,
    mock_recall,
    mock_refine_prompt
):
    # Mock data setup
    mock_get_profile.return_value = {"preferred_tone": "direct"}
    mock_recall.return_value = [{"fact": "Uses Python 3.11"}]
    
    mock_refine_response = RefinerResponse(
        refined_prompt="Enhanced: build a server in python",
        intent="refinement",
        domain="python_development",
        new_memories=["Uses FastAPI"],
        quality_scores={"specificity": 4.5, "clarity": 4.5, "actionability": 4.5}
    )
    mock_refine_prompt.return_value = mock_refine_response
    
    # Run kira_enhance with a complex prompt
    res = await kira_enhance(
        prompt="build a server in python",
        agent_name="antigravity",
        session_id="test_session"
    )
    
    # Assertions
    assert res == "Enhanced: build a server in python"
    mock_recall.assert_called_once_with("build a server in python", user_id="local_user", agent_name="antigravity")
    mock_refine_prompt.assert_called_once()
    mock_remember.assert_called_once_with("Uses FastAPI", user_id="local_user", agent_name="antigravity")
    mock_save_history.assert_called_once()

@pytest.mark.asyncio
@patch("mcp_server.memory.get_all_memories")
async def test_get_kira_memories_tool(mock_get_all_memories):
    mock_get_all_memories.return_value = [
        {"id": "mem-1", "fact": "Uses Python 3.11", "category": "auto_learned"},
        {"id": "mem-2", "fact": "Prefers FastAPI", "category": "manual"}
    ]
    
    res = await get_kira_memories(agent_name="antigravity")
    assert "### KIRA Current Memories (Agent: antigravity)" in res
    assert "[auto_learned] Uses Python 3.11 (ID: mem-1)" in res
    assert "[manual] Prefers FastAPI (ID: mem-2)" in res
