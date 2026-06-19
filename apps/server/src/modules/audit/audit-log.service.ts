import { randomUUID } from "node:crypto";

import prisma from "../../config/prisma.js";
import { redactJson } from "../../lib/redaction.js";

type AuditLogArgs = {
  organizationId: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordAuditEvent(args: AuditLogArgs) {
  const metadata = JSON.stringify(redactJson(args.metadata ?? {}));
  try {
    await prisma.$executeRaw`
      INSERT INTO "AuditLog"
        ("auditLogId", "organizationId", "userId", "action", "resourceType", "resourceId", "metadata", "createdAt")
      VALUES
        (${randomUUID()}, ${args.organizationId}, ${args.userId ?? null}, ${args.action}, ${args.resourceType}, ${args.resourceId ?? null}, ${metadata}::jsonb, NOW())
    `;
  } catch (error) {
    console.warn("[audit] failed to record audit event", {
      action: args.action,
      organizationId: args.organizationId,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
