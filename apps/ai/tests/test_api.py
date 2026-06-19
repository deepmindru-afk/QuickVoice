import os
import sys
import unittest
import warnings
from unittest.mock import patch

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

try:
    warnings.filterwarnings(
        "ignore",
        message="Using `httpx` with `starlette.testclient` is deprecated.*",
    )
    from fastapi.testclient import TestClient  # type: ignore
except Exception:
    TestClient = None


@unittest.skipIf(TestClient is None, "fastapi test client is not installed")
class ApiTests(unittest.TestCase):
    def test_non_health_routes_require_internal_auth(self):
        import api

        with patch.dict(os.environ, {"INTERNAL_API_KEY": "internal-secret"}, clear=False):
            with TestClient(api.app) as client:
                self.assertEqual(client.get("/health").status_code, 200)
                self.assertEqual(client.get("/agents/agent_123/config").status_code, 401)

    def test_kb_process_returns_207_when_any_document_fails(self):
        import api

        async def fake_process_documents(_payload):
            return [
                {"kbId": "kb_ok", "status": "ok"},
                {"kbId": "kb_bad", "status": "error", "error": "failed"},
            ]

        original_process_documents = api.kb_handler.process_documents
        try:
            api.kb_handler.process_documents = fake_process_documents
            with patch.dict(os.environ, {"INTERNAL_API_KEY": "internal-secret"}, clear=False):
                with TestClient(api.app) as client:
                    response = client.post(
                        "/kb/process",
                        headers={"x-internal-key": "internal-secret"},
                        json={
                            "agentId": "agent_123",
                            "organizationId": "org_123",
                            "documents": [
                                {"kbId": "kb_ok", "name": "OK", "sourceType": "URL", "url": "https://example.com"},
                                {"kbId": "kb_bad", "name": "Bad", "sourceType": "URL", "url": "https://example.com"},
                            ],
                        },
                    )
        finally:
            api.kb_handler.process_documents = original_process_documents

        self.assertEqual(response.status_code, 207)
        self.assertFalse(response.json()["success"])


if __name__ == "__main__":
    unittest.main()
