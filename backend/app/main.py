import json
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

from . import agent
from .config import settings
from .documents import ExtractionError, extract_text
from .export import to_excel_bytes, to_json_bytes, swarm_to_excel_bytes, swarm_to_json_bytes
from .schemas import AgentRunRequest, ResultItem, SwarmEvent
from .swarm import DocInput, analyze_swarm

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
_last_swarm_results: list[SwarmEvent] = []


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


@app.post("/api/swarm/run")
async def run_swarm(files: List[UploadFile] = File(...), concurrency: int = 4):
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one document.")
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Limit is 20 documents per run.")

    docs: list[DocInput] = []
    extraction_errors: list[SwarmEvent] = []
    for idx, f in enumerate(files):
        data = await f.read()
        try:
            text = extract_text(f.filename or f"document-{idx}", data)
        except ExtractionError as exc:
            extraction_errors.append(SwarmEvent(
                type="status", doc_id=f"doc-{idx}", doc_name=f.filename or f"document-{idx}",
                status="error", error=str(exc),
            ))
            continue
        docs.append(DocInput(id=f"doc-{idx}", name=f.filename or f"document-{idx}", text=text))

    async def event_stream():
        global _last_swarm_results
        collected: list[SwarmEvent] = list(extraction_errors)
        for event in extraction_errors:
            yield f"data: {event.model_dump_json()}\n\n"
        async for event in analyze_swarm(docs, concurrency=concurrency):
            if event.status in ("done", "error"):
                collected.append(event)
            yield f"data: {event.model_dump_json()}\n\n"
        _last_swarm_results = collected
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/swarm/export/{fmt}")
def export_swarm_results(fmt: str):
    if not _last_swarm_results:
        raise HTTPException(status_code=404, detail="No swarm results yet. Run an analysis first.")
    if fmt == "xlsx":
        data = swarm_to_excel_bytes(_last_swarm_results)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "due_diligence_report.xlsx"
    elif fmt == "json":
        data = swarm_to_json_bytes(_last_swarm_results)
        media_type = "application/json"
        filename = "due_diligence_report.json"
    else:
        raise HTTPException(status_code=400, detail="fmt must be 'xlsx' or 'json'")

    return Response(
        content=data,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
