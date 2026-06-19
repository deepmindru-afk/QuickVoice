import { randomUUID } from "node:crypto";

import prisma from "../../config/prisma.js";
import {
  decryptSecretValue,
  encryptSecretValue,
  isEncryptedSecretValue,
  isSecretReference,
  secretIdFromReference,
  toSecretReference,
} from "../../lib/secrets.js";

type SecretContext = {
  organizationId: string;
  userId?: string | null;
  namePrefix: string;
};

export async function storeSecretReferences<T>(value: T, context: SecretContext): Promise<T> {
  return visitSecretFields(value, context, []) as Promise<T>;
}

export async function storeKeyValueSecretReferences<T>(value: T, context: SecretContext): Promise<T> {
  return visitKeyValueFields(value, context, []) as Promise<T>;
}

export async function resolveSecretReferences<T>(value: T, organizationId: string): Promise<T> {
  return resolveReferences(value, organizationId) as Promise<T>;
}

async function visitSecretFields(
  value: unknown,
  context: SecretContext,
  path: string[]
): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(value.map((item, index) => visitSecretFields(item, context, [...path, String(index)])));
  }
  if (!isRecord(value)) return value;

  if (value.type === "Secret" && typeof value.value === "string") {
    if (isSecretReference(value.value) || isEncryptedSecretValue(value.value)) return value;
    const reference = await createSecretReference(context, path, value.value);
    return { ...value, value: reference };
  }

  const entries = await Promise.all(
    Object.entries(value).map(async ([key, item]) => [
      key,
      await visitSecretFields(item, context, [...path, key]),
    ])
  );
  return Object.fromEntries(entries);
}

async function visitKeyValueFields(
  value: unknown,
  context: SecretContext,
  path: string[]
): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(value.map((item, index) => visitKeyValueFields(item, context, [...path, String(index)])));
  }
  if (!isRecord(value)) return value;

  const entries = await Promise.all(
    Object.entries(value).map(async ([key, item]) => [
      key,
      await visitKeyValueFields(item, context, [...path, key]),
    ])
  );
  const next = Object.fromEntries(entries);

  if (typeof next.key === "string" && typeof next.value === "string") {
    if (!isSecretReference(next.value) && !isEncryptedSecretValue(next.value)) {
      next.value = await createSecretReference(context, [...path, next.key], next.value);
    }
  }

  return next;
}

async function resolveReferences(value: unknown, organizationId: string): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => resolveReferences(item, organizationId)));
  }
  if (typeof value === "string") {
    if (isSecretReference(value)) {
      return resolveSecretReference(value, organizationId);
    }
    if (isEncryptedSecretValue(value)) return decryptSecretValue(value);
    return value;
  }
  if (!isRecord(value)) return value;

  const entries = await Promise.all(
    Object.entries(value).map(async ([key, item]) => [
      key,
      await resolveReferences(item, organizationId),
    ])
  );
  return Object.fromEntries(entries);
}

async function createSecretReference(
  context: SecretContext,
  path: string[],
  secretValue: string
) {
  const secret = await prisma.secret.create({
    data: {
      organizationId: context.organizationId,
      userId: context.userId ?? null,
      name: `${context.namePrefix}:${path.filter(Boolean).join(".")}:${randomUUID()}`,
      value: encryptSecretValue(secretValue),
    },
    select: { secretId: true },
  });
  return toSecretReference(secret.secretId);
}

async function resolveSecretReference(reference: string, organizationId: string) {
  const secret = await prisma.secret.findFirst({
    where: {
      secretId: secretIdFromReference(reference),
      organizationId,
    },
    select: { value: true },
  });
  return secret ? decryptSecretValue(secret.value) : null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
