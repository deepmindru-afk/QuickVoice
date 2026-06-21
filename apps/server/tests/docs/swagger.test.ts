import assert from "node:assert/strict";
import { test } from "node:test";

import { swaggerSpec } from "../../src/config/swagger.js";

const spec = swaggerSpec as {
  tags?: { name: string }[];
  components?: { schemas?: Record<string, { properties?: Record<string, unknown> }> };
  paths?: Record<string, Record<string, unknown>>;
};

test("swagger documents modern workflow tags", () => {
  const tagNames = new Set(spec.tags?.map((tag) => tag.name));

  for (const tagName of ["Outbound Calls", "Tools", "MCP Integrations"]) {
    assert.equal(tagNames.has(tagName), true, `${tagName} tag should be documented`);
  }
});

test("swagger documents mounted routes that clients need for workflow recovery", () => {
  const expectedOperations = [
    ["/ready", "get"],
    ["/numbers/{phId}", "delete"],
    ["/kb/upload-url", "get"],
    ["/outbound-calls", "get"],
    ["/outbound-calls/quick", "post"],
    ["/outbound-calls/{outboundId}", "get"],
    ["/outbound-calls/{outboundId}/status", "get"],
    ["/outbound-calls/{outboundId}/cancel", "post"],
    ["/outbound-calls/{outboundId}/retry", "post"],
    ["/tools", "get"],
    ["/tools", "post"],
    ["/tools/{toolId}", "patch"],
    ["/tools/{toolId}", "delete"],
    ["/tools/agent/{agentId}", "get"],
    ["/tools/{toolId}/attach/{agentId}", "post"],
    ["/tools/{toolId}/detach/{agentId}", "delete"],
    ["/mcp/catalog", "get"],
    ["/mcp/connections", "get"],
    ["/mcp/connections", "post"],
    ["/mcp/connections/{mcpConnectionId}/refresh", "post"],
    ["/mcp/connections/{mcpConnectionId}", "delete"],
    ["/mcp/agent/{agentId}", "get"],
    ["/mcp/connections/{mcpConnectionId}/attach/{agentId}", "post"],
    ["/mcp/connections/{mcpConnectionId}/detach/{agentId}", "delete"],
    ["/mcp/connections/{mcpConnectionId}/tools/{toolName}/execute", "post"],
  ] as const;

  for (const [path, method] of expectedOperations) {
    assert.ok(spec.paths?.[path]?.[method], `${method.toUpperCase()} ${path} should be documented`);
  }
});

test("swagger error schema exposes field-addressable and correlatable errors", () => {
  const properties = spec.components?.schemas?.ErrorResponse?.properties ?? {};

  for (const propertyName of ["success", "code", "message", "details", "fieldErrors", "requestId"]) {
    assert.ok(properties[propertyName], `ErrorResponse.${propertyName} should be documented`);
  }
});
