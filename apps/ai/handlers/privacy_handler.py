from typing import Any


def should_store_call_audio(config: dict[str, Any]) -> bool:
    if bool(config.get("zero_pii_retention")):
        return False
    return bool(config.get("store_call_audio", True))
