import os
import logging
import json
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Initialize standard logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)
logger = logging.getLogger("kira")

# Load .env from the script's directory, not CWD
load_dotenv(Path(__file__).resolve().parent / ".env")

# Mode selection
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", "8090"))

# CORS — comma-separated list of allowed origins
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# LLM Provider Configuration (Supports Groq and DeepSeek)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq" if os.getenv("GROQ_API_KEY") else "deepseek").lower()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

if LLM_PROVIDER == "groq" and GROQ_API_KEY:
    LLM_BASE_URL = GROQ_BASE_URL
    LLM_API_KEY = GROQ_API_KEY
    LLM_MODEL = os.getenv("LLM_MODEL", GROQ_MODEL)
else:
    LLM_BASE_URL = DEEPSEEK_BASE_URL
    LLM_API_KEY = DEEPSEEK_API_KEY
    LLM_MODEL = os.getenv("LLM_MODEL", DEEPSEEK_MODEL)

# Mem0 Configuration
MEM0_API_KEY = os.getenv("MEM0_API_KEY", "")

def get_llm_client() -> OpenAI:
    """Returns an initialized OpenAI-compatible client for text generation."""
    return OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)

def get_model_name() -> str:
    """Returns the name of the model to use for completion requests."""
    return LLM_MODEL

def get_fallback_client_and_model():
    """Returns fallback client and model name if primary provider is rate-limited or fails."""
    if LLM_PROVIDER == "groq" and DEEPSEEK_API_KEY:
        return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL), DEEPSEEK_MODEL
    elif LLM_PROVIDER == "deepseek" and GROQ_API_KEY:
        return OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL), GROQ_MODEL
    return None, None

def parse_llm_json(raw: str) -> dict:
    """Helper to clean markdown code fences and parse LLM JSON responses."""
    content = raw.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        if lines[0].startswith("```json") or lines[0].startswith("```"):
            content = "\n".join(lines[1:-1])
    return json.loads(content.strip())
