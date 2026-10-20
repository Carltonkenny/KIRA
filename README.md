<div align="center">

# ⚡ KIRA

### *Autonomous Prompt Intelligence & Persistent Memory Layer for AI Coding Agents*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React_19-Vite_8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![FastMCP](https://img.shields.io/badge/FastMCP-2026_Standard-6366F1?style=for-the-badge&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Groq LPU](https://img.shields.io/badge/Groq_LPU-Sub_500ms-F55036?style=for-the-badge&logo=speedtest&logoColor=white)](https://groq.com)
[![Neon](https://img.shields.io/badge/Neon-Serverless_pgvector-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech)
[![Firebase](https://img.shields.io/badge/Firebase-Google_OAuth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br/>

**Modern AI coding agents start every request from absolute zero.**<br/>
They forget your schemas. They repeat deprecated patterns. They hallucinate libraries.

**KIRA fixes this.**

<br/>

[🚀 Live Demo](https://knowledgeable-interface-for-refinem.vercel.app/) •
[📖 Documentation](#-local-development) •
[🔌 Connect Your IDE](#-1-click-ide-integration-mcp) •
[☁️ Deploy](#-cloud-deployment)

<br/>

---

</div>

## 🧠 What is KIRA?

KIRA is an **intelligent proxy and persistent memory kernel** that sits between you and your AI coding agent. It intercepts vague prompts, enriches them with project-specific context from persistent memory, and outputs strict production-grade specifications — all in under 500ms.

<table>
  <tr>
    <td width="50%">
      <h3>❌ Without KIRA</h3>
      <pre>"build a stripe webhook handler"</pre>
      <p>→ Generic code. Wrong framework. Invented ORM. Missing error handling. No idempotency. <strong>Hallucinated imports.</strong></p>
    </td>
    <td width="50%">
      <h3>✅ With KIRA (Session 48)</h3>
      <pre>"build a stripe webhook handler"</pre>
      <p>→ FastAPI 0.115 + SQLAlchemy 2.0 asyncpg + Pydantic v2 + Stripe webhook signature verification + idempotency record lookup. <strong>Zero hallucination.</strong></p>
    </td>
  </tr>
</table>

---

## ✨ Core Features

<table>
  <tr>
    <td width="50%">
      <h3 align="center">🎯 4-Agent Parallel Orchestration</h3>
      <p>Every prompt is parsed by 4 specialist agents simultaneously:</p>
      <ul>
        <li><b>Intent Agent:</b> Extracts core technical objective & scope</li>
        <li><b>Context Agent:</b> Retrieves project-scoped pgvector memory</li>
        <li><b>Domain Agent:</b> Enforces security, idempotency, and framework rules</li>
        <li><b>Synthesizer:</b> Produces bulletproof prompt specifications in ~420ms</li>
      </ul>
    </td>
    <td width="50%">
      <h3 align="center">🔐 1-Click Google Sign-In</h3>
      <p>Frictionless developer onboarding:</p>
      <ul>
        <li><b>Firebase Authentication</b> with Google OAuth 2.0</li>
        <li>Zero-config guest sandbox for instant live testing</li>
        <li>Interactive profile configuration (role, hobbies, tech stack)</li>
        <li>Instant IDE routing vs Web Console experience</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="center">⚡ Live Diff Sandbox</h3>
      <p>Real-time architectural contrast:</p>
      <ul>
        <li>Toggle between <b>Synthesized Spec</b> and <b>Added Diff</b></li>
        <li>Inspect positive boundaries (asyncpg, Pydantic v2)</li>
        <li>Inspect negative constraints blocking hallucinated dependencies</li>
        <li>1-click prompt copy with animated toast feedback</li>
      </ul>
    </td>
    <td width="50%">
      <h3 align="center">🌐 Universal FastMCP Server</h3>
      <p>Stateful memory inside your terminal and editor:</p>
      <ul>
        <li>Exposes <code>kira_enhance</code>, <code>get_kira_memories</code>, <code>kira_extract</code></li>
        <li>Auto-intercepts prompts before your IDE agent writes code</li>
        <li>Supports stdio and remote HTTPS SSE streaming</li>
        <li>Latency tracing decorators on every call</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="center">🗺️ Knowledge Graph Visualizer</h3>
      <p>See your project's brain:</p>
      <ul>
        <li>Interactive constellation of memories, tech stack, and constraints</li>
        <li>Auto-clusters by project scope and domain category</li>
        <li>Visual exploration of how KIRA connects your architectural decisions</li>
        <li>Real-time updates as new memories are extracted</li>
      </ul>
    </td>
    <td width="50%">
      <h3 align="center">💾 Persistent Memory Engine</h3>
      <p>KIRA never forgets:</p>
      <ul>
        <li><b>Auto-extraction:</b> Learns facts from every prompt</li>
        <li><b>Project-scoped:</b> Each project gets its own memory namespace</li>
        <li><b>Manual curation:</b> Add, pin, or delete memories</li>
        <li><b>Multi-tenant:</b> Strict user_id isolation across all data</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏛️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Developer IDE / Agent Layer                     │
│          (Claude Code · Google Antigravity · Cursor IDE · VSCode)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ FastMCP stdio / HTTPS SSE
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      KIRA FastMCP Server Layer                         │
│   ┌─────────────────┐   ┌─────────────────┐   ┌────────────────────┐   │
│   │  kira_enhance   │   │  forge_refine   │   │ get_kira_memories  │   │
│   └────────┬────────┘   └────────┬────────┘   └─────────┬──────────┘   │
└────────────┼─────────────────────┼──────────────────────┼──────────────┘
             │                     │                      │
             ▼                     ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          KIRA Engine Core                              │
│                                                                        │
│   [classifier.py] ─── (Heuristic Skip for raw CLI commands / code)    │
│           │                                                            │
│           ▼                                                            │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 4-Agent Parallel Pipeline                                      │   │
│   │  1. Intent Extraction    ─── Identifies core technical goal   │   │
│   │  2. Context Retrieval    ─── Queries active project memory     │   │
│   │  3. Domain Scorer        ─── Security & idempotency boundaries │   │
│   │  4. Prompt Synthesizer   ─── Groq LPU sub-500ms compilation    │   │
│   └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│         Groq LPU Inference           │  │   Neon Serverless pgvector   │
│      (llama-3.3-70b-versatile)       │  │ (Profiles, Memories, Traces) │
│       Sub-500ms Compilation          │  │ Zero-downtime SQLite fallback│
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 🔌 1-Click IDE Integration (MCP)

Drop the integration directive into your project root. Your agent will autonomously consult KIRA before writing any code.

<details>
<summary><b>🤖 Claude Code (<code>CLAUDE.md</code>)</b></summary>

```markdown
# CLAUDE.md — KIRA Intelligence Integration Rule
You are connected to the KIRA Prompt Enhancement & Context Engine.

## Pre-Flight Prompt Interception Rule
1. Before fulfilling any engineering user request, invoke the KIRA tool `kira_enhance` with the user's prompt.
2. Use the exact structured specification returned by KIRA to generate your code.
```
</details>

<details>
<summary><b>🛸 Google Antigravity (<code>.agents/AGENTS.md</code>)</b></summary>

```markdown
# .agents/AGENTS.md — KIRA Integration Rules
You are connected to the KIRA Prompt Enhancement MCP Server.

## Prompt Interception Rule
1. Before answering any engineering request, invoke the KIRA tool `kira_enhance` with:
   - `prompt`: Raw user input
   - `agent_name`: "antigravity"
   - `session_id`: Active conversation ID
2. Use the exact structured specification returned by `kira_enhance` to generate your code.
```
</details>

<details>
<summary><b>⚡ Cursor IDE (<code>.cursorrules</code>)</b></summary>

```markdown
# .cursorrules — KIRA Prompt Intelligence Directive
Connect to KIRA MCP (https://your-backend.onrender.com/mcp/sse).
Always execute `kira_enhance` to fetch verified architectural constraints
and active project memory before generating boilerplate code.
```
</details>

<details>
<summary><b>🔧 Any MCP-Compatible Agent (JSON Config)</b></summary>

```json
{
  "mcp": {
    "kira": {
      "type": "sse",
      "url": "https://your-backend.onrender.com/mcp/sse",
      "enabled": true
    }
  }
}
```

For local stdio mode:
```json
{
  "mcp": {
    "kira": {
      "type": "local",
      "command": ["python", "backend/mcp_server.py"],
      "enabled": true
    }
  }
}
```
</details>

---

## 💻 Local Development

### Prerequisites

| Tool | Version | Link |
|------|---------|------|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Groq API Key | Free | [console.groq.com](https://console.groq.com) |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Carltonkenny/KIRA.git
cd KIRA

# 2. Start the Backend
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env → paste your GROQ_API_KEY (and optionally DATABASE_URL for Neon)

python -m uvicorn main:app --port 8090 --reload

# 3. Start the Frontend (new terminal)
cd frontend
npm install
npm run dev

# 4. Open http://localhost:5173
```

> **Note:** Without a `DATABASE_URL`, KIRA automatically falls back to local SQLite. All features work identically — Neon PostgreSQL is only required for production multi-tenant persistence.

---

## ☁️ Cloud Deployment

### Backend → Render (Free Tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New +** → **Web Service**
3. Connect your `Carltonkenny/KIRA` repository
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   ```
   GROQ_API_KEY=gsk_your_key_here
   DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require
   PORT=8090
   ALLOWED_ORIGINS=*
   ```

### Frontend → Vercel (1-Click) or Firebase Hosting

**Vercel:**
1. Import `Carltonkenny/KIRA` → Root: `frontend` → Framework: `Vite`
2. Add env: `VITE_API_URL=https://your-backend.onrender.com`

**Firebase Hosting:**
```bash
cd frontend && npm run build && cd ..
firebase deploy --only hosting
```

### Database → Neon (Free)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a PostgreSQL database
3. Copy the pooled connection string → set as `DATABASE_URL`
4. Tables auto-create on first backend startup

---

## 📂 Project Structure

```
KIRA/
├── backend/                   # FastAPI + FastMCP Backend
│   ├── routes/                # Modular API routers
│   │   ├── auth.py            #   → Firebase session management
│   │   ├── refine.py          #   → 4-agent prompt refinement
│   │   ├── memories.py        #   → CRUD memory operations
│   │   ├── profile.py         #   → User preferences
│   │   ├── graph.py           #   → Knowledge graph API
│   │   ├── mcp.py             #   → MCP log tracking
│   │   └── schemas.py         #   → Pydantic request/response models
│   ├── classifier.py          # Heuristic skip classifier
│   ├── config.py              # Environment & LLM provider config
│   ├── database.py            # Neon PostgreSQL + SQLite fallback
│   ├── decorators.py          # Latency tracing & telemetry
│   ├── main.py                # FastAPI entrypoint with lifespan
│   ├── mcp_server.py          # FastMCP server (stdio + SSE)
│   ├── memory.py              # Memory embedding & retrieval
│   ├── refiner.py             # 4-agent LLM pipeline via Groq
│   ├── schema.sql             # Database DDL (PostgreSQL/SQLite)
│   ├── requirements.txt       # Pinned Python dependencies
│   └── tests/                 # Test suite
│       ├── test_classifier.py
│       ├── test_database.py
│       ├── test_refiner.py
│       ├── test_integration.py
│       ├── test_e2e_api.py
│       └── test_stress_jailbreak.py
│
├── frontend/                  # React 19 + TypeScript + Vite 8
│   ├── src/
│   │   ├── App.tsx            # Root app shell (Landing ↔ Console)
│   │   ├── main.tsx           # React DOM entrypoint
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── index.css          # Design system tokens & animations
│   │   ├── components/        # UI Components
│   │   │   ├── AuthModal.tsx          # Google OAuth sign-in modal
│   │   │   ├── OnboardingModal.tsx    # Developer profile setup
│   │   │   ├── ProfileModal.tsx       # User preferences editor
│   │   │   ├── McpModal.tsx           # IDE connection hub
│   │   │   ├── HomeTab.tsx            # ChatGPT-style prompt interface
│   │   │   ├── SessionsTab.tsx        # History & MCP logs
│   │   │   ├── GraphTab.tsx           # Knowledge graph visualizer
│   │   │   ├── MemoryTab.tsx          # Memory CRUD manager
│   │   │   ├── Header.tsx             # Navigation & auth controls
│   │   │   ├── NeuralBackground.tsx   # Animated particle canvas
│   │   │   ├── CustomCursor.tsx       # Premium cursor effect
│   │   │   ├── LandingPage.tsx        # Landing page shell
│   │   │   └── landing/              # 13 landing page sections
│   │   ├── hooks/
│   │   │   ├── useApi.ts             # All API calls & state management
│   │   │   └── useMcpStatus.ts       # MCP connection monitoring
│   │   └── lib/
│   │       └── firebase.ts           # Firebase SDK & Google OAuth
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── agent_configs/             # Pre-built IDE integration files
│   ├── claude_desktop.json
│   ├── cursor.json
│   ├── opencode.jsonc
│   └── antigravity.md
│
├── docs/                      # Documentation
│   ├── PRD.md                 # Product Requirements Document
│   ├── REQUIREMENTS.md        # Technical Requirements
│   └── KIRA_REPORT.md         # Architecture & Design Report
│
├── render.yaml                # 1-click Render deployment config
├── firebase.json              # Firebase Hosting config
├── DEPLOYMENT.md              # Step-by-step deployment guide
├── GETTING_STARTED.md         # Quick start guide
└── TEST_REPORT.md             # Test execution results
```

---

## 🧪 Running Tests

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pytest tests/ -v
```

Test coverage includes:
- **Unit:** Classifier logic, database operations, refiner pipeline
- **Integration:** API endpoint contracts, memory CRUD cycles
- **E2E:** Full prompt → refinement → memory extraction flow
- **Security:** Jailbreak resistance and prompt injection defense

---

## 🛣️ Roadmap

- [x] 4-agent parallel prompt pipeline
- [x] Neon PostgreSQL with pgvector semantic memory
- [x] Firebase Google OAuth 2.0
- [x] Multi-tenant user isolation
- [x] Interactive knowledge graph visualizer
- [x] FastMCP server (stdio + SSE)
- [x] Landing page with live demo widget
- [x] ChatGPT-style conversational interface
- [ ] Cinematic video ads (Google Flow I2V)
- [ ] Platform-specific ad campaigns (Twitter/X, LinkedIn, Reddit)
- [ ] Team workspaces & shared memory pools
- [ ] VS Code extension marketplace listing
- [ ] Prompt versioning & rollback

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feat/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ⚡ by [Carlton Kenny](https://github.com/Carltonkenny)**

Made for the 2026 AI Agent Ecosystem

</div>
