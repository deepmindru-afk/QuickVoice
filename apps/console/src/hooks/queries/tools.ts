"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  toolsApi,
  type CreateToolInput,
  type UpdateToolInput,
} from "@/src/lib/api/resources/tools";
import { queryKeys } from "@/src/lib/query-keys";

export function useTools() {
  return useQuery({
    queryKey: queryKeys.tools.list(),
    queryFn: () => toolsApi.list(),
  });
}

export function useAgentTools(agentId: string) {
  return useQuery({
    queryKey: queryKeys.tools.agentTools(agentId),
    queryFn: () => toolsApi.getAgentTools(agentId),
    enabled: !!agentId,
  });
}

export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateToolInput) => toolsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.list() });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not create tool");
    },
  });
}

export function useUpdateTool(toolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateToolInput) => toolsApi.update(toolId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.list() });
      qc.invalidateQueries({ queryKey: queryKeys.tools.detail(toolId) });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not update tool");
    },
  });
}

export function useDeleteTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string) => toolsApi.remove(toolId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.list() });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not delete tool");
    },
  });
}

export function useAttachTool(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string) => toolsApi.attach(toolId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.agentTools(agentId) });
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not attach tool");
    },
  });
}

export function useDetachTool(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string) => toolsApi.detach(toolId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.agentTools(agentId) });
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not detach tool");
    },
  });
}

export function useAttachAgentToTool(toolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => toolsApi.attach(toolId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.list() });
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not link agent");
    },
  });
}

export function useDetachAgentFromTool(toolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => toolsApi.detach(toolId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tools.list() });
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not unlink agent");
    },
  });
}
