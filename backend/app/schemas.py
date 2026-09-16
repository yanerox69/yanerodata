from typing import Literal, Optional

from pydantic import BaseModel, Field


class AgentRunRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=500)
    max_steps: Optional[int] = Field(default=None, ge=1, le=20)


class ResultItem(BaseModel):
    title: str
    detail: str
    source_url: Optional[str] = None


class TraceEvent(BaseModel):
    type: Literal["thought", "action", "observation", "result", "error", "done"]
    step: int
    content: str
    tool: Optional[str] = None
