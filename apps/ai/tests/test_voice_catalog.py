import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.voice_catalog import load_voice_catalog


class VoiceCatalogTests(unittest.TestCase):
    def test_load_voice_catalog_returns_static_provider_options(self):
        catalog = load_voice_catalog()

        self.assertEqual(catalog["version"], "2026-06-30")
        self.assertTrue(any(item["provider"] == "deepgram" for item in catalog["stt_models"]))
        self.assertTrue(any(item["provider"] == "bedrock" for item in catalog["llm_models"]))
        self.assertTrue(any(item["provider"] == "elevenlabs" for item in catalog["tts_models"]))
        self.assertTrue(any(item["provider"] == "sarvam" for item in catalog["voices"]))

    def test_load_voice_catalog_prefers_configured_json_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "catalog.json"
            path.write_text(json.dumps({"version": "custom", "defaults": {}, "languages": []}))

            with patch.dict(os.environ, {"VOICE_CATALOG_PATH": str(path)}, clear=False):
                catalog = load_voice_catalog()

        self.assertEqual(catalog["version"], "custom")


if __name__ == "__main__":
    unittest.main()
