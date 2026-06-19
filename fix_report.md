# QuickVoice Audit Fix Report

## Executive Summary

- Repository: `/home/ubuntu/rahul/quickvoice`
- Starting commit: `d0284076a776a80bc39f06d90d56b4c650e366ac`
- Started: `2026-06-19T10:36:14+00:00`
- Finished: `2026-06-19T10:55:03+00:00`
- Module fix status: 1 fixed
- Push status: not pushed

## Module Status

| Module | Status | Return Code | Duration | Logs |
| --- | --- | ---: | ---: | --- |
| `packages-config` | fixed | 0 | 712.1s | `.fix_runs/2026-06-19T074912+0000/packages-config.stdout.jsonl`, `.fix_runs/2026-06-19T074912+0000/packages-config.stderr.log` |

## Fixes By Module

### packages-config: Shared lint and TypeScript configuration

- Status: `fixed`
- Return code: `0`
- Duration: `712.1s`
- Stdout log: `.fix_runs/2026-06-19T074912+0000/packages-config.stdout.jsonl`
- Stderr log: `.fix_runs/2026-06-19T074912+0000/packages-config.stderr.log`

## Summary

Fixed the scoped shared lint/TypeScript config audit findings. The working tree already contained several audit-fix edits when I started; I preserved them, added a root `check:configs` gate, and added smoke coverage for that gate.

## Fixed Findings

- Removed warning-only ESLint behavior from the shared base config.
- Made `turbo/no-undeclared-env-vars` an error.
- Updated web and console apps to consume `@repo/eslint-config/next-js`.
- Added strict app lint scripts with `--max-warnings=0`.
- Rebuilt the shared Next preset on `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- Made the TypeScript base runtime-neutral and added `browser`, `node`, and `strict` presets.
- Added explicit TypeScript config export map and removed stale publish metadata.
- Updated README naming and consumer examples.
- Added package smoke tests for ESLint exports, TypeScript presets, app adoption, strict lint gates, and root config validation.
- Added root `check:configs` and wired it into `ci:local`.

## Deferred Or Unresolved

No unresolved actionable findings remain inside the allowed edit scope.

A dedicated remote CI workflow/path filter for `packages/eslint-config/**` was not added because `.github/workflows` was outside the allowed paths. The repo now exposes `pnpm check:configs` for CI to call.

## Files Changed

- `apps/console/eslint.config.mjs`
- `apps/console/package.json`
- `apps/web/eslint.config.mjs`
- `apps/web/package.json`
- `package.json`
- `packages/eslint-config/README.md`
- `packages/eslint-config/base.js`
- `packages/eslint-config/next.js`
- `packages/eslint-config/package.json`
- `packages/eslint-config/test.mjs`
- `packages/typescript-config/README.md`
- `packages/typescript-config/base.json`
- `packages/typescript-config/browser.json`
- `packages/typescript-config/nextjs.json`
- `packages/typescript-config/node.json`
- `packages/typescript-config/package.json`
- `packages/typescript-config/react-library.json`
- `packages/typescript-config/strict.json`
- `packages/typescript-config/test.mjs`
- `pnpm-lock.yaml`
- `turbo.json`

## Verification Run

- `pnpm check:configs` passed: ESLint config tests `6/6`, TypeScript config tests `6/6`.
- `pnpm --filter web lint` passed.
- `pnpm --filter console lint` passed.
- `pnpm --filter server check-types` passed.
- `pnpm --filter web check-types` passed.
- `pnpm --filter console check-types` passed.
- `git diff --check -- <scoped paths>` passed.
- Stale marker search for `eslint-plugin-only-warn`, old `@turbo/eslint-config`, and old Next plugin lock markers returned no scoped matches.

#### Verification
- `eslint config syntax`: return code `0`
  - Command: `bash -lc node --check packages/eslint-config/base.js && node --check packages/eslint-config/next.js && node --check packages/eslint-config/react-internal.js`
- `typescript config json`: return code `0`
  - Command: `bash -lc node -e "for (const f of ['packages/typescript-config/base.json','packages/typescript-config/nextjs.json','packages/typescript-config/react-library.json','packages/typescript-config/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8'))"`
- `workspace lint`: return code `0`
  - Command: `pnpm lint`
  - Stdout:
```
> QuickVoice@ lint /home/ubuntu/rahul/quickvoice
> turbo run lint


   • Packages in scope: @repo/eslint-config, @repo/typescript-config, console, server, web
   • Running lint in 5 packages
   • Remote caching disabled

@repo/typescript-config:lint: cache miss, executing bd3cea030dc9cbc6
@repo/eslint-config:lint: cache miss, executing d1f502cf4f02300f
@repo/eslint-config:lint:
@repo/eslint-config:lint: > @repo/eslint-config@0.0.0 lint /home/ubuntu/rahul/quickvoice/packages/eslint-config
@repo/eslint-config:lint: > node --check ./base.js && node --check ./next.js && node --check ./react-internal.js && node --test ./test.mjs
@repo/eslint-config:lint:
@repo/typescript-config:lint:
@repo/typescript-config:lint: > @repo/typescript-config@0.0.0 lint /home/ubuntu/rahul/quickvoice/packages/typescript-config
@repo/typescript-config:lint: > node --test ./test.mjs
@repo/typescript-config:lint:
@repo/typescript-config:lint: ✔ exports every supported TypeScript preset (4.448337ms)
@repo/typescript-config:lint: ✔ every exported TypeScript preset parses as JSON (2.821158ms)
@repo/typescript-config:lint: ✔ base preset is runtime-neutral (0.448896ms)
@repo/typescript-config:lint: ✔ runtime presets opt into browser and Node globals explicitly (5.512452ms)
@repo/typescript-config:lint: ✔ framework presets extend the browser runtime preset (0.63897ms)
@repo/typescript-config:lint: ✔ strict optional preset enables additional safety checks (0.312538ms)
@repo/typescript-config:lint: ℹ tests 6
@repo/typescript-config:lint: ℹ suites 0
@repo/typescript-config:lint: ℹ pass 6
@repo/typescript-config:lint: ℹ fail 0
@repo/typescript-config:lint: ℹ cancelled 0
@repo/typescript-config:lint: ℹ skipped 0
@repo/typescript-config:lint: ℹ todo 0
@repo/typescript-config:lint: ℹ duration_ms 221.821316
server:lint: cache miss, executing 6e0ba0f587a33ad4
server:lint:
server:lint: > server@1.0.0 lint /home/ubuntu/rahul/quickvoice/apps/server
server:lint: > tsc --noEmit --pretty false
server:lint:
@repo/eslint-config:lint: ✔ exports every public ESLint preset (3.073631ms)
@repo/eslint-config:lint: ✔ base preset fails undeclared Turbo env vars and does not downgrade errors (0.599161ms)
@repo/eslint-config:lint: ✔ derived presets do not include the warning-only plugin (0.479042ms)
@repo/eslint-config:lint: ✔ Next preset preserves the same app lint coverage as eslint-config-next (0.560095ms)
@repo/eslint-config:lint: ✔ workspace Next apps consume the shared preset with a strict warning gate (1.007312ms)
@repo/eslint-config:lint: ✔ root config validation task runs both shared config package checks (0.291315ms)
@repo/eslint-config:lint: ℹ tests 6
@repo/eslint-config:lint: ℹ suites 0
@repo/eslint-config:lint: ℹ pass 6
@repo/eslint-config:lint: ℹ fail 0
@repo/eslint-config:lint: ℹ cancelled 0
@repo/eslint-config:lint: ℹ skipped 0
@repo/eslint-config:lint: ℹ todo 0
@repo/eslint-config:lint: ℹ duration_ms 15917.280582
console:lint: cache miss, executing f88fc9cde81beae4
web:lint: cache miss, executing 7321d6a5e1573a02
console:lint:
console:lint: > console@0.1.0 lint /home/ubuntu/rahul/quickvoice/apps/console
console:lint: > eslint --max-warnings=0
console:lint:
web:lint:
web:lint: > web@0.1.0 lint /home/ubuntu/rahul/quickvoice/apps/web
web:lint: > eslint --max-warnings=0
web:lint:

 Tasks:    5 successful, 5 total
Cached:    0 cached, 5 total
  Time:    2m11.494s
```
  - Stderr:
```
• turbo 2.8.20
```

## Final Aggregate Verification

- `workspace lint`: return code `0`
  - Command: `pnpm lint`
  - Stdout:
```
> QuickVoice@ lint /home/ubuntu/rahul/quickvoice
> turbo run lint


   • Packages in scope: @repo/eslint-config, @repo/typescript-config, console, server, web
   • Running lint in 5 packages
   • Remote caching disabled

@repo/typescript-config:lint: cache miss, executing 62f6765531f90d80
@repo/eslint-config:lint: cache miss, executing 7db6aebdc2bf9919
@repo/eslint-config:lint:
@repo/eslint-config:lint: > @repo/eslint-config@0.0.0 lint /home/ubuntu/rahul/quickvoice/packages/eslint-config
@repo/eslint-config:lint: > node --check ./base.js && node --check ./next.js && node --check ./react-internal.js && node --test ./test.mjs
@repo/eslint-config:lint:
@repo/typescript-config:lint:
@repo/typescript-config:lint: > @repo/typescript-config@0.0.0 lint /home/ubuntu/rahul/quickvoice/packages/typescript-config
@repo/typescript-config:lint: > node --test ./test.mjs
@repo/typescript-config:lint:
@repo/typescript-config:lint: ✔ exports every supported TypeScript preset (2.581639ms)
@repo/typescript-config:lint: ✔ every exported TypeScript preset parses as JSON (0.844434ms)
@repo/typescript-config:lint: ✔ base preset is runtime-neutral (0.49264ms)
@repo/typescript-config:lint: ✔ runtime presets opt into browser and Node globals explicitly (8.025481ms)
@repo/typescript-config:lint: ✔ framework presets extend the browser runtime preset (1.618376ms)
@repo/typescript-config:lint: ✔ strict optional preset enables additional safety checks (0.418349ms)
@repo/typescript-config:lint: ℹ tests 6
@repo/typescript-config:lint: ℹ suites 0
@repo/typescript-config:lint: ℹ pass 6
@repo/typescript-config:lint: ℹ fail 0
@repo/typescript-config:lint: ℹ cancelled 0
@repo/typescript-config:lint: ℹ skipped 0
@repo/typescript-config:lint: ℹ todo 0
@repo/typescript-config:lint: ℹ duration_ms 182.242397
server:lint: cache miss, executing 46162bad567f0816
server:lint:
server:lint: > server@1.0.0 lint /home/ubuntu/rahul/quickvoice/apps/server
server:lint: > tsc --noEmit --pretty false
server:lint:
@repo/eslint-config:lint: ✔ exports every public ESLint preset (2.758852ms)
@repo/eslint-config:lint: ✔ base preset fails undeclared Turbo env vars and does not downgrade errors (0.650323ms)
@repo/eslint-config:lint: ✔ derived presets do not include the warning-only plugin (0.355526ms)
@repo/eslint-config:lint: ✔ Next preset preserves the same app lint coverage as eslint-config-next (0.557715ms)
@repo/eslint-config:lint: ✔ workspace Next apps consume the shared preset with a strict warning gate (0.929097ms)
@repo/eslint-config:lint: ✔ root config validation task runs both shared config package checks (1.06956ms)
@repo/eslint-config:lint: ℹ tests 6
@repo/eslint-config:lint: ℹ suites 0
@repo/eslint-config:lint: ℹ pass 6
@repo/eslint-config:lint: ℹ fail 0
@repo/eslint-config:lint: ℹ cancelled 0
@repo/eslint-config:lint: ℹ skipped 0
@repo/eslint-config:lint: ℹ todo 0
@repo/eslint-config:lint: ℹ duration_ms 7441.63131
console:lint: cache miss, executing c8c8d43b85152285
web:lint: cache miss, executing 80ae5582d62514e2
console:lint:
console:lint: > console@0.1.0 lint /home/ubuntu/rahul/quickvoice/apps/console
console:lint: > eslint --max-warnings=0
console:lint:
web:lint:
web:lint: > web@0.1.0 lint /home/ubuntu/rahul/quickvoice/apps/web
web:lint: > eslint --max-warnings=0
web:lint:

 Tasks:    5 successful, 5 total
Cached:    0 cached, 5 total
  Time:    1m21.654s
```
  - Stderr:
```
• turbo 2.8.20
```
- `workspace check-types`: return code `0`
  - Command: `pnpm check-types`
  - Stdout:
```
> QuickVoice@ check-types /home/ubuntu/rahul/quickvoice
> turbo run check-types


   • Packages in scope: @repo/eslint-config, @repo/typescript-config, console, server, web
   • Running check-types in 5 packages
   • Remote caching disabled

server:check-types: cache miss, executing 96b459bc03901e6b
console:check-types: cache miss, executing fb79397d7abf78a9
web:check-types: cache miss, executing 157db52ae6512653
server:check-types:
server:check-types: > server@1.0.0 check-types /home/ubuntu/rahul/quickvoice/apps/server
server:check-types: > tsc --noEmit
server:check-types:
console:check-types:
console:check-types: > console@0.1.0 check-types /home/ubuntu/rahul/quickvoice/apps/console
console:check-types: > tsc --noEmit
console:check-types:
web:check-types:
web:check-types: > web@0.1.0 check-types /home/ubuntu/rahul/quickvoice/apps/web
web:check-types: > tsc --noEmit
web:check-types:

 Tasks:    3 successful, 3 total
Cached:    0 cached, 3 total
  Time:    34.16s
```
  - Stderr:
```
• turbo 2.8.20
```
- `workspace build`: return code `0`
  - Command: `pnpm build`
  - Stdout:
```
page data using 3 workers ...
web:build:   Generating static pages using 3 workers (0/125) ...
console:build:   Finished TypeScript in 43s ...
console:build:   Collecting page data using 3 workers ...
console:build:   Generating static pages using 3 workers (0/25) ...
web:build:   Generating static pages using 3 workers (31/125)
console:build:   Generating static pages using 3 workers (6/25)
console:build:   Generating static pages using 3 workers (12/25)
console:build:   Generating static pages using 3 workers (18/25)
console:build: ✓ Generating static pages using 3 workers (25/25) in 2.4s
console:build:   Finalizing page optimization ...
console:build:
console:build: Route (app)
console:build: ┌ ƒ /
console:build: ├ ○ /_not-found
console:build: ├ ƒ /agents
console:build: ├ ƒ /agents/[id]
console:build: ├ ƒ /calls
console:build: ├ ƒ /calls/[id]
console:build: ├ ƒ /dashboard
console:build: ├ ○ /forgot-password
console:build: ├ ƒ /kb
console:build: ├ ○ /login
console:build: ├ ƒ /numbers
console:build: ├ ƒ /orgs
console:build: ├ ƒ /orgs/[id]
console:build: ├ ƒ /orgs/create
console:build: ├ ƒ /outbound
console:build: ├ ○ /register
console:build: ├ ○ /reset-password
console:build: ├ ƒ /settings
console:build: ├ ƒ /settings/api-keys
console:build: ├ ƒ /settings/billing
console:build: ├ ƒ /settings/danger
console:build: ├ ƒ /settings/organization
console:build: ├ ƒ /settings/profile
console:build: ├ ƒ /settings/roles
console:build: ├ ƒ /tools
console:build: └ ○ /verify
console:build:
console:build:
console:build: ○  (Static)   prerendered as static content
console:build: ƒ  (Dynamic)  server-rendered on demand
console:build:
web:build:   Generating static pages using 3 workers (62/125)
web:build:   Generating static pages using 3 workers (93/125)
web:build: ✓ Generating static pages using 3 workers (125/125) in 13.1s
web:build:   Finalizing page optimization ...
web:build:
web:build: Route (app)
web:build: ┌ ○ /
web:build: ├ ○ /_not-found
web:build: ├ ƒ /api/contact
web:build: ├ ƒ /blog
web:build: ├ ● /blog/[slug]
web:build: │ ├ /blog/air-ai-alternatives
web:build: │ ├ /blog/retell-ai-alternatives
web:build: │ ├ /blog/synthflow-alternatives
web:build: │ └ [+51 more paths]
web:build: ├ ○ /case-studies
web:build: ├ ● /case-studies/[slug]
web:build: │ ├ /case-studies/automotive-lease-retention-equity-mining
web:build: │ ├ /case-studies/automotive-sales-lead-response-bdc
web:build: │ ├ /case-studies/automotive-service-scheduling-noshow-reduction
web:build: │ └ [+30 more paths]
web:build: ├ ○ /company/about-us
web:build: ├ ○ /company/careers
web:build: ├ ○ /company/contact
web:build: ├ ○ /compliance/hipaa
web:build: ├ ○ /industries
web:build: ├ ○ /industries/automotive
web:build: ├ ○ /industries/e-commerce
web:build: ├ ○ /industries/education
web:build: ├ ○ /industries/financial-services
web:build: ├ ○ /industries/healthcare
web:build: ├ ○ /industries/hr-recruiting
web:build: ├ ○ /industries/logistics
web:build: ├ ○ /industries/manufacturing-engineering
web:build: ├ ○ /industries/real-estate
web:build: ├ ○ /industries/saas
web:build: ├ ○ /industries/travel-hospitality
web:build: ├ ○ /manifest.webmanifest
web:build: ├ ○ /pricing
web:build: ├ ○ /privacy-policy
web:build: ├ ○ /sitemap.xml
web:build: ├ ○ /solutions
web:build: ├ ○ /solutions/ai-answering-service
web:build: ├ ○ /solutions/ai-receptionist
web:build: ├ ○ /terms-of-service
web:build: ├ ○ /use-cases
web:build: ├ ○ /use-cases/appointment-scheduling
web:build: ├ ○ /use-cases/customer-support
web:build: ├ ○ /use-cases/operations-automation
web:build: ├ ○ /use-cases/order-status-returns
web:build: ├ ○ /use-cases/reminders-collections
web:build: └ ○ /use-cases/sales-lead-gen
web:build:
web:build:
web:build: ○  (Static)   prerendered as static content
web:build: ●  (SSG)      prerendered as static HTML (uses generateStaticParams)
web:build: ƒ  (Dynamic)  server-rendered on demand
web:build:

 Tasks:    3 successful, 3 total
Cached:    0 cached, 3 total
  Time:    2m27.247s
```
  - Stderr:
```
• turbo 2.8.20
```
- `ai tests`: return code `0`
  - Command: `bash -lc . apps/ai/.venv/bin/activate && cd apps/ai && python -m pytest tests -q`
  - Stdout:
```
..................................................                  [100%]
=============================== warnings summary ===============================
main.py:14
  /home/ubuntu/rahul/quickvoice/apps/ai/main.py:14: DeprecationWarning: livekit-plugins-silero is deprecated and will be removed in v2.0. AgentSession now defaults to the bundled silero VAD, so you can drop the explicit `vad=` argument entirely; pass `vad=None` to opt out, or use `from livekit.agents import inference; inference.VAD(model="silero", ...)` to customise options.
    from livekit.plugins import noise_cancellation, silero

main.py:15
  /home/ubuntu/rahul/quickvoice/apps/ai/main.py:15: DeprecationWarning: `livekit.plugins.turn_detector` is deprecated and will be removed in a future release. Use `livekit.agents.inference.TurnDetector` instead.
    from livekit.plugins.turn_detector.multilingual import MultilingualModel

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
50 passed, 2 warnings, 5 subtests passed in 4.92s
```

## Appendix: Runner Notes

- The runner never commits or pushes.
- Generated logs are stored under `.fix_runs/` and ignored by git.
- A failed status means later modules were not attempted.
