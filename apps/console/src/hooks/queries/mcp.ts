"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mcpApi, type ConnectMcpInput, type McpCatalogParams } from "@/src/lib/api/resources/mcp";
import { queryKeys } from "@/src/lib/query-keys";

const openSetupAndPoll = (
  setupUrl: string,
  mcpConnectionId: string,
  qc: ReturnType<typeof useQueryClient>
) => {
  const targetWindow = window.open(setupUrl, "_blank");
  if (!targetWindow) {
    toast.error("Could not open setup. Use the Setup button and allow popups for this site.");
    return;
  }

  targetWindow.opener = null;
  toast.info("Complete setup in the new tab. QuickVoice will refresh automatically.");
  let attempts = 0;
  const maxAttempts = 24;
  let intervalId: number;
  const refresh = async () => {
    attempts += 1;
    try {
      const connection = await mcpApi.refresh(mcpConnectionId);
      qc.invalidateQueries({ queryKey: queryKeys.mcp.all });
      qc.invalidateQueries({ queryKey: queryKeys.mcp.connections() });
      if (connection.status === "CONNECTED") {
        window.clearInterval(intervalId);
        window.removeEventListener("focus", refresh);
        toast.success(`${connection.displayName} connected`);
      }
    } catch {
      // Keep polling while Smithery is still settling after OAuth.
    }

    if (attempts >= maxAttempts) {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
    }
  };

  intervalId = window.setInterval(refresh, 5000);
  window.addEventListener("focus", refresh);
};

export function useMcpCatalog(params: McpCatalogParams = {}) {
  return useQuery({
    queryKey: queryKeys.mcp.catalog(params),
    queryFn: () => mcpApi.catalog(params),
    retry: false,
  });
}

export function useMcpConnections() {
  return useQuery({
    queryKey: queryKeys.mcp.connections(),
    queryFn: () => mcpApi.connections(),
  });
}

export function useAgentMcpConnections(agentId: string) {
  return useQuery({
    queryKey: queryKeys.mcp.agentConnections(agentId),
    queryFn: () => mcpApi.agentConnections(agentId),
    enabled: !!agentId,
  });
}

export function useConnectMcp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConnectMcpInput) => mcpApi.connect(input),
    onSuccess: (connection) => {
      qc.invalidateQueries({ queryKey: queryKeys.mcp.all });
      qc.invalidateQueries({ queryKey: queryKeys.mcp.connections() });
      if (connection.setupUrl) {
        toast.info("Setup is required. Click the Setup button to continue.");
        return;
      }
      toast.success("MCP connection created");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not connect MCP server");
    },
  });
}

export function useOpenMcpSetup() {
  const qc = useQueryClient();
  return (setupUrl: string, mcpConnectionId: string) => {
    if (typeof window === "undefined") return;
    openSetupAndPoll(setupUrl, mcpConnectionId, qc);
  };
}

export function useRefreshMcpConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mcpConnectionId: string) => mcpApi.refresh(mcpConnectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mcp.connections() });
      qc.invalidateQueries({ queryKey: queryKeys.mcp.all });
    },
    onError: (err: Error) => toast.error(err.message || "Could not refresh MCP connection"),
  });
}

export function useDisconnectMcpConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mcpConnectionId: string) => mcpApi.disconnect(mcpConnectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mcp.all });
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
      toast.success("MCP connection disconnected");
    },
    onError: (err: Error) => toast.error(err.message || "Could not disconnect MCP connection"),
  });
}

export function useAttachMcpConnection(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mcpConnectionId: string) => mcpApi.attach(mcpConnectionId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mcp.agentConnections(agentId) });
      qc.invalidateQueries({ queryKey: queryKeys.mcp.connections() });
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
    onError: (err: Error) => toast.error(err.message || "Could not attach MCP connection"),
  });
}

export function useDetachMcpConnection(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mcpConnectionId: string) => mcpApi.detach(mcpConnectionId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mcp.agentConnections(agentId) });
      qc.invalidateQueries({ queryKey: queryKeys.mcp.connections() });
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
    onError: (err: Error) => toast.error(err.message || "Could not detach MCP connection"),
  });
}
