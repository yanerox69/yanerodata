# Dark Factory — the band that refuses its own work

- **Hackathon:** WeAreDevelopers × BAND present: Dark Factory (hackathon edition)
- **Equipo:** Dark Factory
- **Enviado:** 2026-09-28
- **Página publicada:** https://lablab.ai/ai-hackathons/wearedevelopers-hackathon/revenueflow/dark-factory-the-band-that-refuses-its-own-work

## Paso 1 — Basic Information

### Submission Title
```
Dark Factory — the band that refuses its own work
```

### Short Description
```
Three coding agents in one BAND room build a payments API. Two of the three cannot write code — their job is to refuse handoffs that do not conform.
```

### Long Description
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

**Categories:** Developer Tools · Open-ended Agent Protocol

**Technologies:** Band Intergrations · Featherless · Claude Code · Band Agentic Mesh · Band Control Plane

**Event Tracks:** Pocketful

## Paso 2 — Media

| Campo | Archivo | Original en lablab |
|---|---|---|
| Cover Image | [`media/portada.jpg`](../media/portada.jpg) | [enlace](https://storage.googleapis.com/lablab-static-eu/submissions/z6mh2dr7tqz6cer8l60q0jqv/i39x9a1pno73y9ry1lezwm9y/image/image_rygwm5uj6kggi7kb4rekrep3.jpg) |
| Slide Presentation (PDF) | [`media/presentacion.pdf`](../media/presentacion.pdf) | [enlace](https://storage.googleapis.com/lablab-static-eu/submissions/z6mh2dr7tqz6cer8l60q0jqv/i39x9a1pno73y9ry1lezwm9y/presentation/presentation_cspwydrwwpybz99lgc7zqs62.pdf) |
| Video Presentation | [`media/video.mp4`](../media/video.mp4) | [enlace](https://storage.googleapis.com/lablab-video-submissions/submissions/z6mh2dr7tqz6cer8l60q0jqv/i39x9a1pno73y9ry1lezwm9y/video/video_j6jkfa4jc8aqifty8repr6d5.mp4) |

## Paso 3 — Application

- **GitHub Repository:** https://github.com/yanerox69/dark-factory-pocketful
- **Demo Platform:** OTHER
- **Demo URL:** https://github.com/yanerox69/dark-factory-pocketful

## Reseñas del jurado

En este hackathon el jurado dejó comentarios sin puntuación numérica.

> Dark Factory demonstrates meaningful agent collaboration through separate coordinator, implementer, and reviewer roles, with a 158-item specification checklist and 147 passing checks. Cost and execution metrics are clearly documented. However, two defects escaped review and required human intervention, including a login failure. The incomplete autonomous verification and limited evidence of a polished user interface prevent higher scores.

> The reviewer checks the spec, not the implementer’s report, and all three seats are the same model. The difference is the mandate. Before any code, a 158-item checklist came from the spec text only. The coordinator said an empty body means an empty object. The reviewer agreed and still rejected it: the stored body must be that empty object, or a legitimate retry reads as a key reuse. That is a money bug caught before a line. Then the reviewer was stopped to save budget. Two defects shipped, one of them login impossible after an import. The owner caught both. 3 hours 49 minutes, $11.70, 147 of 147 shipped checks. Input outweighed output 54 to 1 because each turn rereads the room. An honest factory, with the miss written down.
