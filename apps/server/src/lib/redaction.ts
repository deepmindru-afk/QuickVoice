const SENSITIVE_KEY_PATTERN = /(authorization|api[-_]?key|token|secret|password|credential)/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?<!\d)\+?\d[\d\s().-]{7,}\d(?!\d)/g;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;

export function redactText(value: string) {
  return value
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(PHONE_PATTERN, "[REDACTED_PHONE]")
    .replace(SSN_PATTERN, "[REDACTED_SSN]")
    .replace(CARD_PATTERN, "[REDACTED_CARD]");
}

export function redactJson<T>(value: T): T {
  return redactJsonValue(value, null) as T;
}

function redactJsonValue(value: unknown, key: string | null): unknown {
  if (key && SENSITIVE_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactJsonValue(item, null));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      redactJsonValue(childValue, childKey),
    ])
  );
}
