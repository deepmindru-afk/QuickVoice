import asyncio
import json
import os
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen

from loguru import logger


DEFAULT_CONFIG = {
    "agent_id": None,
    "organization_id": None,
    "user_id": None,
    "agent_number": None,
    "provider": "TWILIO",
    "first_message": "Hello, how can I help you today?",
    "system_prompt": "You are a friendly, reliable voice assistant that answers questions, explains topics, and completes tasks with available tools.",
    "agent_language": "en-US",
    "llm_model": "google/gemini-2.5-flash",
    "llm_provider": "google",
    "stt_model": "deepgram/nova-3",
    "tts_model": "deepgram/aura-2",
    "use_rag": False,
    "voice": "aura-2-asteria-en",
    "data_needed": [],
    "data_evaluation": [],
    "data_extracted": [],
    "tools": [],
    "initiation_webhook": None,
    "post_call_webhook": None,
    "variables": None,
    "preemptive_generation": True,
    "timezone": "UTC",
}


async def get_config(
    agent_id: str | None,
    *,
    agent_number: str | None = None,
    server_api_url: str | None = None,
    internal_api_key: str | None = None,
    get_json=None,
):
    base_url = (server_api_url or os.getenv("SERVER_API_URL") or "").rstrip("/")
    api_key = internal_api_key or os.getenv("INTERNAL_API_KEY")

    if base_url and api_key and agent_number:
        encoded_agent_number = quote(agent_number or "", safe="")
        api_base_url = base_url if base_url.endswith("/api/v1") else f"{base_url}/api/v1"
        url = f"{api_base_url}/agents/number-config/{encoded_agent_number}"
        headers = {"Authorization": f"Bearer {api_key}"}
        response = await (get_json or _get_json)(url, headers)
        logger.info("Payload: {}", response.get("data"))
        return normalize_config(response.get("data", response))

    config = dict(DEFAULT_CONFIG)
    config["agent_id"] = agent_id
    config["agent_number"] = agent_number
    return normalize_config(config)


def normalize_config(raw: dict[str, Any]) -> dict[str, Any]:
    llm = _normalize_llm_model(_pick(raw, "llmModel", "llm_model") or DEFAULT_CONFIG["llm_model"])
    stt = _normalize_stt_model(_pick(raw, "sttModel", "stt_model") or DEFAULT_CONFIG["stt_model"])
    tts = _normalize_tts_model(_pick(raw, "ttsModel", "tts_model") or DEFAULT_CONFIG["tts_model"])
    voice = _normalize_tts_voice(tts, _pick(raw, "voiceId", "voice") or DEFAULT_CONFIG["voice"])

    config = dict(DEFAULT_CONFIG)
    config.update(
        {
            "agent_id": _pick(raw, "agentId", "agent_id"),
            "organization_id": _pick(raw, "organizationId", "organization_id"),
            "user_id": _pick(raw, "userId", "user_id"),
            "agent_number": _pick(raw, "agentNumber", "agent_number"),
            "provider": _pick(raw, "provider") or DEFAULT_CONFIG["provider"],
            "first_message": _pick(raw, "firstMessage", "first_message") or DEFAULT_CONFIG["first_message"],
            "system_prompt": _pick(raw, "systemPrompt", "system_prompt") or DEFAULT_CONFIG["system_prompt"],
            "agent_language": _normalize_language(_pick(raw, "agent_language") or DEFAULT_CONFIG["agent_language"]),
            "llm_model": llm["model"],
            "llm_provider": _pick(raw, "llmProvider", "llm_provider") or llm["provider"],
            "stt_model": stt,
            "tts_model": tts,
            "voice": voice,
            "use_rag": bool(_pick(raw, "use_rag") or False),
            "data_needed": _pick(raw, "data_needed") or [],
            "data_evaluation": _pick(raw, "data_evaluation") or [],
            "initiation_webhook": _pick(raw, "initiation_webhook"),
            "post_call_webhook": _pick(raw, "post_call_webhook"),
            "variables": _pick(raw, "variables"),
            "preemptive_generation": bool(_pick(raw, "preemptive_generation") or False),
            "timezone": _pick(raw, "timezone") or DEFAULT_CONFIG["timezone"],
        }
    )
    return config


def _pick(source: dict[str, Any], *keys: str):
    for key in keys:
        if key in source and source[key] is not None:
            return source[key]
    return None


def _normalize_llm_model(model: str) -> dict[str, str]:
    value = model.strip()
    if "/" in value:
        provider = value.split("/", 1)[0].lower()
        return {"model": value, "provider": provider}

    provider = _infer_llm_provider(value)
    return {"model": f"{provider}/{value}", "provider": provider}


def _infer_llm_provider(model: str) -> str:
    lower = model.lower()
    if lower.startswith("gemini"):
        return "google"
    if lower.startswith("claude"):
        return "anthropic"
    return "openai"


def _normalize_tts_model(model: str) -> str:
    value = model.strip()
    if "/" in value:
        return value

    provider = _infer_tts_provider(value)
    return f"{provider}/{value}"


def _infer_tts_provider(model: str) -> str:
    lower = model.lower()
    if lower.startswith("eleven"):
        return "elevenlabs"
    if lower.startswith("sonic"):
        return "cartesia"
    if lower.startswith("gpt-"):
        return "openai"
    if lower.startswith("rime-"):
        return "rime"
    return "deepgram"


def _normalize_tts_voice(tts_model: str, voice: str) -> str:
    value = voice.strip()
    provider = _tts_provider_from_model(tts_model)
    if provider != "deepgram":
        return value

    voice_id = value.rsplit("/", 1)[-1]
    lower = voice_id.lower()
    if lower.startswith("aura-2-") and lower.endswith("-en"):
        return voice_id[len("aura-2-") : -len("-en")]
    if lower.startswith("aura-2-"):
        return voice_id[len("aura-2-") :]
    return voice_id


def _tts_provider_from_model(model: str) -> str:
    if "/" in model:
        return model.split("/", 1)[0].lower()
    return _infer_tts_provider(model)


def _normalize_stt_model(model: str) -> str:
    value = model.strip()
    if "/" in value:
        return value

    provider = _infer_stt_provider(value)
    return f"{provider}/{value}"


def _infer_stt_provider(model: str) -> str:
    lower = model.lower()
    if lower.startswith("universal"):
        return "assemblyai"
    if lower.startswith("gladia"):
        return "gladia"
    if lower.startswith("speechmatics"):
        return "speechmatics"
    if lower.startswith("elevenlabs"):
        return "elevenlabs"
    return "deepgram"


def _normalize_language(language: str) -> str:
    value = language.strip()
    if "-" in value:
        return value
    return {
        "en": "en-US",
        "es": "es-ES",
        "fr": "fr-FR",
        "de": "de-DE",
        "hi": "hi-IN",
        "pt": "pt-BR",
    }.get(value.lower(), value)


async def _get_json(url: str, headers: dict[str, str]):
    return await asyncio.to_thread(_blocking_get_json, url, headers)


def _blocking_get_json(url: str, headers: dict[str, str]):
    request = Request(url, headers=headers, method="GET")
    with urlopen(request, timeout=10) as response:
        body = response.read().decode("utf-8")
    return json.loads(body)
