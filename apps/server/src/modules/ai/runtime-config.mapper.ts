type RuntimeConfigSource = {
  agentId: string;
  organizationId: string;
  userId?: string | null;
  number?: string | null;
  provider?: string | null;
  configuration: {
    firstMessage?: string | null;
    systemPrompt?: string | null;
    llmModel?: string | null;
    voiceId?: string | null;
    agent_language?: string | null;
    use_rag?: boolean | null;
    data_needed?: unknown;
    data_evaluation?: unknown;
    post_call_webhook?: unknown;
    initiation_webhook?: unknown;
    variables?: unknown;
    preemptive_generation?: boolean | null;
    timezone?: string | null;
  };
};

export type AgentRuntimeConfig = ReturnType<typeof buildAgentRuntimeConfig>;

export function buildAgentRuntimeConfig(input: RuntimeConfigSource) {
  const llm = normalizeLlmModel(input.configuration.llmModel ?? "gpt-4o-mini");
  const voiceId = input.configuration.voiceId ?? "aura-2-asteria-en";

  return {
    agentId: input.agentId,
    organizationId: input.organizationId,
    userId: input.userId ?? null,
    agentNumber: input.number ?? null,
    provider: input.provider ?? null,
    firstMessage:
      input.configuration.firstMessage ?? "Hello, how can I help you today?",
    systemPrompt:
      input.configuration.systemPrompt ??
      "You are a friendly, reliable voice assistant.",
    llmModel: llm.model,
    llmProvider: llm.provider,
    ttsModel: normalizeTtsModel(voiceId),
    voiceId,
    agent_language: normalizeLanguage(input.configuration.agent_language ?? "en-US"),
    use_rag: input.configuration.use_rag ?? false,
    data_needed: input.configuration.data_needed ?? [],
    data_evaluation: input.configuration.data_evaluation ?? [],
    post_call_webhook: input.configuration.post_call_webhook ?? null,
    initiation_webhook: input.configuration.initiation_webhook ?? null,
    variables: input.configuration.variables ?? null,
    preemptive_generation: input.configuration.preemptive_generation ?? false,
    timezone: input.configuration.timezone ?? "UTC",
  };
}

function normalizeLlmModel(model: string) {
  const trimmed = model.trim();
  if (trimmed.includes("/")) {
    const provider = trimmed.split("/", 1)[0] ?? inferLlmProvider(trimmed);
    return { model: trimmed, provider: provider.toLowerCase() };
  }

  const provider = inferLlmProvider(trimmed);
  return { model: `${provider}/${trimmed}`, provider };
}

function inferLlmProvider(model: string) {
  const lower = model.toLowerCase();
  if (lower.startsWith("gemini")) return "google";
  if (lower.startsWith("claude")) return "anthropic";
  return "openai";
}

function normalizeTtsModel(voiceId: string) {
  if (voiceId.startsWith("aura-2-")) return "deepgram/aura-2";
  return "deepgram/aura-2";
}

function normalizeLanguage(language: string) {
  const normalized = language.trim();
  if (normalized.includes("-")) return normalized;

  const languageMap: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    hi: "hi-IN",
    pt: "pt-BR",
  };

  return languageMap[normalized.toLowerCase()] ?? normalized;
}
