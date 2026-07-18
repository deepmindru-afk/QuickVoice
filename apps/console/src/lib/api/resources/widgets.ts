import { apiClient } from "@/src/lib/api/client";
import type { AgentWidget, ApiEnvelope } from "@/src/lib/api/types";

export type CreateAgentWidgetInput = {
  name: string;
  enabled: boolean;
  allowedOrigins: string[];
  theme: AgentWidget["theme"];
  consentRequired: boolean;
  consentText: string;
};

export type UpdateAgentWidgetInput = Partial<CreateAgentWidgetInput>;

export const widgetsApi = {
  listForAgent: async (agentId: string): Promise<AgentWidget[]> => {
    const res = await apiClient.get<ApiEnvelope<AgentWidget[]>>(
      `/agents/${agentId}/widgets`,
    );
    return res.data.data;
  },
  createForAgent: async (
    agentId: string,
    input: CreateAgentWidgetInput,
  ): Promise<AgentWidget> => {
    const res = await apiClient.post<ApiEnvelope<AgentWidget>>(
      `/agents/${agentId}/widgets`,
      input,
    );
    return res.data.data;
  },
  update: async (
    widgetId: string,
    input: UpdateAgentWidgetInput,
  ): Promise<AgentWidget> => {
    const res = await apiClient.patch<ApiEnvelope<AgentWidget>>(
      `/widgets/${widgetId}`,
      input,
    );
    return res.data.data;
  },
  remove: async (widgetId: string): Promise<void> => {
    await apiClient.delete(`/widgets/${widgetId}`);
  },
};
