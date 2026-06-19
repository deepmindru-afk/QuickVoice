import os
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from handlers.config_handler import get_config
from handlers import kb_handler
from utils.auth import is_explicit_dev_mode, verify_internal_headers


def _verify_internal(request: Request) -> None:
    """Reject requests that don't carry the correct internal API key."""
    try:
        verify_internal_headers(request.headers)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail="Unauthorized")


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    if not os.environ.get("INTERNAL_API_KEY") and not is_explicit_dev_mode():
        raise RuntimeError("INTERNAL_API_KEY is required for QuickVoice AI API startup")
    yield


app = FastAPI(title="QuickVoice AI", lifespan=_lifespan)


@app.middleware("http")
async def _internal_auth_middleware(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    try:
        _verify_internal(request)
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return await call_next(request)


# ── health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"ok": True, "service": "ai"}


# ── agent config ──────────────────────────────────────────────────────────────

@app.get("/agents/{agent_id}/config")
async def read_agent_config(agent_id: str, request: Request):
    _verify_internal(request)
    return await get_config(agent_id)


# ── KB processing ─────────────────────────────────────────────────────────────

class KbDocument(BaseModel):
    kbId: str
    name: str
    sourceType: str
    url: Optional[str] = None
    presignedUrl: Optional[str] = None
    originalFileName: Optional[str] = None


class KbProcessRequest(BaseModel):
    agentId: str
    organizationId: str
    documents: List[KbDocument]


@app.post("/kb/process")
async def process_kb(payload: KbProcessRequest, request: Request, response: Response):
    _verify_internal(request)
    results = await kb_handler.process_documents(payload.model_dump())
    success = all(result.get("status") == "ok" for result in results)
    if not success:
        response.status_code = 207
    return {"success": success, "processed": results}


@app.delete("/kb/{agent_id}/{kb_id}")
async def delete_kb(agent_id: str, kb_id: str, request: Request):
    _verify_internal(request)
    kb_handler.delete_kb_vectors(namespace=agent_id, kb_id=kb_id)
    return {"success": True, "agentId": agent_id, "kbId": kb_id}
