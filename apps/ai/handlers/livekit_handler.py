from utils.logger import logger, redact_sensitive
from utils.metrics import emit_metric
import os
import uuid
from typing import Any


def recording_path(recording_id):
    return f"Voice-agents/Recordings/{recording_id}.ogg"


def get_recording_storage_config():
    config = {
        "bucket": os.getenv("S3_BUCKET_NAME") or os.getenv("BUCKET") or "quickintell-rcm",
        "region": os.getenv("AWS_REGION") or os.getenv("REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-east-1",
    }
    missing = [key for key in ("bucket", "region") if not config[key]]
    if missing:
        raise RuntimeError(f"Missing recording storage env: {', '.join(missing)}")
    return config


def get_transcripts(agent):
    
    try:
        messages = agent.chat_ctx.messages
        if callable(messages):
            messages = messages()
        transcript = []
        for msg in messages:
            if getattr(msg, "role", None) in ("user", "assistant"):
                content = getattr(msg, "content", "")
                if isinstance(content, list):
                    content = " ".join(str(c) for c in content if isinstance(c, str))
                transcript.append({"role": msg.role, "content": content,"time": msg.created_at})
        logger.info("[TRANSCRIPT] collected {} messages", len(transcript))
    except Exception as e:
        logger.error("[SHUTDOWN] Transcript read failed: {}", redact_sensitive(str(e)))
        transcript = []
    return transcript

async def start_recording(ctx: Any):
    # ── Recording → S3 Storage ─────────────────────────────────────
    from livekit import api  # type: ignore

    egress_id = None
    recording_id = str(uuid.uuid4())
    rec_api = None
    try:
        storage = get_recording_storage_config()
        rec_api = api.LiveKitAPI(
            url=os.environ["LIVEKIT_URL"],
            api_key=os.environ["LIVEKIT_API_KEY"],
            api_secret=os.environ["LIVEKIT_API_SECRET"],
        )
        egress_resp = await rec_api.egress.start_room_composite_egress(
            api.RoomCompositeEgressRequest(
                room_name=ctx.room.name,
                audio_only=True,
                file_outputs=[
                    api.EncodedFileOutput(
                        file_type=api.EncodedFileType.OGG,
                        filepath=recording_path(recording_id),
                        s3=api.S3Upload(
                            bucket=storage["bucket"],
                            region=storage["region"],
                        ),
                    )
                ],
            )
        )
        egress_id = egress_resp.egress_id
        emit_metric("recording_start", status="ok", room=getattr(ctx.room, "name", ""))
        logger.info(f"[RECORDING] Started egress: {egress_id}")
        return recording_id
    except Exception as e:
        emit_metric("recording_start", status="error", room=getattr(ctx.room, "name", ""))
        logger.warning("[RECORDING] Failed to start recording: {}", redact_sensitive(str(e)))
        return None
    finally:
        if rec_api is not None:
            try:
                await rec_api.aclose()
            except Exception as close_error:
                logger.warning("[RECORDING] Failed to close LiveKit API client: {}", redact_sensitive(str(close_error)))
