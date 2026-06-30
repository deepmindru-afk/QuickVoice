import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.worker_handler import apply_metadata_overrides, build_call_context, parse_metadata, speak_first_message
from main import attach_resolved_voice_config, build_session_provider_kwargs, provider_section


class WorkerHandlerTests(unittest.TestCase):
    def test_provider_section_parses_supported_provider_model_values(self):
        self.assertEqual(provider_section("deepgram/nova-3"), {"provider": "deepgram", "model": "nova-3"})
        self.assertEqual(provider_section("bedrock/us.amazon.nova-micro-v1:0"), {"provider": "bedrock", "model": "us.amazon.nova-micro-v1:0"})
        self.assertIsNone(provider_section("google/gemini-2.5-flash"))

    def test_attach_resolved_voice_config_preserves_existing_inference_config_when_unsupported(self):
        config = attach_resolved_voice_config(
            {
                "agent_language": "en-US",
                "stt_model": "deepgram/nova-3",
                "llm_model": "google/gemini-2.5-flash",
                "tts_model": "deepgram/aura-2",
                "voice": "asteria",
            }
        )

        self.assertNotIn("voice_config", config)

    def test_build_session_provider_kwargs_uses_existing_inference_without_voice_config(self):
        from unittest.mock import patch

        with patch.dict(
            os.environ,
            {"LIVEKIT_API_KEY": "test-key", "LIVEKIT_API_SECRET": "test-secret"},
            clear=False,
        ):
            kwargs = build_session_provider_kwargs(
                {
                    "agent_language": "en-US",
                    "stt_model": "deepgram/nova-3",
                    "llm_model": "google/gemini-2.5-flash",
                    "llm_provider": "google",
                    "tts_model": "deepgram/aura-2",
                    "voice": "aura-2-asteria-en",
                }
            )

        self.assertEqual(set(kwargs.keys()), {"stt", "llm", "tts"})

    def test_parse_metadata_returns_empty_dict_for_missing_or_bad_json(self):
        self.assertEqual(parse_metadata(""), {})
        self.assertEqual(parse_metadata("not-json"), {})

    def test_build_call_context_defaults_inbound_from_livekit_room_name(self):
        context = build_call_context(
            room_name="+15551230000_+15550001111",
            metadata={"agent_id": "8d55565f-1111-4111-8111-f95fd03f0df2"},
        )

        self.assertEqual(context["agent_id"], "8d55565f-1111-4111-8111-f95fd03f0df2")
        self.assertEqual(context["agent_number"], "+15551230000")
        self.assertEqual(context["user_number"], "+15550001111")
        self.assertEqual(context["direction"], "inbound")
        self.assertEqual(context["from_number"], "+15550001111")
        self.assertEqual(context["to_number"], "+15551230000")
        self.assertEqual(context["call_id"], "+15551230000_+15550001111")

    def test_build_call_context_uses_livekit_sip_attributes_for_inbound_numbers(self):
        context = build_call_context(
            room_name="call-_+918877645613_ASBJ52Wjd7uk",
            metadata={
                "agentId": "8d55565f-1111-4111-8111-f95fd03f0df2",
                "sip.phoneNumber": "+918877645613",
                "sip.trunkPhoneNumber": "+18005550100",
                "sip.callID": "sip-call-123",
            },
        )

        self.assertEqual(context["agent_id"], "8d55565f-1111-4111-8111-f95fd03f0df2")
        self.assertEqual(context["agent_number"], "+18005550100")
        self.assertEqual(context["user_number"], "+918877645613")
        self.assertEqual(context["from_number"], "+918877645613")
        self.assertEqual(context["to_number"], "+18005550100")
        self.assertEqual(context["call_id"], "sip-call-123")

    def test_build_call_context_uses_outbound_metadata_numbers_when_present(self):
        context = build_call_context(
            room_name="outbound-room",
            metadata={
                "agent_id": "8d55565f-1111-4111-8111-f95fd03f0df2",
                "direction": "outbound",
                "from_number": "+15551230000",
                "to_number": "+15550001111",
                "outbound_id": "2b1f6d53-42f5-4cc7-9689-7b6f51a0c113",
            },
        )

        self.assertEqual(context["direction"], "outbound")
        self.assertEqual(context["agent_number"], "+15551230000")
        self.assertEqual(context["user_number"], "+15550001111")
        self.assertEqual(context["from_number"], "+15551230000")
        self.assertEqual(context["to_number"], "+15550001111")
        self.assertEqual(context["outbound_id"], "2b1f6d53-42f5-4cc7-9689-7b6f51a0c113")

    def test_speak_first_message_sends_configured_message_to_livekit_session(self):
        class FakeSession:
            def __init__(self):
                self.calls = []

            def say(self, text, **kwargs):
                self.calls.append((text, kwargs))
                return "speech-handle"

        session = FakeSession()
        result = speak_first_message(session, {"first_message": "Hello caller."})

        self.assertEqual(result, "speech-handle")
        self.assertEqual(session.calls, [("Hello caller.", {"allow_interruptions": True})])

    def test_apply_metadata_overrides_uses_outbound_prompt_and_first_message(self):
        config = {
            "first_message": "Default greeting.",
            "system_prompt": "Default prompt.",
            "provider": "TWILIO",
        }

        result = apply_metadata_overrides(
            config,
            {
                "direction": "outbound",
                "first_message": "Quick outbound hello.",
                "system_prompt": "Keep this outbound call short.",
            },
        )

        self.assertEqual(result["first_message"], "Quick outbound hello.")
        self.assertEqual(result["system_prompt"], "Keep this outbound call short.")
        self.assertEqual(config["first_message"], "Default greeting.")

    def test_apply_metadata_overrides_uses_preview_prompt_and_first_message(self):
        config = {
            "first_message": "Default greeting.",
            "system_prompt": "Default prompt.",
            "provider": "TWILIO",
        }

        result = apply_metadata_overrides(
            config,
            {
                "mode": "preview",
                "first_message": "Preview hello.",
                "system_prompt": "Use the saved agent behavior in preview.",
            },
        )

        self.assertEqual(result["first_message"], "Preview hello.")
        self.assertEqual(result["system_prompt"], "Use the saved agent behavior in preview.")
        self.assertEqual(config["first_message"], "Default greeting.")

    def test_apply_metadata_overrides_uses_batch_language_voice_and_dynamic_variables(self):
        config = {
            "first_message": "Hi {{city}} customer.",
            "system_prompt": "Ask about {{other_dyn_variable}}.",
            "agent_language": "en-US",
            "voice": "aura-2-asteria-en",
        }

        result = apply_metadata_overrides(
            config,
            {
                "direction": "outbound",
                "language": "hi-IN",
                "voice_id": "aura-2-athena-en",
                "dynamic_variables": {
                    "city": "Mumbai",
                    "other_dyn_variable": "renewal",
                },
            },
        )

        self.assertEqual(result["agent_language"], "hi-IN")
        self.assertEqual(result["voice"], "aura-2-athena-en")
        self.assertEqual(result["first_message"], "Hi Mumbai customer.")
        self.assertEqual(result["system_prompt"], "Ask about renewal.")
        self.assertEqual(config["first_message"], "Hi {{city}} customer.")


if __name__ == "__main__":
    unittest.main()
