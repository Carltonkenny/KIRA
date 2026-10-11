# PromptForge / KIRA

> **The prompt intelligence layer.** Intercepts vague developer prompts, enriches them with persistent project-scoped memory, and returns production-grade engineered prompts — in under 500ms.

[![Backend](https://img.shields.io/badge/backend-FastAPI%203.0-009688?style=flat-square)](./backend)
[![MCP](https://img.shields.io/badge/MCP-stdio%20server-6366f1?style=flat-square)](./backend/mcp_server.py)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-61dafb?style=flat-square)](./frontend)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

---

## What It Does

```
You type:    "build a login page"
KIRA returns: A full prompt template with auth strategy, component structure,
              validation rules, error handling — tuned to your tech stack.
```

KIRA learns your preferences over time (tech stack, tone, coding style) and automatically weaves them into every prompt refinement. Memory is isolated per project — your Next.js rules never leak into your Rust microservice.

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
  Groq / DeepSeek API            Neon PostgreSQL + Mem0
  (LLM inference)                (cloud-synced memory)
```

### Core Modules

| File | Purpose |
|------|---------|
| [`mcp_server.py`](./backend/mcp_server.py) | FastMCP stdio server — 4 tools callable from any IDE |
| [`classifier.py`](./backend/classifier.py) | Heuristic gate — skips CLI commands, code blocks, short inputs |
| [`refiner.py`](./backend/refiner.py) | Structured LLM call → returns `refined_prompt`, `quality_scores`, `new_memories` |
| [`memory.py`](./backend/memory.py) | Dual-mode: Mem0 cloud vector search → local SQLite fallback |
| [`database.py`](./backend/database.py) | Neon PostgreSQL (primary) / SQLite (fallback) for memories, profiles, history, MCP traces |
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
# Fill in your API keys in .env

python main.py                # FastAPI at http://localhost:8090
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # Vite at http://localhost:5173
```

### 3. Connect to Your IDE (MCP)

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

---

## API Endpoints

```
POST /api/v1/refine            Refine a prompt
GET  /api/v1/memories          List all learned facts
POST /api/v1/memories          Add a memory manually
DELETE /api/v1/memories/{id}   Delete a fact
GET  /api/v1/profile           Get user profile
PUT  /api/v1/profile           Update preferences
POST /api/v1/auth/session      Create/resume a Neon DB session
GET  /api/v1/graph             Knowledge graph (nodes + edges)
GET  /api/v1/mcp/status        MCP server connection status
GET  /api/v1/mcp/logs          Tool call trace logs
GET  /api/v1/history/all       All refined prompt history
GET  /health                   Service health check
```

---

## Environment Variables

```bash
ENVIRONMENT=development         # or 'production'
PORT=8090
ALLOWED_ORIGINS=http://localhost:5173  # comma-separated

# LLM — Groq (primary) or DeepSeek (fallback)
GROQ_API_KEY=...                # console.groq.com
DEEPSEEK_API_KEY=...            # platform.deepseek.com

# Memory — Mem0 Cloud (optional, falls back to local SQLite)
MEM0_API_KEY=...                # app.mem0.ai

# Database — Neon PostgreSQL (optional, falls back to SQLite)
DATABASE_URL=postgresql://...   # console.neon.tech
```

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build                  # produces dist/
# Push to GitHub → Vercel auto-deploys from master
```

Set `VITE_API_BASE` env var in Vercel to your backend URL.

### Backend → Railway

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Set root directory to `backend/`
3. Add env vars from `.env.example`
4. Railway auto-detects FastAPI and deploys

---

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, Pydantic v2, asyncpg, Neon PostgreSQL
- **LLM**: Groq (primary) / DeepSeek (fallback) — OpenAI-compatible SDK
- **Memory**: Mem0 cloud + SQLite (automatic fallback)
- **MCP**: Official `mcp` SDK with `FastMCP`
- **Frontend**: React 19, TypeScript, Vite, Lucide icons
- **Deploy**: Railway (backend) + Vercel (frontend)

---

## Design Decisions

See [`DECISIONS.md`](./DECISIONS.md) for architectural ADRs — why single-call refinement (not agent swarm), why Stdio MCP, why dual-mode memory.

---

## License

MIT
