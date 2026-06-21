# Time To Wow

This launch note defines the first impression QuickVoice should give a new GitHub visitor.

## Visitor Promise

Within 30 seconds, a visitor should understand that QuickVoice is an open-source Retell alternative for AI phone agents: a self-hostable stack, not just a landing page or SDK wrapper.

The README should make these points visible before the first long scroll:

- QuickVoice is for AI agents that make and receive phone calls.
- The repository includes the web app, console, API, AI worker, database setup, telephony bindings, billing paths, and local orchestration.
- The narrative is control over the stack: self-hosting, privacy review, provider choice, cost visibility, and extensibility.
- `task up:dev` is the primary local path.
- Live phone calls require real LiveKit plus Twilio or Telnyx credentials.
- The existing console dashboard image is a product UI preview, not proof of customer metrics or production performance.

## First 30 Seconds

The intended GitHub visitor path is:

1. Read the README hook.
2. See the console preview image.
3. Scan the 30-second tour and stack diagram.
4. Copy `task up:dev` if host prerequisites are already installed.
5. Open the local web app, console, API health endpoint, or API docs.

## Demo And Visual Placement

The README uses the existing `apps/web/public/dashboard.png` asset. Do not replace it with generated screenshots, invented metrics, or customer names. If a new demo image is needed later, capture it from a real local run with clearly seeded/demo data and document the command used to produce it.

## Quick Start Contract

Keep the quick start copy-paste friendly:

```sh
task up:dev
```

Installation guidance can exist below the one-command path, but the first command should stay stable unless the Taskfile changes.

## Credential Boundaries

Do not imply that a fresh clone can place real phone calls. A fresh clone can run local services and inspect the product surface. Real calling, OAuth, billing, outbound email, and object storage require provider credentials in generated env files.
