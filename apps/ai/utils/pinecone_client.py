import os

from utils.logger import logger


_LOGGED_KEY_FINGERPRINTS: set[tuple[int, str, str]] = set()


def _clean_env_value(value: str) -> str:
    cleaned = value.strip()
    if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in {"'", '"'}:
        cleaned = cleaned[1:-1].strip()
    return cleaned


def pinecone_api_key() -> str:
    raw = os.environ.get("PINECONE_API_KEY")
    if raw is None:
        raise KeyError("PINECONE_API_KEY")

    key = _clean_env_value(raw)
    if not key:
        raise KeyError("PINECONE_API_KEY")
    if key.startswith("AIza"):
        raise ValueError("PINECONE_API_KEY looks like a Google API key; set a Pinecone API key instead.")

    fingerprint = (len(key), key[:6], key[-4:] if len(key) >= 4 else "")
    if fingerprint not in _LOGGED_KEY_FINGERPRINTS:
        _LOGGED_KEY_FINGERPRINTS.add(fingerprint)
        logger.info(
            "[pinecone] api key loaded {}",
            {"present": True, "length": len(key), "prefix": key[:6]},
        )
    return key


def pinecone_client():
    from pinecone import Pinecone  # type: ignore

    return Pinecone(api_key=pinecone_api_key())
