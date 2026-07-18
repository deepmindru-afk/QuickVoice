import { Prisma } from "../../../prisma/generated/prisma/client.js";
import { BadRequestError } from "../../common/errors/badRequest.js";
import { NotFoundError } from "../../common/errors/notFound.js";
import * as secretRepository from "./secret.repository.js";
import type { CreateSecretArgs } from "./secret.schema.js";

export const listSecrets = (organizationId: string) =>
  secretRepository.listSecrets(organizationId);

export const createSecret = async (args: CreateSecretArgs) => {
  try {
    return await secretRepository.createSecret(args);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BadRequestError("A secret with this name already exists");
    }
    throw error;
  }
};

export const deleteSecret = async (
  organizationId: string,
  secretId: string
) => {
  const result = await secretRepository.deleteSecret(organizationId, secretId);
  if (result.count === 0) throw new NotFoundError("Secret not found");
};
