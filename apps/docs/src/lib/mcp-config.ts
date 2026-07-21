export const defaultMcpServerUrl = "https://mcp.quickvoice.co/mcp";

export function buildMcpConfig({ apiKey, serverUrl }: { apiKey: string; serverUrl: string }) {
  return {
    mcpServers: {
      quickvoice: {
        url: serverUrl.trim() || defaultMcpServerUrl,
        transport: "streamable-http",
        headers: {
          Authorization: `Bearer ${apiKey.trim() || "YOUR_QUICKVOICE_MCP_TOKEN"}`,
        },
      },
    },
  };
}

export function stringifyMcpConfig(input: { apiKey: string; serverUrl: string }) {
  return JSON.stringify(buildMcpConfig(input), null, 2);
}
