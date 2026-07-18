import { apiClient } from "@/src/lib/api/client";
import { ApiError } from "@/src/lib/errors";
import type { ApiEnvelope, Secret } from "@/src/lib/api/types";

export interface CreateSecretInput {
  name: string;
  value: string;
}

function isMissingSecretsRoute(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function secretsUnavailableError() {
  return new ApiError(
    "Secrets API is not available on this server yet. Use Value mode for now, or deploy the latest API server.",
    404,
    "SECRETS_API_UNAVAILABLE"
  );
}

export const secretsApi = {
  list: async (): Promise<Secret[]> => {
    try {
      const res = await apiClient.get<ApiEnvelope<Secret[]>>("/secrets");
      return res.data.data;
    } catch (error) {
      if (isMissingSecretsRoute(error)) return [];
      throw error;
    }
  },
  create: async (input: CreateSecretInput): Promise<Secret> => {
    try {
      const res = await apiClient.post<ApiEnvelope<Secret>>("/secrets", input);
      return res.data.data;
    } catch (error) {
      if (isMissingSecretsRoute(error)) throw secretsUnavailableError();
      throw error;
    }
  },
  remove: async (secretId: string): Promise<void> => {
    try {
      await apiClient.delete(`/secrets/${secretId}`);
    } catch (error) {
      if (isMissingSecretsRoute(error)) throw secretsUnavailableError();
      throw error;
    }
  },
};
