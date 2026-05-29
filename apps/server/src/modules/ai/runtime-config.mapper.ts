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
    sttModel?: string | null;
    ttsModel?: string | null;
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
  const sttModel = normalizeSttModel(input.configuration.sttModel ?? "nova-3");
  const ttsModel = normalizeTtsModel(input.configuration.ttsModel ?? "aura-2");
  const voiceId = normalizeTtsVoice(
    ttsModel,
    input.configuration.voiceId ?? "aura-2-asteria-en"
  );

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
    sttModel,
    ttsModel,
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

function normalizeTtsModel(model: string) {
  const trimmed = model.trim();
  if (trimmed.includes("/")) return trimmed;

  const provider = inferTtsProvider(trimmed);
  return `${provider}/${trimmed}`;
}

function inferTtsProvider(model: string) {
  const lower = model.toLowerCase();
  if (lower.startsWith("eleven")) return "elevenlabs";
  if (lower.startsWith("sonic")) return "cartesia";
  if (lower.startsWith("gpt-")) return "openai";
  if (lower.startsWith("rime-")) return "rime";
  return "deepgram";
}

function normalizeTtsVoice(ttsModel: string, voiceId: string) {
  const trimmed = voiceId.trim();
  const provider = getTtsProvider(ttsModel);
  if (provider !== "deepgram") return trimmed;

  const catalogId = trimmed.split("/").at(-1) ?? trimmed;
  const lower = catalogId.toLowerCase();
  if (lower.startsWith("aura-2-") && lower.endsWith("-en")) {
    return catalogId.slice("aura-2-".length, -"-en".length);
  }
  if (lower.startsWith("aura-2-")) {
    return catalogId.slice("aura-2-".length);
  }
  return catalogId;
}

function getTtsProvider(model: string) {
  if (model.includes("/")) {
    return model.split("/", 1)[0]?.toLowerCase() ?? inferTtsProvider(model);
  }
  return inferTtsProvider(model);
}

function normalizeSttModel(model: string) {
  const trimmed = model.trim();
  if (trimmed.includes("/")) return trimmed;

  const provider = inferSttProvider(trimmed);
  return `${provider}/${trimmed}`;
}

function inferSttProvider(model: string) {
  const lower = model.toLowerCase();
  if (lower.startsWith("universal")) return "assemblyai";
  if (lower.startsWith("gladia")) return "gladia";
  if (lower.startsWith("speechmatics")) return "speechmatics";
  if (lower.startsWith("elevenlabs")) return "elevenlabs";
  return "deepgram";
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
