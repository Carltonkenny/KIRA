"""Prompt refinement and conversational chat route handlers."""

import asyncio
from fastapi import APIRouter
from database import db, LOCAL_USER_ID, CATEGORY_AUTO
from refiner import refine_prompt
from classifier import classify
from routes.schemas import RefineRequest, ChatRequest

router = APIRouter(prefix="/api/v1", tags=["refine"])


@router.post("/refine")
async def api_refine(request: RefineRequest) -> dict:
    """Refines a raw prompt utilizing stored user preferences and context."""
    user_id = request.user_id or LOCAL_USER_ID
    project_id = request.project_id or "default"

    # 0. Fast-path classifier check
    clf = classify(request.prompt)
    if clf.get("action") == "conversational":
        return {
            "refined_prompt": clf.get("reply", "Hello! I am KIRA, your prompt intelligence layer."),
            "intent": "conversational",
            "domain": "general",
            "new_memories": [],
            "quality_scores": {"specificity": 5.0, "clarity": 5.0, "actionability": 5.0},
            "suggested_actions": ["How does KIRA memory work?", "Refine a Stripe webhook prompt", "Refine a React component prompt"],
            "bypassed": False
        }

    if clf.get("action") == "pass_through":
        return {
            "refined_prompt": clf.get("reply", request.prompt),
            "intent": clf.get("intent", "pass_through"),
            "domain": "general",
            "new_memories": [],
            "quality_scores": {"specificity": 5.0, "clarity": 5.0, "actionability": 5.0},
            "suggested_actions": [],
            "bypassed": True,
            "bypass_reason": clf.get("reason", "Heuristic bypass")
        }

    # 1. Fetch user profile & memory list (scoped to project)
    profile = await db.get_profile(user_id)
    memories = await db.get_memories(user_id, project_id=project_id)

    # 2. Run prompt refinery in thread pool — LLM call is synchronous I/O,
    #    offloading prevents blocking FastAPI's event loop during inference.
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, refine_prompt, request.prompt, profile, memories, request.density
    )

    # 3. Save auto-extracted memories
    for fact in result.new_memories:
        await db.add_memory(user_id, category=CATEGORY_AUTO, fact=fact, project_id=project_id)

    # 4. Save history
    await db.save_history(
        user_id=user_id,
        session_id=request.session_id,
        role="user",
        message=request.prompt,
        refined_prompt=result.refined_prompt,
        project_id=project_id
    )

    return {
        "refined_prompt": result.refined_prompt,
        "intent": result.intent,
        "domain": result.domain,
        "new_memories": result.new_memories,
        "quality_scores": result.quality_scores,
        "suggested_actions": result.suggested_actions
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
