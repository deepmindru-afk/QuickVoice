import asyncio
import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers import rag_handler


class RagHandlerTests(unittest.TestCase):
    def test_get_rag_context_distinguishes_empty_matches_from_provider_failure(self):
        async def fake_embed_query(query):
            return [0.1, 0.2]

        class EmptyIndex:
            def query(self, **_kwargs):
                return {"matches": []}

        original_embed_query = rag_handler.embed_query
        original_index = rag_handler._index
        try:
            rag_handler.embed_query = fake_embed_query
            rag_handler._index = lambda: EmptyIndex()

            context = asyncio.run(rag_handler.get_rag_context("agent_123", "unknown"))
        finally:
            rag_handler.embed_query = original_embed_query
            rag_handler._index = original_index

        self.assertEqual(context, "")

        async def broken_embed_query(query):
            raise RuntimeError("embedding provider unavailable")

        try:
            rag_handler.embed_query = broken_embed_query
            with self.assertRaises(rag_handler.RagRetrievalError):
                asyncio.run(rag_handler.get_rag_context("agent_123", "refund policy"))
        finally:
            rag_handler.embed_query = original_embed_query

    def test_get_rag_context_includes_citations_with_chunk_ids_and_scores(self):
        async def fake_embed_query(query):
            return [0.1, 0.2]

        class MatchIndex:
            def query(self, **_kwargs):
                return {
                    "matches": [
                        {
                            "id": "kb_123#4",
                            "score": 0.87,
                            "metadata": {
                                "name": "Refund FAQ",
                                "chunkIdx": 4,
                                "page": 2,
                                "text": "Refunds take five business days.",
                            },
                        }
                    ]
                }

        original_embed_query = rag_handler.embed_query
        original_index = rag_handler._index
        try:
            rag_handler.embed_query = fake_embed_query
            rag_handler._index = lambda: MatchIndex()

            context = asyncio.run(rag_handler.get_rag_context("agent_123", "refund"))
        finally:
            rag_handler.embed_query = original_embed_query
            rag_handler._index = original_index

        self.assertIn("Refund FAQ", context)
        self.assertIn("kb_123#4", context)
        self.assertIn("page=2", context)
        self.assertIn("score=0.87", context)
        self.assertIn("Refunds take five business days.", context)


if __name__ == "__main__":
    unittest.main()
