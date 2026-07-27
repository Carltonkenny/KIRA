# Getting Started with KIRA

This guide walks you through verifying the KIRA Web Console and setting up the Model Context Protocol (MCP) server inside your IDE (e.g. Cursor or Claude Desktop).

---

## 1. Access the Web Console

Open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 2. Test Prompts to Try Out

Use these test prompts in the console to observe KIRA's core capabilities:

### Test 1: Auto-Learning Stack Constraints
* **Prompt to enter:**
  `build a login component using React 19 and Tailwind CSS`
* **What to observe:** KIRA will refine the prompt. After it finishes, look at the **Context Memories** sidebar on the left. KIRA will have automatically extracted and saved `"Uses React 19"` and `"Uses Tailwind CSS"` to the local SQLite database.

### Test 2: Stateful Memory Context Injection
* **Prompt to enter:**
  `write a script to call a rest endpoint`
* **What to observe:** Do not specify React or CSS this time. Because KIRA has saved those facts in memory from Test 1, the refined output will automatically inject those constraints, tailoring the prompt to a React/Tailwind structure.

### Test 3: Conversational Prompt Chat
* **Message to enter in the right-hand panel:**
  `make it async/await and add standard error boundaries`
* **What to observe:** KIRA will update the refined prompt with async/await syntax and error boundaries, while retaining all previous context.

---

## 3. How to Set Up the KIRA MCP Server

You can connect KIRA directly to **Cursor** or **Claude Desktop** so that it runs prompt refinement natively in your coding workspace.

### A. Cursor Setup
1. Open Cursor and go to **Settings (Gear Icon in the top right)**.
2. Navigate to **Beta** > **MCP**.
3. Click **+ Add New MCP Server**.
4. Configure the settings:
   * **Name:** `kira`
   * **Type:** `command`
   * **Command:** `C:\Users\user\OneDrive\Desktop\KIRA\backend\venv\Scripts\python.exe`
   * **Arguments:** `C:\Users\user\OneDrive\Desktop\KIRA\backend\mcp_server.py`
5. Click **Save**. The server status indicator should turn green.

### B. Claude Desktop Setup
Open your Claude Desktop configuration file (typically located at `%APPDATA%\Claude\claude_desktop_config.json`) and add KIRA to the `mcpServers` object:

```json
{
  "mcpServers": {
    "kira": {
      "command": "C:\\Users\\user\\OneDrive\\Desktop\\KIRA\\backend\\venv\\Scripts\\python.exe",
      "args": [
        "C:\\Users\\user\\OneDrive\\Desktop\\KIRA\\backend\\mcp_server.py"
      ]
    }
  }
}
```
Restart Claude Desktop to load the tools.
