# Mis hackathones en lablab.ai — datos de cada entrega (Submission)

Todo lo que pide el formulario de *Submission* de lablab.ai, por hackathon, listo
para copiar y pegar en tu perfil. Los textos van en **inglés** (como se enviaron);
las notas en español son para ti.

El formulario de lablab tiene 3 pasos:

1. **Basic Information** — Title (máx. 50), Short Description (máx. 255), Long Description (máx. 2000), Categories, Technologies
2. **Media** — Cover Image, Video Presentation, Slide Presentation (PDF)
3. **Application** — GitHub Repository, Demo Platform, Demo URL, Additional Information

Según tu página *My Teams* de lablab (lablab.ai/profile/my-teams), tienes **6 equipos**:

| # | Hackathon | Equipo en lablab | Proyecto | Cierre | Estado |
|---|---|---|---|---|---|
| 1 | AssemblyAI — Voice Agent Hackathon | RevenueFlow | RevenueFlow | 30 sep 2026 | ✅ Pasado · enviado el 10 sep |
| 2 | IBM Bob 2.0 hackathon | Yanero Rockstar | Issue → PR with IBM Bob 2.0 | 27 sep 2026 | ✅ Pasado |
| 3 | WeAreDevelopers × BAND present: Dark Factory (hackathon edition) | Dark Factory | Dark Factory — pocketful | 6 oct 2026 | ✅ Enviado el 28 sep · 147/147 |
| 4 | AMD Developer Hackathon: ACT III | Yanero Rockstar | DocuSwarm | 18 oct 2026 | ✅ Enviado el 12 oct (Event Tracks añadidos el 16) |
| 5 | Vultr: Agent Rush Hackathon | Airlock | Airlock | 8 nov 2026 | ⏳ En curso · textos preparados |
| 6 | AMD AI League | Yanero Rockstar | DocuSwarm (el mismo del #4) | 1 dic 2026 | ✅ Enviado el 17 oct |

> **Lo único pendiente:** el video y la URL de la demo de Airlock (el hackathon de
> Vultr cierra el 8 de noviembre).

---

## 1. RevenueFlow — AssemblyAI Voice Agent Hackathon

- **Página:** https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon
- **Premios:** $10.000 ($5k efectivo + $5k créditos)
- **Enviado:** 10 de septiembre de 2026

### Paso 1 — Basic Information

**Submission Title** (40/50)
```
RevenueFlow: WhatsApp voice receptionist
```

**Short Description** (238/255)
```
A WhatsApp voice-note receptionist for Latin American small businesses. A customer sends a voice message in their own language; seconds later the appointment is booked and confirmed. No forms, no menus, nobody waiting on hold.
```

**Long Description** (1827/2000)
```
In Latin America, WhatsApp is not a channel — it is the channel. Customers message small businesses there, usually with a voice note. But the person who would answer is the person doing the work: a dentist with their hands in someone's mouth is not replying to WhatsApp. Messages pile up, and the customer books somewhere else.

RevenueFlow answers instead. It transcribes the voice note with AssemblyAI Universal-3.5 Pro, extracts intent through the AssemblyAI LLM Gateway, resolves "el jueves en la tarde" into a real timestamp in the business's timezone, checks actual availability, books the appointment, and replies — in seconds, while the customer is still looking at their phone.

Language is detected, not assumed. Detection runs with expected_languages, a country fallback and code_switching for mixed voice notes, and on_low_language_confidence set to fallback, so a noisy note degrades to the country's language instead of failing outright. It answers in Spanish, Portuguese or English — and still books for someone writing in Russian or Mandarin.

One rule shapes everything: the model decides what the customer wants; the system decides what is allowed. The model cannot invent a service (catalog IDs only), a date (it returns a weekday symbol and the system computes the date), or availability. Replies are hand-written templates, because they carry exact dates and times, and a hallucination there is a lost appointment in real life.

It holds the conversation too. Four words — "mejor para el viernes" — reschedule the right appointment to Friday at the same hour, without repeating the service or the date. Complaints, money and medical questions stop and go to a human.

Running on a real WhatsApp number, in two countries, with row-level tenant isolation and money stored as integer minor units with its FX rate. 177 tests. Source public under MIT.
```

**Categories:** `Voice / Speech · AI Agents · Productivity · Business / SMB`

**Technologies:** `AssemblyAI · Next.js · TypeScript · Supabase · PostgreSQL · Vercel · WhatsApp API · Tailwind CSS`

### Paso 2 — Media

| Campo | Archivo / enlace |
|---|---|
| Cover Image | `Desktop\Saas\video\material\portada.png` (2560×1440) — se genera con `scripts/generar-portada.mts` del repo |
| Video Presentation | `Desktop\Saas\video\RevenueFlow.mp4` (4:18, 10 MB) · **YouTube: https://youtu.be/ti3kfZqFXo0** |
| Slide Presentation (PDF) | `Desktop\Saas\video\slides\RevenueFlow-slides.pdf` (1,7 MB) |

### Paso 3 — Application

- **GitHub Repository:** https://github.com/yanerox69/revenueflow-ai
- **Demo Platform:** Web
- **Demo URL:** https://revenueflow-ai-yanero.vercel.app

**Additional Information**
```
HOW TO TRY IT — 30 seconds, no signup

1. Open https://revenueflow-ai-yanero.vercel.app
2. Log in with:  owner.ve@demo.local  /  demo-Passw0rd!
3. Press the microphone and speak, in Spanish or English:
     "Hola, necesito una cita para una limpieza dental. ¿Tienes algo el jueves en la tarde?"
     "Hi, I need a dental cleaning. Anything Thursday afternoon?"
4. Watch the stages — transcribing, understanding, checking the calendar — and the appointment appear in the panel below.

A Brazilian business is also seeded: owner.br@demo.local, same password. Same engine, different country: Portuguese, BRL, CNPJ, São Paulo timezone.

ON WHATSAPP — the number is a Meta test number and only delivers to pre-authorised recipients, so judges cannot message it directly. The web recorder above runs the identical pipeline: same transcription, same agent, same database. The video shows the real WhatsApp path end to end, including a four-word follow-up that reschedules the right appointment.

WORTH A LOOK IN THE CODE
- src/lib/voice/assemblyai.ts — automatic language detection with expected_languages, a country fallback and code_switching; on_low_language_confidence set to fallback so a noisy note degrades instead of failing.
- src/lib/agent/intent.ts — the schema as a barrier. The model returns a weekday symbol, never a date, and only catalog IDs.
- src/lib/agent/servicio.ts — the model also returns the service in the customer's own words, so its own ID can be contradicted and corrected.
- tests/ — 177 tests, including the failures found by running it for real.

DISCLOSURE: this project was built and deployed before the challenge window opened and has been developed further throughout September. The commit history is public and dated.
```

**Números:** 177 tests · 46 commits · MIT · 2 países (VE, BR) · 3 idiomas · ~7 s de voz a cita.

---

## 2. Issue → PR with IBM Bob 2.0 — IBM Bob 2.0 Hackathon

- **Fechas:** 25–27 de septiembre de 2026 (en solitario)
- Este repo no tenía un `ENTREGA.md`; los textos de abajo salen del README y de
  `RESULTS.md` del repositorio, ajustados a los límites del formulario.

### Paso 1 — Basic Information

**Submission Title** (27/50)
```
Issue → PR with IBM Bob 2.0
```

**Short Description** (≈200/255)
```
From a bug report to a review-ready pull request with one command. Five IBM Bob 2.0 custom modes reproduce, diagnose, fix and document each bug, with edit guardrails Bob enforces itself. 9 of 10 bugs fixed.
```

**Long Description** (≈1600/2000)
```
Fixing a reported bug is mostly glue work: decode the report, reproduce it, hunt for the cause, patch, re-run everything, write the PR. AI assistants speed that up, but they also cut corners: they patch symptoms, or "fix" a failing test by editing the test.

Issue → PR is a pipeline of five IBM Bob 2.0 custom modes, triggered with one command: /Issue → PR Fix @issues/ISSUE-004.md

- Orchestrator (no edit rights) — creates fix/issue-XXX and runs each stage as a Bob subtask
- Reproducer — writes a failing test (may edit tests/ only)
- Diagnoser — finds the root cause file:line and the same bug elsewhere (no edit rights)
- Fixer — minimal fix, full suite green (may edit the source, NOT tests/)
- PR Writer — commit plus a PR description (may edit prs/ only)

The edit restrictions are fileRegex tool-group rules, enforced by Bob, so the Fixer cannot make a test pass by changing the test.

HOW WE MEASURED IT
A small Python order-management library with 10 seeded, realistic bugs, each written up as a user-style report. One hidden acceptance test per bug, kept outside the repo Bob works in. A scorer checks out every fix/* branch in a temporary worktree; a bug counts as fixed only if its hidden test passes and the existing suite is still green.

RESULTS
9 of 10 bugs fixed against hidden tests, zero regressions, 18.02 Bobcoins in total — about 2 Bobcoins per fixed bug. Every patch and PR description Bob produced is in the repository.
```

**Categories:** `Developer Tools · AI Agents · Software Engineering`

**Technologies:** `IBM Bob 2.0 · Python · pytest · Git`

### Paso 2 — Media

| Campo | Archivo / enlace |
|---|---|
| Cover Image | — (no hay portada en el repo; puedes usar una captura de `bob-sessions/`) |
| Video Presentation | **YouTube: https://youtu.be/dOwGorHE6jU** |
| Slide Presentation (PDF) | [`Issue-to-PR-slides.pdf`](https://github.com/yanerox69/issue-to-pr-bob/blob/main/Issue-to-PR-slides.pdf) |

### Paso 3 — Application

- **GitHub Repository:** https://github.com/yanerox69/issue-to-pr-bob
- **Demo Platform:** Other / CLI (no tiene app web)
- **Demo URL:** — (usa el enlace del repo)

**Additional Information**
```
HOW TO REPRODUCE
cd sample-app
python -m pip install -e ".[dev]"
python -m pytest -q          # 20 passed: the bugs are invisible to the existing suite
python ../eval/score.py      # 0/10 on main
In Bob: open sample-app/, then  /Issue → PR  Fix @issues/ISSUE-00X.md
python ../eval/score.py --branches --label my-run

The five modes are the deliverable: sample-app/.bob/custom_modes.yaml
Results per bug: RESULTS.md · Bob's patches and PRs: fixes/ · Bob session screenshots: bob-sessions/
```

---

## 3. Dark Factory — pocketful · WeAreDevelopers × BAND

- **Página publicada de la entrega:** https://lablab.ai/ai-hackathons/wearedevelopers-hackathon/revenueflow/dark-factory-the-band-that-refuses-its-own-work
- **Enviado:** 28 de septiembre de 2026 · **Equipo:** Dark Factory · **Pista:** 💸 pocketful (clon de Venmo)
- **Premios del hackathon:** $6.000 en efectivo entre dos pistas + $300 en créditos Featherless
- Los textos de abajo son **los que están publicados** en lablab (copiados de la página).

### Paso 1 — Basic Information

**Submission Title**
```
Dark Factory — the band that refuses its own work
```

**Short Description** (lo que muestra la página)
```
Pocketful
```

**Long Description**
```
Dark Factory is a software factory built in BAND Desktop: three coding-agent seats in one room, coordinating through @mention routing, building a wallet and payments service against a written specification.

THE DESIGN DECISION
Grading here is literal and automated: exact field names, exact status codes. One mistyped attribute scores nothing. So the advantage is not implementing faster; it is refusing to hand off anything that does not conform. Two of the three seats are forbidden from writing production code: a coordinator who plans and holds the gate, an implementer, and a reviewer who checks conformance against the spec text, never against the implementer's report. All three run the same harness and model — OpenCode on Featherless, GLM-5.2 — so nothing comes from giving a role a better model. The only difference is the mandate file, loaded as that seat's system prompt.

WHAT IT CAUGHT
Before any code existed, the reviewer turned the specification into a 158-item checklist, derived from the spec text only, never from the shipped tests, which are a sample that would encode its own blind spots as the requirement. Then one seat corrected another: the coordinator ruled that an empty request body means an empty object; the reviewer confirmed it and rejected it as incomplete, because the stored body must be that empty object too, or a legitimate retry reads as a key reuse — a money bug, caught before a line was written.

WHAT IT MISSED
We stopped the reviewer partway to conserve budget. Two defects shipped past the seats, one of them making login impossible after an import. The owner caught both at the gate.

MEASURED
3h49m, 451 messages, 11,743,469 tokens, $11.70 of a $25 credit, 147 of 147 shipped checks. Input outweighed output 54 to 1: a seat re-reads the whole room every turn, so a factory costs what its own history costs.

THE DELETE TEST
Take BAND out and this factory does not degrade. It disappears — the rejection has no channel.
```

**Categories:** `Developer Tools · Open-ended Agent Protocol`

**Technologies:** `Band Integrations · Featherless · Claude Code · Band Agentic Mesh · Band Control Plane`

### Paso 2 — Media

| Campo | Archivo / enlace |
|---|---|
| Cover Image | La página publicada no muestra portada. En el repo `dark-factory` hay una: [`web/cover.png`](https://github.com/yanerox69/dark-factory/blob/main/web/cover.png) (1280×720) |
| Video Presentation | ✅ Subido — visible en la página publicada (comprobado el 17 oct) |
| Slide Presentation (PDF) | [PDF publicado en lablab](https://storage.googleapis.com/lablab-static-eu/submissions/z6mh2dr7tqz6cer8l60q0jqv/i39x9a1pno73y9ry1lezwm9y/presentation/presentation_cspwydrwwpybz99lgc7zqs62.pdf) · copia en el repo: [`deck.pdf`](https://github.com/yanerox69/dark-factory/blob/main/deck.pdf) |

### Paso 3 — Application

- **GitHub Repository:** https://github.com/yanerox69/dark-factory-pocketful
- **Demo URL:** https://github.com/yanerox69/dark-factory-pocketful (en la entrega, la demo apunta al mismo repo)
- **Licencia:** MIT

> Material extra en el repo `dark-factory-pocketful`: `FACTORY.md` (diseño, coste y lo que
> la fábrica detectó y no detectó), `mandates/` (instrucciones de cada agente), `room.json`
> (registro completo de la sala BAND) y `stage-1/` (el servicio, 147/147 checks).

---

## 4. Airlock — Vultr: Agent Rush Hackathon

- **Página:** https://lablab.ai/ai-hackathons/vultr-hackathon
- **Reto:** *Blast Radius Zero: Safe Agent Execution on Vultr*
- **Fase online:** 3–8 de noviembre de 2026 → **todavía no se puede enviar**
- **Antes de pegar:** la inferencia tiene que salir por Vultr Serverless Inference,
  la app tiene que estar en una VM de Vultr y la URL pública tiene que responder.

### Paso 1 — Basic Information

**Submission Title**
```
Airlock
```
*(si admite subtítulo: `Airlock — safe agent execution on Vultr`)*

**Short Description**
```
A control plane for agent execution. The model writes code; a disposable sandbox on Vultr runs it, with a live panel showing exactly what the kernel allowed. An agent that only chats is a demo — the product is the boundary around it.
```

**Long Description**
```
## The problem

The moment you let a model run what it writes, the interesting question stops being "is the answer right?" and becomes "what else can this thing touch?"

Most agent frameworks call exec() inside the app runtime. The generated code inherits every API key the process holds, there is no memory ceiling, no wall clock, and no egress rule. That is why autonomous execution doesn't ship.

## What Airlock is

Airlock is a control plane, not an agent. It plans a task, classifies its risk, dispatches it across a sandbox boundary, verifies what came back, and destroys the environment — always, including when the task crashes.

Two tiers. Low-risk work goes to a warm Docker container. Work that touches the network, the filesystem or the process table is classified high-risk and gets a throwaway instance provisioned through the Vultr API and destroyed afterward, making Vultr itself the sandbox fabric.

The containment panel beside the conversation is not decoration. It reflects the flags the kernel is actually enforcing on the run you are watching.

## Containment — four guarantees, enforced not promised

- Process isolation — separate container, non-root user 65532, --cap-drop ALL, --security-opt no-new-privileges, read-only root filesystem
- Secret hygiene — no -e, no --env, no --env-file anywhere in the run. The container starts with the image environment and nothing else
- Resource limits — --memory with --memory-swap equal (no swap escape), --cpus, --pids-limit, and a host-side wall-clock timeout that ends in a kill
- Lifecycle discipline — created per task, destroyed in a finally block. Destruction is explicit rather than --rm so the exit reason can be inspected first; that is how an OOM kill is told apart from an ordinary failure

Code enters through stdin, never a bind mount. The container cannot see a single file from the host. Artifacts come back out through a base64 manifest the container emits itself, which keeps the work directory a size-capped RAM-only tmpfs.

## Proof — we attack our own boundary

Containment you haven't attacked is a claim, not a property. The repository ships a hostile suite that runs real attacks against a real container: rm -rf against the root filesystem, a fork bomb against the PID ceiling, credential hunting in the environment, attempted egress to the internet, allocating past the memory cap, an infinite loop against the wall clock, and looking for the host from inside.

8 of 8 contained. Zero orphan containers.

## It executes, and it corrects itself

Asked for ten billion operations, the memory ceiling killed two attempts — exit 137 — and the agent read that, changed approach, and solved it in five seconds. Asked for a statistical fit with a library that isn't installed and can't be installed (there is no network), it reimplemented the math in numpy: kurtosis -0.4203 against a theoretical -0.4229.

The limit doesn't only defend. It pushes the agent toward a better solution.

## Vultr

- Vultr VM backend — the control plane runs the whole loop. Vultr is the system of control and orchestration, not static hosting
- Vultr Serverless Inference — every agent call, through the OpenAI-compatible endpoint
- Sandbox boundary — containers on Vultr, never inside the app process
- Vultr API — a throwaway instance per high-risk task

Credentials live on the control-plane side of the boundary and never cross it. The sandbox has no keys, no network, and no way to ask for either.

## What's in the repository

A provider gate that verifies a model can actually do chained tool-calling and vision before you build against it. A credential scanner installed as a pre-commit hook, with a self-test of its own detector. Zero external dependencies — the entire control plane is Python standard library.

Every run is recorded: what it executed, what it produced, what the kernel enforced, and whether the sandbox had to absorb anything. Any past run replays from a direct link.

Blast radius — zero.
```

> ⚠️ Este texto pasa de 2000 caracteres. Si el campo lo corta, quita primero la
> sección *What's in the repository*.

**Categories:** `AI Agents · Developer Tools · Security · Cloud Infrastructure · Code Execution`

**Technologies:** `Vultr · Vultr Serverless Inference · Docker · Python · Server-Sent Events · Mistral`
*(cambia `Mistral` por el modelo de Vultr que uses al final)*

### Paso 2 — Media

| Campo | Archivo / enlace |
|---|---|
| Cover Image | `airlock-portada-cuadrada.png` (cuadrada) o `airlock-portada.png` — en la raíz del repo `airlock` |
| Video Presentation | ⚠️ Pendiente — guion en `video/GUION.md`, capturas `video/00-tabla.png` … `05-estadistica.png` |
| Slide Presentation (PDF) | `slides/airlock-deck.pdf` |

### Paso 3 — Application

- **GitHub Repository:** https://github.com/yanerox69/airlock (⚠️ hoy es **privado** — hazlo público antes de enviar)
- **Demo Platform:** Web
- **Demo URL:** ⚠️ Pendiente — la IP/dominio de la VM de Vultr

**Antes de enviar**
- [ ] La URL pública responde desde fuera de tu red
- [ ] La consola muestra un modelo **de Vultr**
- [ ] Repo público y `python scripts/escanear_secretos.py --todo` limpio
- [ ] El video incluye el momento de contención
- [ ] Slides (`slides/airlock-deck.pdf`) y portada subidas

---

## 5. DocuSwarm — AMD Developer Hackathon: ACT III

- **Página:** https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii
- **Página publicada de la entrega:** https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii/yanero-rockstar/docuswarm-parallel-due-diligence-on-amd-gpus
- **Equipo:** Yanero Rockstar (https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii/yanero-rockstar)
- **Enviado:** 12 oct 2026 · actualizado el 15 y el 16 oct (se añadieron los *Event Tracks*)
- **Código:** https://github.com/yanerox69/docuswarm (rama `main`)
- Probado en vivo en una **AMD Instinct MI300X** (AMD Developer Cloud) con **vLLM + Qwen3-8B**

### Paso 1 — Basic Information

**Submission Title** (45/50)
```
DocuSwarm: Parallel Due-Diligence on AMD GPUs
```

**Short Description**
```
Upload contracts and a swarm of async agents analyzes them in parallel on AMD Instinct GPUs via vLLM — surfacing risk level, red flags, and key dates, with a live GPU-throughput dashboard.
```

**Long Description**
```
DocuSwarm is a parallel document due-diligence agent swarm built for the AMD Developer Hackathon: ACT III — "AI agents and high-performance AI applications on AMD GPUs in the cloud."

Reviewing contracts, NDAs, and reports for risky clauses is slow, manual work done one document at a time. DocuSwarm turns it into a single upload: drop in up to 20 documents and a swarm of async agents analyzes them concurrently against the same LLM endpoint, surfacing risk level, red flags, key dates, and parties per document, with a consolidated Excel/JSON report.

This isn't a chatbot demo — it's built to make AMD GPU throughput visible. Every document gets its own async task bounded by a semaphore; all of them hit the same vLLM server, which is exactly the continuous-batching workload AMD Instinct GPUs + ROCm + vLLM are built for. A live dashboard streams completed/total, tokens/sec, elapsed time, and active concurrency in real time.

Tested end-to-end on an AMD Instinct MI300X (AMD Developer Cloud) serving Qwen3-8B via vLLM: 6 documents processed concurrently in 1.5 seconds at 1,653.9 tokens/sec — real GPU throughput, not a simulation. Each result reflects genuine LLM judgment (e.g., a contract flagged MEDIUM risk with specific red flags like termination penalties and liquidated damages), not keyword matching.

The backend is provider-agnostic by design: it talks to any OpenAI-compatible endpoint, so moving from a laptop to an AMD GPU instance is a one-line config change.

Tech stack: FastAPI + asyncio backend, React/Vite dashboard streaming over Server-Sent Events, vLLM serving on AMD Instinct GPUs (ROCm), openpyxl for Excel export.

Repo: https://github.com/yanerox69/docuswarm
```

**Participation Mode:** Online

**Categories:** `Documents · Legal · Developer Tools`

**Event Tracks:** `Evolus Business Agents on AMD · Intelligent Industry`

**Technologies** (publicadas): `AMD Developer Cloud · AMD ROCm · Claude Code · Qwen3`
*(vLLM, FastAPI, React y Python no estaban en la lista del formulario; se quitaron Nvidia, Assistants API y Anthropic Claude porque el proyecto no los usa)*

### Paso 2 — Media

| Campo | Archivo |
|---|---|
| Cover Image (16:9) | `cover_image.png` — 1920×1080, captura del dashboard |
| Video Presentation | `docuswarm_final5.mp4` — demo narrada con datos reales de rendimiento ✅ visible en la página publicada (comprobado el 17 oct) |
| Slide Presentation (PDF) | [PDF publicado en lablab](https://storage.googleapis.com/lablab-static-eu/submissions/ns4bgcyttkb6hbt4ox02n11j/tby0vdux0qmske2o7msgp22v/presentation/presentation_c4r6mcok0wtr0p4ovndcbhgq.pdf) · `docuswarm_deck.pdf` — 9 slides: problema, solución, captura, rendimiento en GPU AMD, arquitectura, encaje con el hackathon, stack y cierre |

> Estos tres archivos los subiste desde tu PC; no están en ningún repo.

### Paso 3 — Application

- **GitHub Repository:** https://github.com/yanerox69/docuswarm
  ✅ Actualizado en lablab el 17 oct (campo del repo y última línea de la descripción larga).
- **Demo Platform:** Other
- **Demo URL:** http://129.212.188.131:3000 (la instancia MI300X ya está apagada)

**Additional Information**
```
Note: the live demo was running on a real AMD Instinct MI300X GPU Droplet (AMD Developer Cloud), fully functional — all results shown in the video and slide deck were captured live from that instance (6 documents processed in 1.5s at 1,653.9 tokens/sec). The droplet was powered off after the AMD Developer Cloud trial credit was exhausted, so the demo URL above may no longer respond. The video presentation shows the application running live end-to-end on the real GPU as proof.
```


---

## 6. DocuSwarm — AMD AI League

- **Equipo en lablab:** Yanero Rockstar · **Cierre:** 1 de diciembre de 2026
- **Enviado:** 17 de octubre de 2026
- **Proyecto:** DocuSwarm, el mismo de la sección 5. El formulario de la AI League es
  más corto: 2 pasos, sin descripción corta, sin media y sin URL de demo.

### Paso 1 — Basic Information

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

### Paso 2 — Application

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
