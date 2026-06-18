type KbProcessingItem = {
  kbId?: unknown;
  status?: unknown;
  error?: unknown;
};

type KbProcessingResponse = {
  success?: unknown;
  processed?: unknown;
};

export function assertKbProcessingSucceeded(
  body: KbProcessingResponse,
  expectedKbIds: string[]
) {
  if (body?.success !== true || !Array.isArray(body.processed)) {
    throw new Error("KB processing returned an invalid response body");
  }

  const processed = body.processed as KbProcessingItem[];
  const failures = processed.filter((item) => item.status !== "ok");
  const processedIds = new Set(
    processed
      .map((item) => (typeof item.kbId === "string" ? item.kbId : null))
      .filter((kbId): kbId is string => kbId !== null)
  );
  const missingIds = expectedKbIds.filter((kbId) => !processedIds.has(kbId));

  if (failures.length > 0 || missingIds.length > 0) {
    const failureSummary = failures
      .map((item) => {
        const kbId = typeof item.kbId === "string" ? item.kbId : "unknown";
        const error = typeof item.error === "string" ? item.error : "unknown error";
        return `${kbId}: ${error}`;
      })
      .join("; ");
    const missingSummary = missingIds.length
      ? `missing results for ${missingIds.join(", ")}`
      : "";
    const details = [failureSummary, missingSummary].filter(Boolean).join("; ");
    throw new Error(`KB processing failed: ${details}`);
  }
}
