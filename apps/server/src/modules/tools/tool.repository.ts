import prisma from "../../config/prisma.js";
import type { CreateToolArgs, UpdateToolInput } from "./tool.schema.js";

export const listTools = (organizationId: string) =>
  prisma.tool.findMany({
    where: { organizationId },
    include: { agent: { select: { agentId: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

export const findTool = (organizationId: string, toolId: string) =>
  prisma.tool.findFirst({ where: { toolId, organizationId } });

export const createTool = (data: CreateToolArgs) =>
  prisma.tool.create({ data });

export const updateTool = async (
  organizationId: string,
  toolId: string,
  data: UpdateToolInput
) => {
  const result = await prisma.tool.updateMany({
    where: { toolId, organizationId },
    data,
  });
  if (result.count === 0) return null;
  return prisma.tool.findUnique({ where: { toolId } });
};

export const deleteTool = (organizationId: string, toolId: string) =>
  prisma.tool.deleteMany({ where: { toolId, organizationId } });

export const getAgentTools = async (organizationId: string, agentId: string) => {
  const agent = await prisma.agent.findFirst({
    where: { agentId, organizationId },
    include: { tools: true },
  });
  return agent?.tools ?? null;
};

export const attachTool = async (
  organizationId: string,
  agentId: string,
  toolId: string
) => {
  const [agent, tool] = await Promise.all([
    prisma.agent.findFirst({ where: { agentId, organizationId }, select: { agentId: true } }),
    prisma.tool.findFirst({ where: { toolId, organizationId }, select: { toolId: true } }),
  ]);
  if (!agent || !tool) return null;

  return prisma.$transaction([
    prisma.agent.update({
      where: { agentId },
      data: {
        tools: { connect: { toolId } },
        toolsCount: { increment: 1 },
      },
    }),
  ]);
};

export const detachTool = async (
  organizationId: string,
  agentId: string,
  toolId: string
) => {
  const agent = await prisma.agent.findFirst({
    where: { agentId, organizationId },
    select: { agentId: true, toolsCount: true },
  });
  if (!agent) return null;

  return prisma.$transaction([
    prisma.agent.update({
      where: { agentId },
      data: {
        tools: { disconnect: { toolId } },
        toolsCount: { decrement: 1 },
      },
    }),
  ]);
};
