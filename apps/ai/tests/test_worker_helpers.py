import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.worker_handler import build_call_context, parse_metadata, speak_first_message


class WorkerHandlerTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
