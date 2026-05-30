import json
from typing import Any
from utils.logger import logger

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
    }


def speak_first_message(session: Any, config: dict[str, Any]):
    first_message = (config.get("first_message") or "").strip()
    if not first_message:
        return None
    return session.say(first_message, allow_interruptions=True)


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
