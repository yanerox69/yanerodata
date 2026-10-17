# RevenueFlow: WhatsApp voice receptionist

- **Hackathon:** AssemblyAI — Voice Agent Hackathon
- **Equipo:** RevenueFlow
- **Enviado:** 2026-09-10
- **Página publicada:** https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon/revenueflow/revenueflow-whatsapp-voice-receptionist

## Paso 1 — Basic Information

### Submission Title
```
RevenueFlow: WhatsApp voice receptionist
```

### Short Description
```
A WhatsApp voice-note receptionist for Latin American small businesses. A customer sends a voice message in their own language; about seven seconds later the appointment is booked and confirmed. No forms, no menus, nobody waiting on hold
```

### Long Description
```
In Latin America, WhatsApp is not a channel — it is the channel. Customers message small businesses there, usually with a voice note. But the person who would answer is the person doing the work: a dentist with their hands in someone's mouth is not replying to WhatsApp. Messages pile up, and the customer books somewhere else.

RevenueFlow answers instead. It transcribes the voice note with AssemblyAI Universal-3.5 Pro, extracts intent through the AssemblyAI LLM Gateway, resolves "el jueves en la tarde" into a real timestamp in the business's timezone, checks actual availability, books the appointment, and replies — in about seven seconds.

Language is detected, not assumed. Detection runs with expected_languages, a country fallback and code_switching for mixed voice notes, and on_low_language_confidence set to fallback, so a noisy note degrades to the country's language instead of failing outright. It answers in Spanish, Portuguese or English — and still books for someone writing in Russian or Mandarin.

One rule shapes everything: the model decides what the customer wants; the system decides what is allowed. The model cannot invent a service (catalog IDs only), a date (it returns a weekday symbol and the system computes the date), or availability. Replies are hand-written templates, because they carry exact dates and times, and a hallucination there is a lost appointment in real life.

It holds the conversation too. Four words — "mejor para el viernes" — reschedule the right appointment to Friday at the same hour, without repeating the service or the date. Complaints, money and medical questions stop and go to a human.

Running on a real WhatsApp number, in two countries, with row-level tenant isolation and money stored as integer minor units with its FX rate. 177 tests. Source public under MIT.
```

**Categories:** Voice Assistant · Productivity · Business · Language and Translation

**Technologies:** Assistants API · Vercel · Claude Code

## Paso 2 — Media

| Campo | Archivo | Original en lablab |
|---|---|---|
| Cover Image | [`media/portada.jpg`](../media/portada.jpg) | [enlace](https://storage.googleapis.com/lablab-static-eu/submissions/b6wkg1t1zv6hiu22b6rbu59b/kyq9zp77m9g2am8reerxi21o/image/image_e9rsaj1upmaz3omkgk318xlb.jpg) |
| Slide Presentation (PDF) | [`media/presentacion.pdf`](../media/presentacion.pdf) | [enlace](https://storage.googleapis.com/lablab-static-eu/submissions/b6wkg1t1zv6hiu22b6rbu59b/kyq9zp77m9g2am8reerxi21o/presentation/presentation_ghyw9v1mbjio8r9ml418ac4d.pdf) |
| Video Presentation | [`media/video.mp4`](../media/video.mp4) | [enlace](https://storage.googleapis.com/lablab-video-submissions/submissions/b6wkg1t1zv6hiu22b6rbu59b/kyq9zp77m9g2am8reerxi21o/video/video_e7astxs2ku8nqxc0alcy5628.mp4) |

## Paso 3 — Application

- **GitHub Repository:** https://github.com/yanerox69/revenueflow-ai
- **Demo Platform:** VERCEL
- **Demo URL:** https://revenueflow-ai-yanero.vercel.app

## Additional Information

Este campo no se muestra en la página pública de lablab; es el texto que se preparó y pegó en el formulario.

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

## Reseñas del jurado

| Valor de negocio | Originalidad | Presentación | Uso de la tecnología | Comentario |
|---|---|---|---|---|
| 4 | 4 | 4 | 4 | Good: the model-vs-system boundary is enforced in code, not just described. Zod schema with strict enum constraints, sanitizeIntent() post-validation against real catalog, weekday symbol conversion in scheduling. 180 test assertions across 15 files. Country packs (VE/BR) are clean abstractions with currency, tax ID, and phone normalization per country. Hand-written reply templates eliminate LLM hallucination in confirmations. Demo is live and functional. Problems: single WHATSAPP_ACCESS_TOKEN contradicts the multi-tenant narrative. The repo is derivative of an earlier project with similar stack and patterns. No health monitoring, and WhatsApp sender silently drops messages when no number is connected. The presentation deck references unverified WhatsApp penetration figures. Add a dead-letter queue for undelivered messages and replace the single token with per-tenant credential management. |
| 5 | 4 | 4 | 5 |  |
