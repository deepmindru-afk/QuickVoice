export default function TroubleshootingPage() {
  return (
    <article className="prose prose-qv max-w-4xl">
      <h1>Troubleshooting</h1>
      <h2>401 Unauthorized</h2>
      <p>Confirm the client sends <code>Authorization: Bearer MCP_AUTH_TOKEN</code>. Do not use a console browser cookie as the MCP token.</p>
      <h2>Upstream 404</h2>
      <p>The MCP server is reachable, but the configured <code>QUICKVOICE_API_BASE_URL</code> does not expose the wrapped API route. Deploy the latest QuickVoice server or point MCP at the correct API host.</p>
      <h2>Tool succeeds locally but fails remotely</h2>
      <p>Compare ECS task environment, security group egress, and upstream API token permissions. Then run the MCP smoke script against the deployed URL.</p>
      <h2>Model picks a risky tool</h2>
      <p>Update the client approval policy so <code>external-cost</code> and <code>destructive</code> tools always require human confirmation.</p>
    </article>
  );
}
