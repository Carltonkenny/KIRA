import os
import sys
import uuid
import sqlite3
import asyncpg
from typing import List, Dict, Any, Optional
from config import POSTGRES_URL

# Mode: 'local' (SQLite) or 'postgres' (Supabase/PostgreSQL)
# We default to 'local' if postgres connection fails or if DATABASE_MODE is local
DATABASE_MODE = os.getenv("DATABASE_MODE", "local").lower()
SQLITE_DB_PATH = "kira_local.db"

class DatabaseManager:
    def __init__(self):
        self.pool = None
        self.use_sqlite = (DATABASE_MODE == "local")

    async def initialize_pool(self) -> None:
        """Initializes the database pool. Falls back to SQLite if PostgreSQL fails."""
        if self.use_sqlite:
            print("KIRA INFO: Operating in local SQLite mode.")
            return

        if self.pool is not None:
            return
        
        try:
            # Clean connection string to be compatible with asyncpg
            cleaned_url = POSTGRES_URL
            if cleaned_url.startswith("postgresql+asyncpg://"):
                cleaned_url = cleaned_url.replace("postgresql+asyncpg://", "postgresql://")
            elif cleaned_url.startswith("postgres+asyncpg://"):
                cleaned_url = cleaned_url.replace("postgres+asyncpg://", "postgresql://")
            elif cleaned_url.startswith("postgres://"):
                cleaned_url = cleaned_url.replace("postgres://", "postgresql://")

            self.pool = await asyncpg.create_pool(
                cleaned_url,
                min_size=1,
                max_size=10
            )
            print("KIRA INFO: PostgreSQL pool initialized successfully.")
        except Exception as e:
            print(f"KIRA WARNING: Failed to connect to PostgreSQL. Falling back to local SQLite ({SQLITE_DB_PATH}). Error: {e}", file=sys.stderr)
            self.use_sqlite = True

    async def close(self) -> None:
        """Closes any open PostgreSQL connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None

    def _execute_sqlite(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Synchronous SQLite execution helper."""
        # Convert Postgres style placeholder $1, $2 to SQLite style ?
        for i in range(1, 10):
            query = query.replace(f"${i}", "?")
            
        # Convert ON CONFLICT clause style differences
        if "ON CONFLICT" in query:
            # Simple conversion for profileupsert
            query = query.replace(
                "ON CONFLICT (user_id) DO UPDATE SET primary_use = EXCLUDED.primary_use, preferred_tone = EXCLUDED.preferred_tone, density_preference = EXCLUDED.density_preference, updated_at = CURRENT_TIMESTAMP",
                ""
            )
            query = query.replace("INSERT INTO user_profiles", "INSERT OR REPLACE INTO user_profiles")

        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        try:
            if ";" in query and not params:
                cursor.executescript(query)
            else:
                cursor.execute(query, params)
            conn.commit()
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            return []
        finally:
            cursor.close()
            conn.close()

    async def initialize_tables(self, schema_path: str = "schema.sql") -> None:
        """Reads the schema.sql file and executes it to create tables."""
        await self.initialize_pool()

        # Find schema file (checking local dir as well as parent)
        if not os.path.exists(schema_path):
            schema_path = os.path.join(os.path.dirname(__file__), schema_path)

        if not os.path.exists(schema_path):
            print(f"KIRA WARNING: Schema file not found at {schema_path}. Skipping table generation.", file=sys.stderr)
            return

        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        if self.use_sqlite:
            # SQLite does not support VARCHAR(255) constraints but works fine with TEXT.
            # Clean PostgreSQL specific types if needed
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

        if self.use_sqlite:
            rows = self._execute_sqlite(
                "SELECT primary_use, preferred_tone, density_preference FROM user_profiles WHERE user_id = $1",
                (user_id,)
            )
            if rows:
                return rows[0]
            return {
                "primary_use": "development",
                "preferred_tone": "direct",
                "density_preference": "short"
            }

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT primary_use, preferred_tone, density_preference FROM user_profiles WHERE user_id = $1",
                user_id
            )
            if row:
                return dict(row)
            return {
                "primary_use": "development",
                "preferred_tone": "direct",
                "density_preference": "short"
            }

    async def save_profile(self, user_id: str, profile_data: Dict[str, Any]) -> None:
        """Saves or updates user profile details."""
        await self.initialize_pool()

        primary_use = profile_data.get("primary_use", "development")
        preferred_tone = profile_data.get("preferred_tone", "direct")
        density_preference = profile_data.get("density_preference", "short")

        if self.use_sqlite:
            self._execute_sqlite(
                """
                INSERT INTO user_profiles (user_id, primary_use, preferred_tone, density_preference, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO UPDATE
                SET primary_use = EXCLUDED.primary_use,
                    preferred_tone = EXCLUDED.preferred_tone,
                    density_preference = EXCLUDED.density_preference,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (user_id, primary_use, preferred_tone, density_preference)
            )
            return

        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO user_profiles (user_id, primary_use, preferred_tone, density_preference, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO UPDATE
                SET primary_use = EXCLUDED.primary_use,
                    preferred_tone = EXCLUDED.preferred_tone,
                    density_preference = EXCLUDED.density_preference,
                    updated_at = CURRENT_TIMESTAMP
                """,
                user_id, primary_use, preferred_tone, density_preference
            )

    # --- Memory Operations ---
    async def get_memories(self, user_id: str) -> List[Dict[str, Any]]:
        """Returns all memories for the user."""
        await self.initialize_pool()

        if self.use_sqlite:
            return self._execute_sqlite(
                "SELECT id, category, fact, created_at FROM user_memories WHERE user_id = $1 ORDER BY created_at DESC",
                (user_id,)
            )

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, category, fact, created_at FROM user_memories WHERE user_id = $1 ORDER BY created_at DESC",
                user_id
            )
            return [dict(row) for row in rows]

    async def add_memory(self, user_id: str, category: str, fact: str) -> str:
        """Adds a new fact to user memories."""
        await self.initialize_pool()
        memory_id = f"mem-{uuid.uuid4().hex[:12]}"

        if self.use_sqlite:
            self._execute_sqlite(
                "INSERT INTO user_memories (id, user_id, category, fact, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)",
                (memory_id, user_id, category, fact)
            )
            return memory_id

        async with self.pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO user_memories (id, user_id, category, fact, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)",
                memory_id, user_id, category, fact
            )
        return memory_id

    async def delete_memory(self, user_id: str, memory_id: str) -> bool:
        """Deletes a fact from user memories."""
        await self.initialize_pool()

        if self.use_sqlite:
            self._execute_sqlite(
                "DELETE FROM user_memories WHERE id = $1 AND user_id = $2",
                (memory_id, user_id)
            )
            return True

        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM user_memories WHERE id = $1 AND user_id = $2",
                memory_id, user_id
            )
            return result.endswith("1")

    # --- Chat History Operations ---
    async def get_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetches the conversation logs for a given session."""
        await self.initialize_pool()

        if self.use_sqlite:
            return self._execute_sqlite(
                """
                SELECT id, role, message, refined_prompt, created_at 
                FROM chat_history 
                WHERE session_id = $1 
                ORDER BY created_at ASC 
                LIMIT $2
                """,
                (session_id, limit)
            )

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, role, message, refined_prompt, created_at 
                FROM chat_history 
                WHERE session_id = $1 
                ORDER BY created_at ASC 
                LIMIT $2
                """,
                session_id, limit
            )
            return [dict(row) for row in rows]

    async def save_history(
        self, user_id: str, session_id: str, role: str, message: str, refined_prompt: Optional[str] = None
    ) -> str:
        """Appends a new turn to the chat logs."""
        await self.initialize_pool()
        history_id = f"hist-{uuid.uuid4().hex[:12]}"

        if self.use_sqlite:
            self._execute_sqlite(
                """
                INSERT INTO chat_history (id, user_id, session_id, role, message, refined_prompt, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                """,
                (history_id, user_id, session_id, role, message, refined_prompt)
            )
            return history_id

        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO chat_history (id, user_id, session_id, role, message, refined_prompt, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                """,
                history_id, user_id, session_id, role, message, refined_prompt
            )
        return history_id

# Global Database Manager instance
db = DatabaseManager()
