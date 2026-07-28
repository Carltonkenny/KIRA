"""Prompt refinement and conversational chat route handlers."""

from fastapi import APIRouter
from database import db
from refiner import refine_prompt
from routes.schemas import RefineRequest, ChatRequest

router = APIRouter(prefix="/api/v1", tags=["refine"])


@router.post("/refine")
async def api_refine(request: RefineRequest) -> dict:
    """Refines a raw prompt utilizing stored user preferences and context."""
    user_id = "local_user"

    # 1. Fetch user profile & memory list
    profile = await db.get_profile(user_id)
    memories = await db.get_memories(user_id)

    # 2. Run prompt refinery
    result = refine_prompt(
        raw_prompt=request.prompt,
        profile=profile,
        memories=memories,
        density=request.density
    )

    # 3. Save auto-extracted memories
    for fact in result.new_memories:
        await db.add_memory(user_id, category="auto_learned", fact=fact)

    # 4. Save history
    await db.save_history(
        user_id=user_id,
        session_id=request.session_id,
        role="user",
        message=request.prompt,
        refined_prompt=result.refined_prompt
    )

    return {
        "refined_prompt": result.refined_prompt,
        "intent": result.intent,
        "domain": result.domain,
        "new_memories": result.new_memories,
        "quality_scores": result.quality_scores
    }


@router.post("/chat")
async def api_chat(request: ChatRequest) -> dict:
    """Performs stateful iterative refinements (follow-up corrections)."""
    from mcp_server import forge_chat

    response_text = await forge_chat(request.message, request.session_id)

    # Parse out the conversational reply and prompt from forge_chat output
    # forge_chat returns text split by "\n\n---\n\n"
    parts = response_text.split("\n\n---\n\n", 1)
    chat_reply = parts[0]
    refined_prompt = parts[1] if len(parts) > 1 else response_text

    return {
        "response": chat_reply,
        "refined_prompt": refined_prompt
    }
