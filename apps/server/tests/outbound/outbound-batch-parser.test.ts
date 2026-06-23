import assert from "node:assert/strict";
import { test } from "node:test";

import { parseBatchRecipients } from "../../src/modules/outbound/outbound-batch-parser.js";

test("parseBatchRecipients maps batch columns to overrides and dynamic variables", () => {
  const csv = [
    "phone_number,language,voice_id,first_message,prompt,city,other_dyn_variable",
    "+15550001111,en-US,aura-2-athena-en,Hi Sam,Keep this call short.,Austin,renewal",
    "+15550002222,,,Hello Pat,,Dallas,priority",
  ].join("\n");

  const result = parseBatchRecipients(Buffer.from(csv), "recipients.csv");

  assert.equal(result.validRows.length, 2);
  assert.equal(result.invalidRows.length, 0);
  assert.deepEqual(result.headers, [
    "phone_number",
    "language",
    "voice_id",
    "first_message",
    "prompt",
    "city",
    "other_dyn_variable",
  ]);
  assert.deepEqual(result.validRows[0], {
    rowNumber: 2,
    phoneNumber: "+15550001111",
    language: "en-US",
    voiceId: "aura-2-athena-en",
    firstMessage: "Hi Sam",
    systemPrompt: "Keep this call short.",
    dynamicVariables: {
      city: "Austin",
      other_dyn_variable: "renewal",
    },
  });
  assert.deepEqual(result.validRows[1], {
    rowNumber: 3,
    phoneNumber: "+15550002222",
    language: null,
    voiceId: null,
    firstMessage: "Hello Pat",
    systemPrompt: null,
    dynamicVariables: {
      city: "Dallas",
      other_dyn_variable: "priority",
    },
  });
});

test("parseBatchRecipients returns invalid rows for missing phone numbers", () => {
  const csv = [
    "phone_number,language,voice_id,first_message,prompt,city,other_dyn_variable",
    ",en-US,aura-2-athena-en,Hi,Prompt,Austin,value",
  ].join("\n");

  const result = parseBatchRecipients(Buffer.from(csv), "recipients.csv");

  assert.equal(result.validRows.length, 0);
  assert.deepEqual(result.invalidRows, [
    {
      rowNumber: 2,
      phoneNumber: "",
      error: "phone_number is required",
      raw: {
        phone_number: "",
        language: "en-US",
        voice_id: "aura-2-athena-en",
        first_message: "Hi",
        prompt: "Prompt",
        city: "Austin",
        other_dyn_variable: "value",
      },
    },
  ]);
});
