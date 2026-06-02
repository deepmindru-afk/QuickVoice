import { NotFoundError } from "../../common/errors/notFound.js";
import * as toolRepository from "./tool.repository.js";
import type { CreateToolArgs, UpdateToolInput } from "./tool.schema.js";

export const listTools = (organizationId: string) =>
  toolRepository.listTools(organizationId);

export const createTool = (args: CreateToolArgs) =>
  toolRepository.createTool(args);

export const updateTool = async (
  organizationId: string,
  toolId: string,
  data: UpdateToolInput
) => {
  const updated = await toolRepository.updateTool(organizationId, toolId, data);
  if (!updated) throw new NotFoundError("Tool not found");
  return updated;
};

export const deleteTool = async (organizationId: string, toolId: string) => {
  const result = await toolRepository.deleteTool(organizationId, toolId);
  if (result.count === 0) throw new NotFoundError("Tool not found");
};

export const getAgentTools = async (organizationId: string, agentId: string) => {
  const tools = await toolRepository.getAgentTools(organizationId, agentId);
  if (tools === null) throw new NotFoundError("Agent not found");
  return tools;
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
