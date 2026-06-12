import asyncio
import os
import sys
import unittest
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.calllog_handler import build_call_log_payload, post_call_log


class CallLogHandlerTests(unittest.TestCase):
    def test_build_call_log_payload_maps_livekit_session_to_server_ingest_schema(self):
        payload = build_call_log_payload(
            config={
                "agent_id": "8d55565f-1111-4111-8111-f95fd03f0df2",
                "organization_id": "org_123",
                "user_id": "user_123",
                "provider": "TWILIO",
            },
            call_context={
                "call_id": "room-123",
                "direction": "inbound",
                "from_number": "+15550001111",
                "to_number": "+15551230000",
            },
            started_at=datetime(2026, 5, 27, 12, 0, 0, tzinfo=timezone.utc),
            ended_at=datetime(2026, 5, 27, 12, 1, 5, tzinfo=timezone.utc),
            recording_path="Voice-agents/Recordings/recording-123.ogg",
            transcripts=[
                {"role": "user", "content": "Hi", "time": datetime(2026, 5, 27, 12, 0, 5, tzinfo=timezone.utc)},
                {"role": "assistant", "content": "Hello", "time": "2026-05-27T12:00:06+00:00"},
            ],
        )

        self.assertEqual(payload["organizationId"], "org_123")
        self.assertEqual(payload["userId"], "user_123")
        self.assertEqual(payload["agentId"], "8d55565f-1111-4111-8111-f95fd03f0df2")
        self.assertEqual(payload["callId"], "room-123")
        self.assertEqual(payload["direction"], "inbound")
        self.assertEqual(payload["startTime"], "2026-05-27T12:00:00Z")
        self.assertEqual(payload["endTime"], "2026-05-27T12:01:05Z")
        self.assertEqual(payload["durationSeconds"], 65)
        self.assertEqual(payload["status"], "COMPLETED")
        self.assertEqual(payload["recordingSid"], "Voice-agents/Recordings/recording-123.ogg")
        self.assertEqual(payload["provider"], "TWILIO")
        self.assertEqual(payload["fromNumber"], "+15550001111")
        self.assertEqual(payload["toNumber"], "+15551230000")
        self.assertEqual(payload["transcripts"][0]["role"], "user")
        self.assertEqual(payload["transcripts"][0]["message"], "Hi")
        self.assertEqual(payload["transcripts"][0]["timestamp"], "2026-05-27T12:00:05Z")
        self.assertEqual(payload["transcripts"][1]["role"], "agent")
        self.assertEqual(payload["transcripts"][1]["message"], "Hello")

    def test_post_call_log_uses_internal_auth_and_posts_to_server_calls_endpoint(self):
        calls = []

        async def fake_post_json(url, headers, body):
            calls.append((url, headers, body))
            return {"success": True, "data": {"callId": body["callId"]}}

        result = asyncio.run(
            post_call_log(
                {"callId": "room-123", "organizationId": "org_123", "userId": "user_123"},
                server_api_url="http://server.test/api/v1",
                internal_api_key="internal-secret",
                post_json=fake_post_json,
            )
        )

        self.assertEqual(result["data"]["callId"], "room-123")
        self.assertEqual(len(calls), 1)
        url, headers, body = calls[0]
        self.assertEqual(url, "http://server.test/api/v1/calls")
        self.assertEqual(headers["Authorization"], "Bearer internal-secret")
        self.assertEqual(headers["x-organization-id"], "org_123")
        self.assertEqual(headers["x-user-id"], "user_123")
        self.assertEqual(body["callId"], "room-123")

    def test_post_call_log_appends_api_version_when_server_url_is_origin(self):
        calls = []

        async def fake_post_json(url, headers, body):
            calls.append((url, headers, body))
            return {"success": True, "data": {"callId": body["callId"]}}

        asyncio.run(
            post_call_log(
                {"callId": "room-123", "organizationId": "org_123", "userId": "user_123"},
                server_api_url="https://api.quickvoice.co",
                internal_api_key="internal-secret",
                post_json=fake_post_json,
            )
        )

        self.assertEqual(calls[0][0], "https://api.quickvoice.co/api/v1/calls")


if __name__ == "__main__":
    unittest.main()
