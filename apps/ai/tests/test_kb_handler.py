import asyncio
import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers import kb_handler
from utils.pinecone_client import pinecone_api_key


class KbHandlerTests(unittest.TestCase):
    def test_pinecone_api_key_is_trimmed_before_client_use(self):
        original = os.environ.get("PINECONE_API_KEY")
        try:
            os.environ["PINECONE_API_KEY"] = '  "pcsk_test_key"  \n'
            self.assertEqual(pinecone_api_key(), "pcsk_test_key")
        finally:
            if original is None:
                os.environ.pop("PINECONE_API_KEY", None)
            else:
                os.environ["PINECONE_API_KEY"] = original

    def test_pinecone_api_key_rejects_google_key_wired_to_pinecone_env(self):
        original = os.environ.get("PINECONE_API_KEY")
        try:
            os.environ["PINECONE_API_KEY"] = "AIzaSyFakeGoogleKey"
            with self.assertRaises(ValueError) as ctx:
                pinecone_api_key()
        finally:
            if original is None:
                os.environ.pop("PINECONE_API_KEY", None)
            else:
                os.environ["PINECONE_API_KEY"] = original

        self.assertIn("looks like a Google API key", str(ctx.exception))

    def test_validate_ingest_url_rejects_private_hosts_and_bad_schemes(self):
        unsafe_urls = [
            "file:///etc/passwd",
            "ftp://example.com/file.txt",
            "http://127.0.0.1/admin",
            "http://169.254.169.254/latest/meta-data",
            "http://localhost:8080/debug",
        ]

        for url in unsafe_urls:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    kb_handler.validate_ingest_url(url)

    def test_validate_ingest_url_accepts_public_http_urls(self):
        self.assertEqual(
            kb_handler.validate_ingest_url("https://example.com/help"),
            "https://example.com/help",
        )

    def test_validate_ingest_url_honors_optional_host_allowlist(self):
        original_allowed_hosts = kb_handler.ALLOWED_HOSTS
        try:
            kb_handler.ALLOWED_HOSTS = ["trusted.example"]
            with self.assertRaises(ValueError):
                kb_handler.validate_ingest_url("https://example.com/help")
        finally:
            kb_handler.ALLOWED_HOSTS = original_allowed_hosts

    def test_validate_content_type_blocks_unexpected_url_media(self):
        with self.assertRaises(ValueError):
            kb_handler._validate_content_type("application/octet-stream", "html")

        kb_handler._validate_content_type("text/html; charset=utf-8", "html")

    def test_process_documents_enforces_chunk_budget_before_embedding(self):
        calls = {"embed": 0, "upsert": 0}

        async def fake_fetch_url(url):
            return "x" * 5000

        async def fake_embed_chunks(chunks):
            calls["embed"] += 1
            return [[0.1]] * len(chunks)

        def fake_upsert(*_args, **_kwargs):
            calls["upsert"] += 1

        original_fetch_url = kb_handler.fetch_url
        original_embed_chunks = kb_handler.embed_chunks
        original_upsert = kb_handler.upsert_to_pinecone
        original_max_chunks = kb_handler.MAX_CHUNKS_PER_DOCUMENT
        try:
            kb_handler.fetch_url = fake_fetch_url
            kb_handler.embed_chunks = fake_embed_chunks
            kb_handler.upsert_to_pinecone = fake_upsert
            kb_handler.MAX_CHUNKS_PER_DOCUMENT = 2

            result = asyncio.run(
                kb_handler.process_documents(
                    {
                        "agentId": "agent_123",
                        "organizationId": "org_123",
                        "documents": [
                            {
                                "kbId": "kb_123",
                                "name": "Large page",
                                "sourceType": "URL",
                                "url": "https://example.com/large",
                            }
                        ],
                    }
                )
            )
        finally:
            kb_handler.fetch_url = original_fetch_url
            kb_handler.embed_chunks = original_embed_chunks
            kb_handler.upsert_to_pinecone = original_upsert
            kb_handler.MAX_CHUNKS_PER_DOCUMENT = original_max_chunks

        self.assertEqual(result[0]["status"], "error")
        self.assertEqual(result[0]["code"], "KB_CHUNK_LIMIT_EXCEEDED")
        self.assertEqual(result[0]["error"], result[0]["userMessage"])
        self.assertFalse(result[0]["retryable"])
        self.assertEqual(calls, {"embed": 0, "upsert": 0})

    def test_process_documents_accepts_per_agent_chunk_budget_from_payload(self):
        calls = {"embed": 0, "upsert": 0}

        async def fake_fetch_url(url):
            return "x" * 1200

        async def fake_embed_chunks(chunks):
            calls["embed"] += 1
            return [[0.1]] * len(chunks)

        def fake_upsert(*_args, **_kwargs):
            calls["upsert"] += 1

        original_fetch_url = kb_handler.fetch_url
        original_embed_chunks = kb_handler.embed_chunks
        original_upsert = kb_handler.upsert_to_pinecone
        try:
            kb_handler.fetch_url = fake_fetch_url
            kb_handler.embed_chunks = fake_embed_chunks
            kb_handler.upsert_to_pinecone = fake_upsert

            result = asyncio.run(
                kb_handler.process_documents(
                    {
                        "agentId": "agent_123",
                        "organizationId": "org_123",
                        "budgets": {"agent_123": {"maxChunksPerDocument": 2}},
                        "documents": [
                            {
                                "kbId": "kb_123",
                                "name": "Large page",
                                "sourceType": "URL",
                                "url": "https://example.com/large",
                            }
                        ],
                    }
                )
            )
        finally:
            kb_handler.fetch_url = original_fetch_url
            kb_handler.embed_chunks = original_embed_chunks
            kb_handler.upsert_to_pinecone = original_upsert

        self.assertEqual(result[0]["status"], "error")
        self.assertEqual(result[0]["code"], "KB_CHUNK_LIMIT_EXCEEDED")
        self.assertEqual(result[0]["error"], result[0]["userMessage"])
        self.assertFalse(result[0]["retryable"])
        self.assertEqual(calls, {"embed": 0, "upsert": 0})

    def test_process_documents_returns_structured_user_safe_empty_text_error(self):
        async def fake_fetch_url(_url):
            return "   "

        original_fetch_url = kb_handler.fetch_url
        try:
            kb_handler.fetch_url = fake_fetch_url
            result = asyncio.run(
                kb_handler.process_documents(
                    {
                        "agentId": "agent_123",
                        "organizationId": "org_123",
                        "documents": [
                            {
                                "kbId": "kb_empty",
                                "name": "Empty page",
                                "sourceType": "URL",
                                "url": "https://example.com/empty",
                            }
                        ],
                    }
                )
            )
        finally:
            kb_handler.fetch_url = original_fetch_url

        self.assertEqual(result[0]["status"], "error")
        self.assertEqual(result[0]["stage"], "failed")
        self.assertEqual(result[0]["code"], "KB_EMPTY_TEXT")
        self.assertEqual(result[0]["userMessage"], "No readable text was found in this knowledge source.")
        self.assertEqual(result[0]["error"], result[0]["userMessage"])
        self.assertFalse(result[0]["retryable"])
        self.assertNotIn("Extracted text is empty", result[0]["error"])

    def test_embed_chunks_uses_pinecone_inference_passage_embeddings(self):
        calls = []

        class FakeInference:
            def embed(self, **kwargs):
                calls.append(kwargs)
                return {
                    "data": [
                        {"values": [0.1, 0.2]},
                        {"values": [0.3, 0.4]},
                    ]
                }

        class FakePinecone:
            inference = FakeInference()

        original_pinecone = kb_handler._pinecone
        try:
            kb_handler._pinecone = lambda: FakePinecone()
            embeddings = asyncio.run(kb_handler.embed_chunks(["first", "second"]))
        finally:
            kb_handler._pinecone = original_pinecone

        self.assertEqual(embeddings, [[0.1, 0.2], [0.3, 0.4]])
        self.assertEqual(calls[0]["inputs"], ["first", "second"])
        self.assertEqual(calls[0]["parameters"]["input_type"], "passage")

    def test_missing_pinecone_key_returns_actionable_error(self):
        error = kb_handler._document_error_fields(
            KeyError("PINECONE_API_KEY"),
            budget={},
        )

        self.assertEqual(error["code"], "KB_VECTOR_STORE_API_KEY_MISSING")
        self.assertIn("PINECONE_API_KEY", error["userMessage"])
        self.assertFalse(error["retryable"])

    def test_invalid_pinecone_key_returns_actionable_error(self):
        error = kb_handler._document_error_fields(
            RuntimeError("(401) Reason: Unauthorized HTTP response body: Invalid API key"),
            budget={},
        )

        self.assertEqual(error["code"], "KB_VECTOR_STORE_API_KEY_INVALID")
        self.assertIn("PINECONE_API_KEY", error["userMessage"])
        self.assertFalse(error["retryable"])

    def test_google_key_in_pinecone_env_returns_actionable_error(self):
        error = kb_handler._document_error_fields(
            ValueError("PINECONE_API_KEY looks like a Google API key; set a Pinecone API key instead."),
            budget={},
        )

        self.assertEqual(error["code"], "KB_VECTOR_STORE_API_KEY_INVALID")
        self.assertIn("PINECONE_API_KEY", error["userMessage"])
        self.assertFalse(error["retryable"])

    def test_kb_job_tracks_progress_and_final_document_results(self):
        async def fake_process_documents(_payload, progress=None, should_cancel=None):
            if progress:
                await progress({"kbId": "kb_123", "status": "running", "stage": "embedding"})
            return [{"kbId": "kb_123", "status": "ok", "stage": "indexed", "chunks": 3}]

        original_process_documents = kb_handler.process_documents
        try:
            kb_handler.process_documents = fake_process_documents
            job = kb_handler.create_kb_job(
                {
                    "agentId": "agent_123",
                    "organizationId": "org_123",
                    "documents": [
                        {
                            "kbId": "kb_123",
                            "name": "Doc",
                            "sourceType": "URL",
                            "url": "https://example.com/doc",
                        }
                    ],
                }
            )
            asyncio.run(kb_handler.run_kb_job(job["jobId"]))
            finished = kb_handler.get_kb_job(job["jobId"])
        finally:
            kb_handler.process_documents = original_process_documents

        self.assertEqual(finished["status"], "succeeded")
        self.assertEqual(finished["stage"], "completed")
        self.assertEqual(finished["progress"]["processed"], 1)
        self.assertEqual(finished["progress"]["percent"], 100)
        self.assertEqual(finished["documents"][0]["stage"], "indexed")
        self.assertEqual(finished["documents"][0]["chunks"], 3)

    def test_cancel_kb_job_marks_queued_documents_canceled(self):
        job = kb_handler.create_kb_job(
            {
                "agentId": "agent_123",
                "organizationId": "org_123",
                "documents": [
                    {
                        "kbId": "kb_123",
                        "name": "Doc",
                        "sourceType": "URL",
                        "url": "https://example.com/doc",
                    }
                ],
            }
        )

        canceled = kb_handler.cancel_kb_job(job["jobId"])

        self.assertEqual(canceled["status"], "canceled")
        self.assertEqual(canceled["stage"], "canceled")
        self.assertEqual(canceled["progress"]["processed"], 1)
        self.assertEqual(canceled["progress"]["canceled"], 1)
        self.assertEqual(canceled["documents"][0]["code"], "KB_JOB_CANCELED")

    def test_retry_kb_job_requeues_failed_documents_only(self):
        async def fake_process_documents(_payload, progress=None, should_cancel=None):
            return [
                {"kbId": "kb_ok", "status": "ok", "stage": "indexed", "chunks": 1},
                {
                    "kbId": "kb_failed",
                    "status": "error",
                    "stage": "failed",
                    "code": "KB_EMPTY_TEXT",
                    "userMessage": "No readable text was found in this knowledge source.",
                    "retryable": False,
                    "error": "No readable text was found in this knowledge source.",
                },
            ]

        original_process_documents = kb_handler.process_documents
        try:
            kb_handler.process_documents = fake_process_documents
            job = kb_handler.create_kb_job(
                {
                    "agentId": "agent_123",
                    "organizationId": "org_123",
                    "documents": [
                        {
                            "kbId": "kb_ok",
                            "name": "OK",
                            "sourceType": "URL",
                            "url": "https://example.com/ok",
                        },
                        {
                            "kbId": "kb_failed",
                            "name": "Failed",
                            "sourceType": "URL",
                            "url": "https://example.com/failed",
                        },
                    ],
                }
            )
            asyncio.run(kb_handler.run_kb_job(job["jobId"]))
            retry = kb_handler.retry_kb_job(job["jobId"])
        finally:
            kb_handler.process_documents = original_process_documents

        self.assertEqual(retry["status"], "queued")
        self.assertEqual(retry["progress"]["total"], 1)
        self.assertEqual(retry["documents"][0]["kbId"], "kb_failed")

    def test_upsert_deletes_existing_vectors_for_kb_before_replacement(self):
        calls = []

        class FakeIndex:
            def delete(self, **kwargs):
                calls.append(("delete", kwargs))

            def upsert(self, **kwargs):
                calls.append(("upsert", kwargs))

        original_index = kb_handler._index
        try:
            kb_handler._index = lambda: FakeIndex()
            kb_handler.upsert_to_pinecone(
                chunks=["new text"],
                embeddings=[[0.1, 0.2]],
                namespace="agent_123",
                kb_id="kb_123",
                doc_name="Doc",
            )
        finally:
            kb_handler._index = original_index

        self.assertEqual(calls[0][0], "delete")
        self.assertEqual(calls[0][1]["namespace"], "agent_123")
        self.assertEqual(calls[0][1]["filter"], {"kbId": {"$eq": "kb_123"}})
        self.assertEqual(calls[1][0], "upsert")

    def test_delete_kb_vectors_removes_only_selected_document_namespace(self):
        calls = []

        class FakeIndex:
            def delete(self, **kwargs):
                calls.append(kwargs)

        original_index = kb_handler._index
        try:
            kb_handler._index = lambda: FakeIndex()
            kb_handler.delete_kb_vectors(namespace="agent_123", kb_id="kb_123")
        finally:
            kb_handler._index = original_index

        self.assertEqual(calls, [{"filter": {"kbId": {"$eq": "kb_123"}}, "namespace": "agent_123"}])


if __name__ == "__main__":
    unittest.main()
