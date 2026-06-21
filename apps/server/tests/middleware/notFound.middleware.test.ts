import assert from "node:assert/strict";
import { test } from "node:test";

import notFoundMiddleware from "../../src/middleware/notFound.middleware.js";

test("notFoundMiddleware returns the standard error envelope", () => {
  const response = {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };

  notFoundMiddleware(
    { headers: { "x-request-id": "req_404" } } as any,
    response as any
  );

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    success: false,
    code: "NOT_FOUND",
    message: "Route not found",
    details: null,
    fieldErrors: {},
    requestId: "req_404",
  });
});
