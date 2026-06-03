# QuickVoice

QuickVoice is a source-available AI voice agent platform for building, deploying, and operating automated phone workflows. It includes a marketing site, customer console, API server, AI worker, and local development tooling for teams building voice automation across scheduling, support, reminders, collections, sales follow-up, and operations.

Website: [quickvoice.co](https://quickvoice.co)

## What is included

- `apps/web` - Next.js marketing site for QuickVoice, industry pages, use cases, blog content, pricing, and legal pages.
- `apps/console` - Next.js product console for managing organizations, agents, phone numbers, calls, knowledge bases, API keys, billing, and settings.
- `apps/server` - Express API server with auth, organization permissions, agent configuration, phone number management, call logs, outbound calls, runtime AI config, Stripe, Twilio, Telnyx, LiveKit, S3, and Inngest integrations.
- `apps/ai` - Python AI service and LiveKit worker handlers for call runtime configuration, call logging, and voice-agent execution.
- `packages/eslint-config` and `packages/typescript-config` - Shared monorepo linting and TypeScript configuration.
- `scripts`, `Taskfile.yml`, and `docker-compose.dev.yml` - Local development orchestration for Node services, Python services, Prisma, and Postgres.

## License

QuickVoice is source-available under the [QuickVoice Source Available License](./LICENSE).

You may use, modify, and self-host this repository if you are an individual or an organization with annual gross revenue of US $1,000,000 or less. Organizations with annual gross revenue over US $1,000,000 must buy an enterprise license from QuickVoice before using the software.

Enterprise licensing: [quickvoice.co](https://quickvoice.co)

This is not an OSI-approved license because it includes a revenue-based commercial restriction. Third-party dependencies remain under their own licenses.

## Local development

This repo is wired for local SSH development through Go Task. The main command is:

```sh
task up:dev
```

`task up` and `task dev` are aliases. Go Task treats spaces as separate task names, so prefer `task up:dev` for the explicit form.

Before running it on a fresh Ubuntu host, install Docker, Docker Compose, Go, and go-task if they are missing:

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

That command creates local env files from `*.env.dev.example`, activates `pnpm@9.0.0`, installs Node dependencies, creates the AI Python virtualenv, starts Postgres via `docker-compose.dev.yml`, runs Prisma migrations, and launches the local services:

- Console: `http://localhost:3000`
- Marketing site: `http://localhost:3001`
- API: `http://localhost:5000/api/v1/health`
- API docs: `http://localhost:5000/api/v1/docs`
- AI API: `http://localhost:8000/health`

Edit the generated env files after the first run if you need real Google, Stripe, LiveKit, Twilio, Telnyx, or AWS credentials. The generated files are ignored by git.

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

## Development notes

- Package manager: `pnpm@9.0.0`
- Node.js: `>=18`
- Monorepo runner: Turborepo
- Database: Postgres with Prisma migrations in `apps/server/prisma`
- Auth: Better Auth
- Telephony and voice runtime integrations: LiveKit, Twilio, Telnyx
- Payments: Stripe

Common root commands:

```sh
pnpm build
pnpm lint
pnpm check-types
pnpm test:dev-orchestration
```

## Enterprise licensing

If your organization has annual gross revenue over US $1,000,000, you need an enterprise license before using QuickVoice. Visit [quickvoice.co](https://quickvoice.co) to buy or request enterprise terms.
