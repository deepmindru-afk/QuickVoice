"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  callsApi,
  type CallListParams,
  type TranscriptParams,
} from "@/src/lib/api/resources/calls";
import { queryKeys } from "@/src/lib/query-keys";

const PAGE_SIZE = 20;

export function useCalls(
  params: Omit<CallListParams, "cursor" | "limit">,
  limit: number = PAGE_SIZE
) {
  return useInfiniteQuery({
    queryKey: queryKeys.calls.list({ ...params, limit }),
    queryFn: ({ pageParam }) =>
      callsApi.list({
        ...params,
        limit,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useCall(callId: string) {
  return useQuery({
    queryKey: queryKeys.calls.detail(callId),
    queryFn: () => callsApi.get(callId),
    enabled: !!callId,
  });
}

export function useTranscript(callId: string, params: TranscriptParams = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.calls.transcript(callId),
    queryFn: ({ pageParam }) =>
      callsApi.transcripts(callId, {
        ...params,
        limit: 50,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!callId,
  });
}

export function useDeleteCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (callId: string) => callsApi.remove(callId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.calls.all });
      toast.success("Call deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not delete call");
    },
  });
}
