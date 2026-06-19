import { Prisma } from "../../../prisma/generated/prisma/client.js";
import { BadRequestError } from "../../common/errors/badRequest.js";
import { NotFoundError } from "../../common/errors/notFound.js";
import { generateSlug } from "../../common/utils/generateSlug.js";
import { assertSafeRemoteUrl } from "../../lib/url-safety.js";
import {
  redactSecretFields,
} from "../../lib/secrets.js";
import {
  resolveSecretReferences,
  storeSecretReferences,
} from "../secrets/secret-store.service.js";
import * as agentRepository from "./agent.repository.js";
import type { ConfigureAgentArgs, CreateAgentArgs, UpdateAgentInput } from "./agent.schema.js";


export const createAgent = async (args: CreateAgentArgs) => {

  const agentSlug = generateSlug(args.name);
  const existing = await agentRepository.findBySlug(
    args.organizationId,
    agentSlug
  );

  if (existing) {
    throw new BadRequestError(
      "An agent with a similar name already exists in this organization"
    );
  }


  return agentRepository.createAgent({
    ...args,
    agentSlug,
  });
};

export const getAgents = async (organizationId: string) => {
  return agentRepository.getAgents(organizationId);
};

export const updateAgent = async (
  organizationId: string,
  agentId: string,
  input: UpdateAgentInput
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
        "An agent with a similar name already exists in this organization"
      );
    }
    data.agentSlug = newSlug;
  }

  const updated = await agentRepository.updateAgent(
    organizationId,
    agentId,
    data
  );

  if (!updated) {
    throw new NotFoundError("Agent not found");
  }

  return updated;
};

export const configureAgent = async (args: ConfigureAgentArgs) => {
  const { organizationId, userId, agentId, ...data } = args;
  await assertSafeWebhookUrls(data);

  const configuration = await agentRepository.configureAgent(
    organizationId,
    agentId,
    await protectAgentConfigSecrets(organizationId, userId, agentId, data)
  );

  if (!configuration) {
    throw new NotFoundError("Agent not found");
  }

  return redactAgentConfigSecrets(configuration);
};

export const getAgentConfig = async (
  organizationId: string,
  agentId: string
) => {
  const configuration = await agentRepository.getAgentConfig(
    organizationId,
    agentId
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
    normalizedPhoneNumber
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

  const configuration = await agentRepository.getAgentConfigByIdForRuntime(
    normalizedAgentId
  );

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
  data: T
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

function redactAgentConfigSecrets<T extends Record<string, any>>(configuration: T): T {
  return {
    ...configuration,
    initiation_webhook: redactSecretFields(configuration.initiation_webhook),
    post_call_webhook: redactSecretFields(configuration.post_call_webhook),
  };
}

async function resolveRuntimeConfigSecrets<T extends Record<string, any>>(configuration: T): Promise<T> {
  const organizationId = configuration.organizationId;
  return {
    ...configuration,
    initiation_webhook: organizationId
      ? await resolveSecretReferences(configuration.initiation_webhook, organizationId)
      : configuration.initiation_webhook,
    post_call_webhook: organizationId
      ? await resolveSecretReferences(configuration.post_call_webhook, organizationId)
      : configuration.post_call_webhook,
    tools: Array.isArray(configuration.tools)
      ? await Promise.all(
          configuration.tools.map((tool) =>
            organizationId ? resolveSecretReferences(tool, organizationId) : tool
          )
        )
      : configuration.tools,
  };
}
