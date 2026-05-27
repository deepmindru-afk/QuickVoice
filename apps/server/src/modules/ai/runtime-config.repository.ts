import prisma from "../../config/prisma.js";
import type { buildAgentRuntimeConfig } from "./runtime-config.mapper.js";

type RuntimeConfigSource = Parameters<typeof buildAgentRuntimeConfig>[0];

export async function findByAgentId(
  agentId: string
): Promise<RuntimeConfigSource | null> {
  const agent = await prisma.agent.findFirst({
    where: { agentId, isActive: true },
    include: {
      configuration: true,
      phoneNumbers: {
        take: 1,
        orderBy: { updatedAt: "desc" },
        select: { number: true, provider: true },
      },
    },
  });

  if (!agent?.configuration) return null;
  const phoneNumber = agent.phoneNumbers[0] ?? null;

  return {
    agentId: agent.agentId,
    organizationId: agent.organizationId,
    userId: agent.userId,
    number: phoneNumber?.number ?? null,
    provider: phoneNumber?.provider ?? null,
    configuration: agent.configuration,
  };
}

export async function findByPhoneNumber(
  phoneNumber: string
): Promise<RuntimeConfigSource | null> {
  const number = await prisma.phoneNumber.findFirst({
    where: { number: phoneNumber, agentId: { not: null } },
    include: {
      agent: {
        include: { configuration: true },
      },
    },
  });

  if (!number?.agent?.configuration) return null;

  return {
    agentId: number.agent.agentId,
    organizationId: number.organizationId,
    userId: number.agent.userId ?? number.userId,
    number: number.number,
    provider: number.provider,
    configuration: number.agent.configuration,
  };
}
