# KIRA: Context-Aware Prompt Refinement Engine

KIRA is a context-aware prompt engineering assistant designed to bridge the gap between AI instruction-following and local workspace state. It acts as an IDE-native partner (via the Model Context Protocol) and a local web console.

Standard AI assistants evaluate prompts in isolation, requiring developers to repeatedly describe their OS, tech stack, coding standards, and project constraints. KIRA maintains a lightweight database of developer preferences and auto-learned context facts, automatically weaving them as constraints into prompt expansion requests while enforcing a strict output density budget to protect the editor's context window.

---

## 💡 Core Architecture & System Concepts

```mermaid
graph TD
    Client[React Frontend / Cursor IDE] -->|API / stdio MCP| API[FastAPI / MCP Server]
    API -->|Single Call| LLM[DeepSeek Chat API / OpenAI Client]
    API <--->|Get/Set Preferences & Logs| DB[SQLite Local File / Supabase PostgreSQL]
```

### 1. Database Parity (SQLite & PostgreSQL)
* **Local Fallback:** By default, KIRA runs locally using a file-based SQLite database (`kira_local.db`). This allows zero-config startup out of the box.
* **Production PostgreSQL/Supabase:** Connect to a hosted PostgreSQL instance by setting `DATABASE_MODE=postgres` and supplying a `POSTGRES_URL` connection string. The code automatically handles connection pooling via `asyncpg` and translates dialect quirks (e.g., handling percent-encoded special characters in passwords and upsert clauses).

### 2. Single-Call Orchestrator (`refiner.py`)
* Consolidates intent analysis, domain classification, preference checks, entity extraction (learning new facts), and prompt refinement into a **single, structured LLM completion request**.
* Cuts roundtrip network latency from 6+ seconds (typical of multi-agent swarms) to under 1 second.

### 3. Density-Budgeting
* Prompts are generated in three explicit formats:
  * `short`: Markdown bullet points of rules and tables of constraints—designed to be highly dense and minimize token overhead in coding assistants.
  * `medium`: RPG (Role, Problem, Guidance) structured prompt format.
  * `detailed`: Full markdown templates with context variable placeholders.

---

## 📁 Repository Structure

```text
KIRA/
├── backend/
│   ├── tests/
│   │   ├── test_database.py    # Database adapter mock tests
│   │   └── test_refiner.py     # Prompt-building & density tests
│   ├── config.py               # Config factory (with keyless Pollinations fallback)
│   ├── database.py             # Dual DB Adapter (SQLite + PostgreSQL asyncpg)
│   ├── main.py                 # FastAPI Web API
│   ├── mcp_server.py           # Stdio FastMCP Server for IDE tools
│   ├── refiner.py              # Structured prompt refinement logic
│   ├── schema.sql              # Database table schema definitions
│   └── requirements.txt        # Python packages
├── docs/
│   ├── PRD.md                  # Product Requirements Document
│   └── REQUIREMENTS.md         # Technical specifications & API contracts
├── DECISIONS.md                # Architectural Decision Log (ADR)
├── BOTTLENECKS.md              # Known bottlenecks & mitigation strategies
├── GETTING_STARTED.md          # Test prompts & environment setup guide
├── README.md                   # This file
└── frontend/                   # Retro-Brutalist React Console
    ├── src/
    │   ├── App.tsx             # Main dashboard UI component
    │   ├── index.css           # Brutalist styles (0px geometry, neon lime accent)
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

---

## 🛠️ Getting Started

### 1. Configure the Environment
Create a `.env` file in the `backend/` directory:
```bash
ENVIRONMENT=development
PORT=8090
DATABASE_MODE=local # 'local' for SQLite or 'postgres' for Supabase/PostgreSQL

# Database URI (Required if DATABASE_MODE=postgres)
POSTGRES_URL=postgresql://postgres.yourref:password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

# DeepSeek API (Optional, falls back to keyless Pollinations.ai if blank)
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

### 2. Launch the Backend API
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8090
```
API Documentation: [http://localhost:8090/docs](http://localhost:8090/docs)

### 3. Launch the Frontend UI
```bash
cd frontend
npm install
npm run dev
```
Open the Dashboard: [http://localhost:5173](http://localhost:5173)

---

## 🔌 IDE Integration (Model Context Protocol)

KIRA is designed to run as an MCP server over stdio. This exposes stateful prompt refinement tools directly to your AI editor (Cursor / Claude Desktop / VS Code).

Add this configuration to your IDE's MCP settings:
* **Name:** `kira`
* **Type:** `command`
* **Command:** `C:\Users\user\OneDrive\Desktop\KIRA\backend\venv\Scripts\python.exe`
* **Arguments:** `C:\Users\user\OneDrive\Desktop\KIRA\backend\mcp_server.py`

### Exposed Tools:
1. `forge_refine(prompt, session_id, density)`: Expands a vague prompt, automatically applying learned preferences and writing newly extracted stack facts to the database.
2. `forge_chat(message, session_id)`: Stateful conversational updates (e.g. *"make it async"*, *"add logs"*) to iteratively adjust the previous refined prompt.
3. `get_kira_memories()`: Returns a list of all active developer facts KIRA currently remembers.
