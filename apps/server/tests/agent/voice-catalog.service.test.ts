import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const originalFetch = globalThis.fetch;
const originalAiApiUrl = process.env.AI_API_URL;
const originalInternalApiKey = process.env.INTERNAL_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.AI_API_URL = originalAiApiUrl;
  process.env.INTERNAL_API_KEY = originalInternalApiKey;
});

test("getVoiceCatalog fetches the AI voice catalog with internal auth", async () => {
  process.env.AI_API_URL = "http://ai.local:5555";
  process.env.INTERNAL_API_KEY = "internal-key";
  const calls: Array<{ url: string; headers: HeadersInit | undefined }> = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init?.headers });
    return Response.json({
      version: "2026-06-30",
      defaults: {},
      languages: [{ id: "en", label: "English", locale: "en-US" }],
      timezones: ["UTC"],
      stt_models: [],
      llm_models: [],
      tts_models: [],
      voices: [],
    });
  };

  const { getVoiceCatalog } = await import("../../src/modules/agent/agent.service.js");

  const catalog = await getVoiceCatalog();

  assert.equal(catalog.version, "2026-06-30");
  assert.equal(calls[0]?.url, "http://ai.local:5555/voice/catalog");
  assert.deepEqual(calls[0]?.headers, { "x-internal-key": "internal-key" });
});

test("getVoiceCatalog reports AI catalog failures as service unavailable", async () => {
  process.env.AI_API_URL = "http://ai.local:5555";
  process.env.INTERNAL_API_KEY = "internal-key";
  globalThis.fetch = async () =>
    Response.json({ detail: "AI unavailable" }, { status: 503 });

  const { getVoiceCatalog } = await import("../../src/modules/agent/agent.service.js");

  await assert.rejects(() => getVoiceCatalog(), {
    message: "Voice catalog is unavailable",
    statusCode: 503,
  });
});
