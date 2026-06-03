# QuickVoice

The open-source alternative to Retell for AI phone agents.

QuickVoice is an open-source platform for building, self-hosting, and operating AI agents that make and receive phone calls. It gives teams the full voice-agent stack: a marketing site, customer console, API server, LiveKit-powered AI worker, telephony integrations, knowledge bases, call logs, campaigns, billing, and local development tooling.

Website: [quickvoice.co](https://quickvoice.co)

## Why QuickVoice

Voice agents are becoming core business infrastructure. The teams building them need more than a black-box API.

- Own the stack: run the console, API, worker, database, and telephony bindings yourself.
- Keep control of customer data: inspect storage, logs, call metadata, and runtime configuration.
- Customize the workflow: adapt agents, knowledge sources, campaigns, permissions, billing, and integrations to your use case.
- Bring your providers: LiveKit for voice runtime, Twilio or Telnyx for phone numbers, S3-compatible storage for files and recordings.
- Avoid vendor lock-in: fork it, extend it, self-host it, or use QuickVoice Cloud when you want managed infrastructure.

## What You Can Build

- Inbound AI receptionists and support agents
- Outbound sales, reminders, collections, and follow-up workflows
- Appointment scheduling and qualification calls
- Knowledge-backed agents that answer from uploaded sources
- Campaigns that call many contacts and track outcomes
- Voice automation for healthcare, financial services, logistics, real estate, ecommerce, and operations teams

## What's Inside

- `apps/web` - Next.js website with product pages, use cases, industry pages, blog content, pricing, and legal pages.
- `apps/console` - Next.js customer console for organizations, agents, numbers, calls, knowledge bases, API keys, billing, and settings.
- `apps/server` - Express API server with auth, permissions, agent configuration, phone numbers, call logs, outbound calls, Stripe, Twilio, Telnyx, LiveKit, S3, and Inngest integrations.
- `apps/ai` - Python AI service and LiveKit worker handlers for runtime configuration, call logging, and voice-agent execution.
- `packages/eslint-config` and `packages/typescript-config` - Shared monorepo linting and TypeScript configuration.
- `scripts`, `Taskfile.yml`, and `docker-compose.dev.yml` - Local orchestration for Node services, Python services, Prisma, and Postgres.

## Stack

- Product and marketing: Next.js, React, Tailwind CSS
- API: Express, TypeScript, Better Auth
- Voice runtime: LiveKit, Python workers
- Telephony: Twilio and Telnyx
- Data: Postgres, Prisma, S3-compatible object storage
- Billing: Stripe
- Monorepo: pnpm and Turborepo

## Quick Start

The easiest local path is Go Task:

```sh
task up:dev
```

`task up` and `task dev` are aliases. Go Task treats spaces as separate task names, so prefer `task up:dev` for the explicit form.

On a fresh Ubuntu host, install Docker, Docker Compose, Go, and go-task if they are missing:

```sh
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 golang-go
sudo usermod -aG docker "$USER"
go install github.com/go-task/task/v3/cmd/task@latest
export PATH="$PATH:$HOME/go/bin"
```

Reconnect the SSH session after changing Docker group membership. Then run:

```sh
task up:dev
```

The task creates local env files from `*.env.dev.example`, activates `pnpm@9.0.0`, installs Node dependencies, creates the AI Python virtualenv, starts Postgres through `docker-compose.dev.yml`, runs Prisma migrations, and launches:

- Console: `http://localhost:3000`
- Marketing site: `http://localhost:3001`
- API: `http://localhost:5000/api/v1/health`
- API docs: `http://localhost:5000/api/v1/docs`
- AI API: `http://localhost:8000/health`

Edit the generated env files after the first run if you need real Google, Stripe, LiveKit, Twilio, Telnyx, or AWS credentials. Generated env files are ignored by git.

Useful individual tasks:

```sh
task doctor
task env:dev
task docker:up
task db:migrate
task server:dev
task console:dev
task web:dev
task ai:api
task ai:worker
```

Common root commands:

```sh
pnpm build
pnpm lint
pnpm check-types
pnpm test:dev-orchestration
```

## Open Source And Commercial Use

QuickVoice is licensed under the [GNU Affero General Public License v3.0](./LICENSE).

You can use, study, modify, and distribute the code under the AGPL. If you modify QuickVoice and make it available to users over a network, the AGPL requires you to make the corresponding source code available under the same license.

For teams that need a commercial license, managed hosting, implementation support, or enterprise terms, contact QuickVoice through [quickvoice.co](https://quickvoice.co).

This section is not legal advice. Review the AGPL and consult counsel for your specific use case.

## Community

QuickVoice is built in public for teams that want programmable, inspectable phone automation.

- Star the repo if you want open voice-agent infrastructure to exist.
- Open issues for bugs, gaps, and integration requests.
- Read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.
- Report security issues through [SECURITY.md](./SECURITY.md).

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).
