import pytest
from unittest.mock import MagicMock
from database import DatabaseManager


@pytest.fixture
def mock_db_manager():
    manager = DatabaseManager()
    manager._execute_sqlite = MagicMock()
    return manager


@pytest.mark.asyncio
async def test_get_profile_default(mock_db_manager):
    # Setup mock return value for _execute_sqlite (simulating no profile found)
    mock_db_manager._execute_sqlite.return_value = []
    
    profile = await mock_db_manager.get_profile("test_user")
    
    assert profile["primary_use"] == "development"
    assert profile["density_preference"] == "short"
    mock_db_manager._execute_sqlite.assert_called_once()
    
    # Verify exact query and params passed to execute_sqlite
    args = mock_db_manager._execute_sqlite.call_args[0]
    assert "SELECT primary_use" in args[0]
    assert args[1] == ("test_user",)


@pytest.mark.asyncio
async def test_get_profile_custom(mock_db_manager):
    # Setup mock return value (simulating profile exists)
    mock_db_manager._execute_sqlite.return_value = [{
        "primary_use": "copywriting",
        "preferred_tone": "friendly",
        "density_preference": "detailed"
    }]
    
    profile = await mock_db_manager.get_profile("test_user")
    
    assert profile["primary_use"] == "copywriting"
    assert profile["preferred_tone"] == "friendly"
    assert profile["density_preference"] == "detailed"


@pytest.mark.asyncio
async def test_add_memory(mock_db_manager):
    mock_db_manager._execute_sqlite.return_value = []
    
    memory_id = await mock_db_manager.add_memory("test_user", "tech_stack", "Uses Pytest")
    
    assert memory_id.startswith("mem-")
    mock_db_manager._execute_sqlite.assert_called_once()
    # Check that SQL INSERT was executed with correct params
    args = mock_db_manager._execute_sqlite.call_args[0]
    assert "INSERT INTO user_memories" in args[0]
    assert args[1][0] == memory_id
    assert args[1][1] == "test_user"
    assert args[1][2] == "tech_stack"
    assert args[1][3] == "Uses Pytest"
