import { BadRequestError } from "../../common/errors/badRequest.js";
import { NotFoundError } from "../../common/errors/notFound.js";
import {
  buildAgentRuntimeConfig,
  type AgentRuntimeConfig,
} from "./runtime-config.mapper.js";
import * as runtimeConfigRepository from "./runtime-config.repository.js";

type RuntimeConfigSource = Parameters<typeof buildAgentRuntimeConfig>[0];

type RuntimeConfigRepository = {
  findByAgentId: (agentId: string) => Promise<RuntimeConfigSource | null>;
  findByPhoneNumber: (phoneNumber: string) => Promise<RuntimeConfigSource | null>;
};

type ResolveRuntimeConfigInput = {
  agentId?: string | null;
  phoneNumber?: string | null;
};

const defaultRepository: RuntimeConfigRepository = runtimeConfigRepository;

export async function resolveAgentRuntimeConfig(
  input: ResolveRuntimeConfigInput,
  repository: RuntimeConfigRepository = defaultRepository
): Promise<AgentRuntimeConfig> {
  const agentId = input.agentId?.trim() || null;
  const phoneNumber = input.phoneNumber?.trim() || null;

  if (!agentId && !phoneNumber) {
    throw new BadRequestError("agentId or phoneNumber is required");
  }

  const source = agentId
    ? await repository.findByAgentId(agentId)
    : await repository.findByPhoneNumber(phoneNumber!);

  if (!source) {
    throw new NotFoundError("Agent runtime configuration not found");
  }

  return buildAgentRuntimeConfig(source);
}
