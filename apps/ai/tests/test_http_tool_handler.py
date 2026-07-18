import asyncio
import json
import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.http_tool_handler import (
    build_http_tool_instructions,
    call_http_tool,
    parse_http_tool_arguments,
)


def sample_tool(**overrides):
    tool = {
        "toolId": "tool_123",
        "name": "Lookup customer",
        "description": "Fetches customer profile data",
        "api_url": "https://api.example.com/customers/{customerId}",
        "api_method": "POST",
        "api_headers": [{"key": "Authorization", "value": "Bearer test-secret"}],
        "api_path_params": [
            {
                "name": "customerId",
                "type": "String",
                "valueType": "LLM Prompt",
                "description": "Customer id",
                "allowedValues": [],
                "required": True,
            }
        ],
        "api_query_params": [
            {
                "name": "status",
                "type": "String",
                "valueType": "LLM Prompt",
                "description": "Requested profile status",
                "allowedValues": ["active", "pending"],
                "required": False,
            }
        ],
        "api_body": [
            {
                "name": "reason",
                "type": "String",
                "valueType": "LLM Prompt",
                "description": "Lookup reason",
                "allowedValues": [],
                "required": True,
            },
            {
                "name": "accountId",
                "type": "String",
                "valueType": "Dynamic Variable",
                "description": "Runtime account id",
                "allowedValues": [],
                "required": True,
            },
        ],
        "dynamic_variables": [{"key": "accountId", "value": "acct_default"}],
        "response_timeout_secs": 7,
    }
    tool.update(overrides)
    return tool


class HttpToolHandlerTests(unittest.TestCase):
    def test_build_http_tool_instructions_lists_only_llm_prompt_arguments(self):
        instructions = build_http_tool_instructions([sample_tool()])

        self.assertIn("call_http_tool", instructions)
        self.assertIn("Lookup customer", instructions)
        self.assertIn("customerId (String, required", instructions)
        self.assertIn("status (String, optional, allowed: active, pending", instructions)
        self.assertIn("reason (String, required", instructions)
        self.assertNotIn("test-secret", instructions)
        self.assertNotIn("accountId", instructions)

    def test_call_http_tool_builds_request_from_arguments_and_dynamic_variables(self):
        captured = {}

        def fake_fetch(payload):
            request = payload["request"]
            captured["url"] = request.full_url
            captured["method"] = request.get_method()
            captured["timeout"] = payload["timeout"]
            captured["authorization"] = request.get_header("Authorization")
            captured["body"] = json.loads(request.data.decode("utf-8"))
            return {"status": 200, "data": {"ok": True, "customer": "cust_123"}}

        result = asyncio.run(
            call_http_tool(
                tool_name="Lookup customer",
                arguments={
                    "customerId": "cust_123",
                    "status": "active",
                    "reason": "Caller requested account details",
                },
                config={
                    "tools": [sample_tool()],
                    "dynamic_variables": {"accountId": "acct_runtime"},
                },
                call_context={"call_id": "call_123"},
                fetch=fake_fetch,
            )
        )

        self.assertEqual(captured["method"], "POST")
        self.assertEqual(captured["timeout"], 7)
        self.assertEqual(captured["authorization"], "Bearer test-secret")
        self.assertEqual(
            captured["url"],
            "https://api.example.com/customers/cust_123?status=active",
        )
        self.assertEqual(
            captured["body"],
            {
                "reason": "Caller requested account details",
                "accountId": "acct_runtime",
            },
        )
        self.assertEqual(result["status"], 200)
        self.assertEqual(result["data"]["customer"], "cust_123")

    def test_call_http_tool_rejects_missing_required_argument(self):
        with self.assertRaisesRegex(ValueError, "customerId"):
            asyncio.run(
                call_http_tool(
                    tool_name="Lookup customer",
                    arguments={"reason": "Need profile"},
                    config={"tools": [sample_tool()]},
                    call_context={},
                    fetch=lambda payload: {"status": 200},
                )
            )

    def test_parse_http_tool_arguments_requires_json_object(self):
        with self.assertRaisesRegex(ValueError, "decode to an object"):
            parse_http_tool_arguments("[1,2,3]")


if __name__ == "__main__":
    unittest.main()
