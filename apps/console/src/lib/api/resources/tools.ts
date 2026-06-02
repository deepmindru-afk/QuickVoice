import { apiClient } from "@/src/lib/api/client";
import type { ApiEnvelope, KVPair, Tool, ToolParam } from "@/src/lib/api/types";

export interface CreateToolInput {
  name: string;
  description: string;
  api_url: string;
  api_method: string;
  api_headers?: KVPair[] | null;
  api_body?: ToolParam[] | null;
  api_query_params?: ToolParam[] | null;
  api_path_params?: ToolParam[] | null;
  response_timeout_secs?: number | null;
  dynamic_variables?: KVPair[] | null;
  disable_interruptions: boolean;
  force_pre_tool_speech: boolean;
}

export type UpdateToolInput = Partial<CreateToolInput>;

export const toolsApi = {
  list: async (): Promise<Tool[]> => {
    const res = await apiClient.get<ApiEnvelope<Tool[]>>("/tools");
    return res.data.data;
  },
  create: async (input: CreateToolInput): Promise<Tool> => {
    const res = await apiClient.post<ApiEnvelope<Tool>>("/tools", input);
    return res.data.data;
  },
  update: async (toolId: string, input: UpdateToolInput): Promise<Tool> => {
    const res = await apiClient.patch<ApiEnvelope<Tool>>(`/tools/${toolId}`, input);
    return res.data.data;
  },
  remove: async (toolId: string): Promise<void> => {
    await apiClient.delete(`/tools/${toolId}`);
  },
  getAgentTools: async (agentId: string): Promise<Tool[]> => {
    const res = await apiClient.get<ApiEnvelope<Tool[]>>(`/tools/agent/${agentId}`);
    return res.data.data;
  },
  attach: async (toolId: string, agentId: string): Promise<void> => {
    await apiClient.post(`/tools/${toolId}/attach/${agentId}`);
  },
  detach: async (toolId: string, agentId: string): Promise<void> => {
    await apiClient.delete(`/tools/${toolId}/detach/${agentId}`);
  },
};
