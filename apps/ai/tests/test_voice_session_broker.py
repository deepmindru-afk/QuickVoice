import json
import os
import sys
import unittest
from unittest.mock import patch

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.voice_catalog import load_voice_catalog
from handlers.voice_session_broker import FakeDispatchClient, VoiceSessionBroker


class VoiceSessionBrokerTests(unittest.IsolatedAsyncioTestCase):
    async def test_create_session_returns_token_and_dispatch_metadata(self):
        with patch.dict(
            os.environ,
            {
                "LIVEKIT_URL": "wss://livekit.example.com",
                "LIVEKIT_API_KEY": "key",
                "LIVEKIT_API_SECRET": "secret",
                "LIVEKIT_AGENT_NAME": "QuickVoice",
            },
            clear=True,
        ):
            dispatch = FakeDispatchClient("dispatch-123")
            broker = VoiceSessionBroker(catalog_loader=load_voice_catalog, dispatch_client=dispatch)

            session = await broker.create_session(
                {"participant": {"identity": "caller-1"}, "metadata": {"account_id": "acct_1"}}
            )

        self.assertEqual(session["livekit_url"], "wss://livekit.example.com")
        self.assertEqual(session["participant"]["identity"], "caller-1")
        self.assertTrue(session["participant"]["token"])
        self.assertEqual(session["agent"]["dispatch_id"], "dispatch-123")
        metadata = json.loads(dispatch.calls[0]["metadata"])
        self.assertEqual(metadata["schema_version"], "quickvoice.voice-session.v1")
        self.assertEqual(metadata["participant"]["identity"], "caller-1")
        self.assertEqual(metadata["client_metadata"]["account_id"], "acct_1")


if __name__ == "__main__":
    unittest.main()
