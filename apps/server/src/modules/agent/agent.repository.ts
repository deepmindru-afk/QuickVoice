import prisma from "../../config/prisma.js";
import type { CreateAgentArgs, UpdateAgentInput } from "./agent.schema.js";

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