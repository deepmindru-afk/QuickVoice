import prisma from "../../config/prisma.js";
import { encryptSecretValue, toSecretReference } from "../../lib/secrets.js";
import type { CreateSecretArgs } from "./secret.schema.js";

const secretSelect = {
  secretId: true,
  organizationId: true,
  userId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const toPublicSecret = <T extends { secretId: string }>(secret: T) => ({
  ...secret,
  reference: toSecretReference(secret.secretId),
});

export const listSecrets = async (organizationId: string) => {
  const secrets = await prisma.secret.findMany({
    where: { organizationId },
    select: secretSelect,
    orderBy: { updatedAt: "desc" },
  });

  return secrets.map(toPublicSecret);
};

export const createSecret = async ({
  organizationId,
  userId,
  name,
  value,
}: CreateSecretArgs) => {
  const secret = await prisma.secret.create({
    data: {
      organizationId,
      userId,
      name,
      value: encryptSecretValue(value),
    },
    select: secretSelect,
  });

  return toPublicSecret(secret);
};

export const deleteSecret = (organizationId: string, secretId: string) =>
  prisma.secret.deleteMany({ where: { organizationId, secretId } });
