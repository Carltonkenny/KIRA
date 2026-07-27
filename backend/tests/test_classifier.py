import pytest
from classifier import classify

def test_bypass_prefix():
    res = classify("!build a calculator in react")
    assert res["action"] == "pass_through"
    assert "Bypassed via user prefix" in res["reason"]

def test_too_short():
    res = classify("git push")
    assert res["action"] == "pass_through"
    assert "too short" in res["reason"]
    
    res = classify("build it")
    assert res["action"] == "pass_through"

def test_conversational_confirmations():
    for word in ["yes", "no", "ok", "sure", "continue", "proceed", "ack", "y", "n"]:
        res = classify(word)
        assert res["action"] == "pass_through"
        assert "confirmation" in res["reason"]

def test_shell_commands():
    res = classify("npm install express mongoose dotenv")
    assert res["action"] == "pass_through"
    assert "shell command" in res["reason"]
    
    res = classify("git commit -m 'initial commit'")
    assert res["action"] == "pass_through"

def test_too_long():
    long_prompt = "word " * 205
    res = classify(long_prompt)
    assert res["action"] == "pass_through"
    assert "already highly detailed" in res["reason"]

def test_short_targeted_filepath():
    res = classify("fix the bug in server.py")
    assert res["action"] == "pass_through"
    assert "short targeted instruction" in res["reason"].lower()

def test_short_targeted_line():
    res = classify("fix error on line 42")
    assert res["action"] == "pass_through"
    assert "short targeted instruction" in res["reason"].lower()

def test_code_block():
    res = classify("Here is code: ```python\nprint('hello')\n```")
    assert res["action"] == "pass_through"
    assert "markdown code blocks" in res["reason"]

def test_code_density():
    res = classify("x = y + z; if (x > y) { return x; } else { return y; }")
    assert res["action"] == "pass_through"
    assert "High code symbol density" in res["reason"]

def test_enhance_complex_prompt():
    res = classify("build a dashboard component in react using tailwind and fetch from api")
    assert res["action"] == "enhance"
