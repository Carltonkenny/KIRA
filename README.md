<div align="center">

# ⚡ KIRA (PromptForge)
### *The Autonomous Prompt Intelligence & Persistent Memory Layer for AI Coding Agents*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React_19-Vite_8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastMCP](https://img.shields.io/badge/FastMCP-2026_Standard-6366F1?style=for-the-badge&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Groq LPU](https://img.shields.io/badge/Groq_LPU-0.42s_Latency-F55036?style=for-the-badge&logo=speedtest&logoColor=white)](https://groq.com)
[![Neon pgvector](https://img.shields.io/badge/Neon-Serverless_PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech)
[![Firebase Auth](https://img.shields.io/badge/Firebase-Google_OAuth_2.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Eliminate zero-shot amnesia.</b> KIRA intercepts vague engineering prompts, enriches them with persistent project memory, and injects zero-hallucination architectural constraints before code is generated.
</p>

<p align="center">
  <a href="#-quick-tour--features">Explore Features</a> •
  <a href="#-architecture--the-4-agent-orchestrator">Architecture</a> •
  <a href="#-1-click-agent-integration-mcp">Connect IDEs (MCP)</a> •
  <a href="#-step-by-step-deployment-guide">Deploy to Cloud</a> •
  <a href="#-local-development">Run Locally</a>
</p>

---

</div>

## 📌 Executive Summary

Modern AI coding agents (Claude Code, Cursor IDE, Google Antigravity, GitHub Copilot) start from **absolute zero** on every request. They forget your database schemas, repeat deprecated patterns, and invent non-existent libraries.

**KIRA acts as an intelligent proxy and persistent memory kernel**:
- 🧠 **Persistent Semantic Memory**: Remembers your stack, conventions, and negative constraints across sessions using **Neon pgvector**.
- ⚡ **Sub-Second Synthesizer**: 4 parallel specialist agents refine vague prompts into strict production specifications in **~420ms** via **Groq LPUs**.
- 🔌 **Universal Model Context Protocol (MCP)**: Native stdio and cloud HTTPS SSE support for Claude Code, Antigravity, and Cursor.
- 🛡️ **Zero-Hallucination Guardrails**: Injects type boundaries, error-recovery contracts, and negative constraints (*"Do NOT use unverified ORMs"*).

---

## 🚀 Quick Tour & Features

<table>
  <tr>
    <td width="50%">
      <h3 align="center">🎯 4-Agent Parallel Orchestration</h3>
      <p>Every prompt is parsed by 4 specialist agents simultaneously:</p>
      <ul>
        <li><b>Intent Agent:</b> Extracts core technical objective & scope</li>
        <li><b>Context Agent:</b> Retrieves project-scoped pgvector memory</li>
        <li><b>Domain Agent:</b> Enforces security, idempotency, and framework rules</li>
        <li><b>Synthesizer:</b> Produces bulletproof prompt templates</li>
      </ul>
    </td>
    <td width="50%">
      <h3 align="center">🔐 1-Click Google Sign-In & Onboarding</h3>
      <p>Frictionless developer onboarding:</p>
      <ul>
        <li>Powered by <b>Firebase Authentication (Google OAuth 2.0)</b></li>
        <li>Zero-configuration guest sandbox for instant live testing</li>
        <li>Interactive profile configuration (Role, hobbies, tech stack)</li>
        <li>Instant IDE routing vs Web Console experience</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="center">⚡ Interactive Live Diff Sandbox</h3>
      <p>Demonstrates architectural contrast in real-time:</p>
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
        <li>Telemetry and latency tracing decorators on every call</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏛️ Architecture & The 4-Agent Orchestrator

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
│      (llama-3.3-70b-versatile)       │  │ (Profiles, Memories, Traces)│
│       Sub-500ms Compilation          │  │ Zero-downtime SQLite fallback│
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 🔌 1-Click Agent Integration (MCP)

Drop the directive into your project root. Your agent will autonomously consult KIRA before implementing code:

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
Connect to KIRA MCP (https://api.promptforge.ai/mcp/sse).
Always execute `kira_enhance` to fetch verified architectural constraints and active project memory before generating boilerplate code.
```
</details>

---

## 🚢 Step-by-Step Deployment Guide

Follow these verified steps to deploy KIRA to production in under 10 minutes:

### Step 1: Provision Neon Serverless PostgreSQL
1. Sign up at [neon.tech](https://neon.tech) and create a free PostgreSQL database.
2. Copy the pooled connection string:
   ```
   postgresql://username:password@ep-cool-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Deploy Backend (Render or Railway)
1. Fork or push this repository to GitHub.
2. In **Render** ([render.com](https://render.com)):
   - Click **New +** → **Web Service** → Select your `Carltonkenny/KIRA` repository.
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     ```ini
     GROQ_API_KEY=gsk_your_groq_api_key_here
     DATABASE_URL=postgresql://username:password@ep-cool-...neon.tech/neondb?sslmode=require
     PORT=8090
     ALLOWED_ORIGINS=*
     ```
3. Click **Deploy Web Service** and note your public URL (e.g. `https://kira-backend.onrender.com`).

### Step 3: Configure Firebase Auth (Google Sign-In)
1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Go to **Build** → **Authentication** → **Sign-in method** → Enable **Google**.
3. Under **Project Settings** → **General**, register a Web App and copy your config:
   - `apiKey`
   - `authDomain`
   - `projectId`
4. Add your deployment domain (e.g. `your-app.web.app` or `your-app.vercel.app`) to **Authorized domains** in Firebase Authentication settings.

### Step 4: Deploy Frontend (Firebase Hosting or Vercel)

#### Option A: Deploy to Firebase Hosting
```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize in the project root
firebase init hosting
# - Public directory: frontend/dist
# - Configure as a single-page app (SPA): Yes
# - Set up automatic builds: No

# 4. Build and deploy
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

#### Option B: Deploy to Vercel (1-Click)
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import `Carltonkenny/KIRA`.
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variables:
   ```ini
   VITE_API_URL=https://kira-backend.onrender.com
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   ```
4. Click **Deploy**. Your app is live!

---

## 💻 Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Free Groq API Key ([console.groq.com](https://console.groq.com))

```bash
# 1. Clone repository
git clone https://github.com/Carltonkenny/KIRA.git
cd KIRA

# 2. Setup Backend
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and paste your GROQ_API_KEY
python -m uvicorn main:app --port 8090 --reload

# 3. Setup Frontend (in a new terminal)
cd ../frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## 📂 Repository Organization

```
KIRA/
├── backend/                  # FastAPI & FastMCP Architecture
│   ├── routes/               # Modular API routers (refine, memories, profile, mcp, auth)
│   ├── classifier.py         # Heuristic skip classifier (bypasses non-prompts)
│   ├── config.py             # App environment variables & settings
│   ├── database.py           # Neon PostgreSQL connection pooler + SQLite fallback
│   ├── decorators.py         # Latency tracing & telemetry decorators
│   ├── main.py               # FastAPI entrypoint with lifespan DB initialization
│   ├── mcp_server.py         # FastMCP server exposing kira_enhance & memories
│   ├── memory.py             # Memory embedding & vector retrieval logic
│   ├── refiner.py            # 4-Agent LLM compilation via Groq LPU
│   └── requirements.txt      # Pinned Python dependencies
│
├── frontend/                 # React 19 + TypeScript + Vite Web Application
│   ├── src/
│   │   ├── components/       # UI Components & Modals (Auth, Onboarding, Profile, Mcp)
│   │   │   └── landing/      # High-fidelity landing page sections & interactive demo
│   │   ├── lib/              # Firebase Google OAuth & SDK helpers
│   │   ├── hooks/            # Custom React hooks (scroll reveal, demo gate)
│   │   ├── App.tsx           # Main application routing (Landing ↔ Console)
│   │   └── index.css         # Custom tokens, blueprint grid, aurora glow
│   ├── package.json
│   └── vite.config.ts
│
├── agent_configs/            # IDE Directive presets (.agents, CLAUDE.md, .cursorrules)
├── docs/                     # PRD, Architecture Specs & Test Reports
├── DEPLOYMENT.md             # Detailed production deployment cookbook
└── README.md                 # Project showcase & documentation
```

---

<div align="center">

Made with ⚡ by [Carlton Kenny](https://github.com/Carltonkenny) • Built for the 2026 AI Agent Ecosystem

</div>
