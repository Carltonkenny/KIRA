"""Live functional test for the KIRA MCP server.

Exercises MCP tools directly and verifies DB writes for memories, history, and logs.
"""

import asyncio
import logging
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(name)s - %(message)s")
logger = logging.getLogger("kira.live_test")

DB_PATH = Path(__file__).with_name("kira_local.db")
TEST_SESSION = f"live-test-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
AGENT = "cline-live-test"

sys.path.insert(0, str(Path(__file__).parent))
from mcp_server import kira_enhance, get_kira_memories
from database import db
import memory


def db_query(query: str, params: tuple = ()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        cur.execute(query, params)
        rows = cur.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


async def run_tests():
    logger.info("Initializing database tables...")
    await db.initialize_tables()
    memory_before = db_query("SELECT COUNT(*) AS c FROM user_memories")[0]["c"]
    logger.info(f"Local memory count before tests: {memory_before}")

    results = []

    # 1. Shell command pass-through
    p1 = "git push origin main"
    r1 = await kira_enhance(prompt=p1, agent_name=AGENT, session_id=TEST_SESSION, density="short")
    ok1 = r1 == p1
    results.append(("pass-through shell command", ok1, r1[:200]))
    logger.info(f"[1] input={p1!r} output={r1!r} ok={ok1}")

    # 2. Short targeted pass-through
    p2 = "fix typo on line 42 in server.py"
    r2 = await kira_enhance(prompt=p2, agent_name=AGENT, session_id=TEST_SESSION, density="short")
    ok2 = r2 == p2
    results.append(("pass-through targeted instruction", ok2, r2[:200]))
    logger.info(f"[2] input={p2!r} output={r2!r} ok={ok2}")

    # 3. Vague coding request -> enhancement (calls DeepSeek)
    p3 = "build a login page in react with email validation"
    r3 = await kira_enhance(prompt=p3, agent_name=AGENT, session_id=TEST_SESSION, density="short")
    ok3 = r3 != p3 and len(r3) > len(p3)
    results.append(("enhance vague request", ok3, r3[:300]))
    logger.info(f"[3] enhanced ok={ok3} preview={r3[:300]!r}")

    # 4. Force local SQLite fallback by disabling Mem0 client
    logger.info("[4] Testing local SQLite fallback for memory storage")
    original_client = memory._client
    memory._client = None
    original_get_mem0 = memory.get_mem0_client
    memory.get_mem0_client = lambda: None

    p4 = "Remember that I always use Python 3.12 and FastAPI for all backend API projects"
    local_before = db_query("SELECT COUNT(*) AS c FROM user_memories")[0]["c"]
    r4 = await kira_enhance(prompt=p4, agent_name=AGENT, session_id=TEST_SESSION, density="short")
    local_after = db_query("SELECT COUNT(*) AS c FROM user_memories")[0]["c"]
    learned_local = local_after > local_before
    results.append(("learn preference (local SQLite fallback)", learned_local, r4[:300]))
    logger.info(f"[4] local_before={local_before} local_after={local_after} learned={learned_local}")

    # Restore Mem0 client
    memory.get_mem0_client = original_get_mem0
    memory._client = original_client

    # 5. Retrieve local memories
    mem_text = await get_kira_memories(agent_name=AGENT)
    ok5 = "KIRA has not recorded any memories yet." not in mem_text
    results.append(("get_kira_memories", ok5, mem_text[:400]))
    logger.info(f"[5] get memories ok={ok5}\n{mem_text[:600]}")

    # Give background log tasks a moment to flush
    await asyncio.sleep(1.0)

    # DB verification
    history_count = db_query("SELECT COUNT(*) AS c FROM chat_history WHERE session_id = ?", (TEST_SESSION,))[0]["c"]
    log_count = db_query("SELECT COUNT(*) AS c FROM mcp_logs WHERE agent_name = ?", (AGENT,))[0]["c"]
    logger.info(f"[DB] chat_history rows for session: {history_count}")
    logger.info(f"[DB] mcp_logs rows for agent: {log_count}")

    recent_memories = db_query("SELECT id, category, fact, created_at FROM user_memories ORDER BY created_at DESC LIMIT 5")
    logger.info("[DB] recent local memories:")
    for m in recent_memories:
        logger.info(f"  - [{m['category']}] {m['fact'][:120]} (ID: {m['id']})")

    recent_logs = db_query(
        "SELECT tool_name, duration_ms, status, created_at FROM mcp_logs WHERE agent_name = ? ORDER BY created_at DESC LIMIT 10",
        (AGENT,),
    )
    logger.info("[DB] recent mcp_logs:")
    for log in recent_logs:
        logger.info(f"  - {log['tool_name']} | {log['duration_ms']:.2f}ms | {log['status']}")

    logger.info("\n[SUMMARY]")
    for name, ok, preview in results:
        logger.info(f"  [{'PASS' if ok else 'FAIL'}] {name}: {preview}")

    all_ok = all(ok for _, ok, _ in results) and history_count > 0 and log_count > 0
    logger.info(f"Overall: {'ALL TESTS PASSED' if all_ok else 'SOME TESTS FAILED'}")
    return all_ok


if __name__ == "__main__":
    ok = asyncio.run(run_tests())
    raise SystemExit(0 if ok else 1)
