-- Add per-agent IVR navigation control for LiveKit DTMF menu traversal.
ALTER TABLE "AgentConfiguration"
  ADD COLUMN "ivr_navigation_enabled" BOOLEAN NOT NULL DEFAULT true;
