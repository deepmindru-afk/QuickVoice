import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("agent preview API and hook are wired", () => {
  const types = read("src/lib/api/types.ts");
  const agentsResource = read("src/lib/api/resources/agents.ts");
  const hooks = read("src/hooks/queries/agents.ts");
  const queryKeys = read("src/lib/query-keys.ts");

  assert.match(types, /interface AgentPreviewSession/);
  assert.match(agentsResource, /createPreviewSession/);
  assert.ok(agentsResource.includes("`/agents/${id}/preview-session`"));
  assert.match(hooks, /useCreateAgentPreviewSession/);
  assert.match(queryKeys, /previewSession/);
});

test("agent preview panel uses LiveKit microphone flow and is available on the agent page", () => {
  const panel = read("src/components/agents/AgentPreviewPanel.tsx");
  const page = read("src/app/(app)/agents/[id]/page.tsx");
  const packageJson = read("package.json");

  assert.match(packageJson, /"livekit-client"/);
  assert.ok(panel.includes("new Room("));
  assert.ok(panel.includes("createLocalAudioTrack"));
  assert.ok(panel.includes("Agent preview"));
  assert.ok(panel.includes("dark:"));
  assert.ok(panel.includes("bg-background"));
  assert.match(panel, /Mute|Unmute/);
  assert.match(page, /AgentPreviewPanel/);
  assert.ok(page.includes("Preview"));
});
