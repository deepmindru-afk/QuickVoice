# QuickVoice User Acceptance Testing Guide

## Purpose

This guide validates QuickVoice from a user's point of view. The module guides in this folder verify product areas one at a time; this guide verifies whether a real customer can discover, configure, operate, and recover from the product without hitting bugs, confusing UX, broken permissions, or hidden failure states.

Use this as the release gate for user-facing quality. A release is not ready if a critical journey fails, if a tester cannot recover from a common error, or if the UI makes a user guess what happened.

## How To Use This Guide

Run tests against a clean local, staging, or production-like environment. Prefer staging for vendor-dependent flows because real telephony, billing, storage, email, and LiveKit behavior cannot be fully proven with local mocks.

For every check, record one of:

| Result  | Meaning                                                                                                   |
| ------- | --------------------------------------------------------------------------------------------------------- |
| Pass    | The expected UI, network request, data change, and user-facing state are correct.                         |
| Fail    | The feature is available but behaves incorrectly, confuses the user, leaks data, or blocks the journey.   |
| Blocked | The check cannot run because credentials, vendors, seed data, test accounts, or services are unavailable. |
| Waived  | A product owner explicitly accepted the risk for this release with owner, date, and reason.               |

Do not mark a vendor-dependent check as Pass unless the vendor action really completed in the tested environment. Use Blocked with a specific reason when Twilio, Telnyx, LiveKit, Stripe, S3, SMTP, Smithery, or analytics credentials are missing.

## Required Evidence

Capture evidence for every Fail, Blocked, or Waived result:

- Build or commit SHA
- Environment URL
- Browser and version
- Device or viewport
- Tester name
- Date and time with timezone
- Persona used
- Account email
- Organization name, slug, and role
- Route or page
- Exact steps taken
- Expected result
- Actual result
- Screenshot or screen recording
- Browser console errors
- Network request URL, method, status, request body summary, and response body summary
- Server `requestId`, trace id, or relevant logs when available
- `/api/v1/health` and `/api/v1/ready` output when service readiness matters

Suggested bug title format:

```text
[UAT][Journey][Severity] Short user-facing problem
```

Example:

```text
[UAT][Agent setup][P1] Admin cannot tell why new agent is not call-ready
```

## Severity And Release Gates

| Severity | Definition                                                                                                             | Release rule                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| P0       | Data leak, account takeover, payment loss, destructive action without confirmation, or product unusable for all users. | Must fix before release.                                               |
| P1       | Critical journey blocked, wrong tenant data, broken auth, failed call setup, or severe accessibility blocker.          | Must fix before release unless explicitly waived by owner.             |
| P2       | Important workflow confusing or degraded, but a reasonable workaround exists.                                          | Fix before release when practical; otherwise log owner/date/follow-up. |
| P3       | Polish, copy, layout, or minor usability issue that does not block the task.                                           | Can ship with backlog item.                                            |

Release acceptance requires:

- All P0 and P1 issues are fixed or explicitly waived.
- Every critical journey below is Pass or Waived.
- Blocked checks list the exact missing dependency and owner.
- No user can see data from another organization after switching tenants, refreshing, or signing out.
- No destructive action succeeds without a clear confirmation step.
- Every primary form has clear validation, loading, success, and failure states.
- Mobile and keyboard users can complete the critical journeys.

## Test Environment Setup

Minimum local setup from repository root:

```bash
task up:dev
```

Useful targeted setup:

```bash
task env:dev
task deps:node
task deps:python
task docker:up
task db:migrate
task db:seed -- --email tester-owner@example.com
task mail:up
task server:dev
task console:dev
task web:dev
task ai:api
task ai:worker
```

Expected local URLs:

| Surface          | URL                                   |
| ---------------- | ------------------------------------- |
| Console          | `http://localhost:3000`               |
| Marketing site   | `http://localhost:3001`               |
| Server health    | `http://localhost:5000/api/v1/health` |
| Server readiness | `http://localhost:5000/api/v1/ready`  |
| API docs         | `http://localhost:5000/api/v1/docs`   |
| AI API health    | `http://localhost:5555/health`        |
| Mailpit          | `http://localhost:8025`               |

Before starting UAT:

- Confirm server health returns `200`.
- Confirm readiness clearly reports all configured and missing dependencies.
- Confirm console, marketing site, and API docs load.
- Confirm test email can be received in Mailpit or a safe staging mailbox.
- Confirm seed data or fixtures exist for each role and organization.
- Confirm vendor credentials are present for any vendor-dependent test you plan to mark Pass.

## Browsers, Devices, And Accessibility Matrix

Test every critical journey in:

| Platform        | Required coverage                                           |
| --------------- | ----------------------------------------------------------- |
| Chrome desktop  | Full critical journey suite                                 |
| Safari desktop  | Full critical journey suite or staging smoke suite          |
| Firefox desktop | Full critical journey suite or staging smoke suite          |
| Mobile Safari   | Auth, navigation, forms, dashboard, agents, calls, settings |
| Mobile Chrome   | Auth, navigation, forms, dashboard, agents, calls, settings |

Viewport minimums:

- `375 x 667`
- `390 x 844`
- `768 x 1024`
- `1024 x 768`
- `1440 x 900`

Accessibility checks for every journey:

- Keyboard-only path works from start to finish.
- Focus order is logical and visible.
- Dialogs, drawers, menus, popovers, and sheets trap and release focus correctly.
- Icon-only controls have accessible names.
- Form errors are associated with their fields.
- Toasts and async status messages are announced or visible without relying only on color.
- Reduced motion does not hide required content.
- Text remains readable in light and dark themes.
- No horizontal scrolling or overlapping controls at required viewports.

## Test Personas

Use synthetic data only. Do not use real customer data, real patient data, real payment cards outside Stripe test mode, or real call recordings unless the environment is approved for them.

| Persona           | Role               | Goal                                                                                      |
| ----------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| Anonymous visitor | Public user        | Understand QuickVoice and start signup or contact sales.                                  |
| First-time owner  | Organization owner | Create account, create organization, and reach first useful dashboard.                    |
| Operations admin  | Admin              | Configure agents, knowledge, numbers, outbound calls, and tools.                          |
| Team member       | Member             | Review dashboards and calls without mutating restricted resources.                        |
| Billing owner     | Owner              | Review plan, billing, API keys, roles, and organization settings.                         |
| Recovery user     | Any role           | Recover from errors, expired session, offline state, failed uploads, and missing vendors. |

Suggested accounts:

| Email                         | Role                      |
| ----------------------------- | ------------------------- |
| `tester-owner@example.com`    | Owner                     |
| `tester-admin@example.com`    | Admin                     |
| `tester-member@example.com`   | Member                    |
| `tester-recovery@example.com` | Error and recovery checks |

Suggested organizations:

| Organization                | Purpose                        |
| --------------------------- | ------------------------------ |
| `QuickVoice UAT Primary`    | Main happy-path workspace      |
| `QuickVoice UAT Secondary`  | Tenant switching and isolation |
| `QuickVoice UAT Empty`      | Empty-state checks             |
| `QuickVoice UAT Restricted` | RBAC and permission checks     |

Synthetic call and contact data:

| Field                  | Value                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| Name                   | `UAT Caller`                                                                    |
| Email                  | `uat-caller@example.com`                                                        |
| Company                | `QuickVoice QA`                                                                 |
| Safe phone placeholder | `+12184525998`                                                                  |
| Agent name             | `UAT Support Agent`                                                             |
| Knowledge source       | `UAT Product FAQ`                                                               |
| First message          | `Hi, this is QuickVoice QA. How can I help today?`                              |
| System prompt          | `You are a concise support agent for a synthetic QuickVoice QA test workspace.` |

## Product Quality Heuristics

Apply these standards to every journey, not only the explicit checks:

- The page tells the user what it is for.
- Primary actions are visually clear and use consistent labels.
- Loading states preserve layout and do not look broken.
- Empty states explain what is missing and what to do next.
- Error states explain the problem and offer retry, back, or support paths.
- Success states confirm what changed.
- Form validation appears before invalid data reaches the server when possible.
- Disabled controls explain why the action is unavailable.
- Destructive actions name the object being destroyed.
- Tables and cards preserve important information on mobile.
- Search, filters, tabs, and pagination are persistent enough that users do not lose context accidentally.
- Refresh, back button, deep links, and page reloads do not corrupt state.
- Copy does not overpromise unsupported capabilities.
- No page displays stale protected data after sign out, role change, or organization switch.

## Critical Journey 1: Marketing Discovery To Signup

Persona: Anonymous visitor.

Start at the marketing site.

1. Open `/`.
2. Review hero, product explanation, screenshots, use cases, FAQ, and primary CTAs.
3. Open `/pricing`.
4. Compare Free, PAYG, Starter, Growth, Scale, and Enterprise.
5. Open `/solutions`, one industry page, one use-case page, `/blog`, one blog detail page, `/case-studies`, and one case study.
6. Open `/company/contact`.
7. Submit invalid contact form values.
8. Submit a valid synthetic contact form.
9. Click register and login CTAs.

Pass criteria:

- Visitor understands what QuickVoice does, who it is for, and how to start.
- Every tested route returns the expected page or intentional 404.
- CTAs route to the intended console, registration, login, contact, or demo destination.
- Pricing and compliance claims are consistent across pages.
- Invalid contact data is blocked with field-specific errors.
- Valid contact submission shows success, sends only expected data, and avoids duplicate submissions.
- Mobile nav, desktop nav, footer, and search/filter interactions work.

Fail examples:

- CTA points to a dead route or wrong host.
- Marketing page claims a feature that the console cannot support.
- Contact form accepts invalid data or fails silently.
- User cannot navigate the site with keyboard or mobile menu.

References:

- `testing-guides/apps-web.md`

## Critical Journey 2: Account Creation, Verification, Login, And Recovery

Persona: First-time owner.

1. Open console `/register`.
2. Try invalid name, invalid email, short password, and mismatched confirmation.
3. Register with `tester-owner@example.com`.
4. Confirm the verification screen explains the next step.
5. Use Mailpit or staging inbox to verify email if enabled.
6. Sign out.
7. Open `/login`.
8. Try invalid email, wrong password, password visibility toggle, remember-me toggle, and successful login.
9. Open `/forgot-password`.
10. Request a reset link.
11. Open reset link from Mailpit or staging inbox.
12. Try short password and mismatched confirmation.
13. Complete password reset and log in with the new password.
14. Visit protected app routes while signed out.

Pass criteria:

- Invalid auth input never submits as a successful request.
- Loading states prevent duplicate submissions.
- Verification, forgot password, and reset flows explain what happened.
- Missing or invalid reset tokens show a clear expired/invalid message.
- Successful login routes to `/orgs` or `/dashboard` based on organization state.
- Signed-out access to protected routes redirects to `/login` without flashing tenant data.
- Session expiration returns user to login and clears protected UI.

Fail examples:

- Reset accepts missing token.
- Wrong credentials produce blank or generic failure without next action.
- Protected data flashes before redirect.
- Sign out leaves cached dashboard data visible.

References:

- `testing-guides/apps-console.md`
- `testing-guides/apps-server.md`

## Critical Journey 3: Organization Onboarding And Tenant Isolation

Persona: First-time owner.

1. Log in with a user that has no organizations.
2. Confirm `/orgs` offers a clear create path.
3. Create `QuickVoice UAT Primary`.
4. Confirm generated slug is readable and editable where supported.
5. Land in the organization or dashboard.
6. Create or access `QuickVoice UAT Secondary`.
7. Switch between organizations from the app shell.
8. Refresh after switching.
9. Open dashboard, agents, calls, numbers, knowledge base, tools, billing, roles, and settings after switching.
10. Sign out and sign back in.

Pass criteria:

- No-organization state is clear and actionable.
- Organization creation validates required fields.
- Switching organizations clears old React Query/UI data and reloads current tenant data.
- Routes never show resources from the previous organization.
- URL refresh and browser back do not cross tenant data.
- Non-members cannot inspect an organization detail page.

Fail examples:

- Dashboard shows previous organization's calls after switch.
- Agents list briefly shows old tenant agents.
- User can deep-link into an organization they do not belong to.

References:

- `testing-guides/apps-console.md`
- `testing-guides/apps-server.md`

## Critical Journey 4: Dashboard And Operational Overview

Persona: Operations admin or team member.

1. Open `/dashboard` with populated data.
2. Switch ranges: `24h`, `7d`, and `30d`.
3. Try an invalid range URL.
4. Refresh dashboard manually.
5. Inspect KPI cards, call volume chart, breakdown charts, agent activity, and recent calls.
6. Click KPI and recent-call links.
7. Test empty dashboard in `QuickVoice UAT Empty`.
8. Simulate offline mode or server failure.
9. Test member role access.

Pass criteria:

- Dashboard explains current performance without requiring user interpretation of raw data.
- Invalid range defaults safely.
- Range switch updates URL and data consistently.
- Charts have accessible data or text equivalents.
- Drilldown links preserve intended filters.
- Empty state explains how to generate data.
- Offline/server failure is visible and recoverable.
- Member role sees allowed read-only data without restricted controls.

Fail examples:

- API error is shown as an empty dashboard.
- Refresh button remains active while offline and loops failures.
- Chart-only information is inaccessible to keyboard or screen reader users.
- User clicks KPI and lands on an unrelated calls view.

References:

- `testing-guides/apps-console.md`

## Critical Journey 5: Agent Creation And Configuration

Persona: Operations admin.

1. Open `/agents`.
2. Test loading, empty, desktop table, and mobile card layouts.
3. Open create dialog.
4. Try blank name, short name, and each template option.
5. Create `UAT Support Agent`.
6. Confirm route to `/agents/[id]`.
7. Configure Behavior tab with invalid and valid first message/system prompt.
8. Configure Voice tab with language, model, voice, and timezone.
9. Configure Webhooks tab with disabled state, invalid URL, and valid URL.
10. Configure Tools tab with attach and detach where available.
11. Configure Knowledge tab with no sources and linked sources.
12. Review Limits tab.
13. Pause/resume agent from Advanced tab.
14. Return to list and verify state persisted.
15. Test delete or disable actions where supported.

Pass criteria:

- User can tell whether an agent is draft, configured, active, paused, or call-ready.
- Template choice affects the created agent or the UI clearly explains it is only a starter.
- Save actions show loading, success, and failure states.
- Invalid prompts and webhook URLs do not save.
- Unsaved changes are not lost without feedback.
- Agent list and detail remain consistent after refresh.
- Delete/disable action confirms the exact agent name and result.

Fail examples:

- User cannot tell what remains before the agent can receive calls.
- Toggle changes UI without server persistence.
- Agent detail saves invalid webhook URL.
- Delete reports success but the agent remains in list.

References:

- `testing-guides/apps-console.md`
- `testing-guides/apps-server.md`
- `testing-guides/apps-ai.md`

## Critical Journey 6: Phone Numbers And Call Routing

Persona: Operations admin.

1. Open `/numbers`.
2. Test loading, empty, error, and mobile layouts.
3. Open number search.
4. Try Twilio and Telnyx providers.
5. Try invalid country, lowercase country, invalid area code, and valid area code.
6. Search available numbers.
7. Buy a safe test number in staging or mark Blocked locally without credentials.
8. Assign number to `UAT Support Agent`.
9. Unassign number.
10. Copy phone number.
11. Refresh and confirm assignment state.

Pass criteria:

- User understands whether numbers are unavailable because none exist, vendors are missing, or search failed.
- Search validates provider, country, area code, and limit.
- Purchase sends expected provider and E.164 number.
- Assignment persists to the server and survives refresh.
- Unassigned numbers remain visible and actionable.
- Copy feedback is visible and temporary.

Fail examples:

- Missing vendor credentials appear as a generic crash.
- Assignment changes visually but does not persist.
- Unassigned numbers disappear from the page.
- Invalid country or area code submits without feedback.

References:

- `testing-guides/apps-console.md`
- `testing-guides/apps-server.md`

## Critical Journey 7: Knowledge Base Upload And Processing

Persona: Operations admin.

1. Open `/kb`.
2. Test loading, empty, error retry, desktop table, and mobile cards.
3. Open upload dialog.
4. Try URL upload with missing name, invalid URL, and valid URL.
5. Try file upload with no agent selected.
6. Try unsupported file type.
7. Upload supported file to `UAT Support Agent`.
8. Confirm signed upload URL request, direct upload, and knowledge record creation.
9. Watch status move through processing states.
10. Simulate processing error where possible.
11. Delete a source and confirm it is removed.

Pass criteria:

- User knows which agent the knowledge source belongs to.
- File and URL validation prevents bad submissions.
- Progress, processing, active, and error states are visible.
- Failed processing gives a next action.
- Delete confirms exact source and does not delete the wrong item.
- Vendor/service missing states name S3 or AI API where relevant.

Fail examples:

- File upload starts without selected agent.
- Unsupported file appears accepted.
- Processing error is hidden or looks successful.
- Delete action removes wrong source or stale row remains.

References:

- `testing-guides/apps-console.md`
- `testing-guides/apps-server.md`
- `testing-guides/apps-ai.md`

## Critical Journey 8: Outbound Calls And Campaigns

Persona: Operations admin.

1. Open `/outbound`.
2. Review Quick Call tab with no outbound-ready agents.
3. Select active configured agent with assigned number.
4. Try invalid phone number, missing contact name, optional first message, and prompt override.
5. Start a quick call in staging or mark Blocked without LiveKit/telephony credentials.
6. Confirm success state and link to resulting call log where available.
7. Review batch/campaign tab.
8. Try invalid CSV, missing columns, duplicate contacts, and valid synthetic CSV.
9. Upload batch file through signed URL flow where configured.
10. Start campaign or confirm blocked vendor state.

Pass criteria:

- User can tell why outbound is unavailable when agent, number, provider, or LiveKit setup is missing.
- Invalid phone numbers and files are blocked before request completion.
- Quick call success gives a clear next step.
- Batch upload validates required columns and row counts.
- Duplicate submissions are prevented while request is in flight.
- Failed campaign creation preserves user input where safe.

Fail examples:

- Start button is enabled with no call-ready agent.
- Bad CSV creates partial hidden campaign.
- Vendor failure reports success.
- User cannot recover from failed upload.

References:

- `testing-guides/apps-console.md`
- `testing-guides/apps-server.md`
- `testing-guides/apps-ai.md`

## Critical Journey 9: Inbound And Live Call Readiness

Persona: Operations admin.

This journey requires real or staging-compatible LiveKit plus Twilio or Telnyx credentials. Mark Blocked if credentials are unavailable.

1. Confirm `/api/v1/ready` reports LiveKit and selected telephony provider readiness.
2. Confirm AI API health.
3. Confirm AI worker is running when live calls are in scope.
4. Use an assigned number routed to `UAT Support Agent`.
5. Place a test inbound call from an approved test phone.
6. Confirm call connects to the agent.
7. Ask a question covered by the agent prompt.
8. Ask a question covered by uploaded knowledge.
9. End the call.
10. Confirm call log, transcript, recording, metadata, and final status appear.

Pass criteria:

- Readiness endpoints identify missing services before the user attempts calls.
- Inbound call reaches the intended agent and organization.
- Agent behavior follows configured prompt and knowledge.
- Call end state creates expected records.
- User can trace the call from number to agent to call log.

Fail examples:

- Number routes to the wrong organization or agent.
- AI worker receives wrong runtime configuration.
- Call completes but no call log appears.
- Transcript or recording silently fails without status.

References:

- `testing-guides/apps-server.md`
- `testing-guides/apps-ai.md`

## Critical Journey 10: Calls, Transcripts, Recordings, And Outcomes

Persona: Team member and operations admin.

1. Open `/calls`.
2. Test filters for agent, status, direction, from date, to date, and clear filters.
3. Test pagination and rows per page.
4. Open transcript sheet.
5. Open metadata sheet.
6. Play recording where available.
7. Open a call detail route if present.
8. Test completed, failed, in-progress, no transcript, no recording, and missing call states.
9. Delete a call if role permits.
10. Repeat with member role.

Pass criteria:

- Filters update results and are reflected in URL or visible state.
- Empty filtered state is different from global no-data state.
- Pagination does not duplicate or skip records.
- Transcript speaker labels, timestamps, and load-more behavior are correct.
- Recording empty state is explicit when no recording exists.
- Metadata handles missing extracted/evaluation data without crashing.
- Delete confirms exact call and refetches list.
- Members cannot perform restricted mutations.

Fail examples:

- Date filters send invalid format without user feedback.
- Transcript sheet crashes on missing transcript.
- Recording opens insecurely or without safe external-link attributes.
- Member sees success UI after a forbidden delete.

References:

- `testing-guides/apps-console.md`
- `testing-guides/apps-server.md`

## Critical Journey 11: Tools And MCP Connections

Persona: Operations admin.

1. Open `/tools`.
2. Review empty state and existing tool cards.
3. Create or edit an HTTP tool with invalid name, invalid URL, missing parameters, headers, and valid configuration.
4. Test parameter editor and key/value editor keyboard behavior.
5. Attach tool to an agent where supported.
6. Open MCP marketplace.
7. Search, filter, or browse marketplace entries.
8. Create MCP connection with missing and valid configuration.
9. Disconnect or remove connection.
10. Confirm agent detail reflects tool/MCP changes.

Pass criteria:

- User can understand the difference between HTTP tools and MCP connections.
- Validation prevents unsafe or incomplete tool configuration.
- Secrets are never shown in plain text after save unless intentionally revealed.
- Marketplace empty/error states are recoverable.
- Attach/detach state is consistent across `/tools` and agent detail.

Fail examples:

- Secret values leak in UI, logs, or network-visible responses.
- Invalid tool URL saves successfully.
- Marketplace failure leaves a blank page.
- Agent still shows removed tool after refresh.

References:

- `testing-guides/apps-console.md`
- `testing-guides/apps-server.md`

## Critical Journey 12: Settings, Roles, Billing, API Keys, And Danger Actions

Persona: Billing owner and team member.

1. Open `/settings`.
2. Visit profile, organization, billing, API keys, roles, and danger routes.
3. Update profile fields with invalid and valid values.
4. Update organization fields with invalid and valid values.
5. Review billing plan and upgrade/downgrade/portal entry points in test mode.
6. Create, copy, and revoke an API key.
7. Invite or change user roles where supported.
8. Attempt owner/admin/member restricted actions as each role.
9. Attempt danger actions such as org deletion or destructive reset only in a safe test organization.
10. Sign out and confirm protected data is cleared.

Pass criteria:

- Settings sections are discoverable and explain what each action affects.
- Billing uses Stripe test mode or staging-safe paths.
- API key secret is shown exactly once and copy state is clear.
- Revoked API key cannot be used.
- Role changes are reflected in navigation, buttons, and server permissions.
- Member cannot mutate restricted resources.
- Danger actions require explicit confirmation and name the affected organization.

Fail examples:

- Member can create API key, change billing, or delete organization.
- API key secret is recoverable after initial display.
- Billing CTA points to wrong environment.
- Danger action copy is ambiguous or destructive action succeeds accidentally.

References:

- `testing-guides/apps-console.md`
- `testing-guides/apps-server.md`

## Cross-Cutting Failure And Recovery Tests

Run these against at least one page in each main area: dashboard, agents, calls, numbers, knowledge base, outbound, tools, and settings.

| Scenario        | Pass criteria                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Slow API        | Loading state appears, layout stays stable, duplicate actions are prevented.                          |
| API `401`       | User returns to login and protected data is cleared.                                                  |
| API `403`       | User sees permission-aware message and no success state.                                              |
| API `404`       | Missing resource shows useful not-found state, not a crash.                                           |
| API `409`       | Conflict explains what changed and how to recover.                                                    |
| API `422`       | Field-level validation is visible.                                                                    |
| API `429`       | Rate limit message tells user to wait or retry later.                                                 |
| API `500`       | Generic error is recoverable and does not expose secrets.                                             |
| Network offline | App shows offline/error state and avoids false success.                                               |
| Vendor missing  | UI names missing service or points to readiness details.                                              |
| Refresh         | Current page reloads without losing persisted data.                                                   |
| Browser back    | User returns to prior state without stale modal or wrong tenant data.                                 |
| Multi-tab       | Signing out or switching org in one tab does not leave dangerous stale actions active in another tab. |

## Security, Privacy, And Compliance Checks

These checks are release-blocking when failed:

- No secrets, API keys, tokens, reset tokens, provider credentials, or signed upload URLs are exposed beyond their intended one-time use.
- Auth cookies are required for protected API calls.
- Organization-scoped resources cannot be read or mutated across tenants.
- Role-restricted UI matches server-side authorization.
- Logs avoid raw PII unless explicitly required and approved.
- Contact form and call-related data use synthetic data in non-production testing.
- Signed upload URLs are scoped to the intended object and expire.
- Recordings, transcripts, extracted data, and metadata are not visible to unauthorized users.
- External links use safe attributes where appropriate.
- Compliance and HIPAA/BAA copy does not claim unsupported certification.

## UI And UX Review Checklist

Run this checklist after functional UAT, using real screens rather than code inspection:

- The first screen of each route has a clear purpose and primary action.
- Button labels use verbs and match the result.
- Empty states include a next action or a reason no action exists.
- Error states avoid blame and provide a recovery path.
- Loading states do not shift major layout after data loads.
- Tables remain usable with long names, long emails, long phone numbers, missing values, and many rows.
- Mobile layouts preserve all critical actions.
- Dialogs and drawers have clear titles, close controls, and escape behavior.
- Toasts do not contain the only copy needed to understand a permanent state change.
- Color is not the only way to communicate status.
- Dark mode and light mode both have readable contrast.
- Long words, translated strings, and narrow screens do not break buttons or cards.
- Critical actions remain reachable without horizontal scroll.

## Suggested UAT Execution Order

1. Environment readiness and seed data.
2. Marketing discovery to signup.
3. Auth and recovery.
4. Organization onboarding and tenant isolation.
5. Dashboard.
6. Agent creation and configuration.
7. Numbers and call routing.
8. Knowledge base.
9. Outbound calls and campaigns.
10. Inbound/live call readiness.
11. Calls and transcripts.
12. Tools and MCP.
13. Settings, roles, billing, and API keys.
14. Cross-cutting failure and recovery.
15. Browser, mobile, accessibility, and visual regression pass.
16. Release acceptance review.

## Release Acceptance Summary Template

Copy this summary into the release ticket or QA report:

```markdown
# QuickVoice UAT Summary

- Build/commit:
- Environment:
- Test window:
- Test lead:
- Browsers/devices:
- Vendor credentials available:
- Critical journeys passed:
- Critical journeys blocked:
- Critical journeys waived:
- Open P0:
- Open P1:
- Open P2:
- Release recommendation: Ship / Do not ship

## Blocking Issues

| ID  | Severity | Journey | Summary | Owner | Status |
| --- | -------- | ------- | ------- | ----- | ------ |

## Blocked Checks

| Journey | Missing dependency | Owner | Target date |
| ------- | ------------------ | ----- | ----------- |

## Waivers

| Issue | Risk | Owner | Date | Follow-up |
| ----- | ---- | ----- | ---- | --------- |
```

## Relationship To Module Guides

Use this guide to decide whether the product works for users. Use the module guides when a journey fails and the tester needs deeper area-specific checks:

- `testing-guides/apps-web.md` for marketing, SEO, public forms, and public UX.
- `testing-guides/apps-console.md` for authenticated console workflows and frontend behavior.
- `testing-guides/apps-server.md` for API, auth, permissions, data model, billing, and integrations.
- `testing-guides/apps-ai.md` for LiveKit worker, RAG, AI runtime, and call finalization.
- `testing-guides/root-tooling.md` for local setup, CI, and developer workflow.
- `testing-guides/packages-config.md` for shared lint and TypeScript configuration.

The user-facing release decision should come from this UAT guide, supported by the module guides and automated test commands.
