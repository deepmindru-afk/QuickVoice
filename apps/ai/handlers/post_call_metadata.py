from __future__ import annotations

import re
from typing import Any


MAX_VALUE_LENGTH = 180
MAX_SUMMARY_LENGTH = 260


def derive_metadata_from_transcripts(transcripts: list[dict[str, Any]]) -> dict[str, str]:
    turns = _normalized_turns(transcripts)
    user_messages = [turn["message"] for turn in turns if turn["role"] == "user"]
    if not user_messages:
        return {}

    username = _extract_username(user_messages)
    reason = _extract_reason(user_messages)
    intent = _clean_value(reason or _first_meaningful(user_messages), max_length=MAX_VALUE_LENGTH)
    summary = _build_summary(user_messages)

    metadata: dict[str, str] = {}
    if summary:
        metadata["summary"] = summary
    if intent:
        metadata["intent"] = intent
    if reason:
        metadata["reason"] = reason
    if username:
        metadata["username"] = username
    return metadata


def merge_transcript_metadata(
    base_metadata: dict[str, Any],
    transcripts: list[dict[str, Any]],
) -> dict[str, Any]:
    derived = derive_metadata_from_transcripts(transcripts)
    metadata = dict(base_metadata)
    for key, value in derived.items():
        if metadata.get(key) in (None, ""):
            metadata[key] = value
    return metadata


def build_transcript_extracted_data(
    config: dict[str, Any],
    transcripts: list[dict[str, Any]],
    metadata: dict[str, Any],
) -> list[dict[str, Any]]:
    extracted = [
        dict(item)
        for item in _objects(config.get("data_extracted"))
        if isinstance(item, dict)
    ]
    existing_names = {
        str(item.get("name") or "").strip().lower()
        for item in extracted
        if str(item.get("name") or "").strip()
    }
    transcript_text = "\n".join(
        turn["message"] for turn in _normalized_turns(transcripts)
    )

    for target in _objects(config.get("data_needed")):
        name = str(target.get("name") or target.get("id") or "").strip()
        if not name or name.lower() in existing_names:
            continue
        value = _value_for_target(target, transcript_text, metadata)
        if value in (None, ""):
            continue
        extracted.append(
            {
                "type": str(target.get("type") or "text"),
                "name": name,
                "description": str(target.get("description") or ""),
                "value": value,
            }
        )
        existing_names.add(name.lower())

    return extracted


def _value_for_target(
    target: dict[str, Any],
    transcript_text: str,
    metadata: dict[str, Any],
) -> Any:
    key = " ".join(
        str(value or "")
        for value in (
            target.get("id"),
            target.get("name"),
            target.get("description"),
        )
    ).lower()

    if any(token in key for token in ("username", "user name", "caller name", "customer name", "name")):
        return metadata.get("username")
    if any(token in key for token in ("reason", "purpose", "issue", "problem")):
        return metadata.get("reason") or metadata.get("intent")
    if any(token in key for token in ("intent", "intention")):
        return metadata.get("intent")
    if "email" in key:
        match = re.search(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b", transcript_text)
        return match.group(0) if match else None
    if "phone" in key or "number" in key:
        match = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", transcript_text)
        return _clean_value(match.group(0), max_length=40) if match else None

    label = re.escape(str(target.get("name") or target.get("id") or "").strip())
    if not label:
        return None
    generic = re.search(
        rf"\b{label}\b\s*(?:is|:|-)\s*([^.\n?!]{{2,120}})",
        transcript_text,
        flags=re.IGNORECASE,
    )
    return _clean_value(generic.group(1)) if generic else None


def _normalized_turns(transcripts: list[dict[str, Any]]) -> list[dict[str, str]]:
    turns: list[dict[str, str]] = []
    for item in transcripts:
        role = str(item.get("role") or "").strip().lower()
        if role == "assistant":
            role = "agent"
        if role not in {"user", "agent"}:
            continue

        message = item.get("message", item.get("content", ""))
        if isinstance(message, list):
            message = " ".join(str(part) for part in message)
        message = str(message or "").strip()
        if message:
            turns.append({"role": role, "message": message})
    return turns


def _extract_username(user_messages: list[str]) -> str | None:
    patterns = (
        r"\bmy name is\s+([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,3})",
        r"\bthis is\s+([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,3})",
        r"\bi am\s+([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,3})",
        r"\bi'm\s+([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,3})",
        r"\bname(?:'s| is)\s+([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,3})",
    )
    for message in user_messages:
        for pattern in patterns:
            match = re.search(pattern, message, flags=re.IGNORECASE)
            if match:
                return _clean_name(match.group(1))
    return None


def _extract_reason(user_messages: list[str]) -> str | None:
    patterns = (
        r"\b(?:i am|i'm)?\s*calling\s+(?:because|about|regarding|for|to)\s+([^.\n?!]{3,160})",
        r"\bi\s+(?:need|want|would like|am looking)\s+to\s+([^.\n?!]{3,160})",
        r"\bi\s+(?:need|want|would like|am looking for)\s+([^.\n?!]{3,160})",
        r"\bthe reason(?: for my call)? is\s+([^.\n?!]{3,160})",
    )
    for message in user_messages:
        for pattern in patterns:
            match = re.search(pattern, message, flags=re.IGNORECASE)
            if match:
                return _clean_value(match.group(1))
    return None


def _build_summary(user_messages: list[str]) -> str:
    meaningful = [_clean_value(message, max_length=120) for message in user_messages]
    meaningful = [message for message in meaningful if message]
    if not meaningful:
        return ""
    if len(meaningful) == 1:
        return f"Caller said: {meaningful[0]}"
    return _clean_value(
        f"Caller discussed: {meaningful[0]}; {meaningful[1]}",
        max_length=MAX_SUMMARY_LENGTH,
    )


def _first_meaningful(messages: list[str]) -> str:
    for message in messages:
        value = _clean_value(message)
        if value:
            return value
    return ""


def _clean_name(value: str | None) -> str | None:
    cleaned = _clean_value(value, max_length=80)
    if not cleaned:
        return None
    cleaned = re.split(r"[.?!]", cleaned, maxsplit=1)[0]
    cleaned = re.split(r"\b(?:and|calling|from|because|about|regarding|for|to)\b", cleaned, maxsplit=1, flags=re.IGNORECASE)[0]
    cleaned = cleaned.strip(" ,.-")
    return cleaned or None


def _clean_value(value: Any, *, max_length: int = MAX_VALUE_LENGTH) -> str:
    cleaned = re.sub(r"\s+", " ", str(value or "")).strip(" ,.-")
    if len(cleaned) <= max_length:
        return cleaned
    return cleaned[: max_length - 1].rstrip() + "..."


def _objects(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]
