# Contributing To QuickVoice

Thanks for helping improve QuickVoice. This repo is open source so teams can inspect, self-host, and extend AI phone-agent infrastructure.

## Good First Contributions

- Bug fixes with a clear reproduction.
- Documentation improvements for local setup, telephony providers, or deployment.
- Tests for existing behavior.
- Small product improvements that do not introduce a new dependency or migration.
- Integration notes for LiveKit, Twilio, Telnyx, Stripe, Postgres, or S3-compatible storage.

For larger changes, open an issue first so we can agree on the approach before you spend time on implementation.

## Local Setup

QuickVoice uses `pnpm@9.0.0`, Turborepo, Docker, Postgres, Node.js `>=18`, and Python for the AI worker.

```sh
task up:dev
```

Useful checks:

```sh
pnpm lint
pnpm check-types
pnpm test
pnpm build
pnpm ci:local
pnpm audit:deps -- --audit-level high
```

Run the narrowest check that proves your change, then run broader checks when touching shared code, API contracts, auth, billing, database models, or runtime agent behavior.

## Pull Request Guidelines

- Keep PRs focused on one change.
- Describe the user-facing impact.
- Include screenshots or recordings for UI changes.
- Include test evidence in the PR body.
- Avoid unrelated formatting or dependency churn.
- Do not commit local env files, credentials, generated secrets, or private customer data.

## Development Notes

- `apps/web` contains the public website.
- `apps/console` contains the product console.
- `apps/server` contains the API and Prisma schema.
- `apps/ai` contains the Python AI service and LiveKit worker handlers.
- Shared TypeScript and lint configuration live under `packages/`.

## License

By contributing, you agree that your contributions are licensed under the GNU Affero General Public License v3.0, as described in [LICENSE](./LICENSE).
