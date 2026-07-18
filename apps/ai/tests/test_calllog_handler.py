import asyncio
import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.calllog_handler import (
    build_call_log_payload,
    enqueue_call_log,
    flush_call_log_queue,
    post_call_log,
)


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

    def test_build_call_log_payload_preserves_numeric_epoch_transcript_timestamps(self):
        payload = build_call_log_payload(
            config={
                "agent_id": "agent_123",
                "organization_id": "org_123",
                "provider": "TWILIO",
            },
            call_context={
                "call_id": "room-123",
                "from_number": "+15550001111",
                "to_number": "+15551230000",
            },
            started_at=datetime(2024, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            ended_at=datetime(2024, 1, 1, 0, 1, 0, tzinfo=timezone.utc),
            recording_path=None,
            transcripts=[{"role": "user", "content": "Hi", "time": 1704067200.0}],
        )

        self.assertEqual(payload["transcripts"][0]["timestamp"], "2024-01-01T00:00:00Z")

    def test_build_call_log_payload_allows_web_widget_without_phone_numbers(self):
        payload = build_call_log_payload(
            config={
                "agent_id": "agent_123",
                "organization_id": "org_123",
            },
            call_context={
                "call_id": "widget_wgs_123",
                "direction": "inbound",
                "provider": "WEB_WIDGET",
                "metadata": {
                    "source": "web_widget",
                    "widget_id": "wgt_123",
                    "origin": "https://example.com",
                },
            },
            started_at=datetime(2026, 7, 17, 12, 0, 0, tzinfo=timezone.utc),
            ended_at=datetime(2026, 7, 17, 12, 2, 0, tzinfo=timezone.utc),
            recording_path=None,
            transcripts=[],
        )

        self.assertEqual(payload["provider"], "WEB_WIDGET")
        self.assertEqual(payload["fromNumber"], "")
        self.assertEqual(payload["toNumber"], "")
        self.assertEqual(payload["metadata"]["source"], "web_widget")
        self.assertEqual(payload["metadata"]["widget_id"], "wgt_123")

    def test_build_call_log_payload_uses_collected_metadata_and_results(self):
        payload = build_call_log_payload(
            config={
                "agent_id": "agent_123",
                "organization_id": "org_123",
                "data_extracted": [
                    {
                        "type": "text",
                        "name": "Customer name",
                        "description": "Name provided by the caller",
                        "value": "Avery Stone",
                    }
                ],
                "data_evaluation": [
                    {
                        "id": "qualified",
                        "name": "Qualified lead",
                        "criteria": "Caller wants a demo",
                    }
                ],
                "data_evaluated": [
                    {
                        "identifier": "qualified",
                        "description": "Caller wants a demo",
                        "value": True,
                    }
                ],
            },
            call_context={
                "call_id": "call_123",
                "from_number": "+15550001111",
                "to_number": "+15551230000",
                "metadata": {"campaignId": "campaign_123", "leadSource": "website"},
            },
            started_at=datetime(2026, 5, 27, 12, 0, 0, tzinfo=timezone.utc),
            ended_at=datetime(2026, 5, 27, 12, 1, 0, tzinfo=timezone.utc),
            recording_path=None,
            transcripts=[],
        )

        self.assertEqual(payload["metadata"]["campaignId"], "campaign_123")
        self.assertEqual(payload["metadata"]["leadSource"], "website")
        self.assertEqual(payload["extractedData"][0]["value"], "Avery Stone")
        self.assertEqual(payload["evaluatedData"][0]["identifier"], "qualified")
        self.assertNotIn("criteria", payload["evaluatedData"][0])

    def test_build_call_log_payload_derives_metadata_from_transcript(self):
        payload = build_call_log_payload(
            config={
                "agent_id": "agent_123",
                "organization_id": "org_123",
                "data_needed": [
                    {"id": "customer_name", "name": "Customer name", "type": "text"},
                    {"id": "reason", "name": "Call reason", "type": "text"},
                    {"id": "intention", "name": "Intention", "type": "text"},
                ],
            },
            call_context={
                "call_id": "call_123",
                "from_number": "+15550001111",
                "to_number": "+15551230000",
            },
            started_at=datetime(2026, 5, 27, 12, 0, 0, tzinfo=timezone.utc),
            ended_at=datetime(2026, 5, 27, 12, 1, 0, tzinfo=timezone.utc),
            recording_path=None,
            transcripts=[
                {
                    "role": "user",
                    "content": "My name is Avery Stone. I'm calling about upgrading my plan.",
                    "time": datetime(2026, 5, 27, 12, 0, 5, tzinfo=timezone.utc),
                },
                {
                    "role": "assistant",
                    "content": "I can help with plan upgrades.",
                    "time": datetime(2026, 5, 27, 12, 0, 8, tzinfo=timezone.utc),
                },
            ],
        )

        self.assertEqual(payload["metadata"]["username"], "Avery Stone")
        self.assertEqual(payload["metadata"]["reason"], "upgrading my plan")
        self.assertEqual(payload["metadata"]["intent"], "upgrading my plan")
        self.assertIn("Caller said:", payload["metadata"]["summary"])
        self.assertEqual(
            {item["name"]: item["value"] for item in payload["extractedData"]},
            {
                "Customer name": "Avery Stone",
                "Call reason": "upgrading my plan",
                "Intention": "upgrading my plan",
            },
        )

    def test_build_call_log_payload_preserves_explicit_metadata_over_transcript_fallback(self):
        payload = build_call_log_payload(
            config={
                "agent_id": "agent_123",
                "organization_id": "org_123",
            },
            call_context={
                "call_id": "call_123",
                "from_number": "+15550001111",
                "to_number": "+15551230000",
                "summary": "Webhook-provided summary",
                "intent": "Webhook-provided intent",
                "metadata": {"username": "Existing User", "reason": "Existing reason"},
            },
            started_at=datetime(2026, 5, 27, 12, 0, 0, tzinfo=timezone.utc),
            ended_at=datetime(2026, 5, 27, 12, 1, 0, tzinfo=timezone.utc),
            recording_path=None,
            transcripts=[
                {
                    "role": "user",
                    "content": "My name is Avery Stone. I'm calling about upgrading my plan.",
                    "time": datetime(2026, 5, 27, 12, 0, 5, tzinfo=timezone.utc),
                },
            ],
        )

        self.assertEqual(payload["metadata"]["username"], "Existing User")
        self.assertEqual(payload["metadata"]["reason"], "Existing reason")
        self.assertEqual(payload["metadata"]["summary"], "Webhook-provided summary")
        self.assertEqual(payload["metadata"]["intent"], "Webhook-provided intent")

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

    def test_enqueue_and_flush_call_log_queue_retries_durable_payloads(self):
        with tempfile.TemporaryDirectory() as tmp:
            queue_dir = Path(tmp)
            queued_path = enqueue_call_log(
                {"callId": "room-123", "organizationId": "org_123"},
                queue_dir=queue_dir,
            )

            self.assertTrue(queued_path.exists())

            posted = []

            async def fake_post_json(url, headers, body):
                posted.append((url, headers, body))
                return {"success": True}

            result = asyncio.run(
                flush_call_log_queue(
                    queue_dir=queue_dir,
                    server_api_url="http://server.test",
                    internal_api_key="internal-secret",
                    post_json=fake_post_json,
                )
            )

            self.assertEqual(result["posted"], 1)
            self.assertEqual(result["failed"], 0)
            self.assertFalse(queued_path.exists())
            self.assertEqual(posted[0][2]["callId"], "room-123")


if __name__ == "__main__":
    unittest.main()
