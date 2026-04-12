import { BadRequestError } from "../../common/errors/badRequest.js";
import { generateSlug } from "../../common/utils/generateSlug.js";
import * as agentRepository from "./agent.repository.js";
import type { CreateAgentArgs } from "./agent.schema.js";


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
