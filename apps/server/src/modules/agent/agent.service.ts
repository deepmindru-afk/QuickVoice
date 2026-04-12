import { BadRequestError } from "../../common/errors/badRequest.js";
import { NotFoundError } from "../../common/errors/notFound.js";
import { generateSlug } from "../../common/utils/generateSlug.js";
import * as agentRepository from "./agent.repository.js";
import type { CreateAgentArgs, UpdateAgentInput } from "./agent.schema.js";


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