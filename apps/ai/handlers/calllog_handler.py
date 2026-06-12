import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Any
from urllib.request import Request, urlopen


def build_call_log_payload(
    *,
    config: dict[str, Any],
    call_context: dict[str, Any],
    started_at: datetime,
    ended_at: datetime,
    recording_path: str | None,
    transcripts: list[dict[str, Any]],
    status: str = "COMPLETED",
) -> dict[str, Any]:
    return {
        "organizationId": _required(config, "organization_id"),
        "userId": config.get("user_id"),
        "agentId": _required(config, "agent_id"),
        "callId": _required(call_context, "call_id"),
        "startTime": _isoformat(started_at),
        "endTime": _isoformat(ended_at),
        "direction": call_context.get("direction", "inbound"),
        "durationSeconds": max(0, int((ended_at - started_at).total_seconds())),
        "status": status,
        "metadata": {
            "summary": call_context.get("summary", ""),
            "intent": call_context.get("intent", ""),
            "outboundId": call_context.get("outbound_id"),
        },
        "recordingSid": recording_path or "",
        "transcripts": [_normalize_transcript_item(item, index) for index, item in enumerate(transcripts)],
        "toNumber": _required(call_context, "to_number"),
        "fromNumber": _required(call_context, "from_number"),
        "provider": call_context.get("provider") or config.get("provider") or "TWILIO",
        "extractedData": config.get("data_extracted") or [],
        "evaluatedData": config.get("data_evaluation") or [],
    }


async def post_call_log(
    payload: dict[str, Any],
    *,
    server_api_url: str | None = None,
    internal_api_key: str | None = None,
    post_json=None,
):
    base_url = _api_base_url(server_api_url or os.getenv("SERVER_API_URL") or "")
    api_key = internal_api_key or os.getenv("INTERNAL_API_KEY")
    if not base_url:
        raise RuntimeError("SERVER_API_URL is required to post call logs")
    if not api_key:
        raise RuntimeError("INTERNAL_API_KEY is required to post call logs")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "x-organization-id": _required(payload, "organizationId"),
    }
    user_id = payload.get("userId")
    if user_id:
        headers["x-user-id"] = user_id

    return await (post_json or _post_json)(f"{base_url}/calls", headers, payload)


def _api_base_url(server_api_url: str) -> str:
    base_url = server_api_url.rstrip("/")
    if not base_url:
        return ""
    return base_url if base_url.endswith("/api/v1") else f"{base_url}/api/v1"


def _normalize_transcript_item(item: dict[str, Any], index: int) -> dict[str, str]:
    role = item.get("role")
    if role == "assistant":
        role = "agent"
    if role not in ("user", "agent"):
        role = "agent"

    content = item.get("message", item.get("content", ""))
    if isinstance(content, list):
        content = " ".join(str(part) for part in content)

    return {
        "messageId": str(item.get("messageId") or item.get("id") or f"msg-{index}"),
        "role": role,
        "message": str(content),
        "timestamp": _isoformat(item.get("timestamp") or item.get("time") or datetime.now(timezone.utc)),
    }


def _required(source: dict[str, Any], key: str) -> str:
    value = source.get(key)
    if value is None or value == "":
        raise ValueError(f"{key} is required")
    return str(value)


def _isoformat(value: Any) -> str:
    if isinstance(value, str):
        if value.endswith("+00:00"):
            return f"{value[:-6]}Z"
        return value

    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.now(timezone.utc)

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return f"{dt.isoformat(timespec='seconds')}Z"


async def _post_json(url: str, headers: dict[str, str], body: dict[str, Any]):
    return await asyncio.to_thread(_blocking_post_json, url, headers, body)


def _blocking_post_json(url: str, headers: dict[str, str], body: dict[str, Any]):
    request = Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urlopen(request, timeout=10) as response:
        payload = response.read().decode("utf-8")
    return json.loads(payload)
