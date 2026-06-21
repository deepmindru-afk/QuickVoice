# Launch Day Triage

This guide helps maintainers respond quickly to launch-day issues, pull requests, and first-time contributors without overpromising what the repo can do.

## Response Expectations

These are launch-window response goals, not permanent service-level agreements.

- Security reports: route to `SECURITY.md` immediately. Do not ask for exploit details in a public issue.
- Setup blockers: acknowledge during the first responder shift, especially when `task up:dev`, migrations, Docker, or dependency installation is blocked.
- Reproducible bugs: acknowledge the same day and ask for the smallest command, route, or screen that shows the issue.
- Documentation gaps: acknowledge within 24 hours and either patch the docs or open a follow-up issue.
- Pull requests: give a first maintainer response within 24 launch hours. For docs-only PRs, avoid asking contributors to run unrelated product checks.
- Product requests: confirm the use case, note any credential or product-decision boundary, and avoid committing to roadmap timing in the issue.

When a full answer will take longer, leave an interim response with the next action and the information needed from the reporter.

## Triage Flow

1. Check whether the report belongs in public. Security details move to `SECURITY.md`.
2. Identify the affected area: README, docs, web app, console, API, AI worker, telephony, billing, or local tooling.
3. Ask for the narrowest reproduction: command, route, first relevant error, OS, Node and pnpm versions, and whether real provider credentials are involved.
4. Mark credential boundaries clearly. A fresh clone can inspect local services, but real calls require LiveKit plus Twilio or Telnyx credentials, and billing, OAuth, email, and storage need their provider keys.
5. Convert repeated launch questions into docs issues or small documentation PRs.
6. Keep public copy aligned with the launch principle: control, self-hosting, privacy review, cost visibility, extensibility, and honest provider tradeoffs.

## Good First Issue Criteria

A launch-day good first issue should have:

- One clear owner area, such as README, launch docs, a setup command, a small UI copy fix, or an existing test gap.
- A concrete expected result and an observable current result.
- No requirement for live credentials, paid services, private customer data, production secrets, or provider dashboard access.
- No dependency additions, schema migrations, auth changes, billing behavior, runtime worker changes, or new provider architecture.
- A clear verification path, such as `pnpm lint`, `pnpm check-types`, `pnpm test`, a docs review, or a specific local route to inspect.
- Enough context that a contributor can start without private maintainer knowledge.

Good examples:

- Clarify a missing host prerequisite in README setup steps.
- Fix a broken docs link or launch draft typo.
- Add a test for existing parsing or orchestration behavior.
- Improve an empty state or button label using the existing UI pattern.
- Document a known provider credential boundary in setup notes.

Not good first issues:

- Add a new telephony provider.
- Redesign the console information architecture.
- Change auth, billing, permissions, migrations, or agent-runtime behavior.
- Add production-readiness, compliance, customer, benchmark, or cost claims.
- Debug a real provider account that needs private credentials.

## Maintainer Reply Frames

Setup blocker:

```md
Thanks for reporting this. Can you share the command you ran, your OS, Node and pnpm versions, and the first relevant error line? If this happens before adding LiveKit/Twilio/Telnyx credentials, we should treat it as a local setup bug.
```

Provider boundary:

```md
Real phone calls need LiveKit plus Twilio or Telnyx credentials. A fresh clone should still run the local product surface, so please note whether the failure happens before or after provider credentials are added.
```

Good first issue invitation:

```md
This looks like a bounded first contribution: one area, no live credentials, and a clear verification path. A good PR would include the change, the command or page used to verify it, and screenshots only if the UI changed.
```

Roadmap or product request:

```md
This is useful product feedback. We need to separate the use case from implementation because it may involve provider credentials, deployment choices, or billing/auth behavior. Can you describe the workflow and the smallest outcome that would solve it?
```
