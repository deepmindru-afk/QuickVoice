## What are you reporting?

Choose one:

- Bug or setup failure
- Launch-day setup blocker
- Documentation gap
- Provider integration question
- Good first issue candidate
- Product or workflow request
- Security issue disclosure question only. Do not include vulnerability details in a public issue; use `SECURITY.md`.

## Impact

Choose the closest impact:

- Blocks `task up:dev`
- Blocks local product inspection after services start
- Blocks real calls after adding LiveKit plus Twilio or Telnyx credentials
- Blocks billing, OAuth, email, or storage after adding provider credentials
- Confusing docs, copy, or launch positioning
- Nice-to-have improvement

## Context

- QuickVoice area: README, docs, web app, console, API, AI worker, telephony, billing, or local tooling
- Local command or route:
- OS, Node, pnpm, Docker, and Python versions, if setup-related:
- Provider credentials involved, if any: LiveKit, Twilio, Telnyx, Stripe, OAuth, email, or storage
- First-time contributor? If yes, note whether you want help scoping this as a good first issue:

## Expected behavior

What did you expect to happen?

## Actual behavior

What happened instead? Include the first relevant error, not full secrets or private customer data.

## Reproduction or proposed change

For bugs, include the smallest command, route, or click path that reproduces the issue.

For docs or contribution ideas, describe the smallest change that would resolve the confusion.

## Positioning or docs feedback

If this is about launch copy or docs, note whether the control, self-hosting, privacy, cost, extensibility, and provider-boundary tradeoffs were clear.

## Maintainer triage notes

Maintainers should use `docs/launch/launch-day-triage.md` during launch windows. Security reports belong in `SECURITY.md`, and good first issues should avoid live credentials, migrations, auth, billing, runtime worker changes, and new provider architecture.
