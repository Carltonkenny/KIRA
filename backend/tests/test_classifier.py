import pytest
from classifier import classify

def test_bypass_prefix():
    res = classify("!build a calculator in react")
    assert res["action"] == "pass_through"
    assert "Bypassed via user prefix" in res["reason"]

def test_shell_commands():
    res = classify("npm install express mongoose dotenv")
    assert res["action"] == "pass_through"
    assert "Direct shell command" in res["reason"]
    
    res = classify("git commit -m 'initial commit'")
    assert res["action"] == "pass_through"
    assert "Direct shell command" in res["reason"]

def test_conversational_confirmations():
    for word in ["yes", "no", "ok", "sure", "continue", "proceed", "ack", "y", "n"]:
        res = classify(word)
        assert res["action"] == "pass_through"
        assert "acknowledgment" in res["reason"].lower()

def test_conversational_greetings():
    for word in ["hello", "hi", "hey kira"]:
        res = classify(word)
        assert res["action"] == "conversational"
        assert res["intent"] == "greeting"

def test_kira_meta_questions():
    res = classify("what is kira and how do you work?")
    assert res["action"] == "conversational"
    assert res["intent"] == "about_kira"

def test_pinpoint_code_edit():
    res = classify("fix typo on line 42 in server.py")
    assert res["action"] == "pass_through"
    assert res["intent"] == "pinpoint_edit"

def test_code_block():
    res = classify("Here is code: ```python\nprint('hello')\n```")
    assert res["action"] == "pass_through"
    assert "code block" in res["reason"].lower()

def test_code_density():
    res = classify("fn(x) => { return [x+1, y-2, z*3] >= 0; };")
    assert res["action"] == "pass_through"
    assert res["intent"] == "code_snippet"

def test_enhance_complex_prompt():
    res = classify("build a dashboard component in react using tailwind and fetch from api")
    assert res["action"] == "enhance"

def test_enhance_short_technical_prompt():
    res = classify("add oauth authentication with google")
    assert res["action"] == "enhance"
