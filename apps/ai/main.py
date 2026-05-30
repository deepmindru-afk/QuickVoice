from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import (
    AgentSession,
    Agent,
    JobContext,
    LanguageCode,
    TurnHandlingOptions,
    inference,
    room_io,
)
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from handlers.calllog_handler import build_call_log_payload, post_call_log
from handlers.config_handler import get_config
from handlers.livekit_handler import get_transcripts, recording_path as build_recording_path, start_recording
from handlers.worker_handler import build_call_context, parse_metadata, speak_first_message
from utils.logger import logger
import asyncio
from datetime import datetime, timezone
import os
import sys

load_dotenv(".env")


class Assistant(Agent):
    def __init__(self, system_prompt: str):
        super().__init__(instructions=system_prompt)


async def entrypoint(ctx: JobContext):
    logger.info(f"Entrypoint called with room: {ctx.room.name}")

    await ctx.connect()
    metadata = parse_metadata(ctx.job.metadata or "")
    try:
        participant = await asyncio.wait_for(ctx.wait_for_participant(), timeout=10)
        participant_attributes = getattr(participant, "attributes", {}) or {}
        metadata.update(participant_attributes)
    except asyncio.TimeoutError:
        logger.warning("Timed out waiting for room participant before loading config")
    except RuntimeError as error:
        logger.warning(f"Could not read room participant before loading config: {error}")

    call_context = build_call_context(ctx.room.name, metadata)
    logger.info(f"Call context: {call_context}")

    config = await get_config(
        call_context.get("agent_id"),
        agent_number=call_context.get("agent_number"),
    )
    logger.info(f"Config loaded for agent: {config.get('agent_id')}")

    if not call_context.get("agent_id") and config.get("agent_id"):
        call_context["agent_id"] = config["agent_id"]
    if not call_context.get("provider") and config.get("provider"):
        call_context["provider"] = config["provider"]

    session = AgentSession(
        stt=inference.STT(
            model=config.get("stt_model", "deepgram/nova-3"),
            language=LanguageCode(config.get("agent_language", "en-US")),
        ),
        llm=inference.LLM(
            model=config.get("llm_model", "google/gemini-2.5-flash"),
            provider=config.get("llm_provider", "google"),
        ),
        tts=inference.TTS(
            model=config.get("tts_model", "deepgram/aura-2"),
            voice=config.get("voice", "aura-2-asteria-en"),
            language=LanguageCode(config.get("agent_language", "en-US")),
        ),
        vad=silero.VAD.load(),
        turn_handling=TurnHandlingOptions(turn_detection=MultilingualModel()),
        preemptive_generation=config.get("preemptive_generation", True),
    )
    agent = Assistant(
        system_prompt=config.get(
            "system_prompt",
            "You are a friendly, reliable voice assistant that answers questions, explains topics, and completes tasks with available tools.",
        )
    )
    await session.start(
        room=ctx.room,
        agent=agent,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )
    speak_first_message(session, config)

    call_start_time = datetime.now(timezone.utc)
    recording_id = await start_recording(ctx)
    recording_path = build_recording_path(recording_id) if recording_id else None
    shutdown_started = False

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant):
        nonlocal shutdown_started
        logger.info(f"[HANGUP] Participant disconnected: {participant.identity}")
        if shutdown_started:
            return
        shutdown_started = True
        asyncio.create_task(unified_shutdown_hook())

    async def unified_shutdown_hook():
        ended_at = datetime.now(timezone.utc)
        duration = ended_at - call_start_time
        logger.info(f"Call duration: {duration}")
        transcript = get_transcripts(agent)
        logger.info(f"Transcript messages: {len(transcript)}")
        logger.info(f"Recording path: {recording_path}")

        try:
            payload = build_call_log_payload(
                config=config,
                call_context=call_context,
                started_at=call_start_time,
                ended_at=ended_at,
                recording_path=recording_path,
                transcripts=transcript,
            )
            await post_call_log(payload)
            logger.info(f"Call log posted: {payload['callId']}")
        except Exception as error:
            logger.error(f"[CALL_LOG] Failed to post completed call: {error}")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "api":
        import uvicorn

        uvicorn.run(
            "api:app",
            host=os.getenv("AI_API_HOST", "0.0.0.0"),
            port=int(os.getenv("AI_API_PORT", "8000")),
            reload=os.getenv("AI_API_RELOAD", "false").lower() == "true",
        )
        raise SystemExit(0)

    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name=os.getenv("LIVEKIT_AGENT_NAME", "QuickVoice"),
        )
    )
