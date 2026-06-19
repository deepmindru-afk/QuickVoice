import hmac
import os
from collections.abc import Mapping


DEV_MODE_ENV = "AI_ALLOW_INSECURE_DEV_MODE"
TRUTHY = {"1", "true", "yes", "on"}


def is_explicit_dev_mode(environ: Mapping[str, str] | None = None) -> bool:
    env = environ or os.environ
    return str(env.get(DEV_MODE_ENV, "")).strip().lower() in TRUTHY


def verify_internal_headers(
    headers: Mapping[str, str],
    *,
    internal_api_key: str | None = None,
    allow_dev: bool | None = None,
) -> None:
    key = internal_api_key if internal_api_key is not None else os.getenv("INTERNAL_API_KEY", "")
    dev_allowed = is_explicit_dev_mode() if allow_dev is None else allow_dev
    if not key:
        if dev_allowed:
            return
        raise RuntimeError("INTERNAL_API_KEY is required for internal AI routes")

    supplied = _header(headers, "x-internal-key")
    authorization = _header(headers, "authorization")
    if not supplied and authorization.lower().startswith("bearer "):
        supplied = authorization[7:].strip()

    if not supplied or not hmac.compare_digest(str(supplied), str(key)):
        raise PermissionError("Unauthorized")


def _header(headers: Mapping[str, str], name: str) -> str:
    if name in headers:
        return str(headers[name])
    lower_name = name.lower()
    for key, value in headers.items():
        if str(key).lower() == lower_name:
            return str(value)
    return ""
