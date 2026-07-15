import { randomUUID } from "node:crypto";
import { Prisma } from "../../../prisma/generated/prisma/client.js";
import { BadRequestError } from "../../common/errors/badRequest.js";
import CustomApiError from "../../common/errors/customApiError.js";
import { NotFoundError } from "../../common/errors/notFound.js";
import { generateSlug } from "../../common/utils/generateSlug.js";
import { assertSafeRemoteUrl } from "../../lib/url-safety.js";
import { redactSecretFields } from "../../lib/secrets.js";
import {
  resolveSecretReferences,
  storeSecretReferences,
} from "../secrets/secret-store.service.js";
import * as agentRepository from "./agent.repository.js";
import { templateConfigFor } from "./agent.templates.js";
import type {
  ConfigureAgentArgs,
  CreateAgentArgs,
  UpdateAgentInput,
} from "./agent.schema.js";

export type VoiceCatalog = {
  version: string;
  defaults: Record<string, unknown>;
  languages: Array<{ id: string; label: string; locale?: string }>;
  timezones: string[];
  stt_models: Array<Record<string, unknown>>;
  llm_models: Array<Record<string, unknown>>;
  tts_models: Array<Record<string, unknown>>;
  voices: Array<Record<string, unknown>>;
};

export const PREVIEW_SESSION_TTL_SECONDS = 10800;

type PreviewConfigSource = {
  agentId: string;
  organizationId: string;
  agent_language: string;
  timezone: string;
  sttModel: string;
  llmModel: string;
  ttsModel: string;
  voiceId: string;
  firstMessage: string;
  systemPrompt: string;
  variables?: unknown;
};

export type AgentPreviewSessionPayload = {
  room: { name: string };
  participant: { identity: string; name: string };
  config: {
    language: string;
    timezone: string;
    stt: { model: string };
    llm: { model: string };
    tts: { model: string; voice: string };
  };
  metadata: {
    mode: "preview";
    agent_id: string;
    organization_id: string;
    first_message: string;
    system_prompt: string;
    dynamic_variables?: Record<string, string>;
    retention: "ephemeral";
  };
  ttl_seconds: number;
};

export type AgentPreviewSession = {
  livekitUrl: string;
  roomName: string;
  participant: {
    identity: string;
    name: string;
    token: string;
    ttlSeconds: number;
  };
  agent: {
    name: string;
    dispatchId: string;
  };
  expiresAt: string;
};

export const createAgent = async (args: CreateAgentArgs) => {
  const agentSlug = generateSlug(args.name);
  const existing = await agentRepository.findBySlug(
    args.organizationId,
    agentSlug,
  );

  if (existing) {
    throw new BadRequestError(
      "An agent with a similar name already exists in this organization",
    );
  }

  const createInput = {
    ...args,
    agentSlug,
  };
  const templateConfig = templateConfigFor(args.templateId);

  if (templateConfig) {
    return agentRepository.createAgentWithConfiguration(
      createInput,
      templateConfig
    );
  }

  return agentRepository.createAgent(createInput);
};

export const getAgents = async (organizationId: string) => {
  return agentRepository.getAgents(organizationId);
};

export const getVoiceCatalog = async (): Promise<VoiceCatalog> => {
  const aiApiUrl = process.env.AI_API_URL ?? "http://localhost:5555";
  const internalApiKey = process.env.INTERNAL_API_KEY ?? "";
  const response = await fetch(`${aiApiUrl.replace(/\/$/, "")}/voice/catalog`, {
    headers: { "x-internal-key": internalApiKey },
  });

  if (!response.ok) {
    throw new CustomApiError("Voice catalog is unavailable", 503);
  }

  return (await response.json()) as VoiceCatalog;
};

export const createAgentPreviewSession = async (
  organizationId: string,
  agentId: string,
): Promise<AgentPreviewSession> => {
  const configuration = await getAgentConfig(organizationId, agentId);
  return requestAgentPreviewSession(
    buildAgentPreviewSessionPayload({
      agentId,
      organizationId,
      agent_language: configuration.agent_language,
      timezone: configuration.timezone,
      sttModel: configuration.sttModel,
      llmModel: configuration.llmModel,
      ttsModel: configuration.ttsModel,
      voiceId: configuration.voiceId,
      firstMessage: configuration.firstMessage,
      systemPrompt: configuration.systemPrompt,
      variables: configuration.variables,
    }),
  );
};

export const buildAgentPreviewSessionPayload = (
  configuration: PreviewConfigSource,
): AgentPreviewSessionPayload => {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  const dynamicVariables = previewDynamicVariables(configuration.variables);
  return {
    room: { name: `preview-${suffix}` },
    participant: {
      identity: `preview-user-${suffix}`,
      name: "Preview user",
    },
    config: {
      language: configuration.agent_language,
      timezone: configuration.timezone,
      stt: { model: configuration.sttModel },
      llm: { model: configuration.llmModel },
      tts: {
        model: configuration.ttsModel,
        voice: configuration.voiceId,
      },
    },
    metadata: {
      mode: "preview",
      agent_id: configuration.agentId,
      organization_id: configuration.organizationId,
      first_message: configuration.firstMessage,
      system_prompt: configuration.systemPrompt,
      ...(Object.keys(dynamicVariables).length > 0
        ? { dynamic_variables: dynamicVariables }
        : {}),
      retention: "ephemeral",
    },
    ttl_seconds: PREVIEW_SESSION_TTL_SECONDS,
  };
};

function previewDynamicVariables(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const placeholders = (value as { placeholders?: unknown }).placeholders;
  if (
    !placeholders ||
    typeof placeholders !== "object" ||
    Array.isArray(placeholders)
  ) {
    return {};
  }

  const variables: Record<string, string> = {};
  for (const [key, entry] of Object.entries(
    placeholders as Record<string, unknown>,
  )) {
    const name = key.trim();
    if (!name || typeof entry !== "string") continue;
    const variableValue = entry.trim();
    if (variableValue) variables[name] = variableValue;
  }
  return variables;
}

export const requestAgentPreviewSession = async (
  payload: AgentPreviewSessionPayload,
): Promise<AgentPreviewSession> => {
  const aiApiUrl = process.env.AI_API_URL ?? "http://localhost:5555";
  const internalApiKey = process.env.INTERNAL_API_KEY ?? "";
  const response = await fetch(
    `${aiApiUrl.replace(/\/$/, "")}/voice/sessions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-key": internalApiKey,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new CustomApiError("Agent preview is unavailable", 503);
  }

  const body = (await response.json()) as {
    livekit_url?: string;
    room?: { name?: string };
    participant?: {
      identity?: string;
      name?: string;
      token?: string;
      ttl_seconds?: number;
    };
    agent?: {
      name?: string;
      dispatch_id?: string;
    };
  };

  const ttlSeconds = body.participant?.ttl_seconds ?? payload.ttl_seconds;
  return {
    livekitUrl: requireString(body.livekit_url, "livekit_url"),
    roomName: requireString(body.room?.name, "room.name"),
    participant: {
      identity: requireString(
        body.participant?.identity,
        "participant.identity",
      ),
      name: requireString(body.participant?.name, "participant.name"),
      token: requireString(body.participant?.token, "participant.token"),
      ttlSeconds,
    },
    agent: {
      name: requireString(body.agent?.name, "agent.name"),
      dispatchId: requireString(body.agent?.dispatch_id, "agent.dispatch_id"),
    },
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  };
};

export const updateAgent = async (
  organizationId: string,
  agentId: string,
  input: UpdateAgentInput,
) => {
  const data: UpdateAgentInput & { agentSlug?: string } = { ...input };

  // If the name is changing, regenerate the slug and verify uniqueness.
  // Allow a rename that resolves to the same slug on the *same* agent
  // (idempotent); reject only if another agent in the org already owns it.
  if (input.name) {
    const newSlug = generateSlug(input.name);
    const existing = await agentRepository.findBySlug(organizationId, newSlug);
    if (existing && existing.agentId !== agentId) {
      throw new BadRequestError(
        "An agent with a similar name already exists in this organization",
      );
    }
    data.agentSlug = newSlug;
  }

  const updated = await agentRepository.updateAgent(
    organizationId,
    agentId,
    data,
  );

  if (!updated) {
    throw new NotFoundError("Agent not found");
  }

  return updated;
};

export const deleteAgent = async (
  organizationId: string,
  agentId: string,
) => {
  const result = await agentRepository.deleteAgent(organizationId, agentId);

  if (result.count === 0) {
    throw new NotFoundError("Agent not found");
  }
};

export const configureAgent = async (args: ConfigureAgentArgs) => {
  const { organizationId, userId, agentId, ...data } = args;
  await assertSafeWebhookUrls(data);

  const configuration = await agentRepository.configureAgent(
    organizationId,
    agentId,
    await protectAgentConfigSecrets(organizationId, userId, agentId, data),
  );

  if (!configuration) {
    throw new NotFoundError("Agent not found");
  }

  return redactAgentConfigSecrets(configuration);
};

export const getAgentConfig = async (
  organizationId: string,
  agentId: string,
) => {
  const configuration = await agentRepository.getAgentConfig(
    organizationId,
    agentId,
  );

  if (!configuration) {
    throw new NotFoundError("Agent configuration not found");
  }

  return redactAgentConfigSecrets(configuration);
};

export const getAgentConfigByNumber = async (phoneNumber: string) => {
  const normalizedPhoneNumber = phoneNumber.trim();

  if (!normalizedPhoneNumber) {
    throw new BadRequestError("Phone number is required");
  }

  const configuration = await agentRepository.getAgentConfigByNumber(
    normalizedPhoneNumber,
  );

  if (!configuration) {
    throw new NotFoundError("Agent configuration not found");
  }

  return resolveRuntimeConfigSecrets(configuration);
};

export const getAgentConfigByIdForRuntime = async (agentId: string) => {
  const normalizedAgentId = agentId.trim();

  if (!normalizedAgentId) {
    throw new BadRequestError("Agent id is required");
  }

  const configuration =
    await agentRepository.getAgentConfigByIdForRuntime(normalizedAgentId);

  if (!configuration) {
    throw new NotFoundError("Agent configuration not found");
  }

  return resolveRuntimeConfigSecrets(configuration);
};

async function assertSafeWebhookUrls(data: Partial<ConfigureAgentArgs>) {
  const urls = [
    data.initiation_webhook?.webhook_url,
    data.post_call_webhook?.webhook_url,
  ].filter((url): url is string => typeof url === "string" && url.length > 0);

  await Promise.all(urls.map((url) => assertSafeRemoteUrl(url)));
}

async function protectAgentConfigSecrets<T extends Record<string, any>>(
  organizationId: string,
  userId: string,
  agentId: string,
  data: T,
): Promise<T> {
  return {
    ...data,
    initiation_webhook: await storeSecretReferences(data.initiation_webhook, {
      organizationId,
      userId,
      namePrefix: `agent:${agentId}:initiation_webhook`,
    }),
    post_call_webhook: await storeSecretReferences(data.post_call_webhook, {
      organizationId,
      userId,
      namePrefix: `agent:${agentId}:post_call_webhook`,
    }),
  };
}

function redactAgentConfigSecrets<T extends Record<string, any>>(
  configuration: T,
): T {
  return {
    ...configuration,
    initiation_webhook: redactSecretFields(configuration.initiation_webhook),
    post_call_webhook: redactSecretFields(configuration.post_call_webhook),
  };
}

async function resolveRuntimeConfigSecrets<T extends Record<string, any>>(
  configuration: T,
): Promise<T> {
  const organizationId = configuration.organizationId;
  return {
    ...configuration,
    initiation_webhook: organizationId
      ? await resolveSecretReferences(
          configuration.initiation_webhook,
          organizationId,
        )
      : configuration.initiation_webhook,
    post_call_webhook: organizationId
      ? await resolveSecretReferences(
          configuration.post_call_webhook,
          organizationId,
        )
      : configuration.post_call_webhook,
    tools: Array.isArray(configuration.tools)
      ? await Promise.all(
          configuration.tools.map((tool) =>
            organizationId
              ? resolveSecretReferences(tool, organizationId)
              : tool,
          ),
        )
      : configuration.tools,
  };
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new CustomApiError(
      `AI preview response is missing ${fieldName}`,
      503,
    );
  }
  return value;
}
