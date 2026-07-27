import pytest
from refiner import build_system_instructions, RefinerResponse

def test_build_system_instructions_short():
    profile = {"preferred_tone": "direct", "density_preference": "short"}
    memories = [{"fact": "Uses Python 3.11"}, {"fact": "Prefers FastAPI"}]
    
    sys_prompt = build_system_instructions(profile, memories, density="short")
    
    assert "direct" in sys_prompt
    assert "Uses Python 3.11" in sys_prompt
    assert "Prefers FastAPI" in sys_prompt
    assert "DENSITY BUDGET: 'short'" in sys_prompt
    assert "RPG" not in sys_prompt

def test_build_system_instructions_medium():
    profile = {"preferred_tone": "polite"}
    memories = []
    
    sys_prompt = build_system_instructions(profile, memories, density="medium")
    
    assert "polite" in sys_prompt
    assert "No memories recorded yet." in sys_prompt
    assert "DENSITY BUDGET: 'medium'" in sys_prompt
    assert "RPG (Role, Problem, Guidance)" in sys_prompt

def test_refiner_response_schema():
    # Validates our Pydantic response parsing contract
    data = {
        "refined_prompt": "# Best Prompt\nDo this.",
        "intent": "refinement",
        "domain": "typescript_development",
        "new_memories": ["Uses Vite"],
        "quality_scores": {
            "specificity": 4.0,
            "clarity": 4.5,
            "actionability": 4.2
        }
    }
    
    res = RefinerResponse(**data)
    assert res.intent == "refinement"
    assert res.domain == "typescript_development"
    assert res.quality_scores["clarity"] == 4.5
    assert len(res.new_memories) == 1
