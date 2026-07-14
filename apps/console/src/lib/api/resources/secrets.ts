import { apiClient } from "@/src/lib/api/client";
import type { ApiEnvelope, Secret } from "@/src/lib/api/types";

export interface CreateSecretInput {
  name: string;
  value: string;
}

export const secretsApi = {
  list: async (): Promise<Secret[]> => {
    const res = await apiClient.get<ApiEnvelope<Secret[]>>("/secrets");
    return res.data.data;
  },
  create: async (input: CreateSecretInput): Promise<Secret> => {
    const res = await apiClient.post<ApiEnvelope<Secret>>("/secrets", input);
    return res.data.data;
  },
  remove: async (secretId: string): Promise<void> => {
    await apiClient.delete(`/secrets/${secretId}`);
  },
};
