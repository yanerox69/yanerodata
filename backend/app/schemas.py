from typing import List, Literal, Optional

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


class DocumentAnalysis(BaseModel):
    risk_level: Literal["low", "medium", "high", "unknown"] = "unknown"
    summary: str = ""
    red_flags: List[str] = Field(default_factory=list)
    key_dates: List[str] = Field(default_factory=list)
    parties: List[str] = Field(default_factory=list)


class SwarmMetrics(BaseModel):
    completed: int
    total: int
    tokens_per_s: float
    elapsed_s: float
    concurrency: int


class SwarmEvent(BaseModel):
    type: Literal["status", "done"]
    doc_id: str
    doc_name: str
    status: Literal["queued", "running", "done", "error"]
    analysis: Optional[DocumentAnalysis] = None
    error: Optional[str] = None
    latency_s: Optional[float] = None
    metrics: Optional[SwarmMetrics] = None
