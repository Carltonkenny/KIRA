import asyncio
import json
import sys
from mcp.server.fastmcp import FastMCP
from database import db
from refiner import refine_prompt
from config import get_llm_client, get_model_name

# Initialize FastMCP Server
mcp = FastMCP("Kira-IDE-Partner")

@mcp.tool()
async def forge_refine(prompt: str, session_id: str, density: str = "short") -> str:
    """
    Refines a raw, vague developer prompt into a high-fidelity instruction set.
    
    Args:
        prompt: The raw text prompt to refine.
        session_id: A unique identifier for the current coding/chat session.
        density: Target prompt density: 'short' (concise instructions), 'medium' (RPG persona style), or 'detailed' (full template).
    """
    user_id = "local_user"
    
    # 1. Initialize tables & pool
    await db.initialize_tables()
    
    # 2. Fetch context
    profile = await db.get_profile(user_id)
    memories = await db.get_memories(user_id)
    
    # 3. Call refiner (LLM structured call)
    # Since refine_prompt is synchronous, we run it in a thread executor or run it directly
    # for simplicity.
    result = refine_prompt(prompt, profile, memories, density=density)
    
    # 4. Save learned memories
    for fact in result.new_memories:
        await db.add_memory(user_id, category="auto_learned", fact=fact)
        print(f"KIRA learned memory: {fact}", file=sys.stderr)
        
    # 5. Save history
    await db.save_history(
        user_id=user_id,
        session_id=session_id,
        role="user",
        message=prompt,
        refined_prompt=result.refined_prompt
    )
    
    # Return refined prompt
    return result.refined_prompt

@mcp.tool()
async def forge_chat(message: str, session_id: str) -> str:
    """
    Performs stateful conversational follow-up to iteratively update the previous prompt.
    For example: 'make it shorter', 'add logging', 'rewrite in Go'.
    
    Args:
        message: The instruction or request to modify the previous prompt.
        session_id: The active session ID mapping to past history.
    """
    user_id = "local_user"
    
    # 1. Initialize tables & pool
    await db.initialize_tables()
    
    # 2. Fetch history
    history = await db.get_history(session_id, limit=10)
    profile = await db.get_profile(user_id)
    memories = await db.get_memories(user_id)
    
    # Locate last refined prompt
    last_refined = None
    for turn in reversed(history):
        if turn.get("refined_prompt"):
            last_refined = turn["refined_prompt"]
            break
            
    if not last_refined:
        # If no history exists, refine this message as a raw prompt
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
{chr(10).join(['- ' + m['fact'] for m in memories]) if memories else '- None'}

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
    await db.save_history(
        user_id=user_id,
        session_id=session_id,
        role="user",
        message=message,
        refined_prompt=None
    )
    await db.save_history(
        user_id=user_id,
        session_id=session_id,
        role="assistant",
        message=chat_reply,
        refined_prompt=new_refined
    )
    
    return f"{chat_reply}\n\n---\n\n{new_refined}"

@mcp.tool()
async def get_kira_memories() -> str:
    """
    Returns all auto-learned and manual facts saved in KIRA's memory.
    """
    user_id = "local_user"
    await db.initialize_tables()
    
    memories = await db.get_memories(user_id)
    if not memories:
        return "KIRA has not recorded any memories yet."
        
    result = "### KIRA Current Memories\n"
    for m in memories:
        result += f"- [{m['category']}] {m['fact']} (ID: {m['id']})\n"
    return result

if __name__ == "__main__":
    # Standard fastmcp serve executor
    mcp.run()
