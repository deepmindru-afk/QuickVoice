import { CodeBlock } from "@/components/code-block";

export default function SelfHostingPage() {
  return (
    <article className="prose prose-qv max-w-4xl">
      <h1>Self-hosting on ECS</h1>
      <p>The MCP app can run as an HTTP service beside the existing QuickVoice server container, or as a dedicated ECS service. Dedicated service is cleaner for independent scaling and logs; same task is acceptable for a small deployment.</p>
      <h2>Container command</h2>
      <CodeBlock code={`pnpm --filter mcp-server build
pnpm --filter mcp-server start`} />
      <h2>Required environment variables</h2>
      <ul>
        <li><code>PORT</code>: HTTP port exposed by the MCP service.</li>
        <li><code>MCP_AUTH_TOKEN</code>: bearer token checked by MCP.</li>
        <li><code>QUICKVOICE_API_BASE_URL</code>: internal or public QuickVoice API URL.</li>
        <li><code>QUICKVOICE_API_TOKEN</code>: upstream API credential.</li>
      </ul>
      <h2>Health checks</h2>
      <p>Use the MCP server health endpoint if present, otherwise check the HTTP listener and run the smoke script after each deployment.</p>
    </article>
  );
}
