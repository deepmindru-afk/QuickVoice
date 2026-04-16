import type { TelephonyProvider } from "../../../prisma/generated/prisma/client.js";
import prisma from "../../config/prisma.js";

type CreatePhoneNumberInput = {
  organizationId: string;
  userId: string;
  number: string;
  sid: string;
  friendlyName: string;
  provider: TelephonyProvider;
};

export const listByOrg = async (organizationId: string) => {
  return prisma.phoneNumber.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
  });
};

export const createPhoneNumber = async (input: CreatePhoneNumberInput) => {
  return prisma.phoneNumber.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      number: input.number,
      sid: input.sid,
      friendlyName: input.friendlyName,
      provider: input.provider,
    },
  });
};


export const getByIdForOrg = async (phId: string, organizationId: string) => {
  // findFirst with the composite {phId, organizationId} predicate prevents
  // callers from reading rows that belong to another org.
  return prisma.phoneNumber.findFirst({
    where: { phId, organizationId },
  });
};

export const linkAgent = async (
  phId: string,
  organizationId: string,
  agentId: string | null
) => {
  // updateMany with the composite predicate is the tenant-safe write — a row
  // owned by another org yields count: 0 instead of being updated. Mirrors
  // the pattern in agent.repository.ts:updateAgent.
  const result = await prisma.phoneNumber.updateMany({
    where: { phId, organizationId },
    data: { agentId },
  });
  if (result.count === 0) return null;
  return prisma.phoneNumber.findUnique({ where: { phId } });
};

export const deletePhoneNumber = async (
  phId: string,
  organizationId: string
) => {
  const result = await prisma.phoneNumber.deleteMany({
    where: { phId, organizationId },
  });
  return result.count > 0;
};


