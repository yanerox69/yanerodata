# DocuSwarm

**A parallel document due-diligence agent swarm, served by vLLM on AMD Instinct GPUs (ROCm).**

Built for the [AMD Developer Hackathon: ACT III](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii) — *"AI agents and high-performance AI applications on AMD GPUs in the cloud."*

## Status

The app, swarm orchestration, and dashboard are fully built and tested
end-to-end (see Tests below). Both AMD Developer Cloud and Fireworks AI
(which serves inference on AMD Instinct GPUs) require a verified payment
method to issue GPU/inference credits, even when usage is fully covered by
the hackathon's free credits — a barrier we couldn't clear in time for this
submission. This is precisely why the backend was built provider-agnostic
from the start: `backend/app/llm.py` talks to any OpenAI-compatible
endpoint, so connecting it to a live AMD-backed model (self-hosted vLLM or
Fireworks) is a two-line env var change with zero code changes, documented
in [`deploy/AMD_DEPLOYMENT.md`](deploy/AMD_DEPLOYMENT.md). The demo below
runs on the included deterministic mock provider so the full flow —
concurrent processing, live throughput dashboard, export — is fully
demoable today.

## The problem

Reviewing a stack of contracts, NDAs, or vendor agreements for risky clauses
is slow, manual work — hours per document, done one at a time. DocuSwarm
turns that into a single upload: drop in up to 20 documents and a swarm of
agents analyzes them **concurrently** against the same LLM endpoint,
surfacing risk level, red flags, key dates, and parties per document, with
a consolidated Excel/JSON report at the end.

## Why this fits the hackathon

This isn't a chatbot demo — it's built to make GPU throughput visible:

- **Real concurrency, not a queue.** Every document gets its own async
  task; a semaphore caps how many are in flight (1x/2x/4x/8x, selectable
  in the UI). All of them hit the *same* vLLM server, which is exactly the
  continuous-batching workload AMD Instinct GPUs + ROCm + vLLM are built
  for — throughput scales with concurrency instead of documents queuing
  one behind another.
- **A live performance dashboard.** While the swarm runs, the UI streams
  (via SSE) completed/total, tokens/sec, elapsed time, and the active
  concurrency — reading vLLM's real `usage` field once pointed at a live
  GPU endpoint, so the numbers on screen are the actual GPU throughput.
- **Provider-agnostic by design.** The backend talks to any
  OpenAI-compatible `/v1/chat/completions` endpoint. Moving from a laptop
  to an AMD Developer Cloud MI300X instance is a one-line env var change
  (`LLM_BASE_URL`) — see [`deploy/AMD_DEPLOYMENT.md`](deploy/AMD_DEPLOYMENT.md).

## Architecture

```
┌─────────────┐      multipart upload       ┌──────────────────┐
│  React UI   │ ───────────────────────────▶ │  FastAPI backend │
│ (dashboard, │ ◀─────── SSE stream ──────── │  (async swarm     │
│  drag&drop) │      status + metrics        │   orchestrator)  │
└─────────────┘                              └─────────┬────────┘
                                                         │ N concurrent
                                                         │ chat requests
                                                         ▼
                                              ┌──────────────────┐
                                              │  vLLM server     │
                                              │  on AMD Instinct │
                                              │  GPU (ROCm)      │
                                              └──────────────────┘
```

- `backend/app/swarm.py` — async orchestrator: one task per document,
  bounded by an `asyncio.Semaphore`, streaming per-document status and
  aggregate throughput metrics as they happen.
- `backend/app/llm.py` — OpenAI-compatible client (sync + async) targeting
  vLLM; includes a deterministic **mock provider** so the whole app runs
  and demos without any GPU attached.
- `backend/app/documents.py` — PDF/DOCX/TXT text extraction.
- `backend/app/agent.py` — a secondary ReAct-style research agent
  (web_search / fetch_url / calculator tools) exposed at
  `POST /api/agent/run`, kept from an earlier iteration of this project as
  a bonus capability.
- `App.tsx` + `components/` — the DocuSwarm dashboard: file dropzone,
  concurrency selector, live per-document cards, throughput bar, export
  buttons.

## Quickstart (no GPU required)

The backend defaults to `LLM_PROVIDER=mock`, a deterministic stand-in that
lets you run and demo the entire flow — upload, concurrent processing,
live dashboard, export — without any model or GPU.

```bash
# backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080

# frontend (new terminal, repo root)
npm install
npm run dev
```

Open http://localhost:3000, drop in a few `.txt`/`.pdf`/`.docx` files, and
hit **Analizar**.

## Running on real AMD GPUs

See [`deploy/AMD_DEPLOYMENT.md`](deploy/AMD_DEPLOYMENT.md) for the full
walkthrough: serving a model with vLLM's ROCm build, pointing the backend
at it, and running the full stack with `docker compose`.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Model serving | vLLM (ROCm build) | Official high-throughput serving engine with first-class AMD Instinct GPU support |
| Backend | FastAPI + asyncio | Native async concurrency to drive many simultaneous LLM requests |
| Frontend | React + Vite + TypeScript | Fast dev loop, SSE-friendly streaming UI |
| Export | openpyxl | Consolidated Excel report for the due-diligence findings |

## Tests

```bash
cd backend && source .venv/bin/activate && pytest
```
