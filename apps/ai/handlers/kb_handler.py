"""
KB processing pipeline:
  URL  → httpx fetch → BeautifulSoup text extraction
  File → download presigned S3 URL → parse by type → chunk → embed → upsert Pinecone
"""

import os
import io
import ipaddress
import json
import socket
import time
from typing import Optional
from urllib.parse import urlparse, urlunparse

from utils.logger import logger, redact_sensitive
from utils.metrics import emit_metric

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
MAX_DOWNLOAD_BYTES = int(os.environ.get("KB_MAX_DOWNLOAD_BYTES", str(10 * 1024 * 1024)))
MAX_CHUNKS_PER_DOCUMENT = int(os.environ.get("KB_MAX_CHUNKS_PER_DOCUMENT", "500"))
MAX_DOCUMENTS_PER_JOB = int(os.environ.get("KB_MAX_DOCUMENTS_PER_JOB", "50"))
ALLOWED_SCHEMES = {"http", "https"}
ALLOWED_HOSTS = [
    host.strip().lower()
    for host in os.environ.get("KB_ALLOWED_HOSTS", "").split(",")
    if host.strip()
]
ALLOWED_CONTENT_TYPES = (
    "text/",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-excel",
    "application/json",
    "application/csv",
    "application/octet-stream",
)


# ── text extraction ──────────────────────────────────────────────────────────

async def fetch_url(url: str) -> str:
    """Download a web page and extract visible text via BeautifulSoup."""
    import httpx  # type: ignore
    from bs4 import BeautifulSoup  # type: ignore

    content = await download_bytes(url, max_bytes=MAX_DOWNLOAD_BYTES, expected_content="html")
    soup = BeautifulSoup(content, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


async def download_bytes(
    url: str,
    *,
    max_bytes: int = MAX_DOWNLOAD_BYTES,
    expected_content: str | None = None,
) -> bytes:
    import httpx  # type: ignore

    safe_url = validate_ingest_url(url)
    async with httpx.AsyncClient(follow_redirects=False, timeout=60) as client:
        current_url = safe_url
        for _ in range(5):
            async with client.stream("GET", current_url, headers={"User-Agent": "QuickVoice-KB/1.0"}) as resp:
                if resp.status_code in {301, 302, 303, 307, 308}:
                    redirect_url = resp.headers.get("location")
                    if not redirect_url:
                        raise ValueError("Redirect response missing Location header")
                    current_url = validate_ingest_url(str(resp.url.join(redirect_url)))
                    continue

                resp.raise_for_status()
                _validate_content_type(resp.headers.get("content-type", ""), expected_content)
                chunks: list[bytes] = []
                total = 0
                async for chunk in resp.aiter_bytes():
                    total += len(chunk)
                    if total > max_bytes:
                        raise ValueError(f"download exceeds {max_bytes} byte limit")
                    chunks.append(chunk)
                return b"".join(chunks)

        raise ValueError("Too many redirects")


def validate_ingest_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise ValueError("Only http and https URLs are allowed for KB ingestion")
    if not parsed.hostname:
        raise ValueError("URL host is required")
    if parsed.username or parsed.password:
        raise ValueError("URL credentials are not allowed")

    host = parsed.hostname.rstrip(".").lower()
    if host == "localhost" or host.endswith(".localhost"):
        raise ValueError("Local hosts are not allowed for KB ingestion")
    if ALLOWED_HOSTS and not any(host == allowed or host.endswith(f".{allowed}") for allowed in ALLOWED_HOSTS):
        raise ValueError("URL host is not allowed for KB ingestion")

    _validate_public_host(host)
    return urlunparse(parsed._replace(scheme=parsed.scheme.lower(), netloc=parsed.netloc.lower()))


def _validate_public_host(host: str) -> None:
    try:
        addresses = [ipaddress.ip_address(host)]
    except ValueError:
        try:
            infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
        except socket.gaierror as exc:
            raise ValueError("URL host could not be resolved") from exc
        addresses = []
        for info in infos:
            addresses.append(ipaddress.ip_address(info[4][0]))

    for address in addresses:
        if (
            address.is_private
            or address.is_loopback
            or address.is_link_local
            or address.is_reserved
            or address.is_multicast
            or address.is_unspecified
        ):
            raise ValueError("Private, local, or reserved IP addresses are not allowed for KB ingestion")


def _validate_content_type(content_type: str, expected_content: str | None) -> None:
    normalized = (content_type or "").split(";", 1)[0].strip().lower()
    if not normalized:
        return
    if expected_content == "html" and normalized not in {"text/html", "application/xhtml+xml"}:
        raise ValueError(f"Unsupported URL content type: {normalized}")
    if expected_content != "html" and not any(normalized.startswith(prefix) for prefix in ALLOWED_CONTENT_TYPES):
        raise ValueError(f"Unsupported file content type: {normalized}")


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
    _delete_kb_vectors(index=index, namespace=namespace, kb_id=kb_id)
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


def delete_kb_vectors(*, namespace: str, kb_id: str) -> None:
    _delete_kb_vectors(index=_index(), namespace=namespace, kb_id=kb_id)


def _delete_kb_vectors(*, index, namespace: str, kb_id: str) -> None:
    index.delete(filter={"kbId": {"$eq": kb_id}}, namespace=namespace)


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
    budget = _budget_for_agent(agent_id, payload)
    if len(documents) > budget["max_documents_per_job"]:
        raise ValueError(f"KB job exceeds document budget of {budget['max_documents_per_job']}")
    results: list[dict] = []

    for doc in documents:
        started = time.perf_counter()
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
                validate_ingest_url(url)
                text = await fetch_url(url)
            else:
                if not presigned_url:
                    raise ValueError("presignedUrl is required for file source types")
                validate_ingest_url(presigned_url)
                content = await download_bytes(presigned_url)
                text = parse_file(content, source_type)

            if not text.strip():
                raise ValueError("Extracted text is empty")

            # 2. Chunk
            chunks = chunk_text(text)
            if not chunks:
                raise ValueError("No chunks produced")
            if len(chunks) > budget["max_chunks_per_document"]:
                raise ValueError(f"Document exceeds chunk budget of {budget['max_chunks_per_document']}")

            # 3. Embed
            embeddings = await embed_chunks(chunks)

            # 4. Upsert to Pinecone (namespace = agentId for per-agent isolation)
            upsert_to_pinecone(chunks, embeddings, namespace=agent_id, kb_id=kb_id, doc_name=name)

            emit_metric(
                "kb_document_processed",
                status="ok",
                agent_id=agent_id,
                kb_id=kb_id,
                source_type=source_type,
                text_chars=len(text),
                chunks=len(chunks),
                latency_ms=int((time.perf_counter() - started) * 1000),
            )
            logger.info(
                "[kb] processed {}",
                redact_sensitive({"kbId": kb_id, "chunks": len(chunks), "sourceType": source_type}),
            )
            results.append({"kbId": kb_id, "status": "ok", "chunks": len(chunks)})

        except Exception as exc:
            emit_metric(
                "kb_document_processed",
                status="error",
                agent_id=agent_id,
                kb_id=kb_id,
                source_type=source_type,
                latency_ms=int((time.perf_counter() - started) * 1000),
            )
            logger.error("[kb] failed {}", redact_sensitive({"kbId": kb_id, "error": str(exc)}))
            results.append({"kbId": kb_id, "status": "error", "error": str(exc)})

    return results


def _budget_for_agent(agent_id: str, payload: dict) -> dict[str, int]:
    budget = {
        "max_documents_per_job": MAX_DOCUMENTS_PER_JOB,
        "max_chunks_per_document": MAX_CHUNKS_PER_DOCUMENT,
    }

    env_budgets = _parse_budgets_json(os.environ.get("KB_AGENT_BUDGETS_JSON", ""))
    payload_budgets = payload.get("budgets") if isinstance(payload.get("budgets"), dict) else {}
    for source in (env_budgets, payload_budgets):
        candidate = source.get(agent_id) if isinstance(source.get(agent_id), dict) else source
        if not isinstance(candidate, dict):
            continue
        budget["max_documents_per_job"] = _positive_int(
            candidate,
            "maxDocumentsPerJob",
            "max_documents_per_job",
            default=budget["max_documents_per_job"],
        )
        budget["max_chunks_per_document"] = _positive_int(
            candidate,
            "maxChunksPerDocument",
            "max_chunks_per_document",
            default=budget["max_chunks_per_document"],
        )

    return budget


def _parse_budgets_json(value: str) -> dict:
    if not value:
        return {}
    try:
        parsed = json.loads(value)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _positive_int(source: dict, *keys: str, default: int) -> int:
    for key in keys:
        value = source.get(key)
        if value is None:
            continue
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            continue
        if parsed > 0:
            return parsed
    return default
