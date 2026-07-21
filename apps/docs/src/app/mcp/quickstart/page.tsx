import { CodeBlock } from "@/components/code-block";

export default function QuickstartPage() {
  return (
    <article className="prose prose-qv max-w-4xl">
      <p className="lead">Use this flow to connect an MCP-capable client to QuickVoice over Streamable HTTP.</p>
      <h1>Quickstart</h1>
      <h2>1. Start the MCP HTTP service</h2>
      <CodeBlock code={`pnpm --filter mcp-server build
MCP_AUTH_TOKEN="replace-with-a-long-random-token" \
QUICKVOICE_API_BASE_URL="https://api.quickvoice.co" \
pnpm --filter mcp-server start`} />
      <h2>2. Add the remote endpoint to your client</h2>
      <CodeBlock language="json" code={`{
  "mcpServers": {
    "quickvoice": {
      "url": "https://YOUR_MCP_HOST/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_AUTH_TOKEN"
      }
    }
  }
}`} />
      <h2>3. Verify the connection</h2>
      <p>Run the MCP smoke script from the repository. It talks to the MCP endpoint, not the raw REST API.</p>
      <CodeBlock code={`MCP_BASE_URL="https://YOUR_MCP_HOST/mcp" \
MCP_AUTH_TOKEN="YOUR_MCP_AUTH_TOKEN" \
pnpm --filter mcp-server test:mcp`} />
    </article>
  );
}
