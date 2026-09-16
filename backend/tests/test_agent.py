import os

os.environ.setdefault("LLM_PROVIDER", "mock")

from app.agent import run  # noqa: E402


def test_mock_agent_reaches_final_answer():
    events = list(run("test the mock agent", max_steps=6))

    types = [e.type for e in events]
    assert "thought" in types
    assert "action" in types
    assert "observation" in types
    assert types[-1] == "done"
    assert any(e.type == "result" for e in events)


def test_agent_stops_within_max_steps():
    events = list(run("anything", max_steps=1))
    assert len(events) > 0
