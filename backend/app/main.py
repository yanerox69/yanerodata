import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

from . import agent
from .config import settings
from .export import to_excel_bytes, to_json_bytes
from .schemas import AgentRunRequest, ResultItem

app = FastAPI(title="Scout Agent API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origins] if settings.cors_origins != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store of the last run's results, keyed by nothing fancier than
# "most recent" — good enough for a single-session demo/export flow.
_last_results: list[ResultItem] = []


@app.get("/api/health")
def health():
    return {"status": "ok", "llm_provider": settings.llm_provider, "llm_model": settings.llm_model}


@app.post("/api/agent/run")
def run_agent(req: AgentRunRequest):
    def event_stream():
        global _last_results
        collected: list[ResultItem] = []
        for event in agent.run(req.goal, req.max_steps):
            if event.type == "result":
                try:
                    payload = json.loads(event.content)
                    if isinstance(payload, dict) and "title" in payload:
                        collected.append(ResultItem(**payload))
                except (json.JSONDecodeError, TypeError):
                    pass
            yield f"data: {event.model_dump_json()}\n\n"
        _last_results = collected

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/export/{fmt}")
def export_results(fmt: str):
    if not _last_results:
        raise HTTPException(status_code=404, detail="No results yet. Run the agent first.")
    if fmt == "xlsx":
        data = to_excel_bytes(_last_results)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "scout_results.xlsx"
    elif fmt == "json":
        data = to_json_bytes(_last_results)
        media_type = "application/json"
        filename = "scout_results.json"
    else:
        raise HTTPException(status_code=400, detail="fmt must be 'xlsx' or 'json'")

    return Response(
        content=data,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
