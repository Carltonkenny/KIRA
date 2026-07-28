"""KIRA Database Manager — SQLite (local) and PostgreSQL (production) dual-mode adapter."""

import os
import re
import sys
import uuid
import sqlite3
import asyncpg
from typing import List, Dict, Any, Optional
from config import POSTGRES_URL

# Mode: 'local' (SQLite) or 'postgres' (Supabase/PostgreSQL)
DATABASE_MODE = os.getenv("DATABASE_MODE", "local").lower()
SQLITE_DB_PATH = "kira_local.db"


class DatabaseManager:
    def __init__(self) -> None:
        self.pool: Optional[asyncpg.Pool] = None
        self.use_sqlite: bool = (DATABASE_MODE == "local")
        self._initialized: bool = False

    async def initialize_pool(self) -> None:
        """Initializes the database pool. Falls back to SQLite if PostgreSQL fails."""
        if self._initialized:
            return
        self._initialized = True

        if self.use_sqlite:
            print("KIRA INFO: Operating in local SQLite mode.")
            return

        if self.pool is not None:
            return

        try:
            cleaned_url = POSTGRES_URL
            if cleaned_url.startswith("postgresql+asyncpg://"):
                cleaned_url = cleaned_url.replace("postgresql+asyncpg://", "postgresql://")
            elif cleaned_url.startswith("postgres+asyncpg://"):
                cleaned_url = cleaned_url.replace("postgres+asyncpg://", "postgresql://")
            elif cleaned_url.startswith("postgres://"):
                cleaned_url = cleaned_url.replace("postgres://", "postgresql://")

            self.pool = await asyncpg.create_pool(cleaned_url, min_size=1, max_size=10)
            print("KIRA INFO: PostgreSQL pool initialized successfully.")
        except Exception as e:
            print(f"KIRA WARNING: Failed to connect to PostgreSQL. Falling back to SQLite. Error: {e}", file=sys.stderr)
            self.use_sqlite = True

    async def close(self) -> None:
        """Closes any open PostgreSQL connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None
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
            print(f"KIRA WARNING: Schema file not found at {schema_path}.", file=sys.stderr)
            return

        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        if self.use_sqlite:
            self._execute_sqlite(schema_sql)
            print("KIRA INFO: SQLite database tables initialized successfully.")
            return

        async with self.pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(schema_sql)
        print("KIRA INFO: PostgreSQL database tables verified/created successfully.")

    # --- Profile Operations ---

    async def get_profile(self, user_id: str) -> Dict[str, Any]:
        """Fetches the user's profile. Returns a default dictionary if none exists."""
        await self.initialize_pool()
        default = {"primary_use": "development", "preferred_tone": "direct", "density_preference": "short"}
        query = "SELECT primary_use, preferred_tone, density_preference FROM user_profiles WHERE user_id = $1"

        if self.use_sqlite:
            rows = self._execute_sqlite(query, (user_id,))
            return rows[0] if rows else default

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
            return dict(row) if row else default

    async def save_profile(self, user_id: str, profile_data: Dict[str, Any]) -> None:
        """Saves or updates user profile details."""
        await self.initialize_pool()
        primary_use = profile_data.get("primary_use", "development")
        preferred_tone = profile_data.get("preferred_tone", "direct")
        density_preference = profile_data.get("density_preference", "short")

        if self.use_sqlite:
            # SQLite uses INSERT OR REPLACE instead of ON CONFLICT
            self._execute_sqlite(
                """INSERT OR REPLACE INTO user_profiles (user_id, primary_use, preferred_tone, density_preference, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)""",
                (user_id, primary_use, preferred_tone, density_preference)
            )
            return

        async with self.pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO user_profiles (user_id, primary_use, preferred_tone, density_preference, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO UPDATE
                SET primary_use = EXCLUDED.primary_use,
                    preferred_tone = EXCLUDED.preferred_tone,
                    density_preference = EXCLUDED.density_preference,
                    updated_at = CURRENT_TIMESTAMP""",
                user_id, primary_use, preferred_tone, density_preference
            )

    # --- Memory Operations ---

    async def get_memories(self, user_id: str) -> List[Dict[str, Any]]:
        """Returns all memories for the user."""
        await self.initialize_pool()
        query = "SELECT id, category, fact, created_at FROM user_memories WHERE user_id = $1 ORDER BY created_at DESC"

        if self.use_sqlite:
            return self._execute_sqlite(query, (user_id,))

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, user_id)
            return [dict(row) for row in rows]

    async def add_memory(self, user_id: str, category: str, fact: str) -> str:
        """Adds a new fact to user memories."""
        await self.initialize_pool()
        memory_id = f"mem-{uuid.uuid4().hex[:12]}"
        query = "INSERT INTO user_memories (id, user_id, category, fact, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)"

        if self.use_sqlite:
            self._execute_sqlite(query, (memory_id, user_id, category, fact))
            return memory_id

        async with self.pool.acquire() as conn:
            await conn.execute(query, memory_id, user_id, category, fact)
        return memory_id

    async def delete_memory(self, user_id: str, memory_id: str) -> bool:
        """Deletes a fact from user memories."""
        await self.initialize_pool()
        query = "DELETE FROM user_memories WHERE id = $1 AND user_id = $2"

        if self.use_sqlite:
            self._execute_sqlite(query, (memory_id, user_id))
            return True

        async with self.pool.acquire() as conn:
            result = await conn.execute(query, memory_id, user_id)
            return result.endswith("1")

    # --- Chat History Operations ---

    async def get_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetches the conversation logs for a given session."""
        await self.initialize_pool()
        query = """SELECT id, role, message, refined_prompt, created_at
                   FROM chat_history WHERE session_id = $1
                   ORDER BY created_at ASC LIMIT $2"""

        if self.use_sqlite:
            return self._execute_sqlite(query, (session_id, limit))

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, session_id, limit)
            return [dict(row) for row in rows]

    async def save_history(
        self, user_id: str, session_id: str, role: str, message: str, refined_prompt: Optional[str] = None
    ) -> str:
        """Appends a new turn to the chat logs."""
        await self.initialize_pool()
        history_id = f"hist-{uuid.uuid4().hex[:12]}"
        query = """INSERT INTO chat_history (id, user_id, session_id, role, message, refined_prompt, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)"""

        if self.use_sqlite:
            self._execute_sqlite(query, (history_id, user_id, session_id, role, message, refined_prompt))
            return history_id

        async with self.pool.acquire() as conn:
            await conn.execute(query, history_id, user_id, session_id, role, message, refined_prompt)
        return history_id

    async def get_all_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetches global history of refined prompts across all sessions."""
        await self.initialize_pool()
        query = """SELECT id, session_id, role, message, refined_prompt, created_at
                   FROM chat_history
                   WHERE role = 'user' AND refined_prompt IS NOT NULL
                   ORDER BY created_at DESC LIMIT $1"""

        if self.use_sqlite:
            return self._execute_sqlite(query, (limit,))

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, limit)
            return [dict(row) for row in rows]

    # --- MCP Log Operations ---

    async def save_mcp_log(
        self, tool_name: str, agent_name: str, arguments: str, duration_ms: float, status: str
    ) -> str:
        """Saves a new log trace for an MCP tool call."""
        await self.initialize_pool()
        log_id = f"log-{uuid.uuid4().hex[:12]}"
        query = """INSERT INTO mcp_logs (id, tool_name, agent_name, arguments, duration_ms, status, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)"""

        if self.use_sqlite:
            self._execute_sqlite(query, (log_id, tool_name, agent_name, arguments, duration_ms, status))
            return log_id

        async with self.pool.acquire() as conn:
            await conn.execute(query, log_id, tool_name, agent_name, arguments, duration_ms, status)
        return log_id

    async def get_mcp_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetches the most recent MCP tool logs."""
        await self.initialize_pool()
        query = """SELECT id, tool_name, agent_name, arguments, duration_ms, status, created_at
                   FROM mcp_logs ORDER BY created_at DESC LIMIT $1"""

        if self.use_sqlite:
            return self._execute_sqlite(query, (limit,))

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, limit)
            return [dict(row) for row in rows]


# Global Database Manager instance
db = DatabaseManager()
