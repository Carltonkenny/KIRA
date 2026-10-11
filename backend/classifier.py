"""KIRA Fast Classifier — Intelligent Intent & Bypass Detection.
Eliminates arbitrary word-count gates, accurately distinguishing between:
- Conversational greetings & pleasantries ("hi", "hello", "ok thanks")
- KIRA meta-questions ("what is kira", "how do you work")
- Shell commands & direct code snippets
- Technical prompts of any length ("add oauth authentication", "fix slow query")
"""

import re
from typing import Dict, Any

# Shell/CLI commands
SHELL_COMMANDS = {
    "git", "npm", "pip", "cd", "mkdir", "ls", "cat", "python", "node", "pytest", 
    "cargo", "docker", "docker-compose", "curl", "wget", "yarn", "go", "rustc",
    "bun", "deno", "gradle", "mvn", "pip3", "python3", "uv"
}

# Conversational acknowledgments
PASS_THROUGH_PHRASES = {
    "ok thanks", "thanks", "thank you", "thank you so much", "cool thanks", "ok thank you",
    "yes", "no", "ok", "sure", "continue", "proceed", "ack", "y", "n", "fine", 
    "cool", "perfect", "good", "got it", "understood", "makes sense"
}

# Greetings
GREETING_PHRASES = {
    "hello", "hi", "hey", "hi there", "hello there", "good morning", "good afternoon",
    "good evening", "yo", "sup", "hey kira", "hello kira", "hi kira"
}

# Inquiries about KIRA
KIRA_META_PATTERNS = [
    r"\bwhat\s+is\s+kira\b",
    r"\bwho\s+are\s+you\b",
    r"\bwhat\s+(do|can)\s+you\s+do\b",
    r"\bhow\s+does\s+kira\s+work\b",
    r"\btell\s+me\s+about\s+kira\b",
    r"\bexplain\s+kira\b",
    r"\bwhat\s+is\s+promptforge\b",
    r"\bhelp\s+me\s+understand\s+kira\b",
]

FILE_PATH_RE = re.compile(r'\b[\w\-\/\\\.]+\.(py|js|ts|tsx|jsx|html|css|go|rs|cpp|h|json|yaml|yml|sh|md|sql)\b', re.IGNORECASE)
LINE_NUMBER_RE = re.compile(r'\b(line\s+\d+|L\d+)\b', re.IGNORECASE)


def classify(prompt: str) -> Dict[str, Any]:
    """
    Intelligently classifies prompt intent.
    Never bypasses short technical tasks (e.g., 'add oauth authentication').
    """
    cleaned = prompt.strip()
    lower = cleaned.lower().rstrip("!.,?")

    # 1. User manual bypass prefix "!"
    if cleaned.startswith("!"):
        return {
            "action": "pass_through",
            "intent": "pass_through",
            "reason": "Bypassed via user prefix '!'"
        }

    # 2. Conversational greetings
    if lower in GREETING_PHRASES:
        return {
            "action": "conversational",
            "intent": "greeting",
            "reason": "Greeting message",
            "reply": "Hello! I am KIRA, your prompt intelligence layer. Give me any raw coding task, bug report, or architecture goal, and I'll recall your persistent project context to engineer an unambiguous, production-ready prompt template. What are we building today?"
        }

    # 3. Questions about KIRA
    for pattern in KIRA_META_PATTERNS:
        if re.search(pattern, lower):
            return {
                "action": "conversational",
                "intent": "about_kira",
                "reason": "Inquiry about KIRA capabilities",
                "reply": "KIRA (Knowledgeable Interface for Refinement & Adaptation) is a context-aware prompt refinement engine. Instead of generating raw code with hallucinations, KIRA intercepts vague engineering requests, injects verified developer stack context from your persistent Neon database, removes ambiguities, and outputs production-grade prompt specifications tailored for AI coding agents (Claude Code, Cursor, Antigravity)."
            }

    # 4. Pure pleasantries / acknowledgments ("ok thanks")
    if lower in PASS_THROUGH_PHRASES:
        return {
            "action": "pass_through",
            "intent": "pass_through",
            "reason": "Conversational acknowledgment",
            "reply": "You're welcome! Whenever you're ready, share your next task or architectural requirement."
        }

    # 5. Shell commands
    words = cleaned.split()
    first_word = words[0].lower().rstrip(":")
    if first_word in SHELL_COMMANDS and len(words) <= 8 and not any(w in lower for w in ["build", "write", "create", "make", "implement"]):
        return {
            "action": "pass_through",
            "intent": "shell_command",
            "reason": f"Direct shell command starting with '{first_word}'"
        }

    # 6. Very short pinpoint code pointers (e.g., "fix typo on line 42 in server.py")
    if len(words) <= 10:
        has_file = FILE_PATH_RE.search(cleaned) is not None
        has_line = LINE_NUMBER_RE.search(cleaned) is not None
        if has_file and has_line:
            return {
                "action": "pass_through",
                "intent": "pinpoint_edit",
                "reason": "Pinpoint file and line edit instruction"
            }

    # 7. Raw code snippets (markdown fences or heavy symbols)
    if "```" in cleaned:
        return {
            "action": "pass_through",
            "intent": "code_block",
            "reason": "Prompt contains direct markdown code block"
        }

    # High code density (>35% symbols)
    total_chars = len(cleaned)
    if total_chars > 20:
        code_chars = sum(1 for c in cleaned if c in "{}[]();<>=+-*/%&|^~#")
        if (code_chars / total_chars) > 0.35:
            return {
                "action": "pass_through",
                "intent": "code_snippet",
                "reason": "High symbol density indicating raw code snippet"
            }

    # Default: ALL technical prompts (including short 2-4 word prompts like 'add oauth authentication') MUST be enhanced!
    return {
        "action": "enhance",
        "intent": "refinement",
        "reason": "Technical task or architecture goal requiring prompt enhancement"
    }
