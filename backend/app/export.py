import io
import json
from typing import List

from openpyxl import Workbook

from .schemas import ResultItem, SwarmEvent


def _autosize(ws):
    for col_cells in ws.columns:
        width = max((len(str(c.value)) for c in col_cells if c.value is not None), default=10)
        ws.column_dimensions[col_cells[0].column_letter].width = min(max(width + 2, 10), 60)


def to_excel_bytes(results: List[ResultItem]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Results"
    ws.append(["Title", "Detail", "Source URL"])
    for r in results:
        ws.append([r.title, r.detail, r.source_url or ""])
    _autosize(ws)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def to_json_bytes(results: List[ResultItem]) -> bytes:
    return json.dumps([r.model_dump() for r in results], indent=2).encode("utf-8")


def swarm_to_excel_bytes(events: List[SwarmEvent]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Due Diligence"
    ws.append(["Document", "Risk Level", "Summary", "Red Flags", "Key Dates", "Parties", "Latency (s)"])
    for e in events:
        if e.status != "done" or e.analysis is None:
            continue
        a = e.analysis
        ws.append([
            e.doc_name,
            a.risk_level,
            a.summary,
            "; ".join(a.red_flags),
            "; ".join(a.key_dates),
            "; ".join(a.parties),
            e.latency_s or "",
        ])
    _autosize(ws)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def swarm_to_json_bytes(events: List[SwarmEvent]) -> bytes:
    payload = [e.model_dump() for e in events if e.status == "done"]
    return json.dumps(payload, indent=2).encode("utf-8")
