import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.privacy_handler import should_store_call_audio


class PrivacyHandlerTests(unittest.TestCase):
    def test_should_store_call_audio_respects_agent_controls(self):
        self.assertTrue(should_store_call_audio({"store_call_audio": True}))
        self.assertFalse(should_store_call_audio({"store_call_audio": False}))
        self.assertFalse(should_store_call_audio({"store_call_audio": True, "zero_pii_retention": True}))


if __name__ == "__main__":
    unittest.main()
