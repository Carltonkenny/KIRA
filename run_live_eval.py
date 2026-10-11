import json
import time
import urllib.request
import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
from classifier import classify

API_BASE = 'http://localhost:8090/api/v1'

TEST_CASES = [
    {
        "id": "vague_1",
        "category": "Vague / Underspecified",
        "prompt": "make a login page",
        "description": "Ultra-vague prompt with no tech stack, auth type, or validation specified."
    },
    {
        "id": "vague_2",
        "category": "Vague / Underspecified",
        "prompt": "add caching to user profile endpoint",
        "description": "Standard dev request lacking cache store, TTL, invalidation, and error strategies."
    },
    {
        "id": "edge_bypass_cmd",
        "category": "Edge Case: Command / Passthrough",
        "prompt": "git rebase -i HEAD~4",
        "description": "Shell / git command that an IDE agent should NOT touch or rewrite."
    },
    {
        "id": "edge_bypass_affirmation",
        "category": "Edge Case: Short Affirmation",
        "prompt": "proceed",
        "description": "Conversational cue to continue execution; must not hallucinate a 5-paragraph plan."
    },
    {
        "id": "edge_bypass_code",
        "category": "Edge Case: Code Snippet",
        "prompt": "```typescript\ninterface User { id: string; email: string; }\n```",
        "description": "Raw code block paste that should be left untouched."
    },
    {
        "id": "edge_bypass_override",
        "category": "Edge Case: User Override",
        "prompt": "!just output a minimal hello world flask app",
        "description": "User explicitly prefixed '!' indicating manual skip / raw prompt intent."
    },
    {
        "id": "real_world_complex",
        "category": "Complex Real-World Production",
        "prompt": "add stripe webhook handling with idempotency and retry",
        "description": "High-stakes production backend feature requiring webhook signatures, deduplication, and retries."
    }
]

def query_refine(prompt: str, session_id: str = "eval-session"):
    data = json.dumps({"prompt": prompt, "session_id": session_id, "density": "medium"}).encode("utf-8")
    req = urllib.request.Request(f"{API_BASE}/refine", data=data, headers={"Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            elapsed = time.time() - t0
            res = json.loads(resp.read().decode("utf-8"))
            return {"status": "ok", "elapsed_s": round(elapsed, 2), "data": res}
    except Exception as e:
        elapsed = time.time() - t0
        return {"status": "error", "elapsed_s": round(elapsed, 2), "error": str(e)}

results = []

for tc in TEST_CASES:
    prompt = tc["prompt"]
    # 1. Evaluate Classifier
    clf_result = classify(prompt)
    
    # 2. Query API only if it's an enhancement candidate (or if testing live behavior)
    # To conserve Groq tokens and avoid 1000 OTPM rate limit, we call the LLM API for enhancement cases
    # and 1 bypass case to demonstrate the difference.
    should_call_api = (clf_result["action"] == "enhance") or (tc["id"] == "edge_bypass_cmd")
    
    if should_call_api:
        print(f"Calling API for: {tc['id']} ('{prompt[:30]}...')")
        api_res = query_refine(prompt, session_id=f"eval-{tc['id']}")
        # wait 4s to let Groq TPM refill
        time.sleep(4)
    else:
        api_res = {
            "status": "skipped_by_classifier",
            "elapsed_s": 0.001,
            "data": {
                "refined_prompt": prompt,
                "action": "pass_through",
                "reason": clf_result["reason"]
            }
        }
    
    results.append({
        "tc": tc,
        "classifier": clf_result,
        "api_response": api_res
    })

with open("scratch_eval_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("EVALUATION_COMPLETE")
