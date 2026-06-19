import assert from "node:assert/strict";
import { test } from "node:test";

import errorMiddleware from "../../src/middleware/error.middleware.js";

test("errorMiddleware hides unexpected 500 error details and returns a consistent shape", () => {
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

  errorMiddleware(
    new Error("database password leaked in stack detail"),
    {} as any,
    response as any,
    (() => undefined) as any
  );

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    success: false,
    message: "Something went wrong try again later",
  });
});
