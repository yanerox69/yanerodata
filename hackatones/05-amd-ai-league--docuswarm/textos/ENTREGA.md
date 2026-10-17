# DocuSwarm: Parallel Due-Diligence on AMD GPUs

- **Hackathon:** AMD AI League
- **Equipo en lablab:** Yanero Rockstar · **Cierre:** 1 de diciembre de 2026
- **Enviado:** 17 de octubre de 2026
- **Proyecto:** DocuSwarm, el mismo enviado a ACT III (carpeta `04`). El formulario de la AI League es
  más corto: 2 pasos, sin descripción corta, sin media y sin URL de demo.

## Paso 1 — Basic Information

**Submission Title**
```
DocuSwarm: Parallel Due-Diligence on AMD GPUs
```

**Long Description** (1612 caracteres · versión sin la mención a ACT III)
```
DocuSwarm is a parallel document due-diligence agent swarm running on AMD Instinct GPUs in the cloud.

Reviewing contracts, NDAs, and reports for risky clauses is slow, manual work done one document at a time. DocuSwarm turns it into a single upload: drop in up to 20 documents and a swarm of async agents analyzes them concurrently against the same LLM endpoint, surfacing risk level, red flags, key dates, and parties per document, with a consolidated Excel/JSON report.

This isn't a chatbot demo — it's built to make AMD GPU throughput visible. Every document gets its own async task bounded by a semaphore; all of them hit the same vLLM server, which is exactly the continuous-batching workload AMD Instinct GPUs + ROCm + vLLM are built for. A live dashboard streams completed/total, tokens/sec, elapsed time, and active concurrency in real time.

Tested end-to-end on an AMD Instinct MI300X (AMD Developer Cloud) serving Qwen3-8B via vLLM: 6 documents processed concurrently in 1.5 seconds at 1,653.9 tokens/sec — real GPU throughput, not a simulation. Each result reflects genuine LLM judgment (e.g., a contract flagged MEDIUM risk with specific red flags like termination penalties and liquidated damages), not keyword matching.

The backend is provider-agnostic by design: it talks to any OpenAI-compatible endpoint, so moving from a laptop to an AMD GPU instance is a one-line config change.

Tech stack: FastAPI + asyncio backend, React/Vite dashboard streaming over Server-Sent Events, vLLM serving on AMD Instinct GPUs (ROCm), openpyxl for Excel export.

Repo: https://github.com/yanerox69/docuswarm
```

**Categories:** `Developer Tools · Documents · Legal`

**Technologies Used:** `AMD Developer Cloud · AMD ROCm · Qwen3 · Claude Code`

**Mini Challenge 2 Image / Mini Challenge 3 Image:** opcionales, se dejaron vacíos.

## Paso 2 — Application

**GitHub Repository**
```
https://github.com/yanerox69/docuswarm
```

**Additional Information**
```
HOW IT RAN: DocuSwarm was tested live on a real AMD Instinct MI300X GPU Droplet (AMD Developer Cloud), serving Qwen3-8B through vLLM's ROCm build: 6 documents processed concurrently in 1.5 seconds at 1,653.9 tokens/sec. The droplet was powered off once the trial credit ran out, so there is no persistent live URL; the demo video shows the full run on the real GPU.

TRY IT WITHOUT A GPU: the backend defaults to a deterministic mock provider, so the whole flow (upload, concurrent processing, live throughput dashboard, Excel/JSON export) runs locally. Quickstart in the README.

RUN IT ON AMD: deploy/AMD_DEPLOYMENT.md walks through serving a model with vLLM (ROCm) on AMD Developer Cloud and pointing the backend at it with one env var (LLM_BASE_URL). No code changes.

WORTH A LOOK IN THE CODE
- backend/app/swarm.py: async orchestrator, one task per document bounded by a semaphore, streaming per-document status and throughput over SSE.
- backend/app/llm.py: OpenAI-compatible client targeting vLLM, plus the mock provider.
- deploy/Dockerfile.vllm-rocm: vLLM ROCm image for AMD Instinct GPUs.

Also submitted to the AMD Developer Hackathon: ACT III.
```

## Media

El formulario de la AI League no pide portada, video ni PDF. El material del proyecto es el mismo que se envió a ACT III: [`../04-amd-developer-hackathon-act-iii--docuswarm/media/`](../../04-amd-developer-hackathon-act-iii--docuswarm/media/)
