# QuickVoice MCP Server

Remote MCP server exposing verified QuickVoice organization APIs as MCP tools/resources over Streamable HTTP.

## SDK choice

This app uses the official TypeScript SDK `@modelcontextprotocol/sdk` because QuickVoice is a Node/TypeScript monorepo for the main API server, and the SDK provides first-class Streamable HTTP transport support.

## Authentication

The MCP endpoint is remote and is not public. Clients must authenticate every request with a QuickVoice API key:

```http
x-api-key: qv_...
```

or:

```http
Authorization: Bearer qv_...
```

The MCP server forwards that API key to the existing QuickVoice API, so existing organization permissions continue to apply. No business logic is duplicated in the MCP server.

## Run locally

```bash
pnpm --filter quickvoice-mcp-server build
PORT=8787 \
QUICKVOICE_API_BASE_URL=http://localhost:5000/api/v1 \
pnpm --filter quickvoice-mcp-server start
```

## Required env vars

| Env var | Required | Description |
|---|---:|---|
| `QUICKVOICE_API_BASE_URL` | Yes | Base URL of the existing QuickVoice API, e.g. `https://api.quickvoice.co/api/v1`. |
| `PORT` or `MCP_PORT` | No | HTTP port. Default `8787`. |
| `MCP_ENDPOINT_PATH` | No | MCP path. Default `/mcp`. |
| `MCP_CORS_ORIGINS` | No | Comma-separated browser client origins allowed to call the MCP endpoint. |

## Client connection

Configure an MCP Streamable HTTP client with:

```json
{
  "name": "quickvoice",
  "url": "https://YOUR_MCP_HOST/mcp",
  "headers": {
    "x-api-key": "YOUR_QUICKVOICE_API_KEY"
  }
}
```

The server exposes:

- `quickvoice://api_catalog` resource with the full API inventory.
- One MCP resource template per read-only verified API.
- One MCP tool per mutation/action verified API.

## Smoke test

Start the MCP server, then run:

```bash
QUICKVOICE_API_KEY=qv_... \
MCP_URL=http://localhost:8787/mcp \
pnpm --filter quickvoice-mcp-server test:mcp
```

For resource templates that require IDs, optionally provide:

```bash
MCP_TEST_AGENT_ID=...
MCP_TEST_CALL_ID=...
MCP_TEST_WIDGET_ID=...
```

Mutation tools are listed but not executed by the smoke test to avoid destructive side effects.
