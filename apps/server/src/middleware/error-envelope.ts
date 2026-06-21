import type { Request } from "express";

type FieldErrors = Record<string, string[]>;

export type ErrorEnvelopeArgs = {
  code: string;
  message: string;
  details?: unknown;
  fieldErrors?: FieldErrors;
  requestId?: string | null;
};

export function createErrorEnvelope({
  code,
  message,
  details = null,
  fieldErrors = {},
  requestId = null,
}: ErrorEnvelopeArgs) {
  return {
    success: false,
    code,
    message,
    details,
    fieldErrors,
    requestId,
  };
}

export function getRequestId(req: Request) {
  return (
    getHeaderValue(req.headers["x-request-id"]) ??
    getHeaderValue(req.headers["x-correlation-id"])
  );
}

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
