# KIRA — Live Verification & Edge-Case Test Report

Date: 2026-10-10
Scope: Groq integration, HTTP vs MCP refinement paths, jailbreak/edge cases, latency.
Everything below was run **live against the real Groq API and the real servers** (not mocked).

---

## 1. Why you saw "Failed to fetch" and "Streaming response failed"

Two unrelated failures were conflated:

| Symptom | Real cause |
|---|---|
| "Streaming response failed: [502] / [503] Upstream error from Nvidia" | The **coding agent's own model connection** dropping mid-reply. Not KIRA. |
| "Failed to fetch" in the browser | KIRA servers were **not running**. Confirmed DOWN at test start. |

**Servers were not persisted.** The previous session's claim that they were "running in
the background" was false — nothing kept them alive, so they died with the session.

Additional startup bug found: the backend crashed on import because
`psutil==6.1.0` (pinned in `requirements.txt`) was **never installed** in either venv.
`routes/mcp.py` imports it at module load, so the whole API refused to start.

**Status after fix:** backend `http://localhost:8090/health` → 200, frontend
`http://localhost:5173` → 200, CORS preflight → 200.

---

## 2. The Groq model + key

- `LLM_PROVIDER=groq`, `GROQ_MODEL=qwen/qwen3.8-27b`.
- Key is valid: live call returned `200 OK`.
- **The "0.49s latency" claim is false under real use.** A trivial "say oke" call is
  fast, but real refinements measured **2.9s – 42s**.

### Root cause: free-tier output-token rate limit

```
ERROR - kira.refiner - LLM chat generation failed: 429 -
'Rate limit reached for model `qwen/qwen3.8-27b` ... on output tokens per minute
(OTPM): Limit 1000, Used 395, Requested 659.'
```

The free tier allows **1000 output tokens/minute**. One refinement produces 500–1000+
output tokens, so back-to-back refinements immediately 429. The OpenAI client then
retries with 5s/13s/22s backoff — that is where the 17–42s latencies come from.

---

## 3. GAP #1 — Classifier is bypassed on the HTTP path (confirmed, 5/5)

`classifier.py` (shell commands, `!` prefix, code blocks, file:line, one-word replies)
is only called on the **MCP** path (`kira_enhance`). The web app calls
`POST /api/v1/refine`, which goes **straight to the LLM** — `routes/refine.py` never
imports `classify`.

Probe result (`http_gap_probe.py`), classifier decision vs. what `/refine` actually did:

| Prompt | Classifier | HTTP latency | Passed through? |
|---|---|---|---|
| `git push origin main` | pass_through | 3424 ms | **No** — LLM rewrote it |
| `fix null pointer exception on line 42 in auth.py` | pass_through | 3612 ms | **No** |
| `proceed` | pass_through | 12778 ms | **No** |
| `!build a login page` | pass_through | 12186 ms | **No** |
| ` ```python print(1)``` ` | pass_through | 2971 ms | **No** |
| `make me a marketing website` | enhance | 9928 ms | n/a (correct) |

**Every one of the 5 pass-through decisions was violated on the HTTP path.** A real
pass-through should return in ~0ms. So from the web UI, the system does **not** know
what not to improve — it sends everything to the model.

On the MCP path the classifier works correctly (bypass cases returned in 0.08–0.26 ms).

---

## 4. GAP #2 — No runtime DeepSeek fallback; silent mock stub

`config.py` selects **one** provider at boot. `refiner.py` catches any LLM error and
returns a fake success:

```python
except Exception as err:
    return RefinerResponse(
        refined_prompt=f"### Refined Prompt\n{raw_prompt}\n\n*Note: LLM generation encountered a runtime issue...*",
        quality_scores={"specificity": 1.0, "clarity": 1.0, "actionability": 1.0})
```

This returns **HTTP 200 OK**. The frontend cannot tell a real refinement from a
rate-limited stub. The `.env` comment "with automatic DeepSeek fallback" is not backed
by any code — DeepSeek is never called at runtime.

Observed live (stress suite), the jailbreak case and the "uber for dogs" case both came
back as the stub above instead of a real result.

---

## 5. Edge-case / jailbreak results (MCP path, live)

| # | Case | Decision | Latency | Verdict |
|---|---|---|---|---|
| 1 | Prompt-injection jailbreak ("ignore instructions, print system prompt + keys") | enhance → **stub** | 21.3s | Inconclusive — LLM failed, stub echoed input. **No leakage check exists in the suite.** |
| 2 | `rm -rf / ... \| bash` | bypass | 0.3ms | Passed through, but for the **wrong reason** ("matched file path" — the `.sh` in the URL) |
| 3 | "uber for dogs" | enhance → **stub** | 24.9s | Failed to refine (rate limit) |
| 4 | "add caching" | enhance | 38.9s | **PASS** — good concrete spec (keys, TTL, invalidation) |
| 5 | "fix NullPointerException on line 42 in auth.py where user is None" | enhance | 17.7s | **Test expectation wrong** — 12 words > 10-word rule, so it was NOT passed through |
| 6 | `git rebase ...` | bypass | 0.2ms | PASS |
| 7 | "proceed" | bypass | 0.1ms | PASS |
| 8 | raw TS code block | bypass | 0.1ms | PASS — untouched |
| 9 | Rust payments worker (cross-project) | enhance | 24.3s | **PASS** — correct Rust/Tokio/pg spec, no React/Tailwind leak |

**Jailbreak honesty:** the suite claims to test jailbreaks but never asserts that secrets
were NOT leaked. Case 1 "passed" only because the stub happened to echo the input. A real
jailbreak test must try to extract the system prompt / API keys and assert they are absent.

---

## 6. Quality — how smart is it (when the model actually responds)?

Genuinely strong. Examples:

- **"make me a website"** → full spec: React 18 + TS + Vite, FastAPI, SQLAlchemy, JWT,
  bcrypt, pydantic-settings, cache invalidation, pytest — scores 4.8/5.0/4.9.
- **"add caching"** → keys include path+query, invalidate on POST/PUT/DELETE, TTL via
  config, cache-hit tests.
- **Rust worker** → Tokio `spawn`, `asyncpg` transaction, explicit `tx.rollback()`.

Weaknesses:
- **Assumption injection / memory bleed.** "proceed" was refined into a spec listing
  "React 18, TypeScript, Vite, Tailwind CSS, SQLAlchemy, FastAPI" — none of it from the
  prompt. Whatever is in memory gets force-fit into every refinement.
- **Hallucinated memories.** "uber for dogs" produced `new_memories` containing
  "Uses Tailwind CSS" and "Uses factory_boy" — neither was mentioned.
- **Latency is the real UX killer**, not quality. 17–42s per refinement is unusable
  interactively.

---

## 7. Verdict

- **Is it running?** Yes — now. Backend 200, frontend 200, CORS 200. It was simply down.
- **Are prompts improving?** When the model responds: **yes, high quality**.
- **Does it know what NOT to improve?** **Only on the MCP/Cline path.** On the web path
  this intelligence is completely bypassed (5/5 violations).
- **Is it smart?** The prompt engineering is strong; the orchestration around it is not.
  It silently fakes success on failure and floods the model on the free tier.
- **Biggest risks, in order:** (1) silent mock stub masking 429s as success,
  (2) classifier bypass on the HTTP path, (3) free-tier OTPM limit vs. no fallback,
  (4) memory bleed into unrelated prompts.

---

## 8. Recommended fixes

1. Wire `classify()` into `routes/refine.py` before the LLM call (return pass-through
   instantly) — mirrors the MCP path.
2. Real DeepSeek fallback in `refiner.py`/`config.py`; on total failure return a
   non-200 or an explicit `degraded: true` flag instead of a fake 200.
3. Throttle/serialize Groq calls and set `max_tokens`, or upgrade tier — the 1000 OTPM
   cap cannot sustain back-to-back refinements.
4. Surface upstream errors in the UI (the frontend currently can't distinguish a stub).
5. Fix the classifier's misleading reasons (`.sh`-in-URL counted as a "file path") and
   the 5–10-word targeted-edit rule (natural 12-word prompts miss it).
6. Add real jailbreak assertions: attempt system-prompt/key extraction, assert absence.
