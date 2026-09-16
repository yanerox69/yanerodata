"""Best-effort text extraction from uploaded documents."""
import io

from docx import Document as DocxDocument
from pypdf import PdfReader


class ExtractionError(RuntimeError):
    pass


def extract_text(filename: str, data: bytes) -> str:
    lower = filename.lower()
    try:
        if lower.endswith(".pdf"):
            return _extract_pdf(data)
        if lower.endswith(".docx"):
            return _extract_docx(data)
        return data.decode("utf-8", errors="ignore")
    except Exception as exc:  # noqa: BLE001
        raise ExtractionError(f"Could not read {filename}: {exc}") from exc


def _extract_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_docx(data: bytes) -> str:
    doc = DocxDocument(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs)
