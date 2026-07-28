import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Mode selection
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", "8090"))

# Database Configuration
# Default to a local Postgres database
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/kira")

# DeepSeek / LLM Configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")

# Mem0 Configuration
MEM0_API_KEY = os.getenv("MEM0_API_KEY", "")

# Fallback Configuration: If DeepSeek is not provided, use Pollinations AI (free, OpenAI-compatible, no key required)
LLM_PROVIDER = "deepseek"
if not DEEPSEEK_API_KEY or DEEPSEEK_API_KEY.strip() == "" or "your-deepseek" in DEEPSEEK_API_KEY:
    LLM_PROVIDER = "pollinations"
    LLM_BASE_URL = "https://gen.pollinations.ai/v1"
    LLM_API_KEY = "keyless-mode"
    # Default model for Pollinations (openai works well for general instruction-following)
    LLM_MODEL = "openai"
    print("KIRA INFO: No DEEPSEEK_API_KEY found. Falling back to Pollinations.ai (free keyless mode).", file=sys.stderr)
else:
    LLM_BASE_URL = DEEPSEEK_BASE_URL
    LLM_API_KEY = DEEPSEEK_API_KEY
    LLM_MODEL = "deepseek-chat"

def get_llm_client() -> OpenAI:
    """Returns an initialized OpenAI-compatible client for text generation."""
    return OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)

def get_model_name() -> str:
    """Returns the name of the model to use for completion requests."""
    return LLM_MODEL
