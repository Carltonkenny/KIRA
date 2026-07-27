import json
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from config import get_llm_client, get_model_name

class RefinerResponse(BaseModel):
    refined_prompt: str = Field(description="The final expanded, high-fidelity engineered prompt.")
    intent: str = Field(description="Primary user intent classification (e.g., 'refinement', 'conversational_follow_up').")
    domain: str = Field(description="Detected domain niche (e.g., 'python_development', 'copywriting', 'general').")
    new_memories: List[str] = Field(description="Any user facts, technologies, or preferences learned during this interaction to save.")
    quality_scores: Dict[str, float] = Field(description="Score from 1.0 to 5.0 for: specificity, clarity, actionability.")

def build_system_instructions(profile: Dict[str, Any], memories: List[Dict[str, Any]], density: str) -> str:
    """Builds the prompt-architect instructions containing the user preferences and facts."""
    
    # 1. Profile information
    tone = profile.get("preferred_tone", "direct")
    
    # 2. Extract facts from memories
    memories_str = ""
    if memories:
        memories_str = "\n".join([f"- {m.get('fact')}" for m in memories])
    else:
        memories_str = "- No memories recorded yet."

    # 3. Density budget instructions
    density_instructions = ""
    if density == "short":
        density_instructions = (
            "DENSITY BUDGET: 'short'. Output only raw Markdown instructions, bulleted rules, "
            "and tables of constraints. DO NOT include greetings, intro sentences, conversational filler, "
            "or explanations. Focus purely on high-density code instructions."
        )
    elif density == "medium":
        density_instructions = (
            "DENSITY BUDGET: 'medium'. Output in RPG (Role, Problem, Guidance) format. "
            "Define the master role/persona, explain the core problem constraint, and give step-by-step guidance."
        )
    else:  # detailed
        density_instructions = (
            "DENSITY BUDGET: 'detailed'. Output a full, comprehensive prompt template, "
            "complete with background context, clear sections, input variables placeholders (e.g., [INPUT]), "
            "and edge-case handling rules."
        )

    system_prompt = f"""You are KIRA, an expert Prompt Architect. Your job is to transform a short, vague prompt into a highly engineered, production-ready instruction set.

--- USER PROFILE & CONTEXT ---
Tone preference: {tone}
Learned memories (APPLY these constraints automatically, do not prompt for them):
{memories_str}

--- STYLE & BUDGET RULES ---
{density_instructions}

--- CORE OBJECTIVES ---
1. Refine the raw prompt into 'refined_prompt' following the selected density budget.
2. Weave the user's active memories (facts) into the refined prompt where relevant (e.g. if memory says 'uses React 18', make sure the instructions specify React 18).
3. Identify the user's primary 'intent' and 'domain'.
4. Perform entity-extraction to find new facts, preferred technologies, or coding patterns in the prompt that we should remember (e.g. 'I write in Go' -> memory: 'Writes in Go'). Output these as a clean list in 'new_memories'. DO NOT output existing memories.
5. Rate the refined prompt on a scale of 1.0 to 5.0 for specificity, clarity, and actionability in 'quality_scores'.

Your output MUST be a valid JSON object matching this schema:
{{
  "refined_prompt": "string (Markdown instructions)",
  "intent": "string ('refinement' or 'chat')",
  "domain": "string (e.g., 'python_development')",
  "new_memories": ["string (fact 1)", "string (fact 2)"],
  "quality_scores": {{
    "specificity": float,
    "clarity": float,
    "actionability": float
  }}
}}
"""
    return system_prompt

def refine_prompt(
    raw_prompt: str, profile: Dict[str, Any], memories: List[Dict[str, Any]], density: str = "short"
) -> RefinerResponse:
    """Invokes the LLM to refine the prompt, returning structured fields."""
    client = get_llm_client()
    model = get_model_name()
    system_prompt = build_system_instructions(profile, memories, density)

    try:
        # Standard OpenAI / DeepSeek structured completion format
        # Try utilizing client.beta.chat.completions.parse which handles Pydantic natively
        # Fall back to manual parsing if client is not configured for beta or fails
        if model == "deepseek-chat" or "openai" in model:
            response = client.beta.chat.completions.parse(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Refine this raw prompt: '{raw_prompt}'"}
                ],
                response_format=RefinerResponse,
                temperature=0.2
            )
            return response.choices[0].message.parsed
    except Exception as e:
        print(f"KIRA WARNING: Beta structured output failed. Falling back to manual JSON completion. Error: {e}")

    # Fallback: request JSON format and parse manually
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt + "\nReturn ONLY valid JSON. Do not wrap in backticks or Markdown blocks."},
                {"role": "user", "content": f"Refine this raw prompt: '{raw_prompt}'"}
            ],
            temperature=0.2
        )
        content = response.choices[0].message.content.strip()
        
        # Strip markdown fences if LLM wrapped it anyway
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                content = "\n".join(lines[1:-1])
        
        data = json.loads(content)
        return RefinerResponse(**data)
        
    except Exception as err:
        print(f"KIRA ERROR: LLM chat generation failed entirely. Returning mock response. Error: {err}")
        # Return graceful mock response so the system doesn't crash
        return RefinerResponse(
            refined_prompt=f"### Refined Prompt\n{raw_prompt}\n\n*Note: LLM generation encountered a runtime issue. Please verify API configuration.*",
            intent="refinement",
            domain="general",
            new_memories=[],
            quality_scores={"specificity": 1.0, "clarity": 1.0, "actionability": 1.0}
        )
