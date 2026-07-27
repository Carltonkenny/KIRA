# Technical Requirements & API Specification: KIRA

## 1. System Setup & Prerequisites

* **Operating System:** Windows (compatible with standard CMD/Powershell).
* **Runtime:** Python 3.11+, Node.js 18+.
* **Database:** PostgreSQL (local setup or cloud instance such as Neon/Supabase).
* **AI Provider:** DeepSeek Chat API (`https://api.deepseek.com/v1`) with fallback to Pollinations AI for keyless developer testing.

---

## 2. Environment Variables (`.env`)

```bash
# App Configuration
ENVIRONMENT=development
PORT=8000

# Database Configuration
POSTGRES_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/kira

# LLM Configuration
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

---

## 3. API Specifications

### 3.1. Prompt Refinement Endpoint
* **Endpoint:** `POST /api/v1/refine`
* **Request Schema:**
  ```json
  {
    "prompt": "write a python script to parse logs",
    "density": "short",
    "session_id": "session-xyz123"
  }
  ```
* **Response Schema (Structured Output):**
  ```json
  {
    "refined_prompt": "Markdown format of instructions...",
    "intent": "refine",
    "domain": "python_development",
    "new_memories": ["Uses Python 3.11", "Needs JSON output"],
    "quality_scores": {
      "specificity": 4.5,
      "clarity": 4.8,
      "actionability": 4.6
    }
  }
  ```

### 3.2. Conversational Follow-up Endpoint
* **Endpoint:** `POST /api/v1/chat`
* **Request Schema:**
  ```json
  {
    "message": "make it async and add error handling",
    "session_id": "session-xyz123"
  }
  ```
* **Response Schema:**
  ```json
  {
    "response": "Here is the refined prompt utilizing async...",
    "refined_prompt": "Updated Markdown format of instructions..."
  }
  ```

### 3.3. Memories Endpoint
* **Endpoint:** `GET /api/v1/memories`
* **Response Schema:**
  ```json
  [
    {
      "id": "mem-1",
      "category": "tech_stack",
      "fact": "Uses Python 3.11"
    }
  ]
  ```

---

## 4. MCP Tool Definitions

KIRA registers the following tools in the stdio MCP protocol:
1. `forge_refine(prompt: str, session_id: str, density: str = "short") -> str`
2. `forge_chat(message: str, session_id: str) -> str`
3. `get_kira_memories() -> str`
