import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.voice_catalog import load_voice_catalog
from handlers.voice_config_resolution import VoiceConfigValidationError, resolve_voice_config


class VoiceConfigResolutionTests(unittest.TestCase):
    def test_resolve_voice_config_applies_defaults_and_runtime_ids(self):
        config = resolve_voice_config({}, load_voice_catalog())

        self.assertEqual(config["language"], "en")
        self.assertEqual(config["stt"], {"provider": "deepgram", "model": "nova-3"})
        self.assertEqual(config["llm"]["provider"], "bedrock")
        self.assertTrue(config["llm"]["streaming"])
        self.assertEqual(config["tts"]["provider"], "elevenlabs")

    def test_resolve_voice_config_accepts_deepgram_aura_2_selection(self):
        config = resolve_voice_config(
            {
                "language": "en",
                "tts": {"provider": "deepgram", "model": "aura-2", "voice": "aura-2-asteria-en"},
            },
            load_voice_catalog(),
        )

        self.assertEqual(config["tts"]["provider"], "deepgram")
        self.assertEqual(config["tts"]["model"], "aura-2")
        self.assertEqual(config["tts"]["voice"], "aura-2-asteria-en")

    def test_resolve_voice_config_accepts_sarvam_hindi_selection(self):
        config = resolve_voice_config(
            {
                "language": "hi",
                "tts": {"provider": "sarvam", "model": "bulbul:v3", "voice": "shubh"},
                "stt": {"provider": "sarvam", "model": "saaras:v3"},
            },
            load_voice_catalog(),
        )

        self.assertEqual(config["language"], "hi")
        self.assertEqual(config["stt"]["provider"], "sarvam")
        self.assertEqual(config["tts"]["voice"], "shubh")

    def test_resolve_voice_config_rejects_invalid_voice(self):
        with self.assertRaisesRegex(VoiceConfigValidationError, "voice is not supported"):
            resolve_voice_config(
                {"tts": {"provider": "elevenlabs", "model": "eleven_flash_v2_5", "voice": "missing"}},
                load_voice_catalog(),
            )


if __name__ == "__main__":
    unittest.main()
