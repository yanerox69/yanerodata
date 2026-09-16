"""Parallel document-analysis swarm.

Each document gets its own async task; a semaphore bounds how many are
in flight at once (CONCURRENCY). All of them hit the same vLLM endpoint,
so on AMD Instinct GPUs this is exactly the continuous-batching workload
vLLM/ROCm is built for — throughput rises with concurrency instead of
requests queuing one-by-one behind each other.
"""
import asyncio
import json
import time
from dataclasses import dataclass
from typing import AsyncIterator, List

from .llm import achat, LLMError
from .schemas import DocumentAnalysis, SwarmEvent, SwarmMetrics

_SWARM_SYSTEM_PROMPT = """You are a due-diligence analyst. Read the document \
excerpt and respond ONLY with JSON in this exact shape:
{"risk_level": "low|medium|high", "summary": "one or two sentences",
 "red_flags": ["..."], "key_dates": ["..."], "parties": ["..."]}
Only include what is clearly supported by the text. Keep it concise."""


@dataclass
class DocInput:
    id: str
    name: str
    text: str


async def analyze_swarm(documents: List[DocInput], concurrency: int = 4) -> AsyncIterator[SwarmEvent]:
    sem = asyncio.Semaphore(max(concurrency, 1))
    queue: asyncio.Queue = asyncio.Queue()
    start = time.monotonic()
    stats = {"completed": 0, "tokens": 0}

    for doc in documents:
        await queue.put(SwarmEvent(type="status", doc_id=doc.id, doc_name=doc.name, status="queued"))

    async def worker(doc: DocInput):
        await queue.put(SwarmEvent(type="status", doc_id=doc.id, doc_name=doc.name, status="running"))
        async with sem:
            t0 = time.monotonic()
            try:
                content, usage = await achat([
                    {"role": "system", "content": _SWARM_SYSTEM_PROMPT},
                    {"role": "user", "content": doc.text[:6000] or "(empty document)"},
                ])
                analysis = _parse_analysis(content)
                stats["completed"] += 1
                stats["tokens"] += usage.get("total_tokens", 0)
                elapsed_total = time.monotonic() - start
                await queue.put(SwarmEvent(
                    type="status",
                    doc_id=doc.id,
                    doc_name=doc.name,
                    status="done",
                    analysis=analysis,
                    latency_s=round(time.monotonic() - t0, 2),
                    metrics=SwarmMetrics(
                        completed=stats["completed"],
                        total=len(documents),
                        tokens_per_s=round(stats["tokens"] / max(elapsed_total, 0.01), 1),
                        elapsed_s=round(elapsed_total, 2),
                        concurrency=concurrency,
                    ),
                ))
            except LLMError as exc:
                stats["completed"] += 1
                await queue.put(SwarmEvent(
                    type="status", doc_id=doc.id, doc_name=doc.name, status="error", error=str(exc),
                ))

    tasks = [asyncio.create_task(worker(d)) for d in documents]

    async def runner():
        await asyncio.gather(*tasks)
        await queue.put(None)

    runner_task = asyncio.create_task(runner())

    while True:
        item = await queue.get()
        if item is None:
            break
        yield item
    await runner_task


def _parse_analysis(raw: str) -> DocumentAnalysis:
    raw = raw.strip()
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        return DocumentAnalysis(summary=raw[:300])
    try:
        data = json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return DocumentAnalysis(summary=raw[:300])
    try:
        return DocumentAnalysis(**data)
    except Exception:  # noqa: BLE001
        return DocumentAnalysis(summary=raw[:300])
