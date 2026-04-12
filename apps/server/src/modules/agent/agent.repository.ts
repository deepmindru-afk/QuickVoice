import prisma from "../../config/prisma.js";
import { CreateAgentArgs } from "./agent.schema.js";

export const createAgent = async (agent: CreateAgentArgs) => {
  const newAgent = await prisma.agent.create({
    data: agent,
  });
  return newAgent;
};