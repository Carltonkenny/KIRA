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

# DeepSeek / LLM Configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")

# Mem0 Configuration
MEM0_API_KEY = os.getenv("MEM0_API_KEY", "")

LLM_BASE_URL = DEEPSEEK_BASE_URL
LLM_API_KEY = DEEPSEEK_API_KEY
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek-chat")

def get_llm_client() -> OpenAI:
    """Returns an initialized OpenAI-compatible client for text generation."""
    return OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)

def get_model_name() -> str:
    """Returns the name of the model to use for completion requests."""
    return LLM_MODEL

def parse_llm_json(raw: str) -> dict:
    """Helper to clean markdown code fences and parse LLM JSON responses."""
    content = raw.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        if lines[0].startswith("```json") or lines[0].startswith("```"):
            content = "\n".join(lines[1:-1])
    return json.loads(content.strip())
