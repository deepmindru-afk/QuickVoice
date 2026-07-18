export type AgentVariables = {
  firstMessage: string[];
  systemPrompt: string[];
  placeholders?: Record<string, string>;
};

const DYNAMIC_VARIABLE_REGEX = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const names = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || item.length === 0) continue;
    names.add(item);
  }
  return [...names];
}

function normalizePlaceholders(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const placeholders: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof key !== "string" || key.length === 0) continue;
    placeholders[key] = typeof entry === "string" ? entry : "";
  }
  return placeholders;
}

export function extractDynamicVariableNames(value: string | null | undefined): string[] {
  if (!value) return [];

  const names = new Set<string>();
  for (const match of value.matchAll(DYNAMIC_VARIABLE_REGEX)) {
    names.add(match[1]);
  }
  return [...names];
}

export function normalizeAgentVariables(value: unknown): AgentVariables {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      firstMessage: [],
      systemPrompt: [],
      placeholders: {},
    };
  }

  const record = value as Record<string, unknown>;
  return {
    firstMessage: normalizeStringList(record.firstMessage),
    systemPrompt: normalizeStringList(record.systemPrompt),
    placeholders: normalizePlaceholders(record.placeholders),
  };
}

export function uniqueDynamicVariableNames(variables: AgentVariables): string[] {
  const names = new Set<string>();
  for (const name of variables.firstMessage) names.add(name);
  for (const name of variables.systemPrompt) names.add(name);
  return [...names];
}

export function placeholdersForVariables(
  variables: AgentVariables,
  source: Record<string, string> | undefined
): Record<string, string> {
  const placeholders: Record<string, string> = {};
  for (const name of uniqueDynamicVariableNames(variables)) {
    placeholders[name] = source?.[name] ?? "";
  }
  return placeholders;
}

export function buildAgentVariables(
  firstMessage: string,
  systemPrompt: string,
  placeholders?: Record<string, string>
): AgentVariables {
  const variables = {
    firstMessage: extractDynamicVariableNames(firstMessage),
    systemPrompt: extractDynamicVariableNames(systemPrompt),
  };

  return {
    ...variables,
    placeholders: placeholdersForVariables(variables, placeholders),
  };
}

export function dynamicVariablePayload(
  variables: AgentVariables,
  values: Record<string, string> | undefined
): Record<string, string> | undefined {
  const payload: Record<string, string> = {};
  for (const name of uniqueDynamicVariableNames(variables)) {
    const value = values?.[name]?.trim();
    if (value) payload[name] = value;
  }
  return Object.keys(payload).length > 0 ? payload : undefined;
}

export function missingDynamicVariableNames(
  variables: AgentVariables,
  placeholders: Record<string, string> | undefined
): string[] {
  return uniqueDynamicVariableNames(variables).filter(
    (name) => !placeholders?.[name]?.trim()
  );
}
