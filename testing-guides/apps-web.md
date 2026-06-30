# Marketing website and public UX Testing Guide

## Intern Testing Orientation

Test only `apps/web` at commit `3489a213063743d1c3a5a0465c327150d847097a`. First verify:

```bash
git rev-parse HEAD
git status --short apps/web
```

Pass if the commit matches and `apps/web` has no local modifications. Fail if HEAD differs or app files are dirty, because SEO/content behavior may not match this guide.

This module is the public Next.js marketing website. Test as an anonymous visitor unless a check explicitly says an external service is blocked. Do not use real customer data in forms.

## Module Overview

Key files:

- `apps/web/src/app/layout.tsx`: global metadata, GA script, GSC verification, navbar, footer, skip link, CTA analytics.
- `apps/web/src/app/page.tsx`: homepage and homepage JSON-LD.
- `apps/web/src/app/api/contact/route.ts`: only public API route, `POST /api/contact`.
- `apps/web/src/lib/links.ts`: contact, demo, login, and register destinations.
- `apps/web/src/lib/blog.ts`: markdown blog parsing, future/draft filtering, OG image fallback.
- `apps/web/src/lib/case-studies.ts`: case study markdown parsing.
- `apps/web/src/app/sitemap.ts`, `apps/web/public/robots.txt`, `apps/web/src/app/manifest.ts`: SEO crawl and PWA metadata.
- `apps/web/tests/marketing-audit.test.mjs`: repository-level marketing regression checks.

Routes in scope: `/`, `/pricing`, `/solutions`, `/solutions/ai-receptionist`, `/solutions/ai-answering-service`, `/industries`, 11 `/industries/*` pages, `/use-cases`, 6 `/use-cases/*` pages, `/blog`, `/blog/[slug]`, `/case-studies`, `/case-studies/[slug]`, `/company/about-us`, `/company/careers`, `/company/contact`, `/compliance/hipaa`, `/privacy-policy`, `/terms-of-service`, `/manifest.webmanifest`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, and `POST /api/contact`.

## Architecture And Data Flow Testing

- Public render path: Next.js App Router pages under `apps/web/src/app` compose server pages plus client components under `apps/web/src/components`. Pass if every listed route returns `200`, renders the shared navbar/footer, and has one visible primary heading. Fail on blank pages, hydration errors, or missing shared chrome.
- Content path: blog posts load from `apps/web/content/blog/*.md`; case studies load from `apps/web/content/case-studies/*.md`. Pass if `/blog` excludes future/draft posts and `/case-studies` shows 33 case studies grouped by industry. Fail if scheduled posts appear early, missing slugs return `200`, or markdown content renders raw frontmatter.
- SEO path: metadata is defined per page, `sitemap.ts` emits static, blog, and case-study URLs, and `robots.txt` allows public pages while disallowing `/api/` and authenticated app paths. Pass if sitemap contains public marketing URLs and excludes auth/dashboard routes. Fail if public routes are blocked or `/api/contact` is indexed.
- Contact data path: contact forms submit JSON to `POST /api/contact`, validate fields, then either log limited metadata when `CONTACT_WEBHOOK_URL` is unset or forward full submissions to that webhook. Pass if invalid requests return `400`, webhook failures return `502`, and success returns `{ ok: true }`. Fail if raw message content is logged without a webhook or validation is bypassed.
- CTA path: `REGISTER_URL` and `LOGIN_URL` are based on `NEXT_PUBLIC_CONSOLE_URL` or default to `https://console.quickvoice.co`; demo points to `https://tidycal.com/team/quickvoice/demo`. Pass if all CTAs use intended destinations. Fail if links point to stale `/contact`, `/demo`, or unavailable internal auth pages.

## Setup And Required Services

Required local tools: Node `>=18`, pnpm `9.0.0`.

```bash
pnpm install
pnpm --filter web dev
```

Open `http://localhost:3000`.

Environment variables proven from the repo:

- `NEXT_PUBLIC_CONSOLE_URL`: optional console base URL for login/register links and `/register` redirect. Default is `https://console.quickvoice.co`.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: optional Google Analytics ID loaded in `layout.tsx`.
- `NEXT_PUBLIC_GSC_VERIFICATION`: optional Google Search Console verification meta tag.
- `CONTACT_WEBHOOK_URL`: optional server-side webhook used by `POST /api/contact`; referenced in `turbo.json` and `api/contact/route.ts`.

Pass setup if the dev server loads `/` without terminal errors. Fail if dependencies are missing, port conflicts are unresolved, or environment values cause local CTAs to redirect to the wrong host.

## Automated Test Commands

Run from repo root unless noted:

```bash
pnpm --filter web lint
pnpm --filter web check-types
cd apps/web && node --test tests/marketing-audit.test.mjs
pnpm --filter web build
```

Pass if each exits `0`. Fail on lint warnings because `apps/web/package.json` uses `eslint --max-warnings=0`. `build` creates `.next`; do not commit generated output.

Optional full workspace signal:

```bash
pnpm lint
pnpm check-types
```

Pass if workspace checks exit `0`. Failures outside `apps/web` should be recorded as out-of-scope unless they block the web build.

## Functional Test Cases

- Homepage `/`: verify hero, feature sections, FAQ, contact section, JSON-LD, CTA buttons, and footer. Pass if “Book a Demo”, “Get Started”, contact, and FAQ content are visible and links work. Fail on missing CTA, broken anchor, or console errors.
- Navigation: test desktop hover/focus dropdowns and mobile hamburger. Pass if Solutions nested links include solutions, industries, and use cases, Escape closes desktop dropdowns, and mobile links close the menu. Fail if keyboard users cannot open or leave menus.
- Pricing `/pricing`: verify six plans: Free, PAYG, Starter, Growth, Scale, Enterprise. Pass if Free says 15 browser-only minutes, BAA is only Scale/Enterprise, and CTA destinations match `REGISTER_URL` or TidyCal. Fail if pricing contradicts homepage/FAQ copy.
- Blog `/blog`: search with `q=healthcare`, clear search, and search for nonsense. Pass if results filter, clear returns full list, and empty state says no articles found. Fail if future posts dated after June 30, 2026 appear.
- Blog detail `/blog/ai-after-hours-call-handling`: pass if article metadata, tags, related articles, markdown tables/lists/links, and bottom CTA render. Fail if unknown `/blog/not-real` does not show 404.
- Case studies `/case-studies`: pass if 33 studies across 11 industries render and each card links to `/case-studies/[slug]`. Fail if counts are wrong or detail pages lack article schema/breadcrumbs.
- Industry and use-case pages: test every route listed in Module Overview. Pass if each has hero copy, sections, related links, and CTAs. Fail if route 404s, has duplicate/missing H1, or related links are broken.
- Company contact `/company/contact`: submit invalid fields, valid fields, and optional phone. Pass if field-specific errors use `aria-describedby`, valid submission shows success, and button disables while sending. Fail if invalid email/short message submits.
- Careers `/company/careers`: expand each job category and click Apply Now. Pass if job cards expand and Apply Now navigates to `/company/contact?role=...` without crashing. Fail if jobs are inert buttons or role links break.
- Legal and compliance pages: pass if `/privacy-policy`, `/terms-of-service`, and `/compliance/hipaa` render readable sections and contact links. Fail if compliance claims conflict with pricing or HIPAA copy.

## SaaS Business And Operations Test Cases

- Authentication handoff: anonymous visitors only in `apps/web`; login/register are external console links. Pass if marketing pages do not expose authenticated dashboard paths and `/register` redirects to `${NEXT_PUBLIC_CONSOLE_URL}/register`. Fail if public pages link to local `/login` or `/register` content that does not exist.
- Tenant/RBAC boundaries: no tenant data or RBAC exists in this module. Pass if public pages never show customer-specific data, workspace IDs, billing IDs, or dashboards. Fail if authenticated route names become crawlable content.
- Billing claims: compare `/pricing`, homepage FAQ, `apps/web/data/plans.ts`, and CTA copy. Pass if Free/PAYG/Starter/Growth/Scale/Enterprise values are consistent or documented as marketing-only. Fail on contradictory minutes, BAA availability, or overage rates.
- Support handoff: contact forms and footer email/phone are the support path. Pass if form failures tell users to email `info@quickvoice.co` and contact page displays phone `+1 2184525998`. Fail if support path disappears or returns only a silent error.
- Lifecycle states: test first visit, CTA click, form submit success, form submit failure, 404, and route-level error UI. Pass if each state gives a clear next action. Fail if users dead-end.

## Integration And API Test Cases

Start the dev server, then run:

```bash
curl -i http://localhost:3000/api/contact
curl -i -X POST http://localhost:3000/api/contact -H 'Content-Type: application/json' --data '{bad json'
curl -i -X POST http://localhost:3000/api/contact -H 'Content-Type: application/json' --data '{"name":"A","email":"bad","lookingFor":"","message":"short"}'
curl -i -X POST http://localhost:3000/api/contact -H 'Content-Type: application/json' --data '{"name":"Intern Tester","email":"intern@example.com","company":"QuickVoice QA","phone":"+12184525998","lookingFor":"Free Demo","message":"Testing the public contact route with safe synthetic data."}'
```

Pass criteria: non-POST should not create a submission; bad JSON returns `400`; invalid fields return `400`; valid submission returns `200` with `ok: true` when no webhook is configured. Fail if invalid input is accepted or valid safe input crashes.

Webhook integration: with a controlled test webhook in `CONTACT_WEBHOOK_URL`, valid submissions should POST full JSON including `source: quickvoice-web-contact` and ISO `submittedAt`. Pass if webhook receives one request and UI shows success. Fail if duplicate requests occur, PII is sent to the wrong endpoint, or a failing webhook does not return `502`.

## Non-Functional Test Cases

- Performance: run Lighthouse on `/`, `/pricing`, `/blog`, `/company/contact`, and one long article. Pass if LCP is reasonable on local/prod, no render-blocking third-party script loads without env, images have dimensions/alt text, and below-fold homepage sections lazy-load. Fail on blank delayed hero, huge layout shift, or unoptimized remote images.
- Reliability: reload every route, then disable network and submit contact form. Pass if pages recover on refresh and form shows a user-facing error. Fail on uncaught promise errors or stuck loading buttons.
- Responsiveness: test 375px, 768px, 1024px, and 1440px widths. Pass if nav, pricing tables, blog grids, forms, and legal text remain readable without horizontal scroll. Fail if text overlaps or CTA buttons leave the viewport.
- Compatibility: test latest Chrome, Safari, Firefox, and mobile Safari/Chrome. Pass if menus, forms, markdown, and animations work. Fail if any browser cannot navigate or submit forms.
- Data integrity: pass if blog/case-study canonical URLs match their route and missing OG images fall back to `/og-image.png`. Fail if content slugs duplicate or canonical points to another page.

## UX, UI, Accessibility, And Compatibility Testing

- Keyboard: Tab from the browser top through skip link, navbar, CTA buttons, forms, footer, FAQ accordions, and mobile menu. Pass if focus is visible and order is logical. Fail if focus is trapped, hidden, or skips active controls.
- Screen reader cues: pass if form labels are announced, validation errors are associated with fields, status messages use `role="status"` or `role="alert"`, and decorative icons do not replace text. Fail if icon-only controls lack labels.
- Motion: with reduced motion enabled, pass if animations are minimized by `globals.css` and content remains visible. Fail if essential content only appears after animation.
- Visual hierarchy: pass if each page has one clear H1, prominent CTA, readable body copy, and consistent navbar/footer. Fail if hero copy is obscured, cards overlap, or mobile text is clipped.
- Forms: pass if required fields, optional phone, loading, success, and error states are clear on both homepage and contact page forms. Fail if submit can be double-clicked into duplicate requests.

## Security, Privacy, And Compliance Checks

- Secrets: pass if no API keys or real credentials appear in `apps/web`, `.env.dev.example`, content markdown, or public assets. Fail on committed secrets.
- Contact privacy: pass if server logs without `CONTACT_WEBHOOK_URL` contain only email domain, booleans, message length, source, timestamp, and destination. Fail if full names, phone numbers, or messages are logged unnecessarily.
- XSS/markdown: pass if blog markdown renders through `react-markdown` without raw HTML execution. Fail if script tags or unsafe HTML execute from markdown.
- External links: pass if markdown external links open with `rel="noopener noreferrer"` and social/demo/console links are expected. Fail if untrusted external links omit safe rel attributes.
- Compliance copy: pass if HIPAA/BAA claims say Scale and Enterprise healthcare customers before PHI is processed, and the site does not claim the repo alone proves compliance. Fail on unsupported “certified for everyone” claims.
- Robots/privacy: pass if `/api/`, dashboard, billing, settings, and auth paths remain disallowed in `robots.txt`. Fail if customer-data paths become crawlable.

## Edge Cases And Failure Modes

- Empty content directories: blocked for destructive local simulation unless done in a throwaway clone. Pass if app handles no posts/case studies with empty states; fail if build crashes.
- Invalid blog dates/frontmatter: pass if invalid/future/draft posts are excluded by `isPublishedPost`. Fail if invalid dates publish.
- Webhook timeout/failure: pass if user sees fallback email message and API returns `502`. Fail if the UI reports success when delivery failed.
- External image outage: pass if layout reserves image space and page remains usable. Fail if remote CloudFront image failures break whole pages.
- CTA env mistakes: pass if missing `NEXT_PUBLIC_CONSOLE_URL` defaults to `https://console.quickvoice.co`; fail if malformed env creates broken login/register URLs.
- Unknown routes: pass if `/does-not-exist` renders the custom 404 with Home and Login actions. Fail if it exposes stack traces.

## Test Data, Fixtures, Accounts, And Roles

Use synthetic form data only:

- Name: `Intern Tester`
- Email: `intern@example.com`
- Company: `QuickVoice QA`
- Phone: `+12184525998`
- Looking for: `Free Demo`, `Consultation`, `Implementation`, `Support`, `General Inquiry`
- Message: `Testing the public contact route with safe synthetic data.`

Fixtures: 90 blog markdown files in `apps/web/content/blog`, 33 case-study markdown files in `apps/web/content/case-studies`, 11 industry content files in `apps/web/content/industries`, 6 use-case content files in `apps/web/content/use-cases`, image metadata in `apps/web/data/industries/*.json`, and compliance images in `apps/web/data/compliance.json`.

Roles: anonymous public visitor, marketing/sales recipient via webhook, and external console user. No in-repo admin, tenant, RBAC, or billing role is available in `apps/web`.

## External Services Or Blocked Checks

- Console login/register: blocked without access to `console.quickvoice.co` or a staging console. Pass if login/register pages load and preserve intended destination; fail if links 404 or route users to the marketing app.
- TidyCal demo booking: blocked if internet or booking permissions are unavailable. Pass if `https://tidycal.com/team/quickvoice/demo` opens a booking flow; fail if CTA is dead or points elsewhere.
- Google Analytics: blocked without `NEXT_PUBLIC_GA_MEASUREMENT_ID` and GA access. Pass if `gtag` loads and `cta_click` events fire; fail if analytics breaks page navigation.
- Google Search Console verification: blocked without the verification token. Pass if the configured meta tag appears in `<head>`; fail if wrong or duplicated.
- Contact webhook delivery: blocked without a safe test webhook. Pass if one valid submission reaches the webhook once; fail on missing, duplicate, or wrong-payload delivery.
- Live compliance certification validation: blocked without legal/vendor evidence. Pass if claims match approved collateral; fail if page copy asserts unsupported certifications.

## Regression Risks

High-risk areas are CTA link constants in `src/lib/links.ts`, pricing copy drift between `/pricing`, homepage FAQ, and `data/plans.ts`, future blog publication filtering in `src/lib/blog.ts`, sitemap/robots consistency, contact form validation parity between homepage and contact page, and keyboard accessibility in `components/mvpblocks/header-1.tsx`.

Also watch for remote image host changes because `next.config.ts` only allows `d35j3mps666d98.cloudfront.net`, and for compliance copy changes because HIPAA/BAA wording appears on pricing, healthcare, answering service, receptionist, and compliance pages.

## Release Acceptance Checklist

- `git rev-parse HEAD` matches `3489a213063743d1c3a5a0465c327150d847097a`.
- `pnpm --filter web lint`, `pnpm --filter web check-types`, `cd apps/web && node --test tests/marketing-audit.test.mjs`, and `pnpm --filter web build` pass.
- Every route in Module Overview returns the expected page or 404 behavior.
- Navbar, footer, CTAs, blog search, pricing, contact forms, career jobs, legal pages, and dynamic content are manually verified.
- `POST /api/contact` passes success, validation, bad JSON, and webhook-failure checks.
- SEO metadata, JSON-LD, sitemap, robots, manifest, OG images, and canonical URLs are checked.
- Accessibility checks pass for keyboard, focus, labels, live regions, reduced motion, and mobile navigation.
- External-service checks are either passed with evidence or explicitly marked blocked with the reason.
