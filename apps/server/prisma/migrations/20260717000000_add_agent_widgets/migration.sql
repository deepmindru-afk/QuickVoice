-- Website voice widgets for public customer-site embedding.
CREATE TYPE "AgentWidgetSessionStatus" AS ENUM (
  'CREATED',
  'ACTIVE',
  'ENDED',
  'EXPIRED',
  'FAILED'
);

CREATE TABLE "AgentWidget" (
  "widgetId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "allowedOrigins" JSONB NOT NULL DEFAULT '[]',
  "theme" JSONB NOT NULL DEFAULT '{}',
  "consentRequired" BOOLEAN NOT NULL DEFAULT true,
  "consentText" TEXT,
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AgentWidget_pkey" PRIMARY KEY ("widgetId")
);

CREATE TABLE "AgentWidgetSession" (
  "sessionId" TEXT NOT NULL,
  "widgetId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "roomName" TEXT NOT NULL,
  "callId" TEXT,
  "participantIdentity" TEXT NOT NULL,
  "dispatchId" TEXT,
  "origin" TEXT,
  "status" "AgentWidgetSessionStatus" NOT NULL DEFAULT 'CREATED',
  "endTokenHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,

  CONSTRAINT "AgentWidgetSession_pkey" PRIMARY KEY ("sessionId")
);

CREATE UNIQUE INDEX "AgentWidgetSession_roomName_key" ON "AgentWidgetSession"("roomName");
CREATE INDEX "AgentWidget_organizationId_idx" ON "AgentWidget"("organizationId");
CREATE INDEX "AgentWidget_agentId_idx" ON "AgentWidget"("agentId");
CREATE INDEX "AgentWidget_organizationId_agentId_idx" ON "AgentWidget"("organizationId", "agentId");
CREATE INDEX "AgentWidget_enabled_idx" ON "AgentWidget"("enabled");
CREATE INDEX "AgentWidgetSession_widgetId_idx" ON "AgentWidgetSession"("widgetId");
CREATE INDEX "AgentWidgetSession_organizationId_idx" ON "AgentWidgetSession"("organizationId");
CREATE INDEX "AgentWidgetSession_agentId_idx" ON "AgentWidgetSession"("agentId");
CREATE INDEX "AgentWidgetSession_organizationId_status_idx" ON "AgentWidgetSession"("organizationId", "status");
CREATE INDEX "AgentWidgetSession_expiresAt_idx" ON "AgentWidgetSession"("expiresAt");

ALTER TABLE "AgentWidget"
  ADD CONSTRAINT "AgentWidget_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentWidget"
  ADD CONSTRAINT "AgentWidget_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("agentId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentWidgetSession"
  ADD CONSTRAINT "AgentWidgetSession_widgetId_fkey"
  FOREIGN KEY ("widgetId") REFERENCES "AgentWidget"("widgetId")
  ON DELETE CASCADE ON UPDATE CASCADE;
