import assert from "node:assert/strict";
import { test } from "node:test";

import { signCallRecordingUrl } from "../../src/modules/calllogs/calllog.service.js";

test("signCallRecordingUrl replaces a stored S3 key with a signed playback URL", async () => {
  const call = {
    callId: "SCL_recording123",
    audioRecordingPath: "Voice-agents/Recordings/recording-123.ogg",
  };

  const signed = await signCallRecordingUrl(call, async (key) => {
    return `https://recordings.quickvoice.test/${encodeURIComponent(key)}?signature=test`;
  });

  assert.equal(
    signed.audioRecordingPath,
    "https://recordings.quickvoice.test/Voice-agents%2FRecordings%2Frecording-123.ogg?signature=test"
  );
  assert.equal(call.audioRecordingPath, "Voice-agents/Recordings/recording-123.ogg");
});

test("signCallRecordingUrl leaves missing recordings and existing URLs unchanged", async () => {
  const nullRecording = await signCallRecordingUrl(
    { callId: "SCL_no_recording", audioRecordingPath: null },
    async () => {
      throw new Error("should not sign empty recording path");
    }
  );
  assert.equal(nullRecording.audioRecordingPath, null);

  const existingUrl = await signCallRecordingUrl(
    {
      callId: "SCL_url_recording",
      audioRecordingPath: "https://cdn.quickvoice.test/recording.ogg",
    },
    async () => {
      throw new Error("should not sign existing URL");
    }
  );
  assert.equal(
    existingUrl.audioRecordingPath,
    "https://cdn.quickvoice.test/recording.ogg"
  );
});
