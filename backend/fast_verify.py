"""Fast local-only tests: classifier, DB, no LLM calls."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from classifier import classify
from database import db
import asyncio

async def main():
    await db.initialize_tables()

    print("=" * 60)
    print("KIRA — LOCAL FAST VERIFICATION (no LLM)")
    print("=" * 60)

    # --- Classifier tests ---
    print("\n[CLASSIFIER]")
    tests = [
        ("git push origin main", "pass_through"),
        ("!build a login page", "pass_through"),
        ("yes", "pass_through"),
        ("fix typo on line 42 in server.py", "pass_through"),
        ("build a login page in react with email validation", "enhance"),
        ("create a CLI tool to rename files in a folder", "enhance"),
        ('x = 5; y = 10; if (x == y) { print(x); }', "pass_through"),
    ]
    for p, expected in tests:
        result = classify(p)
        ok = result["action"] == expected
        print(f"  {'OK' if ok else 'FAIL'}: {p[:55]:55s} → {result['action']:15s} ({result['reason']})")

    # --- DB tables ---
    print("\n[DATABASE]")
    from database import SQLITE_DB_PATH
    import sqlite3
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [r["name"] for r in c.fetchall()]
    print(f"  Tables: {tables}")

    for tbl in tables:
        c.execute(f"SELECT COUNT(*) as c FROM {tbl}")
        cnt = c.fetchone()["c"]
        print(f"    {tbl:25s}: {cnt} rows")

    c.execute("SELECT category, fact FROM user_memories ORDER BY created_at DESC LIMIT 8")
    print("\n  Recent memories:")
    for r in c.fetchall():
        print(f"    [{r['category']}] {r['fact'][:100]}")

    c.execute("SELECT tool_name, agent_name, duration_ms, status FROM mcp_logs ORDER BY created_at DESC LIMIT 5")
    print("\n  Recent MCP logs:")
    for r in c.fetchall():
        print(f"    {r['tool_name']:25s} | agent={r['agent_name']:20s} | {r['duration_ms']:8.2f}ms | {r['status']}")

    conn.close()
    print("\n" + "=" * 60)
    print("Local tests complete — classifier & DB both functional.")
    print("=" * 60)

asyncio.run(main())
