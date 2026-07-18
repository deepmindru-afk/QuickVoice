import { currentAuthContext } from "./auth-context.js";

const trim = (value: string) => value.replace(/\/+$/, "");

export const quickvoiceApiBaseUrl = trim(
  process.env.QUICKVOICE_API_BASE_URL ?? "http://localhost:5000/api/v1",
);

export type ApiCall = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
};

export class UpstreamApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
  }
}

export async function callQuickVoiceApi<T = unknown>({ method, path, query, body }: ApiCall): Promise<T> {
  const { upstreamApiKey } = currentAuthContext();
  const url = new URL(`${quickvoiceApiBaseUrl}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": upstreamApiKey,
    },
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : undefined) ?? `QuickVoice API request failed with HTTP ${response.status}`;
    throw new UpstreamApiError(message, response.status, payload);
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
