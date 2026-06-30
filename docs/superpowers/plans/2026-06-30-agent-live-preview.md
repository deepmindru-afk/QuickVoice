# Agent Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an ElevenLabs-style live microphone preview for saved QuickVoice agents.

**Architecture:** The console creates a preview through the QuickVoice server, never by calling AI directly. The server validates organization access, maps saved agent configuration to an AI voice-session request, and the AI service creates a LiveKit room/token with a 3-hour preview TTL. The browser joins the room with LiveKit client SDK, publishes microphone audio, subscribes to agent audio, and renders a polished preview panel.

**Tech Stack:** Express + TypeScript server, FastAPI/Python AI runtime, Next.js/React console, LiveKit server SDK, LiveKit browser client SDK, node:test, unittest/pytest-compatible Python tests.

---

### Task 1: AI Preview TTL And Metadata

**Files:**

- Modify: `apps/ai/handlers/voice_session_broker.py`
- Modify: `apps/ai/handlers/voice_worker_metadata.py`
- Modify: `apps/ai/handlers/worker_handler.py`
- Test: `apps/ai/tests/test_voice_session_broker.py`
- Test: `apps/ai/tests/test_voice_worker_metadata.py`
- Test: `apps/ai/tests/test_worker_helpers.py`

- [ ] **Step 1: Write failing AI tests**

Add tests proving:

```python
def test_create_session_accepts_preview_ttl_and_clamps_to_three_hours(self):
    broker = VoiceSessionBroker(catalog_loader=load_voice_catalog, dispatch_client=FakeDispatchClient())
    result = await broker.create_session({"ttl_seconds": 999999, "metadata": {"mode": "preview"}})
    assert result["participant"]["ttl_seconds"] == 10800

def test_preview_metadata_exposes_mode_and_prompt_overrides(self):
    metadata = parse_voice_session_metadata(json.dumps({
        "schema_version": SCHEMA_VERSION,
        "catalog_version": "2026-06-30",
        "room": {"name": "preview-room"},
        "participant": {"identity": "preview-user", "name": "Preview user"},
        "config": {"language": "en", "stt": {}, "llm": {}, "tts": {}},
        "client_metadata": {
            "mode": "preview",
            "first_message": "Hello from preview",
            "system_prompt": "Preview prompt"
        }
    }))
    assert metadata.mode == "preview"
    assert metadata.client_metadata["first_message"] == "Hello from preview"

def test_apply_metadata_overrides_applies_preview_prompt_fields(self):
    updated = apply_metadata_overrides(
        {"first_message": "Old", "system_prompt": "Old prompt"},
        {"mode": "preview", "first_message": "New", "system_prompt": "New prompt"}
    )
    assert updated["first_message"] == "New"
    assert updated["system_prompt"] == "New prompt"
```

- [ ] **Step 2: Run AI tests and confirm RED**

Run:

```bash
cd apps/ai && python3 -m unittest tests.test_voice_session_broker tests.test_voice_worker_metadata tests.test_worker_helpers
```

Expected: failing assertions or missing `mode`/TTL behavior.

- [ ] **Step 3: Implement AI behavior**

Implement:

```python
MAX_SESSION_TTL_SECONDS = 10800

def _ttl_seconds(payload: dict[str, Any]) -> int:
    raw = payload.get("ttl_seconds")
    default = _int_env("SESSION_TOKEN_TTL_SECONDS", 900)
    if raw in (None, ""):
        return min(default, MAX_SESSION_TTL_SECONDS)
    try:
        return max(1, min(int(raw), MAX_SESSION_TTL_SECONDS))
    except (TypeError, ValueError) as exc:
        raise VoiceSessionBrokerError("ttl_seconds must be an integer") from exc
```

Use `_ttl_seconds(payload)` in `VoiceSessionBroker.create_session`.

Add `mode` property to `VoiceSessionMetadata`:

```python
@property
def mode(self) -> str:
    value = self.client_metadata.get("mode")
    return value if isinstance(value, str) and value else "session"
```

Change `apply_metadata_overrides` so overrides apply when direction is outbound or `mode == "preview"`.

- [ ] **Step 4: Run AI tests and confirm GREEN**

Run the same unittest command and, if pytest is installed, the relevant pytest files.

### Task 2: Server Preview Session Endpoint

**Files:**

- Modify: `apps/server/src/modules/agent/agent.schema.ts`
- Modify: `apps/server/src/modules/agent/agent.service.ts`
- Modify: `apps/server/src/modules/agent/agent.controller.ts`
- Modify: `apps/server/src/modules/agent/agent.route.ts`
- Create: `apps/server/tests/agent/preview-session.service.test.ts`

- [ ] **Step 1: Write failing server tests**

Add `preview-session.service.test.ts` using node:test. Mock `globalThis.fetch`, call service helpers, and assert:

```typescript
test("createAgentPreviewSession maps saved config to AI preview session", async () => {
  const session = await createAgentPreviewSession("org_1", "agent_1");
  assert.equal(calls[0].body.ttl_seconds, 10800);
  assert.equal(calls[0].body.metadata.mode, "preview");
  assert.equal(calls[0].body.metadata.retention, "ephemeral");
  assert.equal(calls[0].body.config.language, "en");
  assert.equal(session.participant.ttlSeconds, 10800);
});
```

- [ ] **Step 2: Run server test and confirm RED**

Run:

```bash
tsx --test apps/server/tests/agent/preview-session.service.test.ts
```

Expected: import/function not found.

- [ ] **Step 3: Implement service API**

Add:

```typescript
export const PREVIEW_SESSION_TTL_SECONDS = 10800;

export type AgentPreviewSession = {
  livekitUrl: string;
  roomName: string;
  participant: { identity: string; name: string; token: string; ttlSeconds: number };
  agent: { name: string; dispatchId: string };
  expiresAt: string;
};

export async function createAgentPreviewSession(
  organizationId: string,
  agentId: string
): Promise<AgentPreviewSession> { ... }
```

Implementation loads config with `getAgentConfig`, calls AI `/voice/sessions` with internal auth, maps the AI response, and throws 503 on AI failure.

- [ ] **Step 4: Wire route/controller**

Add:

```typescript
router.post(
  "/:agentId/preview-session",
  authMiddleware,
  requirePermission({ agentConfiguration: ["read"] }),
  agentController.createAgentPreviewSession,
);
```

Controller calls service and returns an API envelope.

- [ ] **Step 5: Run server tests and typecheck**

Run the focused node test and `pnpm --filter server check-types` when pnpm is available.

### Task 3: Console API And Hook

**Files:**

- Modify: `apps/console/src/lib/api/types.ts`
- Modify: `apps/console/src/lib/api/resources/agents.ts`
- Modify: `apps/console/src/hooks/queries/agents.ts`
- Modify: `apps/console/src/lib/query-keys.ts`
- Test: `apps/console/tests/agent-preview.test.mjs`

- [ ] **Step 1: Write failing console API tests**

Add a Node test that reads the source files and asserts the preview API method, hook, and query key exist:

```javascript
test("agent preview API and hook are wired", () => {
  assert.match(agentsResource, /createPreviewSession/);
  assert.match(agentsResource, /\\/agents\\/\\$\\{id\\}\\/preview-session/);
  assert.match(hooks, /useCreateAgentPreviewSession/);
});
```

- [ ] **Step 2: Run console test and confirm RED**

Run:

```bash
node --test apps/console/tests/agent-preview.test.mjs
```

- [ ] **Step 3: Implement API/hook types**

Add `AgentPreviewSession` type, `agentsApi.createPreviewSession(id)`, and `useCreateAgentPreviewSession(agentId)`.

- [ ] **Step 4: Run console API test and confirm GREEN**

Run the focused console test.

### Task 4: LiveKit Preview Panel UI

**Files:**

- Modify: `apps/console/package.json`
- Create: `apps/console/src/components/agents/AgentPreviewPanel.tsx`
- Modify: `apps/console/src/app/(app)/agents/[id]/page.tsx`
- Test: `apps/console/tests/agent-preview.test.mjs`

- [ ] **Step 1: Write failing UI wiring tests**

Extend the console test to assert:

```javascript
assert.match(panel, /new Room\\(/);
assert.match(panel, /createLocalAudioTrack/);
assert.match(panel, /Agent preview/);
assert.match(page, /AgentPreviewPanel/);
assert.match(page, /Preview/);
```

- [ ] **Step 2: Run test and confirm RED**

Run:

```bash
node --test apps/console/tests/agent-preview.test.mjs
```

- [ ] **Step 3: Add LiveKit dependency**

Add the official browser SDK to `apps/console/package.json`:

```json
"livekit-client": "^2.15.13"
```

Then update the lockfile with package tooling when available.

- [ ] **Step 4: Build `AgentPreviewPanel`**

Create a client component that:

- opens in existing `Sheet` UI;
- requests mic only on Start;
- creates `Room`, connects, publishes local audio;
- subscribes to remote audio tracks;
- supports mute/unmute and end;
- stops local tracks on cleanup;
- uses balanced light/dark classes with `bg-background`, `bg-muted`, `text-foreground`, `border-border`, `shadow`, `ring`, and non-purple accent states.

- [ ] **Step 5: Add header button**

In the agent detail page, add a `Preview` button with a phone/audio icon and render `AgentPreviewPanel`.

- [ ] **Step 6: Run UI tests**

Run focused console test and all console node tests.

### Task 5: Verification And Browser Polish

**Files:**

- No new files unless fixes are required.

- [ ] **Step 1: Run verification commands**

Run:

```bash
node --test apps/console/tests/*.test.mjs
cd apps/ai && python3 -m unittest tests.test_voice_session_broker tests.test_voice_worker_metadata tests.test_worker_helpers
```

When tooling is available:

```bash
pnpm --filter server test
pnpm --filter server check-types
pnpm --filter console check-types
pnpm --filter console build
```

- [ ] **Step 2: Browser visual check**

Start the console dev server if package tooling is available, open the agent page in Playwright, and capture light/dark screenshots of the preview panel. Verify no overlapping text, no one-note purple palette, visible controls, and accessible contrast in both themes.

- [ ] **Step 3: Commit implementation**

Commit implementation files separately from the existing spec/safety commits:

```bash
git add apps/ai apps/server apps/console
git commit -m "feat: add agent live preview"
```
