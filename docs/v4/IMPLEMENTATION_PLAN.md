# KIRA v4 — Implementation Plan (Technical Specification)

## Answering Your Grilling Questions (Locked Decisions)

### 1. "MVP" → Phase 1 Scope Confirmed

We're building the MVP with a scalable foundation. Every module has Phase 2/3 extension stubs built in from day one. The MVP delivers a **working, useful** MCP server in ~13-14 days.

### 2. "DeepSeek Only" → LLM Provider Confirmed

```python
# config.py — DeepSeek configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = "deepseek-chat"

# Cost: $0.14/M input tokens, $0.28/M output tokens
# At ~1M tokens/month = ~$0.42/month total
```

Why DeepSeek is the right call:
- OpenAI-compatible API (works with `openai` Python SDK)
- Cheapest structured output provider in 2026
- Fast inference (~500-800ms for enhancement calls)
- Your existing KIRA v3 already uses this provider

### 3. "Never Used Mem0 — Talk About How to Use It" → Full Walkthrough

#### What Mem0 Actually Is
Mem0 is a **memory-as-a-service** SDK. You don't build a memory system — you call their API. Think of it like a database you don't manage: you `add()` stuff, you `search()` for stuff, it handles dedup, relevance, and relationships internally.

#### Managed Cloud Setup (5 minutes)

**Step 1:** Sign up at [app.mem0.ai](https://app.mem0.ai) → Get API key

**Step 2:** Add to your `.env`:
```bash
MEM0_API_KEY=your-api-key-here
```

**Step 3:** Install:
```bash
pip install mem0ai
```

**Step 4:** Use it:
```python
from mem0 import MemoryClient

# Initialize (one line)
client = MemoryClient(api_key=os.getenv("MEM0_API_KEY"))

# ---- ADD A MEMORY ----
# KIRA calls this after extracting facts from your prompt
client.add(
    "User prefers FastAPI over Flask for Python backends",
    user_id="local_user",
    metadata={"category": "tech_stack", "source": "auto_learned"}
)

# ---- SEARCH MEMORIES ----
# KIRA calls this before enhancing your prompt
results = client.search(
    "What backend framework does the user prefer?",
    user_id="local_user"
)
# Returns: [{"memory": "User prefers FastAPI over Flask...", "score": 0.94}]

# ---- GET ALL MEMORIES ----
# KIRA calls this for the kira_memories tool
all_mems = client.get_all(user_id="local_user")

# ---- PER-AGENT MEMORIES ----
# KIRA scopes memories by which agent you're using
client.add(
    "User wants verbose logging when using OpenCode",
    user_id="local_user",
    agent_id="opencode"  # Only retrieved for OpenCode
)
```

#### What Happens Under the Hood
When you call `client.add("User prefers FastAPI over Flask")`, Mem0:
1. Calls its internal LLM to extract structured entities
2. Checks for semantic duplicates (won't store it twice)
3. Checks for contradictions (if "uses Flask" exists, it updates/invalidates)
4. Stores the fact in its vector store + entity graph
5. Returns a memory ID

When you call `client.search("what framework?")`, Mem0:
1. Embeds your query
2. Searches vector store for semantic matches
3. Ranks by relevance + recency
4. Returns top-K results with confidence scores

**You never manage the vector store, the embeddings, or the dedup logic.** Mem0 does all of it.

#### Pricing (Managed Cloud)
| Tier | Price | Limits |
|---|---|---|
| **Free (Hobby)** | $0/month | 10,000 memory adds, 1,000 searches/month |
| **Starter** | $19/month | Higher limits + vector search |
| **Pro** | $249/month | Graph memory + unlimited |

**For KIRA MVP:** The free tier is MORE than enough. At ~30 enhanced prompts/day × 30 days = 900 adds/month and ~900 searches/month. Well within free tier limits.

### 4. "Start with Managed Cloud — Access Anywhere" → Confirmed

You're right — managed is the easiest onramp. Zero Docker, zero local vector stores, zero maintenance. Just an API key.

The beauty: if you later want to switch to self-hosted (privacy, cost, whatever), the API is nearly identical:

```python
# Managed cloud:
from mem0 import MemoryClient
client = MemoryClient(api_key="your-key")

# Self-hosted (swap ONE import):
from mem0 import Memory
client = Memory.from_config({
    "llm": {"provider": "openai", "config": {"model": "deepseek-chat", ...}},
    "vector_store": {"provider": "chroma", "config": {"path": "./mem0_data"}}
})
```

Same `.add()`, `.search()`, `.get_all()` methods. One-line migration.

### 5. "Behavioral Fingerprint — What Should It Be?" → Full Breakdown

The fingerprint is your **developer DNA**. It's everything KIRA learns about HOW you work — not just what you say, but your patterns, rhythms, and preferences.

#### The Seven Dimensions of Your Fingerprint

**Dimension 1: Vocabulary Profile**
```
What: The words you use most often
Tracks: {"build": 47, "fix": 23, "refactor": 12, "explain": 8, "test": 31}
Uses: When you say "build", KIRA knows to generate scaffold instructions.
      When you say "fix", KIRA knows to include debugging context.
```

**Dimension 2: Formality Score**
```
What: How casual vs. formal your prompts are (0.0 = "yo do the thing" → 1.0 = "Please implement...")
Tracks: Rolling average of formality scores per prompt
Uses: Matches the enhancement tone to YOUR tone. If you're casual, KIRA doesn't 
      output corporate-speak. If you're formal, KIRA matches.
```

**Dimension 3: Time-of-Day Patterns**
```
What: What you tend to do at different times
Tracks: {morning: "planning/architecture", afternoon: "implementation", night: "debugging/fixes"}
Uses: At 11pm, KIRA auto-adds debugging context. At 9am, KIRA formats as architecture specs.
```

**Dimension 4: Task Distribution**
```
What: Breakdown of your prompt types over time
Tracks: {build: 30%, fix: 25%, explain: 15%, refactor: 10%, test: 20%}
Uses: Weights the intent classifier. If 30% of your prompts are builds, 
      the classifier has a prior toward "build" for ambiguous prompts.
```

**Dimension 5: Quality Threshold**
```
What: What enhancement level you actually accept
Tracks: accept_rate_by_density = {short: 82%, medium: 54%, detailed: 28%}
Uses: Auto-adjusts density. If you accept "short" 82% of the time, 
      KIRA defaults to short and only uses detailed when you explicitly ask.
```

**Dimension 6: Speed Preference**
```
What: How fast you re-prompt after receiving a response
Tracks: avg_time_to_reprompt = 12 seconds (fast = impatient, wants concise output)
Uses: If you re-prompt quickly, KIRA shortens enhancements. 
      If you take 5+ minutes, KIRA knows you read carefully and can go deeper.
```

**Dimension 7: Agent Routing**
```
What: Which agent you use for which task type
Tracks: {opencode: ["terminal tasks", "scripts"], antigravity: ["architecture", "refactors"]}
Uses: When enhancing for OpenCode, emphasizes CLI-friendly output.
      When enhancing for Antigravity, emphasizes architectural structure.
```

#### Phase 2 Behavior Mode: Suggestive

In Phase 2, the fingerprint is **suggestive, not autonomous**:
- It tracks everything silently
- It surfaces insights via `kira_status`: "Your accept rate for 'detailed' dropped to 28%"
- It SUGGESTS changes: "Switch default density to 'short'?"
- It does NOT auto-change settings without your confirmation
- Phase 3 graduates to autonomous mode once the data is trustworthy

### 6. "AI-to-AI Translation Should Be LLM-Based" → Confirmed + Design

#### How It Works (The Full Pipeline)

```
YOUR PROMPT: "yo do the auth thing again but make it work with supabase this time"

Step 1: CLASSIFIER
  → Intent: task_complex (confidence: 0.83)
  → Decision: ENHANCE

Step 2: MEMORY SEARCH
  → Query Mem0: "auth implementation user preferences"
  → Results:
    - "User implements JWT auth with FastAPI" (score: 0.91)
    - "User prefers async/await patterns" (score: 0.87)
    - "User previously built auth with SQLite local storage" (score: 0.84)

Step 3: AI-TO-AI TRANSLATION (DeepSeek Call)
  System prompt:
  "You are KIRA, a prompt translator. Convert the user's casual prompt 
   into a structured, agent-optimized instruction set.
   
   CONTEXT FROM MEMORY:
   - User implements JWT auth with FastAPI
   - User prefers async/await patterns  
   - User previously built auth with SQLite local storage
   
   RULES:
   - Resolve ALL vague references using the memory context
   - 'again' means: reference the previous implementation pattern
   - 'this time' means: keep the same approach but swap the specified component
   - Output format: [Task] → [Context] → [Constraints] → [Expected Output]
   - Be concise. Agents have context window limits."

  User message: "yo do the auth thing again but make it work with supabase this time"

Step 4: DEEPSEEK RETURNS
  "Implement JWT authentication for the FastAPI backend, migrating from 
   the current SQLite-based token storage to Supabase (PostgreSQL).
   
   Context:
   - Follow the existing async/await pattern from the current auth module
   - Use Supabase's Python client library (supabase-py) for database operations
   - Maintain the same JWT token structure and refresh logic
   
   Constraints:
   - Keep all endpoints async
   - Use environment variables for Supabase URL and anon key
   - Preserve the existing /auth/login and /auth/refresh route signatures
   
   Expected output:
   - Updated auth module with Supabase integration
   - Migration script from SQLite to Supabase schema
   - Updated .env.example with Supabase config variables"

Step 5: RETURN TO AGENT
  → The agent receives this clean, structured prompt
  → It knows exactly what to do, what patterns to follow, what to output
```

**Cost of this call:** ~500 input tokens + ~300 output tokens = ~800 tokens = **$0.00016** (less than a penny per hundred calls)

---

## Technical Implementation — File-by-File Specification

### `backend/config.py` — [REWRITE]

```python
"""
KIRA v4 Configuration
- DeepSeek LLM provider
- Mem0 managed cloud memory
- Classifier settings
"""
import os
from dotenv import load_dotenv
load_dotenv()

# --- LLM Provider (DeepSeek) ---
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# --- Memory Provider (Mem0 Cloud) ---
MEM0_API_KEY = os.getenv("MEM0_API_KEY", "")

# --- Classifier Settings ---
CLASSIFIER_BYPASS_PREFIX = "!"        # Prefix to skip enhancement
CLASSIFIER_MIN_TOKENS = 10           # Prompts shorter than this → pass through
CLASSIFIER_MAX_TOKENS = 200          # Prompts longer than this → pass through (user wrote enough)
CLASSIFIER_CONFIDENCE_THRESHOLD = 0.6 # Below this → escalate to LLM

# --- Analytics ---
ANALYTICS_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "kira_analytics.db")

# --- User ---
DEFAULT_USER_ID = "local_user"
```

### `backend/core/classifier.py` — [NEW]

Three-layer classification engine:
- Layer 1: Pure Python heuristics (token count, prefix, code detection)
- Layer 2: Sentence-transformer embedding model (MiniLM, ~25MB, CPU)
- Layer 3: Flag for LLM fallback

Returns: `ClassifierResult(intent, confidence, action)` where action is `"pass_through"` or `"enhance"`.

### `backend/core/memory.py` — [NEW]

Thin wrapper around `MemoryClient`:
- `init()` → initialize with MEM0_API_KEY
- `remember(fact, agent_name)` → `client.add()` with scoping
- `recall(query, agent_name)` → `client.search()` with filtering
- `all_memories(agent_name)` → `client.get_all()` with optional filter
- Error handling: if Mem0 is down, graceful fallback to "no memories"

### `backend/core/enhancer.py` — [NEW]

The AI-to-AI translation pipeline:
- `enhance(prompt, memories, classifier_result)` → DeepSeek structured call
- System prompt includes: memories, past patterns, normalization rules
- Returns: `EnhanceResult(enhanced_prompt, new_memories, intent, confidence)`

### `backend/mcp_server.py` — [REWRITE]

Four MCP tools:
- `kira_enhance(prompt, agent_name, session_id, force)`
- `kira_feedback(prompt_id, outcome)`
- `kira_memories(agent_name)`
- `kira_status()`

Orchestrates: classifier → memory → enhancer → response + logging.

### `backend/models/schemas.py` — [NEW]

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from enum import Enum

class PromptIntent(str, Enum):
    COMMAND = "command"
    QUESTION = "question"
    TASK_SIMPLE = "task_simple"
    TASK_COMPLEX = "task_complex"
    EXPLORATION = "exploration"
    CONTINUATION = "continuation"

class ClassifierAction(str, Enum):
    PASS_THROUGH = "pass_through"
    ENHANCE = "enhance"

class ClassifierResult(BaseModel):
    intent: PromptIntent
    confidence: float
    action: ClassifierAction
    layer: str  # "heuristic", "embedding", "llm"

class EnhanceResult(BaseModel):
    enhanced_prompt: str
    original_prompt: str
    intent: PromptIntent
    new_memories: List[str]
    was_enhanced: bool
    prompt_id: str

class FeedbackOutcome(str, Enum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    MODIFIED = "modified"
```

---

## Verification Plan

### Automated Tests
```bash
# Run all tests
cd backend && python -m pytest tests/ -v

# Individual test suites
python -m pytest tests/test_classifier.py -v    # Heuristic + embedding accuracy
python -m pytest tests/test_memory.py -v        # Mem0 integration
python -m pytest tests/test_enhancer.py -v      # AI-to-AI translation quality
python -m pytest tests/test_integration.py -v   # Full pipeline end-to-end
```

### Manual Verification
1. Connect KIRA MCP server to Antigravity
2. Test 10 diverse prompts:
   - Simple command ("run the tests") → should pass through
   - Sloppy language ("do the thing like before") → should enhance
   - Technical task ("build a REST API with auth") → should enhance with memories
   - Bypass ("!just paste this exactly") → should pass through
3. Verify memory learning: check `kira_memories` after 10 prompts
4. Verify latency: pass-through <50ms, enhancement <1.5s
