import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  decryptSecretValue,
  encryptSecretValue,
  encryptSecretFields,
  redactSecretFields,
  resolveSecretFields,
} from "../../src/lib/secrets.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

test("secret values are stored as encrypted envelopes and can be resolved for runtime use", () => {
  process.env.SECRET_ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  const encrypted = encryptSecretValue("sk_live_secret");

  assert.notEqual(encrypted, "sk_live_secret");
  assert.match(encrypted, /^qvsec:v1:/);
  assert.equal(decryptSecretValue(encrypted), "sk_live_secret");
});

test("secret-marked webhook fields are encrypted for storage, redacted for reads, and resolved for runtime", () => {
  process.env.SECRET_ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  const input = {
    webhook_url: "https://example.com/hook",
    method: "POST",
    headers: {
      Authorization: { type: "Secret", value: "Bearer token" },
      "X-Mode": { type: "Value", value: "test" },
    },
    body: {
      apiKey: { type: "Secret", value: "body-secret" },
    },
  };

  const encrypted = encryptSecretFields(input);

  assert.match(encrypted.headers.Authorization.value, /^qvsec:v1:/);
  assert.equal(encrypted.headers["X-Mode"].value, "test");

  assert.deepEqual(redactSecretFields(encrypted).headers.Authorization, {
    type: "Secret",
    value: null,
    redacted: true,
  });
  assert.equal(resolveSecretFields(encrypted).headers.Authorization.value, "Bearer token");
  assert.equal(resolveSecretFields(encrypted).body.apiKey.value, "body-secret");
});
