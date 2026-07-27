# KIRA v4 — Build Plan (Phased)

## Build Philosophy

> **MVP first. Full on top. Ambitious scales it.**
> Every file created in Phase 1 has extension points for Phase 2 and 3. No rewrites.

---

## Phase 1: MVP (~13-14 days)

### What It Delivers
A working MCP server that any agent can call. It classifies prompts, retrieves memories from Mem0 cloud, translates sloppy human language into structured agent instructions via DeepSeek, and learns new facts from every interaction.

### New Project Structure

```
KIRA/
├── the doc/                        # Documentation (you're reading it)
│   ├── PRD.md
│   ├── BUILD_PLAN.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── WHY.md
│   ├── WHEN.md
│   └── PROBLEMS.md
├── backend/
│   ├── core/                       # [NEW] Core engine modules
│   │   ├── __init__.py
│   │   ├── classifier.py           # [NEW] Three-layer skip classifier
│   │   ├── enhancer.py             # [NEW] LLM-based AI-to-AI translation
│   │   ├── memory.py               # [NEW] Mem0 integration wrapper
│   │   └── fingerprint.py          # [NEW] Behavioral fingerprint (Phase 2 stub)
│   ├── models/                     # [NEW] Pydantic models
│   │   ├── __init__.py
│   │   └── schemas.py              # [NEW] Request/response schemas
│   ├── data/                       # [NEW] Data storage
│   │   ├── classifier_examples.json # [NEW] Default training examples
│   │   └── kira_analytics.db       # [NEW] SQLite for logs & analytics
│   ├── tests/                      # [UPGRADED] Real tests
│   │   ├── test_classifier.py
│   │   ├── test_enhancer.py
│   │   ├── test_memory.py
│   │   └── test_integration.py
│   ├── config.py                   # [REWRITE] New config with Mem0 + DeepSeek
│   ├── mcp_server.py               # [REWRITE] New smart MCP tools
│   ├── schema.sql                  # [KEEP] For analytics logging
│   └── requirements.txt            # [UPDATE] Add mem0ai, sentence-transformers
├── agent_configs/                  # [NEW] Ready-to-use agent config templates
│   ├── antigravity.md              # Auto-invoke rules for Antigravity
│   ├── opencode.jsonc              # MCP config for OpenCode
│   ├── cline.json                  # MCP config for Cline
│   └── README.md                   # Setup guide for each agent
├── DECISIONS.md                    # [UPDATE] Log new decisions
├── BOTTLENECKS.md                  # [UPDATE] New bottlenecks
├── README.md                       # [REWRITE] New docs
└── .env.example                    # [NEW] Template env file
```

### Build Order (Day by Day)

#### Days 1-2: Foundation
| Task | File | Details |
|---|---|---|
| New config system | `backend/config.py` | DeepSeek config + Mem0 API key + environment vars |
| Pydantic schemas | `backend/models/schemas.py` | `EnhanceRequest`, `EnhanceResponse`, `ClassifierResult`, `FeedbackSignal` |
| `.env.example` | `.env.example` | Template with all required env vars |
| Requirements | `backend/requirements.txt` | `mem0ai`, `sentence-transformers`, `mcp`, `pydantic`, `openai` |

#### Days 3-5: Core Engine (Parallel Tracks)

**Track A: Memory (Days 3-5)**
| Task | File | Details |
|---|---|---|
| Mem0 wrapper | `backend/core/memory.py` | Initialize `MemoryClient`, wrap `add()`, `search()`, `get_all()`. Handle Mem0 API errors gracefully. Scope by `user_id` + `agent_id`. |
| Memory migration | — | Export existing SQLite memories → Mem0 cloud (one-time script) |

**Track B: Classifier (Days 3-5)**
| Task | File | Details |
|---|---|---|
| Heuristic layer | `backend/core/classifier.py` | Token count, bypass prefix, code detection |
| Intent classifier | `backend/core/classifier.py` | Load MiniLM embedding model, classify against examples |
| Default examples | `backend/data/classifier_examples.json` | 50-100 labeled prompts across 6 intent categories |

#### Days 6-8: Enhancement Pipeline
| Task | File | Details |
|---|---|---|
| AI-to-AI translator | `backend/core/enhancer.py` | DeepSeek call: sloppy prompt + memories → structured instructions |
| Pipeline orchestration | `backend/core/enhancer.py` | Wire classifier → memory search → translation → output |
| Analytics logging | `backend/data/kira_analytics.db` | Log every prompt: raw, enhanced, intent, agent, timestamp |

#### Days 9-10: MCP Server
| Task | File | Details |
|---|---|---|
| `kira_enhance` tool | `backend/mcp_server.py` | Main tool: classify → memory → enhance → return |
| `kira_feedback` tool | `backend/mcp_server.py` | Accept/reject signal, update memory scores |
| `kira_memories` tool | `backend/mcp_server.py` | Return memories filtered by agent |
| `kira_status` tool | `backend/mcp_server.py` | Health check, memory count, stats |

#### Days 11-13: Integration & Testing
| Task | File | Details |
|---|---|---|
| Agent configs | `agent_configs/` | Ready-to-paste config for Antigravity, OpenCode, Cline |
| Auto-invoke rules | `agent_configs/*.md` | AGENTS.md rules that tell agents to call KIRA |
| Unit tests | `backend/tests/` | Classifier, enhancer, memory, integration |
| Edge case testing | — | Empty prompts, very long prompts, pure code, unicode, etc. |

---

## Phase 2: Full (~17 days) — Extension Points

### Behavioral Fingerprint Engine
**File:** `backend/core/fingerprint.py` (stub created in Phase 1)

**What it tracks:**
- Prompt length distribution (mean, std dev)
- Vocabulary frequency (tech keywords, action words)
- Time-of-day patterns (morning = planning, night = debugging)
- Session length and prompts-per-session averages
- Intent distribution (what % of your prompts are builds vs. fixes vs. questions)
- Enhancement accept/reject rate over time
- Common first words / opening patterns

**What it fingerprints:**
Think of it as KIRA building a "developer DNA" profile. Not just what you say, but HOW you say it, WHEN you say it, and what WORKS when you say it.

| Fingerprint Dimension | What It Measures | How KIRA Uses It |
|---|---|---|
| **Vocabulary** | Your most-used technical words | Auto-includes in memory context |
| **Formality** | Casual vs. formal language ratio | Matches enhancement tone to your style |
| **Time Patterns** | When you code vs. when you plan | Adjusts enhancement strategy by time of day |
| **Task Preference** | Build vs. fix vs. explain ratio | Weights intent classifier toward your patterns |
| **Quality Threshold** | What enhancement level you typically accept | Auto-adjusts density (short/medium/detailed) |
| **Speed Preference** | How fast you re-prompt (impatient vs. thorough) | Adjusts enhancement depth |
| **Agent Preference** | Which agent you use for which task type | Routes per-agent memories correctly |

**How aggressive should it be?**

I recommend **Suggestive mode** for Phase 2:
- Track patterns passively (always on)
- Show insights via `kira_status` tool ("Your accept rate dropped 20% this week")
- Suggest changes ("Switch to 'short' density? Your accept rate for 'detailed' is 35%")
- Do NOT auto-modify behavior without user confirmation
- Graduate to autonomous mode in Phase 3 once you trust the fingerprint data

### Outcome Feedback Loop
**File:** `backend/core/feedback.py`

Connects `kira_feedback` signals to:
- Memory relevance scores (accepted → boost, rejected → decay)
- Classifier training data (add outcomes as labeled examples)
- Fingerprint quality threshold updates

### Per-Agent Profiles
**File:** `backend/core/memory.py` (extension)

Uses Mem0's `agent_id` scope. Each agent gets its own memory partition + enhancement strategy.

### Prompt Pattern Library
**File:** `backend/core/patterns.py`

Detects repeated prompt structures, extracts templates with variable slots, offers auto-completion.

### Sleep-Time Consolidation
**File:** `backend/core/consolidation.py`

Nightly cron job that:
1. Reviews all memories
2. Deduplicates via Mem0
3. Resolves contradictions
4. Compiles summary report

---

## Phase 3: Ambitious (~25 days) — Scalability

### Cross-Agent Observatory
Full analytics dashboard (web UI) showing:
- Prompt effectiveness per agent
- Enhancement accept rates over time
- Memory growth and decay
- Behavioral fingerprint evolution

### DSPy Compilation Pipeline
After 3 months of data:
1. Export prompt→outcome pairs from SQLite analytics DB
2. Define evaluation metrics (accept rate, re-prompt rate)
3. Run DSPy MIPROv2 optimizer over the enhancement pipeline
4. Deploy compiled templates that run WITHOUT LLM calls
5. Re-compile monthly with new data

### Prompt Regression Testing
Golden dataset of 50-100 prompts with expected enhancements.
Run before any KIRA update to ensure quality doesn't degrade.

---

## Scalability Architecture Summary

```
Phase 1 (MVP):
  Simple pipeline → Classify → Memory → Enhance → Return
  
Phase 2 (Full):
  Pipeline + Fingerprint context → Classify with learned weights 
  → Memory with per-agent scope → Enhance with feedback-tuned templates
  
Phase 3 (Ambitious):
  Pipeline + Compiled DSPy templates → Classify with trained model 
  → Memory with graph relationships → Enhance with zero-LLM compiled output
```

Each phase adds a layer. Nothing gets rewritten. The classifier gets smarter. The memory gets deeper. The enhancement gets cheaper.
