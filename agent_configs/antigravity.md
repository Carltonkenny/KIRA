# Antigravity KIRA Integration

To make Antigravity auto-invoke KIRA before answering, you need to add an MCP server configuration and a prompt-interception rule to your workspace rules.

## Step 1: Add KIRA as MCP Server

Add KIRA to your Antigravity settings:

```json
{
  "mcpServers": {
    "kira": {
      "command": "python",
      "args": ["c:/Users/user/OneDrive/Desktop/KIRA/backend/mcp_server.py"],
      "env": {
        "PYTHONPATH": "c:/Users/user/OneDrive/Desktop/KIRA/backend"
      }
    }
  }
}
```

## Step 2: Add Rule to AGENTS.md / `.agents/AGENTS.md`

Add this instruction to your project's `AGENTS.md` or global configurations:

```markdown
## KIRA Smart Prompt Interception
Before responding to any complex developer prompt (vague tasks, feature build requests, architecture refactors, etc.), you MUST call the `kira_enhance` MCP tool. 

Example:
1. User prompt: "build a dark mode toggler in react"
2. Action: Call `kira_enhance(prompt="build a dark mode toggler in react", agent_name="antigravity")`
3. Result: Use the returned enhanced prompt to write the code.

For simple terminal commands, confirmations, or targeted fixes specifying line numbers (e.g. "git push", "fix typo on line 12"), proceed directly without calling `kira_enhance`.
```
