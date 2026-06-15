import { Prisma } from "../../../prisma/generated/prisma/client.js";
import { BadRequestError } from "../../common/errors/badRequest.js";
import { NotFoundError } from "../../common/errors/notFound.js";
import { generateSlug } from "../../common/utils/generateSlug.js";
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

  const configuration = await agentRepository.configureAgent(
    organizationId,
    agentId,
    data
  );

  if (!configuration) {
    throw new NotFoundError("Agent not found");
  }

  return configuration;
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

  return configuration;
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

  return configuration;
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

  return configuration;
};
