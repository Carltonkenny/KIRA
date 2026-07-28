"""KIRA MCP Server — FastMCP tool definitions with automatic trace logging."""

import json
import sys
from mcp.server.fastmcp import FastMCP
from database import db
from refiner import refine_prompt
from config import get_llm_client, get_model_name
from decorators import traced_tool
import classifier
import memory

# Initialize FastMCP Server
mcp = FastMCP("Kira-IDE-Partner")


@mcp.tool()
@traced_tool("forge_refine", agent_field="agent_name")
async def forge_refine(prompt: str, session_id: str, density: str = "short", agent_name: str = "frontend") -> str:
    """
    Refines a raw, vague developer prompt into a high-fidelity instruction set.

    Args:
        prompt: The raw text prompt to refine.
        session_id: A unique identifier for the current coding/chat session.
        density: Target prompt density: 'short', 'medium', or 'detailed'.
        agent_name: The calling agent identifier for trace logging.
    """
    user_id = "local_user"

    await db.initialize_tables()
    profile = await db.get_profile(user_id)
    memories = await db.get_memories(user_id)

    result = refine_prompt(prompt, profile, memories, density=density)

    for fact in result.new_memories:
        await db.add_memory(user_id, category="auto_learned", fact=fact)
        print(f"KIRA learned memory: {fact}", file=sys.stderr)

    await db.save_history(
        user_id=user_id,
        session_id=session_id,
        role="user",
        message=prompt,
        refined_prompt=result.refined_prompt
    )

    return result.refined_prompt


@mcp.tool()
@traced_tool("kira_enhance", agent_field="agent_name")
async def kira_enhance(
    prompt: str,
    agent_name: str = "",
    session_id: str = "",
    density: str = "short"
) -> str:
    """
    KIRA's smart prompt enhancement tool.
    Intercepts prompt, decides whether to enhance or pass through based on classifier rules.
    If enhancing, uses Mem0/SQLite memories to optimize prompt via DeepSeek.

    Args:
        prompt: The raw developer prompt.
        agent_name: The calling agent (e.g. 'opencode', 'antigravity'). For per-agent memory scoping.
        session_id: A unique identifier for the current session to link history.
        density: Target density budget ('short', 'medium', or 'detailed').
    """
    user_id = "local_user"

    # 1. Check skip classifier
    classification = classifier.classify(prompt)
    if classification["action"] == "pass_through":
        print(f"KIRA INFO: Pass-through prompt. Reason: {classification['reason']}", file=sys.stderr)
        return prompt

    # 2. Initialize DB tables
    await db.initialize_tables()

    # 3. Recall context from Mem0/local fallback
    memories = await memory.recall(prompt, user_id=user_id, agent_name=agent_name)

    # 4. Fetch profile
    profile = await db.get_profile(user_id)

    # 5. Call refiner (LLM structured call)
    result = refine_prompt(prompt, profile, memories, density=density)

    # 6. Save newly learned memories
    for fact in result.new_memories:
        await memory.remember(fact, user_id=user_id, agent_name=agent_name)
        print(f"KIRA learned memory: {fact}", file=sys.stderr)

    # 7. Save to chat history
    active_session_id = session_id if session_id else f"session-{agent_name if agent_name else 'generic'}"
    await db.save_history(
        user_id=user_id,
        session_id=active_session_id,
        role="user",
        message=prompt,
        refined_prompt=result.refined_prompt
    )

    return result.refined_prompt


@mcp.tool()
@traced_tool("forge_chat", agent_field="agent_name")
async def forge_chat(message: str, session_id: str, agent_name: str = "frontend") -> str:
    """
    Performs stateful conversational follow-up to iteratively update the previous prompt.
    For example: 'make it shorter', 'add logging', 'rewrite in Go'.

    Args:
        message: The instruction or request to modify the previous prompt.
        session_id: The active session ID mapping to past history.
        agent_name: The calling agent identifier for trace logging.
    """
    user_id = "local_user"

    await db.initialize_tables()
    history = await db.get_history(session_id, limit=10)
    profile = await db.get_profile(user_id)
    db_memories = await db.get_memories(user_id)

    # Locate last refined prompt
    last_refined = None
    for turn in reversed(history):
        if turn.get("refined_prompt"):
            last_refined = turn["refined_prompt"]
            break

    if not last_refined:
        refined = await forge_refine(message, session_id, density=profile.get("density_preference", "short"))
        return f"Acknowledged. Initiating new prompt session.\n\n{refined}"

    # Build context for chat modifications
    history_str = ""
    for turn in history:
        history_str += f"{turn['role'].upper()}: {turn['message']}\n"

    system_prompt = f"""You are KIRA, an expert Prompt Architect. 
The user is having a chat to iteratively modify their previous refined prompt.

--- USER PROFILE & MEMORIES ---
Tone: {profile.get('preferred_tone', 'direct')}
Active memories:
{chr(10).join(['- ' + m['fact'] for m in db_memories]) if db_memories else '- None'}

--- PREVIOUS REFINED PROMPT ---
{last_refined}

--- RECENT SESSION HISTORY ---
{history_str}

--- INSTRUCTIONS ---
Apply the user's latest request to the PREVIOUS REFINED PROMPT.
Produce a JSON response:
{{
  "response": "Brief chat explanation (1-2 sentences) of what changes you made.",
  "refined_prompt": "The complete updated prompt containing all previous details plus new changes in Markdown."
}}
"""

    client = get_llm_client()
    model = get_model_name()

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt + "\nReturn ONLY valid JSON. Do not wrap in markdown tags."},
                {"role": "user", "content": f"Update request: '{message}'"}
            ],
            temperature=0.2
        )
        content = response.choices[0].message.content.strip()

        # Clean markdown wrappers if any
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                content = "\n".join(lines[1:-1])

        data = json.loads(content)
        chat_reply = data.get("response", "Prompt updated successfully.")
        new_refined = data.get("refined_prompt", last_refined)

    except Exception as e:
        print(f"KIRA ERROR: Conversational update failed: {e}", file=sys.stderr)
        chat_reply = "Iterative update encountered an error. Applied basic append."
        new_refined = f"{last_refined}\n\n*Applied change request: {message}*"

    # Save to history
    await db.save_history(user_id=user_id, session_id=session_id, role="user", message=message, refined_prompt=None)
    await db.save_history(user_id=user_id, session_id=session_id, role="assistant", message=chat_reply, refined_prompt=new_refined)

    return f"{chat_reply}\n\n---\n\n{new_refined}"


@mcp.tool()
@traced_tool("get_kira_memories", agent_field="agent_name")
async def get_kira_memories(agent_name: str = "") -> str:
    """
    Returns all auto-learned and manual facts saved in KIRA's memory.

    Args:
        agent_name: Optional agent name to filter memories.
    """
    user_id = "local_user"
    await db.initialize_tables()

    memories = await memory.get_all_memories(user_id=user_id, agent_name=agent_name)
    if not memories:
        return "KIRA has not recorded any memories yet."

    result = f"### KIRA Current Memories (Agent: {agent_name or 'All'})\n"
    for m in memories:
        category = m.get("category", "auto_learned")
        fact = m.get("fact", "")
        mem_id = m.get("id", "N/A")
        result += f"- [{category}] {fact} (ID: {mem_id})\n"
    return result


if __name__ == "__main__":
    # Standard fastmcp serve executor
    mcp.run()
