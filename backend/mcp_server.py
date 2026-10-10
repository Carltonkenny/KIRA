"""KIRA MCP Server — FastMCP tool definitions with automatic trace logging."""

import logging
from mcp.server.fastmcp import FastMCP
from database import db, LOCAL_USER_ID, CATEGORY_AUTO
from refiner import refine_prompt
from config import get_llm_client, get_model_name, parse_llm_json
from decorators import traced_tool
import classifier
import memory

logger = logging.getLogger("kira.mcp")

# Initialize FastMCP Server
mcp = FastMCP("Kira-IDE-Partner")


@mcp.tool()
@traced_tool("forge_refine", agent_field="agent_name")
async def forge_refine(
    prompt: str,
    session_id: str,
    density: str = "short",
    agent_name: str = "frontend",
    project_id: str = "default"
) -> str:
    """
    Refines a raw, vague developer prompt into a high-fidelity instruction set.

    Args:
        prompt: The raw text prompt to refine.
        session_id: A unique identifier for the current coding/chat session.
        density: Target prompt density: 'short', 'medium', or 'detailed'.
        agent_name: The calling agent identifier for trace logging.
        project_id: Project identifier to isolate tech stacks and constraints.
    """
    user_id = LOCAL_USER_ID

    profile = await db.get_profile(user_id)
    memories = await db.get_memories(user_id, project_id=project_id)

    result = refine_prompt(prompt, profile, memories, density=density)

    for fact in result.new_memories:
        await db.add_memory(user_id, category=CATEGORY_AUTO, fact=fact, project_id=project_id)
        logger.info(f"KIRA learned memory for [{project_id}]: {fact}")

    await db.save_history(
        user_id=user_id,
        session_id=session_id,
        role="user",
        message=prompt,
        refined_prompt=result.refined_prompt,
        project_id=project_id
    )

    return result.refined_prompt


@mcp.tool()
@traced_tool("kira_enhance", agent_field="agent_name")
async def kira_enhance(
    prompt: str,
    agent_name: str = "",
    session_id: str = "",
    density: str = "short",
    project_id: str = "default"
) -> str:
    """
    KIRA's smart prompt enhancement tool.
    Intercepts prompt, decides whether to enhance or pass through based on classifier rules.
    If enhancing, uses Mem0/SQLite memories scoped to project_id to optimize prompt.

    Args:
        prompt: The raw developer prompt.
        agent_name: The calling agent (e.g. 'opencode', 'antigravity'). For per-agent memory scoping.
        session_id: A unique identifier for the current session to link history.
        density: Target density budget ('short', 'medium', or 'detailed').
        project_id: Target project scope to prevent memory leakage across repositories.
    """
    user_id = LOCAL_USER_ID

    # 1. Check skip classifier
    classification = classifier.classify(prompt)
    if classification["action"] == "pass_through":
        logger.info(f"Pass-through prompt. Reason: {classification['reason']}")
        return prompt

    # 2. Recall context from Mem0/local fallback scoped to this project
    memories = await memory.recall(prompt, user_id=user_id, agent_name=agent_name, project_id=project_id)

    # 3. Fetch profile
    profile = await db.get_profile(user_id)

    # 4. Call refiner (LLM structured call)
    result = refine_prompt(prompt, profile, memories, density=density)

    # 5. Save newly learned memories scoped to project
    for fact in result.new_memories:
        await memory.remember(fact, user_id=user_id, agent_name=agent_name, project_id=project_id)
        logger.info(f"KIRA learned memory for [{project_id}]: {fact}")

    # 6. Save to chat history
    active_session_id = session_id if session_id else f"session-{agent_name if agent_name else 'generic'}"
    await db.save_history(
        user_id=user_id,
        session_id=active_session_id,
        role="user",
        message=prompt,
        refined_prompt=result.refined_prompt,
        project_id=project_id
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
    user_id = LOCAL_USER_ID

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
        data = parse_llm_json(content)
        chat_reply = data.get("response", "Prompt updated successfully.")
        new_refined = data.get("refined_prompt", last_refined)

    except Exception as e:
        logger.error(f"Conversational update failed: {e}")
        chat_reply = "Iterative update encountered an error. Applied basic append."
        new_refined = f"{last_refined}\n\n*Applied change request: {message}*"

    # Save to history
    await db.save_history(user_id=user_id, session_id=session_id, role="user", message=message, refined_prompt=None)
    await db.save_history(user_id=user_id, session_id=session_id, role="assistant", message=chat_reply, refined_prompt=new_refined)

    return f"{chat_reply}\n\n---\n\n{new_refined}"


@mcp.tool()
@traced_tool("get_kira_memories", agent_field="agent_name")
async def get_kira_memories(agent_name: str = "", project_id: str = "") -> str:
    """
    Returns all auto-learned and manual facts saved in KIRA's memory.

    Args:
        agent_name: Optional agent name to filter memories.
        project_id: Optional project ID to filter memories by project scope.
    """
    user_id = LOCAL_USER_ID

    memories = await memory.get_all_memories(user_id=user_id, agent_name=agent_name, project_id=project_id or None)
    if not memories:
        scope = f" (Project: {project_id})" if project_id else ""
        return f"KIRA has not recorded any memories yet{scope}."

    result = f"### KIRA Current Memories (Agent: {agent_name or 'All'})\n"
    for m in memories:
        category = m.get("category", CATEGORY_AUTO)
        fact = m.get("fact", "")
        mem_id = m.get("id", "N/A")
        result += f"- [{category}] {fact} (ID: {mem_id})\n"
    return result


if __name__ == "__main__":
    import asyncio

    async def _startup() -> None:
        """Initialize DB tables before FastMCP takes over the event loop."""
        await db.initialize_tables()

    asyncio.run(_startup())
    mcp.run()  # FastMCP handles its own event loop from here
