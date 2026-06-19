import { NotFoundError } from "../../common/errors/notFound.js";
import { assertSafeRemoteUrl } from "../../lib/url-safety.js";
import {
  redactKeyValueSecrets,
} from "../../lib/secrets.js";
import { storeKeyValueSecretReferences } from "../secrets/secret-store.service.js";
import * as toolRepository from "./tool.repository.js";
import type { CreateToolArgs, UpdateToolInput } from "./tool.schema.js";

export const listTools = async (organizationId: string) =>
  (await toolRepository.listTools(organizationId)).map(redactToolSecrets);

export const createTool = async (args: CreateToolArgs) => {
  await assertSafeRemoteUrl(args.api_url);
  return redactToolSecrets(
    await toolRepository.createTool(
      await protectToolSecrets(args.organizationId, args.userId, args)
    )
  );
};

export const updateTool = async (
  organizationId: string,
  toolId: string,
  data: UpdateToolInput
) => {
  if (data.api_url) {
    await assertSafeRemoteUrl(data.api_url);
  }
  const updated = await toolRepository.updateTool(
    organizationId,
    toolId,
    await protectToolSecrets(organizationId, null, data)
  );
  if (!updated) throw new NotFoundError("Tool not found");
  return redactToolSecrets(updated);
};

export const deleteTool = async (organizationId: string, toolId: string) => {
  const result = await toolRepository.deleteTool(organizationId, toolId);
  if (result.count === 0) throw new NotFoundError("Tool not found");
};

export const getAgentTools = async (organizationId: string, agentId: string) => {
  const tools = await toolRepository.getAgentTools(organizationId, agentId);
  if (tools === null) throw new NotFoundError("Agent not found");
  return tools.map(redactToolSecrets);
};

export const attachTool = async (
  organizationId: string,
  agentId: string,
  toolId: string
) => {
  const result = await toolRepository.attachTool(organizationId, agentId, toolId);
  if (result === null) throw new NotFoundError("Agent or tool not found");
};

export const detachTool = async (
  organizationId: string,
  agentId: string,
  toolId: string
) => {
  const result = await toolRepository.detachTool(organizationId, agentId, toolId);
  if (result === null) throw new NotFoundError("Agent not found");
};

async function protectToolSecrets<T extends Record<string, any>>(
  organizationId: string,
  userId: string | null,
  tool: T
): Promise<T> {
  return {
    ...tool,
    api_headers: await storeKeyValueSecretReferences(tool.api_headers, {
      organizationId,
      userId,
      namePrefix: "tool:api_headers",
    }),
    dynamic_variables: await storeKeyValueSecretReferences(tool.dynamic_variables, {
      organizationId,
      userId,
      namePrefix: "tool:dynamic_variables",
    }),
  };
}

function redactToolSecrets<T extends Record<string, any>>(tool: T): T {
  return {
    ...tool,
    api_headers: redactKeyValueSecrets(tool.api_headers),
    dynamic_variables: redactKeyValueSecrets(tool.dynamic_variables),
  };
}
