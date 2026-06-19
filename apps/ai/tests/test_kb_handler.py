import asyncio
import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers import kb_handler


class KbHandlerTests(unittest.TestCase):
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
        self.assertIn("chunk budget", result[0]["error"])
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
        self.assertIn("chunk budget", result[0]["error"])
        self.assertEqual(calls, {"embed": 0, "upsert": 0})

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
