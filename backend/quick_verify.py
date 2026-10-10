"""Standalone quick-verify script for KIRA MCP — 5 clean examples plus DB dump."""
import asyncio, sys, sqlite3, json
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent))
from mcp_server import kira_enhance, get_kira_memories, forge_refine
from database import db

DB_PATH = Path(__file__).with_name("kira_local.db")
SESSION = f"verify-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"

def q(query, params=()):
    conn = sqlite3.connect(str(DB_PATH)); conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor(); cur.execute(query, params); return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

async def main():
    print("=" * 72)
    print("KIRA MCP — LIVE VERIFICATION RUN")
    print("=" * 72)

    await db.initialize_tables()

    ex = []

    # ── 1. Pass-through: shell command ──
    p = "git commit -m \"fix bug\""
    r = await kira_enhance(prompt=p, agent_name="cline-verify", session_id=SESSION)
    ok = r == p
    ex.append(("PASS-THROUGH (shell cmd)", ok, r[:120]))
    print(f"\n[1] {'PASS' if ok else 'FAIL'}: {p!r} → {r[:120]!r}")

    # ── 2. Pass-through: by prefix ──
    p = "!build a REST API in Go"
    r = await kira_enhance(prompt=p, agent_name="cline-verify", session_id=SESSION)
    ok = r == p
    ex.append(("PASS-THROUGH (bypass !)", ok, r[:120]))
    print(f"[2] {'PASS' if ok else 'FAIL'}: {p!r} → {r[:120]!r}")

    # ── 3. Enhancement: vague prompt ➜ structured ──
    p = "create a CLI tool to rename files in a folder"
    r = await kira_enhance(prompt=p, agent_name="cline-verify", session_id=SESSION, density="short")
    ok = len(r) > len(p) and "rename" in r.lower()
    ex.append(("ENHANCE (vague → structured)", ok, r[:200]))
    print(f"[3] {'PASS' if ok else 'FAIL'}: enhanced to {len(r)} chars")
    print(f"    Preview: {r[:200]}...")

    # ── 4. Enhancement with memory context ──
    p = "add authentication to my API"
    r = await kira_enhance(prompt=p, agent_name="cline-verify", session_id=SESSION, density="short")
    ok = len(r) > len(p)
    ex.append(("ENHANCE (with memory recall)", ok, r[:200]))
    print(f"[4] {'PASS' if ok else 'FAIL'}: enhanced to {len(r)} chars")
    print(f"    Preview: {r[:200]}...")

    # ── 5. Get memories ──
    mem = await get_kira_memories(agent_name="cline-verify")
    has_data = "has not recorded" not in mem
    ex.append(("GET MEMORIES", has_data, mem[:250]))
    print(f"\n[5] {'PASS' if has_data else 'FAIL'}:")
    print(mem[:600])

    await asyncio.sleep(1.0)

    # ── DB Dump ──
    print("\n" + "=" * 72)
    print("DATABASE STATE")
    print("=" * 72)

    h = q("SELECT COUNT(*) as c FROM chat_history WHERE session_id=?", (SESSION,))
    l = q("SELECT COUNT(*) as c FROM mcp_logs WHERE agent_name=?", ("cline-verify",))
    m = q("SELECT COUNT(*) as c FROM user_memories")
    print(f"chat_history rows (this session): {h[0]['c']}")
    print(f"mcp_logs rows (this agent):       {l[0]['c']}")
    print(f"total user_memories:              {m[0]['c']}")

    logs = q("SELECT tool_name, duration_ms, status FROM mcp_logs WHERE agent_name=? ORDER BY created_at DESC LIMIT 8", ("cline-verify",))
    print("\nRecent MCP Logs:")
    for row in logs:
        print(f"  {row['tool_name']:25s} | {row['duration_ms']:8.2f}ms | {row['status']}")

    mems = q("SELECT category, fact FROM user_memories ORDER BY created_at DESC LIMIT 10")
    print("\nRecent Local Memories:")
    for row in mems:
        print(f"  [{row['category']}] {row['fact'][:100]}")

    # ── Summary ──
    print("\n" + "=" * 72)
    passed = sum(1 for _, ok, _ in ex if ok)
    print(f"RESULTS: {passed}/{len(ex)} passed")
    for name, ok, _ in ex:
        print(f"  [{'✓' if ok else '✗'}] {name}")
    print("=" * 72)

    all_ok = passed == len(ex) and h[0]['c'] > 0 and l[0]['c'] > 0
    print("OVERALL: KIRA MCP is LIVE & FUNCTIONAL" if all_ok else "OVERALL: Issues detected")
    return all_ok

if __name__ == "__main__":
    ok = asyncio.run(main())
    raise SystemExit(0 if ok else 1)
