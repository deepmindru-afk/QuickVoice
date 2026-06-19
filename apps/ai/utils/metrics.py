from typing import Any

from utils.logger import logger, redact_sensitive


def emit_metric(name: str, **fields: Any) -> None:
    payload = {"metric": name, **fields}
    logger.info("[metric] {}", redact_sensitive(payload))
