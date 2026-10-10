"""KIRA Database Manager — SQLite-only local database manager."""

import os
import re
import uuid
import sqlite3
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("kira.database")

# Constants
LOCAL_USER_ID = "local_user"
CATEGORY_AUTO = "auto_learned"
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), "kira_local.db")


class DatabaseManager:
    def __init__(self) -> None:
        self._initialized: bool = False

    async def initialize_pool(self) -> None:
        """Initializes database status. SQLite is pool-less, so this is a status guard."""
        if self._initialized:
            return
        self._initialized = True
        logger.info(f"SQLite database initialized with absolute path: {SQLITE_DB_PATH}")

    async def close(self) -> None:
        """Closes any database hooks. No-op for local SQLite."""
        self._initialized = False

    # --- SQLite Helpers ---

    @staticmethod
    def _convert_placeholders(query: str) -> str:
        """Safely convert PostgreSQL-style $N placeholders to SQLite ? placeholders."""
        return re.sub(r'\$(\d+)', '?', query)

    def _execute_sqlite(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Synchronous SQLite execution helper with safe placeholder conversion."""
        converted_query = self._convert_placeholders(query)

        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        try:
            if ";" in converted_query and not params:
                cursor.executescript(converted_query)
            else:
                cursor.execute(converted_query, params)
            conn.commit()
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            return []
        finally:
            cursor.close()
            conn.close()

    # --- Schema Init ---

    async def initialize_tables(self, schema_path: str = "schema.sql") -> None:
        """Reads the schema.sql file and executes it to create tables."""
        await self.initialize_pool()

        if not os.path.exists(schema_path):
            schema_path = os.path.join(os.path.dirname(__file__), schema_path)

        if not os.path.exists(schema_path):
            logger.warning(f"Schema file not found at {schema_path}.")
            return

        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        # Robust migration: inspect table columns and add project_id if missing before creating indexes
        conn = sqlite3.connect(SQLITE_DB_PATH)
        try:
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(user_memories)")
            mem_cols = [row[1] for row in cursor.fetchall()]
            if mem_cols and "project_id" not in mem_cols:
                cursor.execute("ALTER TABLE user_memories ADD COLUMN project_id VARCHAR(255) DEFAULT 'default'")

            cursor.execute("PRAGMA table_info(chat_history)")
            hist_cols = [row[1] for row in cursor.fetchall()]
            if hist_cols and "project_id" not in hist_cols:
                cursor.execute("ALTER TABLE chat_history ADD COLUMN project_id VARCHAR(255) DEFAULT 'default'")
            conn.commit()
        finally:
            conn.close()

        self._execute_sqlite(schema_sql)
        logger.info("SQLite database tables verified/created successfully.")

    # --- Profile Operations ---

    async def get_profile(self, user_id: str) -> Dict[str, Any]:
        """Fetches the user's profile. Returns a default dictionary if none exists."""
        await self.initialize_pool()
        default = {"primary_use": "development", "preferred_tone": "direct", "density_preference": "short"}
        query = "SELECT primary_use, preferred_tone, density_preference FROM user_profiles WHERE user_id = $1"

        rows = self._execute_sqlite(query, (user_id,))
        return rows[0] if rows else default

    async def save_profile(self, user_id: str, profile_data: Dict[str, Any]) -> None:
        """Saves or updates user profile details."""
        await self.initialize_pool()
        primary_use = profile_data.get("primary_use", "development")
        preferred_tone = profile_data.get("preferred_tone", "direct")
        density_preference = profile_data.get("density_preference", "short")

        self._execute_sqlite(
            """INSERT OR REPLACE INTO user_profiles (user_id, primary_use, preferred_tone, density_preference, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)""",
            (user_id, primary_use, preferred_tone, density_preference)
        )

    # --- Memory Operations ---

    async def get_memories(self, user_id: str, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns memories for the user. If project_id is given, returns project-specific + global memories."""
        await self.initialize_pool()
        if project_id and project_id != "all":
            query = """SELECT id, project_id, category, fact, created_at 
                       FROM user_memories 
                       WHERE user_id = ? AND (project_id = ? OR project_id = 'default' OR project_id = 'global')
                       ORDER BY created_at DESC"""
            return self._execute_sqlite(query, (user_id, project_id))
        else:
            query = "SELECT id, project_id, category, fact, created_at FROM user_memories WHERE user_id = ? ORDER BY created_at DESC"
            return self._execute_sqlite(query, (user_id,))

    async def add_memory(self, user_id: str, category: str, fact: str, project_id: str = "default") -> str:
        """Adds a new fact to user memories with project scope."""
        await self.initialize_pool()
        memory_id = f"mem-{uuid.uuid4().hex[:12]}"
        query = "INSERT INTO user_memories (id, user_id, project_id, category, fact, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
        self._execute_sqlite(query, (memory_id, user_id, project_id, category, fact))
        return memory_id

    async def delete_memory(self, user_id: str, memory_id: str) -> bool:
        """Deletes a fact from user memories."""
        await self.initialize_pool()
        query = "DELETE FROM user_memories WHERE id = $1 AND user_id = $2"
        self._execute_sqlite(query, (memory_id, user_id))
        return True

    # --- Chat History Operations ---

    async def get_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetches the conversation logs for a given session."""
        await self.initialize_pool()
        query = """SELECT id, role, message, refined_prompt, created_at
                   FROM chat_history WHERE session_id = $1
                   ORDER BY created_at ASC LIMIT $2"""
        return self._execute_sqlite(query, (session_id, limit))

    async def save_history(
        self, user_id: str, session_id: str, role: str, message: str, refined_prompt: Optional[str] = None, project_id: str = "default"
    ) -> str:
        """Appends a new turn to the chat logs with project scope."""
        await self.initialize_pool()
        history_id = f"hist-{uuid.uuid4().hex[:12]}"
        query = """INSERT INTO chat_history (id, user_id, project_id, session_id, role, message, refined_prompt, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"""
        self._execute_sqlite(query, (history_id, user_id, project_id, session_id, role, message, refined_prompt))
        return history_id

    async def get_all_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetches global history of refined prompts across all sessions."""
        await self.initialize_pool()
        query = """SELECT id, session_id, role, message, refined_prompt, created_at
                   FROM chat_history
                   WHERE role = 'user' AND refined_prompt IS NOT NULL
                   ORDER BY created_at DESC LIMIT $1"""
        return self._execute_sqlite(query, (limit,))

    # --- MCP Log Operations ---

    async def save_mcp_log(
        self, tool_name: str, agent_name: str, arguments: str, duration_ms: float, status: str
    ) -> str:
        """Saves a new log trace for an MCP tool call."""
        await self.initialize_pool()
        log_id = f"log-{uuid.uuid4().hex[:12]}"
        query = """INSERT INTO mcp_logs (id, tool_name, agent_name, arguments, duration_ms, status, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)"""
        self._execute_sqlite(query, (log_id, tool_name, agent_name, arguments, duration_ms, status))
        return log_id

    async def get_mcp_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetches the most recent MCP tool logs."""
        await self.initialize_pool()
        query = """SELECT id, tool_name, agent_name, arguments, duration_ms, status, created_at
                   FROM mcp_logs ORDER BY created_at DESC LIMIT $1"""
        return self._execute_sqlite(query, (limit,))


# Global Database Manager instance
db = DatabaseManager()
