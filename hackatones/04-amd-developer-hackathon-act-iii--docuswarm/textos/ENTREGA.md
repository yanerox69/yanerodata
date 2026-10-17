# DocuSwarm: Parallel Due-Diligence on AMD GPUs

- **Hackathon:** AMD Developer Hackathon: ACT III
- **Equipo:** Yanero Rockstar
- **Enviado:** 2026-10-12
- **Página publicada:** https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii/yanero-rockstar/docuswarm-parallel-due-diligence-on-amd-gpus

## Paso 1 — Basic Information

### Submission Title
```
DocuSwarm: Parallel Due-Diligence on AMD GPUs
```

### Short Description
```
Upload contracts and a swarm of async agents analyzes them in parallel on AMD Instinct GPUs via vLLM — surfacing risk level, red flags, and key dates, with a live GPU-throughput dashboard.
```

### Long Description
```
DocuSwarm is a parallel document due-diligence agent swarm built for the AMD Developer Hackathon: ACT III — "AI agents and high-performance AI applications on AMD GPUs in the cloud."

Reviewing contracts, NDAs, and reports for risky clauses is slow, manual work done one document at a time. DocuSwarm turns it into a single upload: drop in up to 20 documents and a swarm of async agents analyzes them concurrently against the same LLM endpoint, surfacing risk level, red flags, key dates, and parties per document, with a consolidated Excel/JSON report.

This isn't a chatbot demo — it's built to make AMD GPU throughput visible. Every document gets its own async task bounded by a semaphore; all of them hit the same vLLM server, which is exactly the continuous-batching workload AMD Instinct GPUs + ROCm + vLLM are built for. A live dashboard streams completed/total, tokens/sec, elapsed time, and active concurrency in real time.

Tested end-to-end on an AMD Instinct MI300X (AMD Developer Cloud) serving Qwen3-8B via vLLM: 6 documents processed concurrently in 1.5 seconds at 1,653.9 tokens/sec — real GPU throughput, not a simulation. Each result reflects genuine LLM judgment (e.g., a contract flagged MEDIUM risk with specific red flags like termination penalties and liquidated damages), not keyword matching.

The backend is provider-agnostic by design: it talks to any OpenAI-compatible endpoint, so moving from a laptop to an AMD GPU instance is a one-line config change.

Tech stack: FastAPI + asyncio backend, React/Vite dashboard streaming over Server-Sent Events, vLLM serving on AMD Instinct GPUs (ROCm), openpyxl for Excel export.

Repo: https://github.com/yanerox69/docuswarm
```

**Categories:** Developer Tools · Documents · Legal

**Technologies:** AMD Developer Cloud · AMD ROCm · Claude Code · Qwen3

**Event Tracks:** Evolus Business Agents on AMD · Intelligent Industry

## Paso 2 — Media

| Campo | Archivo | Original en lablab |
|---|---|---|
| Cover Image | [`media/portada.jpg`](../media/portada.jpg) | [enlace](https://storage.googleapis.com/lablab-static-eu/submissions/ns4bgcyttkb6hbt4ox02n11j/tby0vdux0qmske2o7msgp22v/image/image_ep62696r0c65peb737yb6p5p.jpg) |
| Slide Presentation (PDF) | [`media/presentacion.pdf`](../media/presentacion.pdf) | [enlace](https://storage.googleapis.com/lablab-static-eu/submissions/ns4bgcyttkb6hbt4ox02n11j/tby0vdux0qmske2o7msgp22v/presentation/presentation_c4r6mcok0wtr0p4ovndcbhgq.pdf) |
| Video Presentation | [`media/video.mp4`](../media/video.mp4) | [enlace](https://storage.googleapis.com/lablab-video-submissions/submissions/ns4bgcyttkb6hbt4ox02n11j/tby0vdux0qmske2o7msgp22v/video/video_qn4cf263iwf1rk8sxeplgo2k.mp4) |

## Paso 3 — Application

- **GitHub Repository:** https://github.com/yanerox69/docuswarm
- **Demo Platform:** OTHER
- **Demo URL:** http://129.212.188.131:3000

## Additional Information

Este campo no se muestra en la página pública de lablab; es el texto que se preparó y pegó en el formulario.

```
Note: the live demo was running on a real AMD Instinct MI300X GPU Droplet (AMD Developer Cloud), fully functional — all results shown in the video and slide deck were captured live from that instance (6 documents processed in 1.5s at 1,653.9 tokens/sec). The droplet was powered off after the AMD Developer Cloud trial credit was exhausted, so the demo URL above may no longer respond. The video presentation shows the application running live end-to-end on the real GPU as proof.
```
