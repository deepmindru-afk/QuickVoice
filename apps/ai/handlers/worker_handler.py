import json
from collections.abc import Callable
from typing import Any
from utils.logger import logger

PREVIEW_TRANSCRIPT_TOPIC = "quickvoice.preview.transcript"
PREVIEW_TRANSCRIPT_TYPE = "preview_user_transcript"

ROUTING_METADATA_KEYS = {
    "agent_id",
    "agentId",
    "agent_number",
    "agentNumber",
    "agent_language",
    "agentLanguage",
    "call_id",
    "callId",
    "callDirection",
    "direction",
    "dynamic_variables",
    "dynamicVariables",
    "first_message",
    "firstMessage",
    "from_number",
    "fromNumber",
    "language",
    "outbound_id",
    "outboundId",
    "phoneNumber",
    "provider",
    "sip.callID",
    "sip.phoneNumber",
    "sip.trunkPhoneNumber",
    "sip_call_id",
    "sip_phone_number",
    "sip_trunk_phone_number",
    "system_prompt",
    "systemPrompt",
    "to_number",
    "toNumber",
    "trunkPhoneNumber",
    "user_number",
    "userNumber",
    "voice_id",
    "voiceId",
}

def parse_metadata(metadata: str | None) -> dict[str, Any]:
    if not metadata:
        return {}
    try:
        parsed = json.loads(metadata)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def build_call_context(room_name: str, metadata: dict[str, Any]) -> dict[str, Any]:
    room_agent_number, room_user_number = _numbers_from_room(room_name)
    direction = _pick(metadata, "direction", "callDirection") or "inbound"

    if direction == "outbound":
        agent_number = _pick(metadata, "agent_number", "agentNumber", "from_number", "fromNumber") or room_agent_number
        user_number = _pick(metadata, "user_number", "userNumber", "to_number", "toNumber") or room_user_number
        from_number = agent_number
        to_number = user_number
    else:
        agent_number = _pick(
            metadata,
            "agent_number",
            "agentNumber",
            "to_number",
            "toNumber",
            "sip.trunkPhoneNumber",
            "sip_trunk_phone_number",
            "trunkPhoneNumber",
        ) or room_agent_number
        user_number = _pick(
            metadata,
            "user_number",
            "userNumber",
            "from_number",
            "fromNumber",
            "sip.phoneNumber",
            "sip_phone_number",
            "phoneNumber",
        ) or room_user_number
        from_number = user_number
        to_number = agent_number

    return {
        "call_id": _pick(metadata, "call_id", "callId", "sip.callID", "sip_call_id") or room_name,
        "agent_id": _pick(metadata, "agent_id", "agentId"),
        "agent_number": agent_number,
        "user_number": user_number,
        "direction": direction,
        "from_number": from_number,
        "to_number": to_number,
        "outbound_id": _pick(metadata, "outbound_id", "outboundId"),
        "provider": _pick(metadata, "provider"),
        "metadata": _metadata_extras(metadata),
    }


def apply_metadata_overrides(config: dict[str, Any], metadata: dict[str, Any]) -> dict[str, Any]:
    updated = dict(config)
    mode = _pick(metadata, "mode")
    direction = _pick(metadata, "direction", "callDirection")
    if direction != "outbound" and mode != "preview":
        return updated

    first_message = _pick(metadata, "first_message", "firstMessage")
    system_prompt = _pick(metadata, "system_prompt", "systemPrompt")
    language = _pick(metadata, "language", "agent_language", "agentLanguage")
    voice_id = _pick(metadata, "voice_id", "voiceId")
    dynamic_variables = _pick(metadata, "dynamic_variables", "dynamicVariables")
    if first_message:
        updated["first_message"] = first_message
    if system_prompt:
        updated["system_prompt"] = system_prompt
    if language:
        updated["agent_language"] = language
    if voice_id:
        updated["voice"] = voice_id
    if isinstance(dynamic_variables, dict):
        updated["first_message"] = render_dynamic_variables(
            str(updated.get("first_message") or ""),
            dynamic_variables,
        )
        updated["system_prompt"] = render_dynamic_variables(
            str(updated.get("system_prompt") or ""),
            dynamic_variables,
        )
    return updated


def render_dynamic_variables(template: str, variables: dict[str, Any]) -> str:
    rendered = template
    for key, value in variables.items():
        rendered = rendered.replace("{{" + str(key) + "}}", str(value))
    return rendered


def speak_first_message(session: Any, config: dict[str, Any]):
    first_message = (config.get("first_message") or "").strip()
    if not first_message:
        return None
    return session.say(first_message, allow_interruptions=True)


def parse_preview_user_transcript_packet(
    data: bytes | str,
    *,
    topic: str | None,
    participant_identity: str | None,
    preview_mode: bool,
) -> str | None:
    if not preview_mode:
        return None
    if topic != PREVIEW_TRANSCRIPT_TOPIC:
        return None
    if not participant_identity or not participant_identity.startswith("preview-user-"):
        return None

    try:
        raw = data.decode("utf-8") if isinstance(data, bytes) else data
        payload = json.loads(raw)
    except Exception:
        return None
    if not isinstance(payload, dict):
        return None
    if payload.get("type") != PREVIEW_TRANSCRIPT_TYPE:
        return None

    text = payload.get("text")
    if not isinstance(text, str):
        return None
    text = text.strip()
    return text or None


async def consume_preview_user_transcript_stream(
    reader: Any,
    *,
    participant_identity: str | None,
    preview_mode: bool,
    generate_reply: Callable[[str], Any],
) -> str | None:
    topic = getattr(getattr(reader, "info", None), "topic", PREVIEW_TRANSCRIPT_TOPIC)
    text = parse_preview_user_transcript_packet(
        await reader.read_all(),
        topic=topic,
        participant_identity=participant_identity,
        preview_mode=preview_mode,
    )
    if not text:
        return None

    logger.info("[preview] received browser transcript from text stream")
    generate_reply(text)
    return text


def _metadata_extras(metadata: dict[str, Any]) -> dict[str, Any]:
    extras: dict[str, Any] = {}
    for key, value in metadata.items():
        if key in ROUTING_METADATA_KEYS or key.startswith("sip."):
            continue
        if value in (None, ""):
            continue
        extras[key] = value
    return extras


def _numbers_from_room(room_name: str):
    parts = room_name.split("_", 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return None, None


def _pick(source: dict[str, Any], *keys: str):
    for key in keys:
        value = source.get(key)
        if value not in (None, ""):
            return value
    return None
