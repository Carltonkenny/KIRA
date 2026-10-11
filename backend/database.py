"""KIRA Database Manager — Unified PostgreSQL (Neon/Supabase) & SQLite Database Manager."""

import os
import re
import uuid
import sqlite3
import logging
from typing import List, Dict, Any, Optional
import asyncpg
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger("kira.database")

# Constants
LOCAL_USER_ID = "local_user"
CATEGORY_AUTO = "auto_learned"
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), "kira_local.db")

DATABASE_MODE = os.getenv("DATABASE_MODE", "postgres").lower()
POSTGRES_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL", "")


class DatabaseManager:
    def __init__(self) -> None:
        self.mode: str = "postgres" if DATABASE_MODE == "postgres" and POSTGRES_URL else "local"
        self.pool: Optional[asyncpg.Pool] = None
        self._initialized: bool = False

    async def initialize_pool(self) -> None:
        """Initializes connection pool for PostgreSQL or verifies SQLite ready status."""
        if self._initialized:
            return

        if self.mode == "postgres":
            try:
                # Clean URL if quotes were accidentally enclosed
                dsn = POSTGRES_URL.strip().strip('"').strip("'")
                logger.info("Initializing asyncpg connection pool to Neon PostgreSQL...")
                self.pool = await asyncpg.create_pool(
                    dsn,
                    ssl="require",
                    min_size=1,
                    max_size=10,
                    command_timeout=30,
                )
                self._initialized = True
                logger.info("Connected successfully to Neon PostgreSQL database pool.")
                return
            except Exception as e:
                logger.error(f"Failed to connect to PostgreSQL ({e}). Falling back to local SQLite.", exc_info=True)
                self.mode = "local"

        # Local SQLite fallback
        self._initialized = True
        logger.info(f"SQLite database mode active with path: {SQLITE_DB_PATH}")

    async def close(self) -> None:
        """Closes connection pool if active."""
        if self.pool:
            await self.pool.close()
            self.pool = None
        self._initialized = False

    # --- SQLite Synchronous Helpers ---

    @staticmethod
    def _convert_placeholders(query: str) -> str:
        """Convert PostgreSQL-style $N placeholders to SQLite ? placeholders."""
        return re.sub(r'\$(\d+)', '?', query)

    def _execute_sqlite(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
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

    # --- Schema Initialization ---

    async def initialize_tables(self, schema_path: str = "schema.sql") -> None:
        """Reads schema.sql and verifies/creates all required tables."""
        await self.initialize_pool()

        if not os.path.exists(schema_path):
            schema_path = os.path.join(os.path.dirname(__file__), schema_path)

        if not os.path.exists(schema_path):
            logger.warning(f"Schema file not found at {schema_path}.")
            return

        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        if self.mode == "postgres" and self.pool:
            async with self.pool.acquire() as conn:
                await conn.execute(schema_sql)
            logger.info("Neon PostgreSQL tables verified successfully.")
            return

        # SQLite execution
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
        logger.info("SQLite database tables verified successfully.")

    # --- Profile Operations ---

    async def get_profile(self, user_id: str) -> Dict[str, Any]:
        await self.initialize_pool()
        default = {"primary_use": "development", "preferred_tone": "direct", "density_preference": "short"}
        query = "SELECT primary_use, preferred_tone, density_preference FROM user_profiles WHERE user_id = $1"

        if self.mode == "postgres" and self.pool:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(query, user_id)
                return dict(row) if row else default

        rows = self._execute_sqlite(query, (user_id,))
        return rows[0] if rows else default

    async def save_profile(self, user_id: str, profile_data: Dict[str, Any]) -> None:
        await self.initialize_pool()
        primary_use = profile_data.get("primary_use", "development")
        preferred_tone = profile_data.get("preferred_tone", "direct")
        density_preference = profile_data.get("density_preference", "short")

        if self.mode == "postgres" and self.pool:
            query = """INSERT INTO user_profiles (user_id, primary_use, preferred_tone, density_preference, updated_at)
                       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                       ON CONFLICT (user_id) DO UPDATE SET
                           primary_use = EXCLUDED.primary_use,
                           preferred_tone = EXCLUDED.preferred_tone,
                           density_preference = EXCLUDED.density_preference,
                           updated_at = CURRENT_TIMESTAMP"""
            async with self.pool.acquire() as conn:
                await conn.execute(query, user_id, primary_use, preferred_tone, density_preference)
            return

        self._execute_sqlite(
            """INSERT OR REPLACE INTO user_profiles (user_id, primary_use, preferred_tone, density_preference, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)""",
            (user_id, primary_use, preferred_tone, density_preference)
        )

    # --- Memory Operations ---

    async def get_memories(self, user_id: str, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        await self.initialize_pool()
        if project_id and project_id != "all":
            query = """SELECT id, project_id, category, fact, created_at 
                       FROM user_memories 
                       WHERE user_id = $1 AND (project_id = $2 OR project_id = 'global')
                       ORDER BY created_at DESC"""
            if self.mode == "postgres" and self.pool:
                async with self.pool.acquire() as conn:
                    rows = await conn.fetch(query, user_id, project_id)
                    return [dict(r) for r in rows]
            return self._execute_sqlite(query, (user_id, project_id))
        else:
            query = "SELECT id, project_id, category, fact, created_at FROM user_memories WHERE user_id = $1 ORDER BY created_at DESC"
            if self.mode == "postgres" and self.pool:
                async with self.pool.acquire() as conn:
                    rows = await conn.fetch(query, user_id)
                    return [dict(r) for r in rows]
            return self._execute_sqlite(query, (user_id,))

    async def add_memory(self, user_id: str, category: str, fact: str, project_id: str = "default") -> str:
        await self.initialize_pool()
        memory_id = f"mem-{uuid.uuid4().hex[:12]}"
        query = "INSERT INTO user_memories (id, user_id, project_id, category, fact, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)"

        if self.mode == "postgres" and self.pool:
            async with self.pool.acquire() as conn:
                await conn.execute(query, memory_id, user_id, project_id, category, fact)
            return memory_id

        self._execute_sqlite(query, (memory_id, user_id, project_id, category, fact))
        return memory_id

    async def delete_memory(self, user_id: str, memory_id: str) -> bool:
        await self.initialize_pool()
        query = "DELETE FROM user_memories WHERE id = $1 AND user_id = $2"

        if self.mode == "postgres" and self.pool:
            async with self.pool.acquire() as conn:
                res = await conn.execute(query, memory_id, user_id)
                return True

        self._execute_sqlite(query, (memory_id, user_id))
        return True

    # --- Chat History Operations ---

    async def get_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        await self.initialize_pool()
        query = """SELECT id, role, message, refined_prompt, created_at
                   FROM chat_history WHERE session_id = $1
                   ORDER BY created_at ASC LIMIT $2"""

        if self.mode == "postgres" and self.pool:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, session_id, limit)
                return [dict(r) for r in rows]

        return self._execute_sqlite(query, (session_id, limit))

    async def save_history(
        self, user_id: str, session_id: str, role: str, message: str, refined_prompt: Optional[str] = None, project_id: str = "default"
    ) -> str:
        await self.initialize_pool()
        history_id = f"hist-{uuid.uuid4().hex[:12]}"
        query = """INSERT INTO chat_history (id, user_id, project_id, session_id, role, message, refined_prompt, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)"""

        if self.mode == "postgres" and self.pool:
            async with self.pool.acquire() as conn:
                await conn.execute(query, history_id, user_id, project_id, session_id, role, message, refined_prompt)
            return history_id

        self._execute_sqlite(query, (history_id, user_id, project_id, session_id, role, message, refined_prompt))
        return history_id

    async def get_all_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        await self.initialize_pool()
        query = """SELECT id, session_id, role, message, refined_prompt, created_at
                   FROM chat_history
                   WHERE role = 'user' AND refined_prompt IS NOT NULL
                   ORDER BY created_at DESC LIMIT $1"""

        if self.mode == "postgres" and self.pool:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, limit)
                return [dict(r) for r in rows]

        return self._execute_sqlite(query, (limit,))

    # --- MCP Log Operations ---

    async def save_mcp_log(
        self, tool_name: str, agent_name: str, arguments: str, duration_ms: float, status: str
    ) -> str:
        await self.initialize_pool()
        log_id = f"log-{uuid.uuid4().hex[:12]}"
        query = """INSERT INTO mcp_logs (id, tool_name, agent_name, arguments, duration_ms, status, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)"""

        if self.mode == "postgres" and self.pool:
            async with self.pool.acquire() as conn:
                await conn.execute(query, log_id, tool_name, agent_name, arguments, duration_ms, status)
            return log_id

        self._execute_sqlite(query, (log_id, tool_name, agent_name, arguments, duration_ms, status))
        return log_id

    async def get_mcp_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        await self.initialize_pool()
        query = """SELECT id, tool_name, agent_name, arguments, duration_ms, status, created_at
                   FROM mcp_logs ORDER BY created_at DESC LIMIT $1"""

        if self.mode == "postgres" and self.pool:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, limit)
                return [dict(r) for r in rows]

        return self._execute_sqlite(query, (limit,))


# Global Database Manager instance
db = DatabaseManager()
