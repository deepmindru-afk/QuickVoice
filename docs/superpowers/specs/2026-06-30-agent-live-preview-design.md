# Agent Live Preview Design

## Goal

Build an ElevenLabs-style agent preview inside QuickVoice so a user can open an agent, start a real microphone conversation, hear the configured voice agent respond, and end the preview without creating long-lived preview records.

## Decisions

- Use the real LiveKit voice runtime, not a simulated text or TTS-only preview.
- Use saved agent configuration for v1. Previewing unsaved form edits is out of scope for this first preview release.
- Set preview session TTL to 3 hours.
- Do not store preview conversation details long term in v1.
- Mark all preview sessions in metadata so runtime behavior and future retention logic can distinguish them from phone calls.

## User Experience

The agent detail page gets a `Preview` action near the existing agent header actions. Clicking it opens a right-side preview panel. The panel starts idle and asks the user to start a preview call. Microphone permission is requested only after the user clicks start.

During a live preview, the panel shows:

- Connection state: idle, requesting microphone, connecting, live, reconnecting, ended, or error.
- Agent name and configured voice/model summary.
- A conversation area for live transcript events when available, with a plain "live audio only" fallback until transcript events are wired.
- Controls for start, end, mute, and unmute.
- Expiration copy based on the 3-hour token/session TTL.

The preview panel should feel like an operational tool, not a landing-page widget. It should use the existing QuickVoice console design system, constrained panels, clear controls, and compact status text.

## Architecture

QuickVoice server remains the browser-facing authority. The console never calls the AI service directly and never receives provider secrets. The server validates the user's session and organization access, loads the saved agent config, creates a temporary AI voice session, and returns browser-safe LiveKit connection details.

The AI service continues to own LiveKit room token creation and agent dispatch. Preview sessions use the same `/voice/sessions` path as other ephemeral voice sessions, with metadata that sets `mode: "preview"` and includes agent-specific prompt/voice overrides.

The browser joins the LiveKit room using the returned participant token. It publishes microphone audio, subscribes to agent audio, and disconnects on explicit end, page close, unrecoverable error, or token expiry.

## Backend API

Add:

`POST /agents/:agentId/preview-session`

Auth:

- Requires app auth middleware.
- Requires `agentConfiguration:read`.
- Requires the agent to belong to `req.auth.activeOrganizationId`.

Response:

```json
{
  "livekitUrl": "wss://livekit.quickintell.com",
  "roomName": "preview-abc123",
  "participant": {
    "identity": "preview-user-abc123",
    "name": "Preview user",
    "token": "jwt",
    "ttlSeconds": 10800
  },
  "agent": {
    "name": "quickvoice-voice-agent",
    "dispatchId": "AD_xxx"
  },
  "expiresAt": "2026-06-30T22:30:00.000Z"
}
```

The server maps saved `AgentConfiguration` into AI session payload:

```json
{
  "room": { "name": "preview-<random>" },
  "participant": {
    "identity": "preview-user-<random>",
    "name": "Preview user"
  },
  "config": {
    "language": "<agent_language>",
    "timezone": "<timezone>",
    "stt": { "model": "<sttModel>" },
    "llm": { "model": "<llmModel>" },
    "tts": {
      "model": "<ttsModel>",
      "voice": "<voiceId>"
    }
  },
  "metadata": {
    "mode": "preview",
    "agent_id": "<agentId>",
    "organization_id": "<organizationId>",
    "first_message": "<firstMessage>",
    "system_prompt": "<systemPrompt>",
    "retention": "ephemeral"
  },
  "ttl_seconds": 10800
}
```

If AI session creation fails, the server returns a typed 503 error with a user-safe message. Secret values and provider errors are not exposed to the console.

## AI Runtime

Preview metadata is parsed by the existing voice-session metadata path. The worker applies preview prompt overrides in the same spirit as outbound call overrides:

- `first_message` becomes the initial spoken message.
- `system_prompt` becomes the session prompt.
- `agent_id` and organization metadata are available for RAG/tool context.
- `mode: "preview"` tells future persistence code not to create durable call history by default.

The server sends `ttl_seconds: 10800` in preview session requests. The AI service accepts an optional `ttl_seconds` payload field, uses it for the participant token TTL, and clamps it to a maximum of 10,800 seconds. Existing non-preview callers keep using `SESSION_TOKEN_TTL_SECONDS`.

## Frontend

Add a preview client API resource, React hook, and panel component:

- API method: `agentsApi.createPreviewSession(agentId)`.
- Hook: `useCreateAgentPreviewSession(agentId)`.
- Component: `AgentPreviewPanel`.
- The agent detail page owns open/close state and passes the current agent ID/name.

The preview panel uses LiveKit browser client SDK. If the dependency is not present, add the official LiveKit client package to the console app. The browser code must:

- Request microphone permission after the user clicks start.
- Connect with the returned LiveKit URL and token.
- Publish the local microphone track.
- Subscribe to remote agent audio.
- Provide mute/unmute by enabling or disabling the local audio track.
- Disconnect and stop local tracks on end, close, route change, or unmount.

For v1, transcript rendering can be opportunistic. If LiveKit data messages or transcript events are not already emitted by the worker, the panel still ships as a real audio preview with connection status and a minimal event timeline.

## Cleanup And Retention

Preview tokens expire after 3 hours. The UI also disconnects explicitly when the user ends the preview. The room name uses a `preview-` prefix so operational cleanup scripts and logs can identify previews.

No preview-specific database table is required for v1. No preview transcript, audio recording, or summary is stored long term. If existing call logging sees preview metadata, it should skip durable call-log writes or mark them ephemeral for deletion.

## Error Handling

The panel handles:

- Microphone permission denied: show a clear retry state.
- Agent config missing: ask the user to save/configure the agent first.
- AI service unavailable: show a service unavailable state with retry.
- LiveKit connection failure: disconnect local tracks and allow restart.
- Token expired: end the preview and allow a new preview session.
- Browser unsupported: show a message that microphone preview requires a modern browser with media device support.

## Security

The console receives only a scoped LiveKit participant token. It never receives LiveKit API secret, provider credentials, or internal API keys.

The participant token grants only join/publish/subscribe for the preview room. It expires after 3 hours. Room names and identities are random and prefixed with `preview-`.

The preview-session API checks organization ownership and existing permissions before creating a room.

## Testing

Server tests:

- Reject unauthenticated preview-session requests.
- Reject users without `agentConfiguration:read`.
- Return 404 for agents outside the organization.
- Map saved config into the AI `/voice/sessions` payload.
- Return a safe 503 when the AI service fails.

AI tests:

- Preserve existing `/voice/sessions` behavior.
- Accept preview metadata and expose it to the worker.
- Apply preview `first_message` and `system_prompt` overrides.
- Respect or clamp the 3-hour preview TTL.

Console tests:

- API client and hook call the correct endpoint.
- Preview panel requests a session only after start.
- Mic permission denied shows an error state.
- End call disconnects room and stops local tracks.
- The agent page opens and closes the preview panel.

Manual verification:

- Open an agent in the console.
- Start preview.
- Browser asks for microphone permission.
- User audio publishes to LiveKit.
- Agent joins and speaks the configured first message.
- User can speak and hear an agent response.
- Mute/unmute works.
- End call disconnects and allows starting a new preview.
