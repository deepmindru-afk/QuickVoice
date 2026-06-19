import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";

import validate from "../../src/middleware/validate.middleware.js";

test("validate replaces req.body with parsed Zod output", () => {
  const schema = z
    .object({
      limit: z.coerce.number().default(20),
      name: z.string().trim(),
    })
    .strip();
  const req = {
    body: {
      limit: "5",
      name: " Ada ",
      ignored: "drop me",
    },
  } as any;
  const nextCalls: unknown[] = [];

  validate(schema)(req, {} as any, (error?: unknown) => {
    nextCalls.push(error);
  });

  assert.deepEqual(req.body, { limit: 5, name: "Ada" });
  assert.deepEqual(nextCalls, [undefined]);
});
