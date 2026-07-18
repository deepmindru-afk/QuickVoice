"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  secretsApi,
  type CreateSecretInput,
} from "@/src/lib/api/resources/secrets";
import { queryKeys } from "@/src/lib/query-keys";

export function useSecrets() {
  return useQuery({
    queryKey: queryKeys.secrets.list(),
    queryFn: () => secretsApi.list(),
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useCreateSecret() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSecretInput) => secretsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.secrets.list() });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not create secret");
    },
  });
}

export function useDeleteSecret() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (secretId: string) => secretsApi.remove(secretId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.secrets.list() });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not delete secret");
    },
  });
}
