# Architectural Decision Log (ADR): KIRA

## ADR 1: Unified PostgreSQL Adapter (Asyncpg)
* **Context:** The system needs database persistence for user preferences, chat logs, and learned facts. It must run locally on PostgreSQL for development and migrate seamlessly to a managed database (Supabase/Neon) for production.
* **Decision:** We use standard SQL queries over `asyncpg` in Python. We avoid heavy ORMs (like SQLAlchemy or Prisma on the backend) to minimize dependencies, setup complexity, and database connection overhead.
* **Consequence:** Easy setup. The user supplies a local `POSTGRES_URL` connection string for development, and simply updates the env variable to a cloud link to migrate.

---

## ADR 2: Single-Call Refinement Engine
* **Context:** PromptForge v2 used LangGraph with a 4-agent swarm (`intent_agent`, `context_agent`, `domain_agent`, `prompt_engineer_agent`). This resulted in severe network latency (6+ seconds) and complex state syncing.
* **Decision:** Consolidate intent detection, domain classification, memory extraction, and prompt refinement into a single LLM structured call.
* **Consequence:** Reduces refinement latency to under 1 second (sub-second performance) and simplifies state management to a single Pydantic schema model.

---

## ADR 3: Stdio-based Model Context Protocol (MCP) Server
* **Context:** Developers want KIRA to work natively inside their IDEs (like Cursor or Claude Desktop) without keeping a separate GUI open.
* **Decision:** Write `mcp_server.py` using the official `mcp` SDK to export standard tools over stdin/stdout.
* **Consequence:** Cursor and Claude Desktop can interact directly with the SQLite or PostgreSQL database and the refiner module.

---

## ADR 4: Brutalist Dark-Mode UI Theme (UI/UX Pro Max)
* **Context:** The client app must not feel like a generic SaaS clone.
* **Decision:** We apply a Retro-Brutalist visual theme with sharp 0px border-radius, black/dark-zinc background (#09090b), bright acid-lime accent color (#39FF14), and CSS grid borders.
* **Consequence:** Distinctive, premium, modern appearance that stands out instantly.
