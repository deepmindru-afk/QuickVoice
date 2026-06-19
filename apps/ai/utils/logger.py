import copy
import logging
import os
import re
import sys


PHONE_RE = re.compile(r"(?<![\w-])\+?\d[\d\s().-]{7,}\d(?![\w-])")
SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
SENSITIVE_KEY_PARTS = (
    "authorization",
    "api_key",
    "apikey",
    "secret",
    "token",
    "password",
    "system_prompt",
    "prompt",
    "transcript",
    "message",
    "content",
    "variables",
    "webhook",
)


def redact_sensitive(value):
    return _redact(copy.deepcopy(value), parent_key="")


def _redact(value, *, parent_key: str):
    if _is_sensitive_key(parent_key):
        return "[REDACTED]"

    if isinstance(value, dict):
        return {key: _redact(item, parent_key=str(key)) for key, item in value.items()}

    if isinstance(value, list):
        return [_redact(item, parent_key=parent_key) for item in value]

    if isinstance(value, str):
        value = SSN_RE.sub("[REDACTED_SSN]", value)
        return PHONE_RE.sub("[REDACTED_PHONE]", value)

    return value


def _is_sensitive_key(key: str) -> bool:
    normalized = key.lower().replace("-", "_")
    return any(part in normalized for part in SENSITIVE_KEY_PARTS)


class _StdlibLogger:
    def __init__(self):
        self._logger = logging.getLogger("quickvoice.ai")
        if not self._logger.handlers:
            handler = logging.StreamHandler(sys.stderr)
            handler.setFormatter(
                logging.Formatter(
                    "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
                )
            )
            self._logger.addHandler(handler)
        self._logger.setLevel(logging.INFO)

    def debug(self, message, *args, **kwargs):
        self._log(logging.DEBUG, message, *args, **kwargs)

    def info(self, message, *args, **kwargs):
        self._log(logging.INFO, message, *args, **kwargs)

    def warning(self, message, *args, **kwargs):
        self._log(logging.WARNING, message, *args, **kwargs)

    def error(self, message, *args, **kwargs):
        self._log(logging.ERROR, message, *args, **kwargs)

    def exception(self, message, *args, **kwargs):
        self._log(logging.ERROR, message, *args, exc_info=True, **kwargs)

    def _log(self, level, message, *args, **kwargs):
        if args:
            try:
                message = str(message).format(*args)
            except Exception:
                message = f"{message} {args}"
        self._logger.log(level, message, **kwargs)


def _build_logger():
    try:
        from loguru import logger as loguru_logger  # type: ignore
    except Exception:
        return _StdlibLogger()

    loguru_logger.remove()
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    diagnose = os.getenv("AI_LOG_DIAGNOSE", "").lower() in {"1", "true", "yes", "on"}
    loguru_logger.add(
        sys.stderr,
        level=os.getenv("AI_LOG_LEVEL", "INFO"),
        format=log_format,
        colorize=True,
        backtrace=False,
        diagnose=diagnose,
    )
    return loguru_logger


logger = _build_logger()
