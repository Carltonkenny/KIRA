# PromptForge

> **The prompt intelligence layer.** Intercepts vague developer prompts, enriches them with persistent user context, and returns production-grade engineered prompts — in under 2 seconds.

[![Backend](https://img.shields.io/badge/backend-FastAPI%203.0-009688?style=flat-square)](./backend)
[![MCP](https://img.shields.io/badge/MCP-stdio%20server-6366f1?style=flat-square)](./backend/mcp_server.py)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

---

## What It Does

```
You type:    "build a login page"
KIRA returns: A full prompt template with auth strategy, component structure,
              validation rules, error handling — tuned to your tech stack.
```

KIRA learns your preferences over time (tech stack, tone, coding style) and automatically weaves them into every prompt refinement.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  IDE / Agent                         │
│   (Cursor · Claude Desktop · Antigravity · VSCode)   │
└──────────────────┬──────────────────────────────────┘
                   │ MCP stdio (JSON-RPC)
                   ▼
┌──────────────────────────────────────────────────────┐
│              mcp_server.py  (FastMCP)                │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │kira_enhance│  │forge_refine│  │  forge_chat   │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬────────┘  │
│        │               │                │            │
│  ┌─────▼───────────────▼────────────────▼──────────┐ │
│  │              Core Engine                        │ │
│  │  classifier.py → refiner.py → memory.py        │ │
│  └───────────────────────┬──────────────────────┘ │ │
└──────────────────────────┼──────────────────────────┘
                           │
        ┌──────────────────┴───────────────────┐
        ▼                                      ▼
  DeepSeek API                    Mem0 Cloud + SQLite
  (LLM inference)                 (dual-mode memory)
```

### Core Modules

| File | Purpose |
|------|---------|
| [`mcp_server.py`](./backend/mcp_server.py) | FastMCP stdio server — 4 tools callable from any IDE |
| [`classifier.py`](./backend/classifier.py) | Heuristic gate — skips CLI commands, code blocks, short inputs |
| [`refiner.py`](./backend/refiner.py) | Single structured LLM call → returns JSON with `refined_prompt`, `quality_scores`, `new_memories` |
| [`memory.py`](./backend/memory.py) | Dual-mode: Mem0 cloud vector search → SQLite fallback |
| [`database.py`](./backend/database.py) | SQLite manager for memories, profiles, history, MCP traces |
| [`decorators.py`](./backend/decorators.py) | `@traced_tool` — auto-times and logs every MCP tool call |

### MCP Tools

| Tool | What It Does |
|------|-------------|
| `kira_enhance` | Smart intercept: classify → recall memories → refine → save new facts |
| `forge_refine` | Direct refinement with `short` / `medium` / `detailed` density |
| `forge_chat` | Stateful follow-up: "make it shorter", "add error handling" |
| `get_kira_memories` | Inspect what KIRA has learned about you |

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

cp .env.example .env
# Fill in your DEEPSEEK_API_KEY in .env

python main.py                # FastAPI at http://localhost:8090
```

### 2. Connect to Your IDE (MCP)

The MCP server runs as a **stdio subprocess** — no port needed.

**Cursor** — add to `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "kira": {
      "command": "python",
      "args": ["C:/path/to/KIRA/backend/mcp_server.py"],
      "env": { "PYTHONPATH": "C:/path/to/KIRA/backend" }
    }
  }
}
```

**Claude Desktop** — add to `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "kira": {
      "command": "python",
      "args": ["C:/path/to/KIRA/backend/mcp_server.py"],
      "env": { "PYTHONPATH": "C:/path/to/KIRA/backend" }
    }
  }
}
```

Pre-built config files are in [`agent_configs/`](./agent_configs/).

### 3. Frontend (Internal Tool)

```bash
cd frontend
npm install
npm run dev    # Vite at http://localhost:5173
```

---

## API Endpoints

```
POST /api/v1/refine       Refine a prompt
POST /api/v1/chat         Iterative follow-up on previous prompt
GET  /api/v1/memories     List all learned facts
DELETE /api/v1/memories/{id}  Delete a fact
GET  /api/v1/profile      Get user profile
PUT  /api/v1/profile      Update preferences
GET  /api/v1/mcp/status   MCP server connection status
GET  /api/v1/mcp/logs     Tool call trace logs
GET  /api/v1/history/all  All refined prompt history
GET  /health              Service health check
```

---

## Design Decisions

See [`DECISIONS.md`](./DECISIONS.md) for architectural ADRs — why single-call refinement (not agent swarm), why Stdio MCP, why dual-mode memory.

---

## Environment Variables

```bash
ENVIRONMENT=development         # or 'production'
PORT=8090
ALLOWED_ORIGINS=http://localhost:5173  # comma-separated for multi-origin
DEEPSEEK_API_KEY=...            # platform.deepseek.com
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat         # override for any OpenAI-compatible model
MEM0_API_KEY=...                # optional — app.mem0.ai (falls back to SQLite)
```

---

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLite, psutil
- **LLM**: DeepSeek (OpenAI-compatible SDK — swap any model)
- **Memory**: Mem0 cloud + SQLite (automatic fallback)
- **MCP**: Official `mcp` SDK with `FastMCP`
- **Frontend**: React 18, TypeScript, Vite
- **Deploy**: Railway (backend), Vercel (frontend + marketing)

---

## License

MIT
