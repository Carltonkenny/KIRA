"""KIRA Prompt Refiner — Context-grounded prompt expansion and anti-hallucination engine."""

import logging
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from config import get_llm_client, get_model_name, get_fallback_client_and_model, parse_llm_json

logger = logging.getLogger("kira.refiner")


class RefinerResponse(BaseModel):
    refined_prompt: str = Field(description="The final expanded, high-fidelity engineered prompt.")
    intent: str = Field(description="Primary user intent classification (e.g., 'refinement', 'conversational').")
    domain: str = Field(description="Detected domain niche (e.g., 'python_development', 'frontend_development', 'database', 'general').")
    new_memories: List[str] = Field(description="Verified technical facts or preferences learned during this interaction to save.")
    quality_scores: Dict[str, float] = Field(description="Score from 1.0 to 5.0 for: specificity, clarity, actionability.")
    suggested_actions: List[str] = Field(default_factory=list, description="3 dynamic, intent-aware follow-up chips tailored to this specific prompt.")


def build_system_instructions(profile: Dict[str, Any], memories: List[Dict[str, Any]], density: str) -> str:
    """Builds the prompt architect instructions enforcing strict contextual grounding."""
    tone = profile.get("preferred_tone", "direct")
    
    if memories:
        memories_str = "\n".join([f"- [VERIFIED MEMORY]: {m.get('fact')}" for m in memories])
    else:
        memories_str = "- No pre-existing memories. DO NOT ASSUME OR INVENT TECH STACK CONSTRAINTS."

    # Density Budget Instructions
    if density == "short":
        density_instructions = (
            "DENSITY BUDGET: 'short'. Output only concise, high-density instructions, key bulleted constraints, "
            "and expected input/output contract. Zero boilerplate, zero lengthy narrative."
        )
    elif density == "medium":
        density_instructions = (
            "DENSITY BUDGET: 'medium'. Output structured engineering requirements: "
            "Context, Functional Requirements, Technical Constraints, and Expected Output."
        )
    else:  # detailed
        density_instructions = (
            "DENSITY BUDGET: 'detailed'. Output a complete, production-grade specification template with: "
            "Background Context, Objective, Functional Requirements, Technical Constraints, Input Variables placeholders (e.g., [CURRENT_CODE]), "
            "Edge Cases, and Acceptance Criteria."
        )

    system_prompt = f"""You are KIRA, an elite Prompt Architect and Engineering Intelligence Layer.
Your job is to transform raw, vague developer prompts into unambiguous, production-grade instruction sets for AI coding agents (Claude Code, Cursor, Antigravity).

--- USER PROFILE & VERIFIED CONTEXT ---
Developer Tone: {tone}
Active Project Knowledge Base:
{memories_str}

--- DENSITY BUDGET ---
{density_instructions}

--- MANDATORY ANTI-HALLUCINATION & GROUNDING RULES ---
1. STRICT CONTEXT GROUNDING:
   - ONLY specify frameworks, libraries, versions, or databases (e.g. React 18, Vite, Tailwind, FastAPI, SQLAlchemy, Stripe, pydantic-settings) IF:
     a) They appear explicitly in the user's raw prompt, OR
     b) They are explicitly listed above under [VERIFIED MEMORY].
   - If a technology is NOT verified, DO NOT INVENT IT. Instead:
     - Use explicit placeholders: `[INSERT_FRAMEWORK]`, `[EXISTING_DATABASE]`, `[CURRENT_ROUTER_PATH]`.
     - Or specify: "Ensure strict compatibility with the project's existing framework and dependency manifest."

2. DEBUGGING & BUG INVESTIGATION PROMPTS:
   - When the user asks to debug an error (e.g. "My API randomly returns 500 errors"):
     - DO NOT pretend to know the root cause or invent specific database locks, JWT auth, or third-party webhooks.
     - Require the developer to provide: `[INSERT_ERROR_LOG_OR_STACK_TRACE]`, `[INSERT_RELEVANT_ROUTE_HANDLER]`, and `[ENVIRONMENT_DETAILS]`.
     - Direct the agent to formulate hypotheses, analyze logs, and verify with tests before making changes.

3. PROPORTIONAL COMPLEXITY:
   - Keep the specification strictly proportional to the task requested.
   - Do NOT turn a simple standalone utility script (e.g. CSV cleaning, deleting old logs) into an enterprise multi-class microservice architecture unless explicitly demanded.

4. DYNAMIC, INTENT-AWARE SUGGESTIONS:
   - In "suggested_actions", return exactly 3 contextual, high-value prompt modification chips specifically tailored to this task.
   - Examples for Python data tasks: ["Use pandas vectorization", "Add pytest fixtures", "Make it shorter"]
   - Examples for Frontend UI tasks: ["Add WCAG 2.1 a11y checks", "Extract to reusable hook", "Add responsive breakpoints"]
   - Examples for Backend API tasks: ["Add idempotency header validation", "Add rate-limiting tests", "Make it shorter"]

5. ENTITY EXTRACTION:
   - In "new_memories", extract ONLY factual technologies or standards the user explicitly stated (e.g. if user said "I use Go and PostgreSQL", record "Uses Go for backend", "Uses PostgreSQL for database"). DO NOT record hallucinated facts.

Return ONLY a valid JSON object matching this schema:
{{
  "refined_prompt": "string (Markdown instructions)",
  "intent": "string ('refinement' or 'conversational')",
  "domain": "string (e.g., 'python_development', 'frontend_development', 'api_engineering', 'general')",
  "new_memories": ["string (fact 1)"],
  "quality_scores": {{
    "specificity": float (1.0 to 5.0),
    "clarity": float (1.0 to 5.0),
    "actionability": float (1.0 to 5.0)
  }},
  "suggested_actions": ["string (action 1)", "string (action 2)", "string (action 3)"]
}}
"""
    return system_prompt


def refine_prompt(
    raw_prompt: str, profile: Dict[str, Any], memories: List[Dict[str, Any]], density: str = "short"
) -> RefinerResponse:
    """Invokes the LLM to refine the prompt, returning structured grounded fields."""
    client = get_llm_client()
    model = get_model_name()
    system_prompt = build_system_instructions(profile, memories, density)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt + "\nReturn ONLY valid JSON. Do not wrap in backticks or markdown code fences."},
                {"role": "user", "content": f"Engineer a production prompt specification for: '{raw_prompt}'"}
            ],
            temperature=0.15,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content.strip()
        data = parse_llm_json(content)
        
        # Ensure default suggested_actions if model omitted it
        if "suggested_actions" not in data or not data["suggested_actions"]:
            data["suggested_actions"] = [
                "Make it shorter",
                "Add comprehensive edge cases",
                "Add test specifications"
            ]
            
        return RefinerResponse(**data)
        
    except Exception as err:
        logger.warning(f"Primary LLM generation failed ({err}), attempting fallback...")
        fb_client, fb_model = get_fallback_client_and_model()
        if fb_client and fb_model:
            try:
                fb_response = fb_client.chat.completions.create(
                    model=fb_model,
                    messages=[
                        {"role": "system", "content": system_prompt + "\nReturn ONLY valid JSON."},
                        {"role": "user", "content": f"Engineer a production prompt specification for: '{raw_prompt}'"}
                    ],
                    temperature=0.15,
                    response_format={"type": "json_object"}
                )
                fb_content = fb_response.choices[0].message.content.strip()
                fb_data = parse_llm_json(fb_content)
                if "suggested_actions" not in fb_data or not fb_data["suggested_actions"]:
                    fb_data["suggested_actions"] = ["Make it shorter", "Add edge cases", "Add tests"]
                return RefinerResponse(**fb_data)
            except Exception as fb_err:
                logger.error(f"Fallback LLM failed: {fb_err}")

        # Graceful grounded fallback
        return RefinerResponse(
            refined_prompt=f"### Objective\n{raw_prompt}\n\n### Guidance\nImplement the requested task adhering to the existing project conventions. Avoid unverified assumptions.",
            intent="refinement",
            domain="general",
            new_memories=[],
            quality_scores={"specificity": 4.0, "clarity": 4.0, "actionability": 4.0},
            suggested_actions=["Make it shorter", "Add test cases", "Specify framework"]
        )
