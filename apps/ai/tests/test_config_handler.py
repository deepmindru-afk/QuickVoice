import asyncio
import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.config_handler import get_config, normalize_config


class ConfigHandlerTests(unittest.TestCase):
    def test_normalize_config_maps_console_fields_to_livekit_runtime_fields(self):
        config = normalize_config(
            {
                "agentId": "8d55565f-1111-4111-8111-f95fd03f0df2",
                "organizationId": "org_123",
                "userId": "user_123",
                "agentNumber": "+15551230000",
                "provider": "TWILIO",
                "firstMessage": "Hello, thanks for calling QuickVoice.",
                "systemPrompt": "You are a concise support agent.",
                "llmModel": "gpt-4o-mini",
                "voiceId": "aura-2-asteria-en",
                "agent_language": "en",
                "use_rag": True,
                "data_needed": [{"id": "name", "name": "Name"}],
                "data_evaluation": [{"id": "tone", "name": "Tone"}],
                "post_call_webhook": {"webhook_url": "https://example.com/hook", "method": "POST"},
                "preemptive_generation": True,
                "timezone": "America/New_York",
            }
        )

        self.assertEqual(config["agent_id"], "8d55565f-1111-4111-8111-f95fd03f0df2")
        self.assertEqual(config["organization_id"], "org_123")
        self.assertEqual(config["user_id"], "user_123")
        self.assertEqual(config["agent_number"], "+15551230000")
        self.assertEqual(config["provider"], "TWILIO")
        self.assertEqual(config["first_message"], "Hello, thanks for calling QuickVoice.")
        self.assertEqual(config["system_prompt"], "You are a concise support agent.")
        self.assertEqual(config["llm_model"], "openai/gpt-4o-mini")
        self.assertEqual(config["llm_provider"], "openai")
        self.assertEqual(config["tts_model"], "deepgram/aura-2")
        self.assertEqual(config["voice"], "aura-2-asteria-en")
        self.assertEqual(config["agent_language"], "en-US")
        self.assertTrue(config["use_rag"])
        self.assertEqual(config["data_needed"], [{"id": "name", "name": "Name"}])
        self.assertEqual(config["data_evaluation"], [{"id": "tone", "name": "Tone"}])
        self.assertEqual(config["post_call_webhook"]["webhook_url"], "https://example.com/hook")
        self.assertTrue(config["preemptive_generation"])
        self.assertEqual(config["timezone"], "America/New_York")

    def test_get_config_fetches_runtime_config_from_server_with_internal_auth(self):
        calls = []

        async def fake_get_json(url, headers):
            calls.append((url, headers))
            return {
                "success": True,
                "data": {
                    "agentId": "8d55565f-1111-4111-8111-f95fd03f0df2",
                    "organizationId": "org_123",
                    "userId": "user_123",
                    "firstMessage": "Hello from server.",
                    "systemPrompt": "Server prompt.",
                    "llmModel": "google/gemini-2.5-flash",
                    "voiceId": "aura-2-hera-en",
                    "agent_language": "en-US",
                    "provider": "TELNYX",
                },
            }

        config = asyncio.run(
            get_config(
                "8d55565f-1111-4111-8111-f95fd03f0df2",
                agent_number="+15551230000",
                server_api_url="http://server.test/api/v1",
                internal_api_key="internal-secret",
                get_json=fake_get_json,
            )
        )

        self.assertEqual(config["first_message"], "Hello from server.")
        self.assertEqual(config["system_prompt"], "Server prompt.")
        self.assertEqual(config["llm_provider"], "google")
        self.assertEqual(config["provider"], "TELNYX")
        self.assertEqual(len(calls), 1)
        url, headers = calls[0]
        self.assertTrue(url.startswith("http://server.test/api/v1/ai/runtime-config?"))
        self.assertIn("agentId=8d55565f-1111-4111-8111-f95fd03f0df2", url)
        self.assertIn("phoneNumber=%2B15551230000", url)
        self.assertEqual(headers["Authorization"], "Bearer internal-secret")


if __name__ == "__main__":
    unittest.main()
