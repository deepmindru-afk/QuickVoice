import os
import sys
import unittest
from unittest.mock import patch

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from handlers.livekit_handler import get_recording_storage_config, recording_path


class LiveKitHandlerTests(unittest.TestCase):
    def test_recording_path_uses_shared_s3_recording_prefix(self):
        self.assertEqual(
            recording_path("recording-123"),
            "Voice-agents/Recordings/recording-123.ogg",
        )

    def test_recording_storage_config_prefers_standard_aws_env_names(self):
        with patch.dict(
            os.environ,
            {
                "AWS_ACCESS_KEY_ID": "aws-access",
                "AWS_SECRET_ACCESS_KEY": "aws-secret",
                "AWS_SESSION_TOKEN": "aws-session-token",
                "AWS_REGION": "us-west-2",
                "S3_BUCKET_NAME": "quickvoice-recordings",
                "ACCESS_KEY": "legacy-access",
                "SECRET_ACCESS_KEY": "legacy-secret",
                "REGION": "legacy-region",
            },
            clear=True,
        ):
            config = get_recording_storage_config()

        self.assertEqual(config["access_key"], "aws-access")
        self.assertEqual(config["secret"], "aws-secret")
        self.assertEqual(config["session_token"], "aws-session-token")
        self.assertEqual(config["region"], "us-west-2")
        self.assertEqual(config["bucket"], "quickvoice-recordings")


if __name__ == "__main__":
    unittest.main()
