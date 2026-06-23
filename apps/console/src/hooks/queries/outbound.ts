"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { outboundApi } from "@/src/lib/api/resources/outbound";
import type { CreateBatchCampaignInput } from "@/src/lib/api/resources/outbound";
import type { QuickCallInput } from "@/src/models/outbound/quickCall";
import { queryKeys } from "@/src/lib/query-keys";

export function useQuickOutboundCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuickCallInput) => outboundApi.quickCall(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.calls.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      qc.invalidateQueries({ queryKey: queryKeys.outbound.all });
      toast.success("Outbound call started");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not start outbound call");
    },
  });
}

export function useBatchCampaigns(agentId?: string) {
  return useQuery({
    queryKey: queryKeys.outbound.batches(agentId),
    queryFn: () => outboundApi.listBatchCampaigns(agentId),
  });
}

export function useCreateBatchCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBatchCampaignInput) =>
      outboundApi.createBatchCampaign(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.outbound.all });
      toast.success("Batch campaign queued");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not queue batch campaign");
    },
  });
}
