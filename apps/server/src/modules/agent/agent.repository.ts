import prisma from "../../config/prisma.js";
import type { CreateAgentArgs } from "./agent.schema.js";

type CreateAgentInput = CreateAgentArgs & { agentSlug: string };

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

