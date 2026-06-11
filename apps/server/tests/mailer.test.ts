import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { sendEmail } from "../src/lib/mailer.js";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
});

function setEmailEnv() {
  process.env.SMTP_HOST = "smtp.zeptomail.in";
  process.env.SMTP_PASSWORD = "test-token";
  process.env.FROM_EMAIL = "no-reply@mail.quickvoice.co";
}

test("sendEmail derives the ZeptoMail API endpoint from the SMTP host", async () => {
  setEmailEnv();

  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  await sendEmail(
    "verifyEmail",
    "ada@example.com",
    "https://console.quickvoice.co/verify",
    "Ada",
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.zeptomail.in/v1.1/email");
  assert.equal(calls[0].init?.method, "POST");
  const headers = calls[0].init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "test-token");
});

test("sendEmail rejects with a controlled error when ZeptoMail transport fails", async () => {
  setEmailEnv();
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;

  await assert.rejects(
    sendEmail(
      "resetPassword",
      "ada@example.com",
      "https://console.quickvoice.co/reset",
      "Ada",
    ),
    /Failed to send resetPassword email via ZeptoMail: fetch failed/,
  );
});
