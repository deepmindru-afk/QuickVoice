"""
KB processing pipeline:
  URL  → httpx fetch → BeautifulSoup text extraction
  File → download presigned S3 URL → parse by type → chunk → embed → upsert Pinecone
"""

import os
import io
import httpx
from typing import Optional

from loguru import logger

# ── lazy imports (heavy deps loaded once) ────────────────────────────────────

def _pinecone():
    from pinecone import Pinecone  # type: ignore
    return Pinecone(api_key=os.environ["PINECONE_API_KEY"])

def _index():
    pc = _pinecone()
    return pc.Index(os.environ.get("PINECONE_INDEX", "quickvoice-kb"))

def _google_client():
    import google.generativeai as genai  # type: ignore
    genai.configure(api_key=os.environ.get("GOOGLE_EMBEDDING_API_KEY", os.environ.get("GOOGLE_API_KEY", "")))
    return genai

EMBEDDING_MODEL = "models/text-embedding-004"
CHUNK_SIZE = 500       # characters (not tokens — keeps it dependency-light)
CHUNK_OVERLAP = 50


# ── text extraction ──────────────────────────────────────────────────────────

async def fetch_url(url: str) -> str:
    """Download a web page and extract visible text via BeautifulSoup."""
    from bs4 import BeautifulSoup  # type: ignore
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url, headers={"User-Agent": "QuickVoice-KB/1.0"})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.content, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


async def download_bytes(url: str) -> bytes:
    async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    return resp.content


def parse_pdf(content: bytes) -> str:
    import fitz  # type: ignore  (pymupdf)
    doc = fitz.open(stream=content, filetype="pdf")
    return "\n".join(page.get_text() for page in doc)


def parse_docx(content: bytes) -> str:
    from docx import Document  # type: ignore
    doc = Document(io.BytesIO(content))
    parts = []
    for para in doc.paragraphs:
        if para.text.strip():
            parts.append(para.text)
    for table in doc.tables:
        for row in table.rows:
            parts.append("\t".join(cell.text for cell in row.cells))
    return "\n".join(parts)


def parse_xlsx(content: bytes) -> str:
    import openpyxl  # type: ignore
    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    parts = []
    for ws in wb.worksheets:
        for row in ws.iter_rows(values_only=True):
            row_text = "\t".join(str(c) for c in row if c is not None)
            if row_text.strip():
                parts.append(row_text)
    return "\n".join(parts)


def parse_xls(content: bytes) -> str:
    import xlrd  # type: ignore
    wb = xlrd.open_workbook(file_contents=content)
    parts = []
    for sheet in wb.sheets():
        for rx in range(sheet.nrows):
            row_text = "\t".join(str(sheet.cell_value(rx, cx)) for cx in range(sheet.ncols))
            if row_text.strip():
                parts.append(row_text)
    return "\n".join(parts)


def parse_file(content: bytes, source_type: str) -> str:
    st = source_type.upper()
    if st == "PDF":
        return parse_pdf(content)
    if st == "DOCX":
        return parse_docx(content)
    if st == "XLSX":
        return parse_xlsx(content)
    if st == "XLS":
        return parse_xls(content)
    # TXT / CSV and any other plain-text type
    return content.decode("utf-8", errors="replace")


# ── chunking ─────────────────────────────────────────────────────────────────

def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Simple character-based sliding window splitter."""
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += size - overlap
    return chunks


# ── embedding ─────────────────────────────────────────────────────────────────

async def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """Batch-embed chunks using Google text-embedding-004."""
    import asyncio
    genai = _google_client()

    BATCH = 100  # Google API allows up to 100 texts per request
    all_embeddings: list[list[float]] = []

    for i in range(0, len(chunks), BATCH):
        batch = chunks[i : i + BATCH]
        result = await asyncio.to_thread(
            genai.embed_content,
            model=EMBEDDING_MODEL,
            content=batch,
            task_type="retrieval_document",
        )
        all_embeddings.extend(result["embedding"] if isinstance(result["embedding"][0], list) else [result["embedding"]])

    return all_embeddings


# ── Pinecone upsert ───────────────────────────────────────────────────────────

def upsert_to_pinecone(
    chunks: list[str],
    embeddings: list[list[float]],
    namespace: str,
    kb_id: str,
    doc_name: str,
) -> None:
    index = _index()
    vectors = [
        {
            "id": f"{kb_id}#{i}",
            "values": emb,
            "metadata": {
                "kbId": kb_id,
                "name": doc_name,
                "chunkIdx": i,
                "text": chunk[:1000],  # store truncated text for retrieval
            },
        }
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ]
    # Upsert in batches of 100
    batch_size = 100
    for start in range(0, len(vectors), batch_size):
        index.upsert(vectors=vectors[start : start + batch_size], namespace=namespace)


# ── main entry ────────────────────────────────────────────────────────────────

async def process_documents(payload: dict) -> list[dict]:
    """
    Process each document in the payload. Returns a list of
    {kbId, status} dicts — 'ok' on success, 'error' on failure.
    """
    agent_id: str = payload.get("agentId") or ""
    if not agent_id:
        raise ValueError("agentId is required — KB sources must be assigned to an agent before processing")
    documents: list[dict] = payload["documents"]
    results: list[dict] = []

    for doc in documents:
        kb_id: str = doc["kbId"]
        name: str = doc.get("name", kb_id)
        source_type: str = doc.get("sourceType", "TXT")
        url: Optional[str] = doc.get("url")
        presigned_url: Optional[str] = doc.get("presignedUrl")

        try:
            # 1. Extract text
            if source_type.upper() == "URL":
                if not url:
                    raise ValueError("url is required for URL source type")
                text = await fetch_url(url)
            else:
                if not presigned_url:
                    raise ValueError("presignedUrl is required for file source types")
                content = await download_bytes(presigned_url)
                text = parse_file(content, source_type)

            if not text.strip():
                raise ValueError("Extracted text is empty")

            # 2. Chunk
            chunks = chunk_text(text)
            if not chunks:
                raise ValueError("No chunks produced")

            # 3. Embed
            embeddings = await embed_chunks(chunks)

            # 4. Upsert to Pinecone (namespace = agentId for per-agent isolation)
            upsert_to_pinecone(chunks, embeddings, namespace=agent_id, kb_id=kb_id, doc_name=name)

            logger.info(f"[kb] processed kbId={kb_id} chunks={len(chunks)}")
            results.append({"kbId": kb_id, "status": "ok"})

        except Exception as exc:
            logger.error(f"[kb] failed kbId={kb_id}: {exc}")
            results.append({"kbId": kb_id, "status": "error", "error": str(exc)})

    return results
