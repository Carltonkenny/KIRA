# KIRA Agent Integrations

This directory contains configuration templates to connect KIRA as an MCP server to your favorite AI coding agents (Antigravity, OpenCode, Cline, Cursor, Claude Desktop).

## Setup Steps

1. Make sure your KIRA backend server is configured. Add your `DEEPSEEK_API_KEY` and optional `MEM0_API_KEY` to `backend/.env`.
2. Locate the configuration template for your agent:
   - [Antigravity Rules](antigravity.md)
   - [OpenCode JSON Configuration](opencode.jsonc)
   - [Generic MCP JSON Configuration](generic_mcp.json)
3. Copy-paste the configuration into your agent's setting file/rules file.
4. Restart your agent or reload MCP servers.

KIRA will now run silently in the background. It intercepts prompts, skips enhancement for simple commands/confirmations, and automatically injects your context/preferences for complex tasks.
