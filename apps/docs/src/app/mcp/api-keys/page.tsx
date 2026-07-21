export default function ApiKeysPage() {
  return (
    <article className="prose prose-qv max-w-4xl">
      <h1>API keys and authentication</h1>
      <p>The remote MCP endpoint must not be public. QuickVoice MCP uses a bearer token gate before forwarding requests to the existing QuickVoice API layer.</p>
      <h2>Required environment</h2>
      <ul>
        <li><code>MCP_AUTH_TOKEN</code>: long random token accepted by the MCP HTTP server.</li>
        <li><code>QUICKVOICE_API_BASE_URL</code>: server API base URL, for example <code>https://api.quickvoice.co</code>.</li>
        <li><code>QUICKVOICE_API_TOKEN</code>: API credential used by MCP when calling QuickVoice upstream APIs.</li>
      </ul>
      <h2>Rotation checklist</h2>
      <ol>
        <li>Create the new token in the secret manager or ECS task environment.</li>
        <li>Deploy or restart MCP tasks with both old and new clients coordinated.</li>
        <li>Update client configuration and verify the MCP handshake.</li>
        <li>Remove the old token after all clients are migrated.</li>
      </ol>
    </article>
  );
}
