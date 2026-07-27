# Known Bottlenecks & Optimization Strategies: KIRA

This document outlines key performance and operational bottlenecks that can arise during KIRA's lifecycle, along with their solutions.

---

## 1. LLM API Latency
* **Bottleneck:** Sending multiple agent requests sequentially to LLM APIs creates massive network latency overhead (6+ seconds).
* **Mitigation:**
  * Consolidate the entire prompt analysis and engineering cycle into a **single, structured LLM call**.
  * Use **DeepSeek's API** or **Groq** for high-speed token generation.
  * Implement an optional in-memory cache for repeating prompt queries.

---

## 2. PostgreSQL Connection Pooling
* **Bottleneck:** Opening and closing database connections for every API endpoint or MCP tool call can overwhelm local and cloud PostgreSQL limits.
* **Mitigation:**
  * Use `asyncpg.create_pool` to initialize a pool on backend startup.
  * Share the pool globally across route handlers.
  * Release connections immediately using `async with pool.acquire()` blocks.

---

## 3. Editor Context Window Overfill
* **Bottleneck:** Elaborate prompt templates (e.g. 2,000+ words) eat up the IDE's prompt window budget, forcing the model to forget code context.
* **Mitigation:**
  * Implement density configurations (`short`, `medium`, `detailed`).
  * In `short` mode, KIRA outputs dense Markdown rules/instructions rather than verbose explanations, preserving developer context.

---

## 4. Memory Overload (Noise)
* **Bottleneck:** Saving every conversational fact turns the memory prompt context into a cluttered, noisy list of contradicting facts.
* **Mitigation:**
  * Impose a schema filter limiting memories to specific categories (`tech_stack`, `style`, `constraints`).
  * Automatically deduplicate or combine overlapping facts on the database level.
