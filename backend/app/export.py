import io
import json
from typing import List

from openpyxl import Workbook

from .schemas import ResultItem


def to_excel_bytes(results: List[ResultItem]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Results"
    ws.append(["Title", "Detail", "Source URL"])
    for r in results:
        ws.append([r.title, r.detail, r.source_url or ""])
    for col_cells in ws.columns:
        width = max(len(str(c.value)) for c in col_cells if c.value is not None)
        ws.column_dimensions[col_cells[0].column_letter].width = min(max(width + 2, 10), 60)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def to_json_bytes(results: List[ResultItem]) -> bytes:
    return json.dumps([r.model_dump() for r in results], indent=2).encode("utf-8")
