from livekit import api
from utils.logger import logger
import os
from livekit.agents import JobContext
import uuid


def recording_path(recording_id):
    return f"Voice-agents/Recordings/{recording_id}.ogg"


def get_recording_storage_config():
    config = {
        "access_key": os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("ACCESS_KEY"),
        "secret": os.getenv("AWS_SECRET_ACCESS_KEY") or os.getenv("SECRET_ACCESS_KEY"),
        "session_token": os.getenv("AWS_SESSION_TOKEN"),
        "bucket": os.getenv("S3_BUCKET_NAME") or os.getenv("BUCKET") or "quickintell-rcm",
        "region": os.getenv("AWS_REGION") or os.getenv("REGION") or "us-east-1",
    }
    missing = [key for key in ("access_key", "secret", "bucket", "region") if not config[key]]
    if missing:
        raise RuntimeError(f"Missing recording storage env: {', '.join(missing)}")
    return config


def get_transcripts(agent):
    
    try:
        messages = agent.chat_ctx.messages
        logger.info(f"Messages: {messages}")
        if callable(messages):
            messages = messages()
        transcript = []
        logger.info(f"Messages: {messages}")
        for msg in messages:
            if getattr(msg, "role", None) in ("user", "assistant"):
                content = getattr(msg, "content", "")
                if isinstance(content, list):
                    content = " ".join(str(c) for c in content if isinstance(c, str))
                transcript.append({"role": msg.role, "content": content,"time": msg.created_at})
        logger.info(f"Transcript: {transcript}")
    except Exception as e:
        logger.error(f"[SHUTDOWN] Transcript read failed: {e}")
        transcript = []
    return transcript

async def start_recording(ctx: JobContext):
    # ── Recording → S3 Storage ─────────────────────────────────────
    egress_id = None
    recording_id = str(uuid.uuid4())
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
                            access_key=storage["access_key"],
                            secret=storage["secret"],
                            session_token=storage.get("session_token"),
                            bucket=storage["bucket"],
                            region=storage["region"],
                        ),
                    )
                ],
            )
        )
        egress_id = egress_resp.egress_id
        await rec_api.aclose()
        logger.info(f"[RECORDING] Started egress: {egress_id}")
        return recording_id
    except Exception as e:
        logger.warning(f"[RECORDING] Failed to start recording: {e}")
        return None