import { Prisma } from "../../../prisma/generated/prisma/client.js";
import prisma from "../../config/prisma.js";
import type { CreateAgentArgs, UpdateAgentInput, ConfigureAgentInput } from "./agent.schema.js";

type CreateAgentInput = CreateAgentArgs & { agentSlug: string };
type UpdateAgentRepoInput = UpdateAgentInput & { agentSlug?: string };

export const createAgent = async (agent: CreateAgentInput) => {
  const newAgent = await prisma.agent.create({
    data: agent,
  });
  return newAgent;
};

export const findBySlug = async (
  organizationId: string,
  agentSlug: string
) => {
  return prisma.agent.findUnique({
    where: {
      organizationId_agentSlug: {
        organizationId,
        agentSlug,
      },
    },
  });
};


export const getAgents = async (organizationId: string) => {
  return prisma.agent.findMany({
    where: {
      organizationId,
    },
  });
};

export const updateAgent = async (
  organizationId: string,
  agentId: string,
  data: UpdateAgentRepoInput
) => {
  // updateMany with a composite {agentId, organizationId} predicate is the
  // tenant-safe write: a row that belongs to another org yields count: 0
  // instead of being updated.
  const result = await prisma.agent.updateMany({
    where: { agentId, organizationId },
    data,
  });
  if (result.count === 0) return null;
  return prisma.agent.findUnique({ where: { agentId } });
};

export const configureAgent = async (
  organizationId: string,
  agentId: string,
  data: ConfigureAgentInput
) => {
  // Tenant pre-check — bail early with null (service maps to NotFoundError).
  // findUnique on the PK, then compare org, is cheaper than a composite findFirst.
  const agent = await prisma.agent.findFirst({
    where: {
      agentId,
      organizationId
    }
  });
  if (!agent ) return null;

  const prismaConfigData = {
    ...data,
    initiation_webhook: data.initiation_webhook ?? Prisma.JsonNull,
    post_call_webhook: data.post_call_webhook ?? Prisma.JsonNull,
  };

  return prisma.$transaction(async (tx) => {
    const existing = await tx.agentConfiguration.findUnique({
      where: { agentId },
      select: { agentConfigId: true },
    });

    if (existing) {
      // Update path — do NOT touch isConfigured (already true from first create).
      return tx.agentConfiguration.update({
        where: { agentId },
        data: prismaConfigData,
      });
    }

    // Create path — write the config and flip the agent flag atomically.
    const [configuration] = await Promise.all([
      tx.agentConfiguration.create({
        data: {
          agentId,
          ...prismaConfigData,
          concurrent_calls_limit: 5,
          daily_calls_limit: 20,
          max_conversation_duration_seconds: 600,
          silence_end_call_timeout_seconds: 30,
          turn_timeout_seconds: 30,
          user_input_audio_format: "mp3",
          store_call_audio: true,
          zero_pii_retention: false,
          conversation_retention_days: 30,
          enable_auth_for_agent_api: false,
          voice_similarity_boost: 0.5,
          voice_speed: 1.0,
          voice_stability: 0.5,
        },
      }),
      tx.agent.update({
        where: { agentId },
        data: { isConfigured: true },
      }),
    ]);

    return configuration;
  });
};

export const getAgentConfig = async (
  organizationId: string,
  agentId: string
) => {
  // Filter through the agent relation so a config row owned by another
  // org cannot be returned even if the caller guesses a valid agentId.
  return prisma.agentConfiguration.findFirst({
    where: {
      agentId,
      agent: { organizationId },
    },
  });
};

// Cross-entity foreign-key check used by linkAgent to verify the target agent
// lives in the same org as the number being linked. Kept here rather than in
// agent.repository.ts so the numbers module does not reach across module
// boundaries at the service layer.
export const agentExistsInOrg = async (
  agentId: string,
  organizationId: string
) => {
  const row = await prisma.agent.findFirst({
    where: { agentId, organizationId },
    select: { agentId: true },
  });
  return row !== null;
};

export const getAgentConfigByNumber= async (
  phoneNumber:string
)=>{
  const phone = await prisma.phoneNumber.findUnique({
    where: {
      number: phoneNumber,
    },
    include: {
      agent: {
        include: {
          configuration: true,
        },
      },
    },
  });
  
  return phone?.agent?.configuration ?? null;
}