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
from handlers.calllog_handler import flush_call_log_queue
from handlers.config_handler import get_config
from handlers.finalization_handler import CallFinalizer
from handlers.livekit_handler import get_transcripts, recording_path as build_recording_path, start_recording
from handlers.mcp_handler import build_mcp_tool_instructions, call_mcp_tool, parse_arguments_json
from handlers.privacy_handler import should_store_call_audio
from handlers.rag_handler import RagRetrievalError, get_rag_context
from handlers.worker_handler import (
    PREVIEW_TRANSCRIPT_TOPIC,
    apply_metadata_overrides,
    build_call_context,
    consume_preview_user_transcript_stream,
    parse_preview_user_transcript_packet,
    parse_metadata,
    speak_first_message,
)
from handlers.voice_catalog import load_voice_catalog
from handlers.voice_config_resolution import resolve_voice_config
from handlers.voice_provider_adapters import ProviderAdapterError, build_voice_provider_adapters
from handlers.voice_worker_metadata import is_voice_session_metadata, parse_voice_session_metadata
from utils.logger import logger
from utils.logger import redact_sensitive
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
DEFAULT_SYSTEM_PROMPT = (
    "You are a friendly, reliable voice assistant that answers questions, "
    "explains topics, and completes tasks with available tools."
)
RAG_TOOL_INSTRUCTIONS = (
    "\n\nKnowledge base search is available through search_knowledge_base. "
    "When a user asks about company policies, uploaded documents, FAQs, "
    "pricing, procedures, or any answer that may depend on the configured "
    "knowledge base, call search_knowledge_base with the user's question "
    "before answering. Use retrieved context as the source of truth, and say "
    "when the knowledge base does not contain the answer."
)


def build_agent_instructions(config: dict) -> str:
    instructions = config.get("system_prompt") or DEFAULT_SYSTEM_PROMPT
    if config.get("use_rag"):
        instructions += RAG_TOOL_INSTRUCTIONS
    instructions += build_mcp_tool_instructions(config.get("mcp_connections") or [])
    return instructions


def build_room_options() -> room_io.RoomOptions:
    enable_noise_cancellation = os.getenv("LIVEKIT_ENABLE_NOISE_CANCELLATION", "").lower() in {
        "1",
        "true",
        "yes",
    }
    noise_cancellation_selector = None
    if enable_noise_cancellation:
        noise_cancellation_selector = lambda params: (
            noise_cancellation.BVCTelephony()
            if params.participant.kind
            == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
            else noise_cancellation.BVC()
        )

    return room_io.RoomOptions(
        audio_input=room_io.AudioInputOptions(
            noise_cancellation=noise_cancellation_selector,
        ),
        text_output=room_io.TextOutputOptions(sync_transcription=False),
    )


def provider_section(value: str | None):
    if not value or "/" not in value:
        return None
    provider, model = value.split("/", 1)
    if provider in {"deepgram", "sarvam", "bedrock", "elevenlabs"}:
        return {"provider": provider, "model": model}
    return None


def attach_resolved_voice_config(config: dict) -> dict:
    if isinstance(config.get("voice_config"), dict):
        return config

    tts_section = provider_section(config.get("tts_model"))
    if tts_section is not None:
        tts_section = {**tts_section, "voice": config.get("voice")}
    try:
        voice_config = resolve_voice_config(
            {
                "language": str(config.get("agent_language", "en-US")).split("-", 1)[0],
                "timezone": config.get("timezone"),
                "stt": provider_section(config.get("stt_model")),
                "llm": provider_section(config.get("llm_model")),
                "tts": tts_section,
            },
            load_voice_catalog(),
        )
    except Exception:
        return config

    updated = dict(config)
    updated["voice_config"] = voice_config
    return updated


def build_session_provider_kwargs(config: dict) -> dict:
    voice_config = config.get("voice_config")
    if isinstance(voice_config, dict):
        adapters = build_voice_provider_adapters(voice_config)
        logger.info("Voice provider adapters: {}", redact_sensitive(adapters.summary))
        return {"stt": adapters.stt, "llm": adapters.llm, "tts": adapters.tts}

    return {
        "stt": inference.STT(
            model=config.get("stt_model", "deepgram/nova-3"),
            language=LanguageCode(config.get("agent_language", "en-US")),
        ),
        "llm": inference.LLM(
            model=config.get("llm_model", "google/gemini-2.5-flash"),
            provider=config.get("llm_provider", "google"),
        ),
        "tts": inference.TTS(
            model=config.get("tts_model", "deepgram/aura-2"),
            voice=config.get("voice", "aura-2-asteria-en"),
            language=LanguageCode(config.get("agent_language", "en-US")),
        ),
    }


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

    def _rag_enabled(self) -> bool:
        return bool(self._config.get("use_rag"))

    def _agent_id(self) -> str:
        return (
            self._config.get("agent_id")
            or self._call_context.get("agent_id")
            or ""
        )

    async def on_user_turn_completed(self, turn_ctx, new_message) -> None:
        if not self._rag_enabled():
            return

        agent_id = self._agent_id()
        if not agent_id:
            logger.warning("[rag] skipped retrieval because agent_id is missing")
            return

        query = new_message.text_content if hasattr(new_message, "text_content") else ""
        if callable(query):
            query = query()
        query = str(query or "").strip()
        if not query:
            return

        try:
            context = await get_rag_context(agent_id=agent_id, query=query)
        except RagRetrievalError:
            turn_ctx.add_message(
                role="system",
                content=(
                    "Knowledge base retrieval failed for the user's latest question. "
                    "Tell the user the knowledge base is temporarily unavailable and do not invent an answer."
                ),
            )
            logger.warning("[rag] injected unavailable signal for agent={}", redact_sensitive(agent_id))
            return

        if not context:
            logger.info(f"[rag] no context returned for agent={agent_id}")
            return

        turn_ctx.add_message(
            role="system",
            content=(
                "Relevant knowledge base context for the user's latest question. "
                "Use this context to answer accurately. If it does not contain the answer, "
                "say you do not have that information in the knowledge base.\n\n"
                f"{context}"
            ),
        )
        logger.info(f"[rag] injected context for agent={agent_id}")

    @function_tool
    async def search_knowledge_base(self, query: str, top_k: int = 5) -> str:
        """
        Search the configured agent knowledge base for relevant context.

        Args:
            query: The user question or the topic to search for.
            top_k: Maximum number of matching chunks to retrieve.
        """
        if not self._rag_enabled():
            return "Knowledge base search is disabled for this agent."

        agent_id = self._agent_id()
        if not agent_id:
            return "Knowledge base search is unavailable because this call has no agent_id."

        normalized_query = (query or "").strip()
        if not normalized_query:
            return "A search query is required."

        try:
            context = await get_rag_context(str(agent_id), normalized_query, top_k=top_k)
        except RagRetrievalError:
            return "Knowledge base search is temporarily unavailable. Please try again later."
        return context or "No matching knowledge base context found."

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
    logger.info("Entrypoint called with room: {}", redact_sensitive(ctx.room.name))

    await ctx.connect()
    raw_metadata = ctx.job.metadata or ""
    if is_voice_session_metadata(raw_metadata):
        voice_metadata = parse_voice_session_metadata(raw_metadata)
        metadata = voice_metadata.client_metadata
        preview_mode = voice_metadata.mode == "preview"
        call_context = build_call_context(ctx.room.name, metadata)
        if not call_context.get("agent_id") and metadata.get("agent_id"):
            call_context["agent_id"] = metadata["agent_id"]
        config = await get_config(
            call_context.get("agent_id"),
            agent_number=call_context.get("agent_number"),
            allow_default_config=True,
        )
        config = apply_metadata_overrides(config, metadata)
        config["voice_config"] = voice_metadata.config
        config["agent_language"] = voice_metadata.config["language"]
    else:
        metadata = parse_metadata(raw_metadata)
        preview_mode = False
        try:
            participant = await asyncio.wait_for(ctx.wait_for_participant(), timeout=10)
            participant_attributes = getattr(participant, "attributes", {}) or {}
            metadata.update(participant_attributes)
        except asyncio.TimeoutError:
            logger.warning("Timed out waiting for room participant before loading config")
        except RuntimeError as error:
            logger.warning(f"Could not read room participant before loading config: {error}")

        call_context = build_call_context(ctx.room.name, metadata)
        logger.info("Call context: {}", redact_sensitive(call_context))

        config = await get_config(
            call_context.get("agent_id"),
            agent_number=call_context.get("agent_number"),
        )
        config = apply_metadata_overrides(config, metadata)
        config = attach_resolved_voice_config(config)
    logger.info("Config loaded for agent: {}", redact_sensitive(config.get("agent_id")))

    try:
        await flush_call_log_queue()
    except Exception as error:
        logger.warning("[CALL_LOG] queued delivery retry failed: {}", redact_sensitive(str(error)))

    if not call_context.get("agent_id") and config.get("agent_id"):
        call_context["agent_id"] = config["agent_id"]
    if not call_context.get("provider") and config.get("provider"):
        call_context["provider"] = config["provider"]

    try:
        provider_kwargs = build_session_provider_kwargs(config)
    except ProviderAdapterError as error:
        logger.error("Voice provider adapter error: {}", redact_sensitive(str(error)))
        ctx.shutdown(reason=f"provider adapter error: {error}")
        return

    session = AgentSession(
        **provider_kwargs,
        vad=silero.VAD.load(),
        turn_handling=TurnHandlingOptions(turn_detection=MultilingualModel()),
        preemptive_generation=config.get("preemptive_generation", True),
    )
    system_prompt = build_agent_instructions(config)
    agent = Assistant(
        system_prompt=system_prompt,
        config=config,
        call_context=call_context,
    )

    @ctx.room.on("data_received")
    def on_data_received(data_packet):
        participant = getattr(data_packet, "participant", None)
        text = parse_preview_user_transcript_packet(
            getattr(data_packet, "data", b""),
            topic=getattr(data_packet, "topic", None),
            participant_identity=getattr(participant, "identity", None),
            preview_mode=preview_mode,
        )
        if not text:
            return

        logger.info(
            "[preview] received browser transcript from {}",
            redact_sensitive(getattr(participant, "identity", "")),
        )
        session.generate_reply(user_input=text, allow_interruptions=True)

    def on_preview_text_stream(reader, participant_identity):
        asyncio.create_task(
            consume_preview_user_transcript_stream(
                reader,
                participant_identity=participant_identity,
                preview_mode=preview_mode,
                generate_reply=lambda text: session.generate_reply(
                    user_input=text,
                    allow_interruptions=True,
                ),
            )
        )

    if hasattr(ctx.room, "register_text_stream_handler"):
        ctx.room.register_text_stream_handler(
            PREVIEW_TRANSCRIPT_TOPIC,
            on_preview_text_stream,
        )

    await session.start(
        room=ctx.room,
        agent=agent,
        room_options=build_room_options(),
    )
    speak_first_message(session, config)

    call_start_time = datetime.now(timezone.utc)
    recording_id = None
    if should_store_call_audio(config):
        recording_id = await start_recording(ctx)
    else:
        logger.info("[RECORDING] skipped by agent privacy controls")
    recording_path = build_recording_path(recording_id) if recording_id else None
    shutdown_started = False

    call_finalizer = CallFinalizer(
        config=config,
        call_context=call_context,
        started_at=call_start_time,
        recording_path=recording_path,
        transcript_reader=lambda: get_transcripts(agent),
    )

    async def unified_shutdown_hook():
        try:
            await call_finalizer.finalize()
        except Exception as error:
            logger.error("[CALL_LOG] Failed to finalize completed call: {}", redact_sensitive(str(error)))

    if hasattr(ctx, "add_shutdown_callback"):
        ctx.add_shutdown_callback(unified_shutdown_hook)

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant):
        nonlocal shutdown_started
        logger.info("[HANGUP] Participant disconnected: {}", redact_sensitive(getattr(participant, "identity", "")))
        if shutdown_started:
            return
        shutdown_started = True
        asyncio.create_task(unified_shutdown_hook())


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
