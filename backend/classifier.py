import re
from typing import Dict, Any

# Common shell/development command prefixes
SHELL_COMMANDS = {
    "git", "npm", "pip", "cd", "mkdir", "ls", "cat", "python", "node", "pytest", 
    "cargo", "docker", "docker-compose", "curl", "wget", "yarn", "go", "rustc",
    "bun", "deno", "gradle", "mvn", "pip3", "python3", "uv"
}

# Common conversational feedback words (one-word responses)
ONE_WORD_CONFIRMATIONS = {
    "yes", "no", "ok", "sure", "continue", "proceed", "ack", "y", "n", "fine", 
    "cool", "thanks", "thankyou", "perfect", "good", "hello", "hi", "hey"
}

# Regex to detect code file paths (e.g. main.py, index.js, App.tsx, etc.)
FILE_PATH_RE = re.compile(r'\b[\w\-\/\\\.]+\.(py|js|ts|tsx|jsx|html|css|go|rs|cpp|h|json|yaml|yml|sh|md|sql)\b', re.IGNORECASE)

# Regex to detect line number references (e.g. line 42, L42)
LINE_NUMBER_RE = re.compile(r'\b(line\s+\d+|L\d+)\b', re.IGNORECASE)

def classify(prompt: str) -> Dict[str, Any]:
    """
    Heuristically classifies whether a prompt needs to be enhanced by KIRA.
    
    Returns:
        Dict containing:
            "action": "pass_through" | "enhance"
            "reason": Explanation of the decision.
    """
    cleaned = prompt.strip()
    
    # Rule 1: Starts with bypass prefix "!"
    if cleaned.startswith("!"):
        return {
            "action": "pass_through",
            "reason": "Bypassed via user prefix '!'"
        }
        
    # Rule 7: One-word response/short confirmation
    if cleaned.lower() in ONE_WORD_CONFIRMATIONS:
        return {
            "action": "pass_through",
            "reason": "One-word conversational confirmation"
        }
        
    words = cleaned.split()
    word_count = len(words)
    
    # Rule 2: Extremely short (less than 5 words)
    if word_count < 5:
        return {
            "action": "pass_through",
            "reason": f"Prompt is too short ({word_count} words)"
        }
        
    # Rule 6: Starts with common CLI/shell commands
    first_word = words[0].lower().rstrip(":")
    if first_word in SHELL_COMMANDS:
        return {
            "action": "pass_through",
            "reason": f"Prompt appears to be a shell command starting with '{first_word}'"
        }
        
    # Rule 4: Extremely long (more than 200 words)
    if word_count > 200:
        return {
            "action": "pass_through",
            "reason": f"Prompt is already highly detailed ({word_count} words)"
        }
        
    # Rule 3: 5-10 words AND contains file path or line number
    if 5 <= word_count <= 10:
        has_file = FILE_PATH_RE.search(cleaned) is not None
        has_line = LINE_NUMBER_RE.search(cleaned) is not None
        if has_file or has_line:
            target = "file path" if has_file else "line number"
            if has_file and has_line:
                target = "file path and line number"
            return {
                "action": "pass_through",
                "reason": f"Short targeted instruction specifying a {target}"
            }
            
    # Rule 5: High code character density (>30% of characters are non-alphanumeric code markers)
    # Or contains explicit markdown code fences
    if "```" in cleaned:
        return {
            "action": "pass_through",
            "reason": "Prompt contains direct markdown code blocks"
        }
        
    # Calculate non-alphanumeric/non-space character ratio to filter pasted JSON/code
    total_chars = len(cleaned)
    if total_chars > 0:
        code_chars = sum(1 for c in cleaned if c in "{}[]();<>=+-*/%&|^~#")
        code_ratio = code_chars / total_chars
        if code_ratio > 0.2:
            return {
                "action": "pass_through",
                "reason": f"High code symbol density ({code_ratio:.1%})"
            }
            
    # Default: Enhance
    return {
        "action": "enhance",
        "reason": "Complex task or vague request needing prompt construction"
    }

if __name__ == "__main__":
    # Quick self-test logic
    test_prompts = [
        "!build a login page",
        "git push origin main",
        "fix typo on line 42 in server.py",
        "yes",
        "build a login page in react",
        "Implement a fully functional login page with email validation, bcrypt hashing, jwt session storage, and user registration form.",
        "x = 5;\ny = 10;\nif (x == y) { print(x); }"
    ]
    for tp in test_prompts:
        res = classify(tp)
        print(f"Prompt: {tp!r} -> Action: {res['action']} ({res['reason']})")
