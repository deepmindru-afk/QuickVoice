import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from utils.auth import is_explicit_dev_mode, verify_internal_headers
from utils.logger import redact_sensitive


class SecurityControlsTests(unittest.TestCase):
    def test_internal_auth_fails_closed_when_key_is_missing_outside_dev(self):
        with self.assertRaisesRegex(RuntimeError, "INTERNAL_API_KEY"):
            verify_internal_headers({}, internal_api_key="", allow_dev=False)

    def test_internal_auth_requires_matching_header(self):
        with self.assertRaises(PermissionError):
            verify_internal_headers({"x-internal-key": "wrong"}, internal_api_key="secret")

        verify_internal_headers({"x-internal-key": "secret"}, internal_api_key="secret")

    def test_explicit_dev_mode_requires_named_opt_in(self):
        self.assertFalse(is_explicit_dev_mode({}))
        self.assertFalse(is_explicit_dev_mode({"AI_ENV": "development"}))
        self.assertTrue(is_explicit_dev_mode({"AI_ALLOW_INSECURE_DEV_MODE": "true"}))

    def test_redact_sensitive_masks_pii_prompts_headers_and_webhook_urls(self):
        redacted = redact_sensitive(
            {
                "from_number": "+15550001111",
                "toNumber": "+15551230000",
                "system_prompt": "You are collecting SSNs.",
                "Authorization": "Bearer internal-secret",
                "post_call_webhook": {"webhook_url": "https://hooks.example.test/secret"},
                "transcripts": [{"message": "My SSN is 123-45-6789"}],
            }
        )

        serialized = str(redacted)
        self.assertNotIn("+15550001111", serialized)
        self.assertNotIn("internal-secret", serialized)
        self.assertNotIn("collecting SSNs", serialized)
        self.assertNotIn("hooks.example.test/secret", serialized)
        self.assertNotIn("123-45-6789", serialized)


if __name__ == "__main__":
    unittest.main()
