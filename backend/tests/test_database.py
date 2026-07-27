import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from database import DatabaseManager

@pytest.fixture
def mock_db_manager():
    manager = DatabaseManager()
    manager.pool = MagicMock()
    return manager

@pytest.mark.asyncio
async def test_get_profile_default(mock_db_manager):
    # Setup mock return value for fetchrow (simulating no profile found)
    mock_conn = AsyncMock()
    mock_conn.fetchrow.return_value = None
    
    mock_db_manager.pool.acquire.return_value.__aenter__.return_value = mock_conn
    
    profile = await mock_db_manager.get_profile("test_user")
    
    assert profile["primary_use"] == "development"
    assert profile["density_preference"] == "short"
    mock_conn.fetchrow.assert_called_once()

@pytest.mark.asyncio
async def test_get_profile_custom(mock_db_manager):
    # Setup mock return value for fetchrow (simulating profile exists)
    mock_conn = AsyncMock()
    mock_conn.fetchrow.return_value = {
        "primary_use": "copywriting",
        "preferred_tone": "friendly",
        "density_preference": "detailed"
    }
    
    mock_db_manager.pool.acquire.return_value.__aenter__.return_value = mock_conn
    
    profile = await mock_db_manager.get_profile("test_user")
    
    assert profile["primary_use"] == "copywriting"
    assert profile["preferred_tone"] == "friendly"
    assert profile["density_preference"] == "detailed"

@pytest.mark.asyncio
async def test_add_memory(mock_db_manager):
    mock_conn = AsyncMock()
    mock_db_manager.pool.acquire.return_value.__aenter__.return_value = mock_conn
    
    memory_id = await mock_db_manager.add_memory("test_user", "tech_stack", "Uses Pytest")
    
    assert memory_id.startswith("mem-")
    mock_conn.execute.assert_called_once()
    # Check that SQL INSERT was executed with correct params
    args = mock_conn.execute.call_args[0]
    assert "INSERT INTO user_memories" in args[0]
    assert args[1] == memory_id
    assert args[2] == "test_user"
    assert args[3] == "tech_stack"
    assert args[4] == "Uses Pytest"
