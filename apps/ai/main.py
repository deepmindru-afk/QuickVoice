from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import (
    AgentSession,
    Agent,
    JobContext,
    LanguageCode,
    TurnHandlingOptions,
    function_tool,
    inference,
    room_io,
)
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from handlers.calllog_handler import build_call_log_payload, post_call_log
from handlers.config_handler import get_config
from handlers.livekit_handler import get_transcripts, recording_path as build_recording_path, start_recording
from handlers.mcp_handler import build_mcp_tool_instructions, call_mcp_tool, parse_arguments_json
from handlers.worker_handler import (
    apply_metadata_overrides,
    build_call_context,
    parse_metadata,
    speak_first_message,
)
from utils.logger import logger
import asyncio
import json
from datetime import datetime, timezone
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

APP_DIR = Path(__file__).resolve().parent
load_dotenv(APP_DIR / ".env")

API_PORT = int(os.getenv("AI_API_PORT", "5555"))


def run_combined_server() -> int:
    commands = {
        "api": [sys.executable, str(APP_DIR / "main.py"), "api"],
        "worker": [sys.executable, str(APP_DIR / "main.py"), "start"],
    }
    processes: dict[str, subprocess.Popen] = {}
    shutting_down = False

    def stop_children() -> None:
        nonlocal shutting_down
        if shutting_down:
            return
        shutting_down = True

        for name, process in processes.items():
            if process.poll() is None:
                logger.info(f"Stopping {name} process")
                process.terminate()

        deadline = time.monotonic() + 10
        for name, process in processes.items():
            while process.poll() is None and time.monotonic() < deadline:
                time.sleep(0.2)
            if process.poll() is None:
                logger.warning(f"Killing unresponsive {name} process")
                process.kill()

    def handle_signal(signum, _frame) -> None:
        logger.info(f"Received signal {signum}; shutting down AI services")
        stop_children()

    for handled_signal in (signal.SIGINT, signal.SIGTERM):
        signal.signal(handled_signal, handle_signal)

    try:
        for name, command in commands.items():
            logger.info(f"Starting {name}: {' '.join(command)}")
            processes[name] = subprocess.Popen(command, cwd=APP_DIR)

        while True:
            for name, process in processes.items():
                return_code = process.poll()
                if return_code is not None:
                    logger.error(f"{name} process exited with code {return_code}")
                    stop_children()
                    return return_code or 1
            time.sleep(1)
    finally:
        stop_children()


class Assistant(Agent):
    def __init__(self, system_prompt: str, config: dict, call_context: dict):
        super().__init__(instructions=system_prompt)
        self._config = config
        self._call_context = call_context

    @function_tool
    async def call_mcp_tool(self, connection_id: str, tool_name: str, arguments_json: str = "{}") -> str:
        """
        Call an attached MCP tool using a connected MCP connection.

        Args:
            connection_id: The MCP connection ID from the connected tools list.
            tool_name: The exact MCP tool name to execute.
            arguments_json: A JSON object string containing the tool arguments.
        """
        arguments = parse_arguments_json(arguments_json)
        result = await call_mcp_tool(
            connection_id=connection_id,
            tool_name=tool_name,
            arguments=arguments,
            config=self._config,
            call_context=self._call_context,
        )
        return json.dumps(result.get("data", result), ensure_ascii=False)


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
    config = apply_metadata_overrides(config, metadata)
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
    system_prompt = config.get(
            "system_prompt",
            "You are a friendly, reliable voice assistant that answers questions, explains topics, and completes tasks with available tools.",
        ) + build_mcp_tool_instructions(config.get("mcp_connections") or [])
    agent = Assistant(
        system_prompt=system_prompt,
        config=config,
        call_context=call_context,
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
    if len(sys.argv) > 1 and sys.argv[1] == "serve":
        raise SystemExit(run_combined_server())

    if len(sys.argv) > 1 and sys.argv[1] == "api":
        import uvicorn

        uvicorn.run(
            "api:app",
            host=os.getenv("AI_API_HOST", "0.0.0.0"),
            port=API_PORT,
            reload=os.getenv("AI_API_RELOAD", "false").lower() == "true",
        )
        raise SystemExit(0)

    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name=os.getenv("LIVEKIT_AGENT_NAME", "QuickVoice"),
        )
    )
