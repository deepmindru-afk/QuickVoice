import json
from typing import Any


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
    direction = metadata.get("direction") or "inbound"

    if direction == "outbound":
        agent_number = metadata.get("from_number") or room_agent_number
        user_number = metadata.get("to_number") or room_user_number
        from_number = agent_number
        to_number = user_number
    else:
        agent_number = metadata.get("agent_number") or metadata.get("to_number") or room_agent_number
        user_number = metadata.get("user_number") or metadata.get("from_number") or room_user_number
        from_number = user_number
        to_number = agent_number

    return {
        "call_id": metadata.get("call_id") or room_name,
        "agent_id": metadata.get("agent_id"),
        "agent_number": agent_number,
        "user_number": user_number,
        "direction": direction,
        "from_number": from_number,
        "to_number": to_number,
        "outbound_id": metadata.get("outbound_id"),
        "provider": metadata.get("provider"),
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
