"""ReAct-style agent loop: think -> act -> observe, until a final answer.

Yields TraceEvent objects as it goes so the caller can stream progress to
the UI over SSE instead of waiting for the whole run to finish.
"""
import json
from typing import Iterator, List

from .config import settings
from .llm import chat, LLMError
from .schemas import ResultItem, TraceEvent
from .tools import TOOLS

_SYSTEM_PROMPT = """You are Scout, a research agent. Given a goal, decide the \
next step and respond ONLY with JSON.

To use a tool, respond with:
{"thought": "...", "action": "web_search|fetch_url|calculator", "action_input": "..."}

When you have enough information, respond with:
{"thought": "...", "final_answer": "...", "results": [{"title": "...", "detail": "...", "source_url": "..."}]}

Available tools: web_search(query), fetch_url(url), calculator(expression).
Keep tool calls to a minimum and stop as soon as you can answer."""


def run(goal: str, max_steps: int | None = None) -> Iterator[TraceEvent]:
    max_steps = max_steps or settings.max_agent_steps
    messages: List[dict] = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": goal},
    ]

    for step in range(1, max_steps + 1):
        try:
            raw = chat(messages)
        except LLMError as exc:
            yield TraceEvent(type="error", step=step, content=str(exc))
            return

        parsed = _parse_step(raw)
        if parsed is None:
            yield TraceEvent(type="error", step=step, content=f"Could not parse model output: {raw[:300]}")
            return

        thought = parsed.get("thought", "")
        if thought:
            yield TraceEvent(type="thought", step=step, content=thought)

        if "final_answer" in parsed:
            yield TraceEvent(type="result", step=step, content=parsed["final_answer"])
            for item in parsed.get("results", []):
                try:
                    ResultItem(**item)
                except Exception:  # noqa: BLE001
                    continue
                yield TraceEvent(
                    type="result",
                    step=step,
                    content=json.dumps(item),
                )
            yield TraceEvent(type="done", step=step, content="Agent finished.")
            return

        tool_name = parsed.get("action")
        tool_input = parsed.get("action_input", "")
        tool_fn = TOOLS.get(tool_name)
        if tool_fn is None:
            yield TraceEvent(type="error", step=step, content=f"Unknown tool requested: {tool_name}")
            return

        yield TraceEvent(type="action", step=step, content=str(tool_input), tool=tool_name)
        observation = tool_fn(tool_input)
        yield TraceEvent(type="observation", step=step, content=observation, tool=tool_name)

        messages.append({"role": "assistant", "content": raw})
        messages.append({"role": "tool", "content": observation})

    yield TraceEvent(type="error", step=max_steps, content="Max steps reached without a final answer.")


def _parse_step(raw: str) -> dict | None:
    raw = raw.strip()
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return None
