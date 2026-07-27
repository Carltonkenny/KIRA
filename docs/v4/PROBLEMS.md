# Problems You'll Hit Later (That We're Solving Now)

This document maps future problems to the architectural decisions being made in Phase 1 MVP. Every design choice below is intentional — it prevents a rewrite later.

---

## Problem 1: Memory Bloat (The "10,000 Memories" Crisis)

### What Will Happen
After 3-6 months of use, KIRA will have accumulated thousands of memories. Many will be:
- Duplicates ("uses React", "prefers React", "React developer")
- Contradictions ("uses Flask" from 4 months ago, "switched to FastAPI" from yesterday)
- Noise ("mentioned Docker once in passing")

If you dump all these into every prompt, you'll eat the agent's context window with garbage.

### How We're Solving It Now
**Decision: Mem0 Managed Cloud (not flat SQLite)**

Mem0 handles this internally:
- **Semantic deduplication** — "uses React" and "prefers React" merge into one memory
- **Contradiction resolution** — new facts auto-invalidate old contradicting ones
- **Relevance scoring** — memories used recently rank higher
- **Search, not dump** — we `search()` for relevant memories per-prompt, not `get_all()`

**Phase 2 extension:** Sleep-time consolidation will batch-clean memories nightly.
**Phase 3 extension:** DSPy will compile the most important memories INTO the template itself.

### If We Hadn't Done This
You'd need to rebuild the entire memory system in 3 months when the flat SQLite list becomes unusable. That's a full rewrite of `database.py`, `refiner.py`, and `mcp_server.py`.

---

## Problem 2: Over-Enhancement (The "KIRA Won't Shut Up" Problem)

### What Will Happen
Without smart skip logic, KIRA will try to "enhance" everything:
- `"git push"` → gets rewritten as a 500-word instruction about Git workflows
- `"fix the typo on line 5"` → becomes a comprehensive code quality analysis
- Quick follow-ups like `"now add tests"` → lose context because KIRA rewrites them

Users will disable KIRA within a week because it slows them down.

### How We're Solving It Now
**Decision: Three-Layer Skip Classifier**

```
Layer 1 (Heuristic): Catches 40% → zero cost
Layer 2 (Embedding):  Catches 30% → zero cost  
Layer 3 (LLM):        Handles 30% → ~$0.0004/call
```

The classifier is the FIRST thing that runs. Before memory. Before enhancement. Before any LLM call. If the prompt is trivial, KIRA returns it unchanged in <10ms.

**The `!` bypass prefix** ensures you always have a manual kill switch.

### If We Hadn't Done This
Every prompt would hit the LLM (800ms+ latency). At 100 prompts/day, that's 80 seconds of wait time per day — just for classification. Users would disable KIRA or fork it to add skip logic themselves.

---

## Problem 3: Agent Lock-In (The "Only Works With Cursor" Trap)

### What Will Happen
If you build KIRA to work with only one agent's config format, you're locked in. When you switch agents (which you do — Antigravity, OpenCode, Cline, etc.), KIRA becomes useless.

### How We're Solving It Now
**Decision: Standard MCP Server (stdio protocol)**

KIRA exposes tools via the standard MCP protocol. Any agent that speaks MCP can call `kira_enhance`. The `agent_name` parameter lets KIRA adapt per-agent, but the interface is universal.

**Agent config is a 3-line JSON block** — identical format for every MCP-compatible client:
```json
{
  "kira": {
    "command": "python",
    "args": ["path/to/mcp_server.py"]
  }
}
```

### If We Hadn't Done This
You'd need custom integrations for each agent. When a new agent launches (and they launch monthly), you'd need to write a new adapter.

---

## Problem 4: The "Sloppy Language" Cliff

### What Will Happen
You type like a human: "do the thing like before but with postgres this time". Every keyword-based system will fail to understand:
- "the thing" = reference to a past task
- "like before" = reference to a previous session
- "but with" = modification operator

These references are THE most common pattern in experienced AI users. They reference past context constantly.

### How We're Solving It Now
**Decision: LLM-Based AI-to-AI Translation (not template-based)**

Template-based normalization would require pre-defined patterns. But human language is too creative — you'd need to manually code a new template every time you use a new shorthand.

LLM-based translation handles novel language patterns inherently. The DeepSeek call:
1. Receives your sloppy prompt
2. Receives relevant memories from Mem0 (via semantic search)
3. Resolves references by matching against memory and history
4. Outputs structured instructions

**Cost:** ~500-800 tokens per enhancement. At $0.14/M tokens, that's $0.00007 per call.

### If We Hadn't Done This
KIRA would only work for users who already write clean prompts. The entire value proposition — "learn my language" — would be impossible.

---

## Problem 5: The "Stale Context" Drift

### What Will Happen
Your tech stack changes. You move from SQLite to Postgres. You switch from React to Svelte. You start using Go instead of Python. If KIRA keeps injecting "Uses React" and "Prefers SQLite" 6 months after you've moved on, it's actively harmful.

### How We're Solving It Now
**Decision: Mem0's temporal awareness + Outcome feedback loop (Phase 2)**

Mem0 tracks when memories were created and last accessed. Old, unused memories naturally decay in relevance ranking. When you explicitly contradict a memory ("I'm using Svelte now"), Mem0 invalidates the old one.

**Phase 2's feedback loop** accelerates this: if enhanced prompts containing "React" keep getting rejected, KIRA learns that "React" is no longer relevant.

### If We Hadn't Done This
KIRA would become actively worse over time — the opposite of self-learning. Users would need to manually curate memories, which defeats the automation promise.

---

## Problem 6: The "Windows Process Leak"

### What Will Happen
On Windows, MCP servers running via stdio transport can become orphaned processes. If the IDE crashes or the session ends without proper cleanup, `python.exe` processes accumulate in the background, each consuming 50-200MB of RAM.

After a week of heavy use, you could have 20+ orphaned KIRA processes eating 2-4GB of RAM.

### How We're Solving It Now
**Decision: Lightweight MCP server + externalized state**

1. **KIRA's MCP server is stateless** — all state lives in Mem0 (cloud) and SQLite (disk). The process itself holds nothing in memory that can't be reconstructed.
2. **Process lifecycle hooks** — KIRA registers a shutdown handler to clean up connections.
3. **No in-memory caches** — embedding models are loaded on-demand or via lazy initialization.

### If We Hadn't Done This
Each orphaned process would hold a stale memory cache, vector index, and database connection — multiplying the RAM cost and potentially corrupting the SQLite database with concurrent writes.

---

## Problem 7: The "Cold Start" Problem

### What Will Happen
When a user first installs KIRA, it has zero memories, zero fingerprint data, zero patterns. Every prompt goes through the full LLM enhancement pipeline because the classifier has no training data.

First-time users will experience:
- Slow responses (every prompt hits LLM)
- Generic enhancements (no personalization)
- Irrelevant suggestions (no context)

### How We're Solving It Now
**Decision: Heuristic-first classifier + progressive learning**

Layer 1 (heuristic) works from day one — no training data needed. It catches 40% of prompts purely based on token count and syntax.

Layer 2 starts with hand-labeled examples (50-100 prompts we provide as defaults). These cover common patterns: commands, questions, simple tasks, complex tasks. It's not perfect on day one, but it's good enough.

Mem0 also starts working from the first prompt — the LLM extracts facts immediately. By prompt #10, KIRA already has useful memories.

### If We Hadn't Done This
The cold start would be so bad that users would uninstall before KIRA ever got useful. The heuristic layer is the "safety net" that makes KIRA usable even with zero data.

---

## Summary: Architecture Decisions → Future Problems Prevented

| Decision Made Now | Problem Prevented Later |
|---|---|
| Mem0 managed cloud | Memory bloat, dedup, contradictions, context drift |
| Three-layer classifier | Over-enhancement, latency, cost waste |
| Standard MCP server | Agent lock-in, incompatibility |
| LLM-based translation | Sloppy language failure, rigid templates |
| Stateless process design | Windows process leaks, RAM bloat |
| Heuristic-first classifier | Cold start unusability |
| `agent_name` parameter | Per-agent profile support in Phase 2 |
| `session_id` parameter | Workflow pattern detection in Phase 2 |
| Outcome feedback tool | Self-learning feedback loop in Phase 2 |
| Prompt logging to SQLite | Behavioral fingerprint in Phase 2, DSPy data in Phase 3 |
