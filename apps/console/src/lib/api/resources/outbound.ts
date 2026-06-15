import { apiClient } from "@/src/lib/api/client";
import type { ApiEnvelope, CallStatus } from "@/src/lib/api/types";
import type { QuickCallInput } from "@/src/models/outbound/quickCall";

export interface OutboundCall {
  outboundId: string;
  organizationId: string;
  agentId: string | null;
  userId: string | null;
  campaignId: string | null;
  scheduledAt: string | null;
  callLogId: string | null;
  phoneNumber: string;
  fromNumber: string;
  firstMessage: string | null;
  systemPrompt: string | null;
  optionalData: Record<string, unknown> | null;
  mode: "quick" | "campaign";
  status: CallStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuickOutboundCallResponse {
  outbound: OutboundCall;
  livekitParticipant: unknown;
  agentDispatch: unknown;
}

export const outboundApi = {
  quickCall: async (
    input: QuickCallInput
  ): Promise<QuickOutboundCallResponse> => {
    const res = await apiClient.post<ApiEnvelope<QuickOutboundCallResponse>>(
      "/outbound-calls/quick",
      input
    );
    return res.data.data;
  },
};
