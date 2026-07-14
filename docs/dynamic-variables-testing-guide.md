# Dynamic Variables Testing Guide

This guide tests the dynamic variables implementation added from the RCM v2 flow. It is written for local manual QA and should not be pushed unless intentionally requested.

## 1. What This Tests

Dynamic variables are prompt tokens written as `{{variable_name}}`. The implementation covers:

- Agent Behavior tab variable detection and fallback values
- Saving and preserving `AgentConfiguration.variables`
- Quick Call per-call dynamic variable inputs
- Quick Call server metadata dispatch as `dynamic_variables`
- Batch Call CSV template generation from selected agent variables
- Initiation webhook static variables
- AI runtime rendering and precedence

Expected runtime precedence:

```text
quick/campaign values > initiation webhook response > initiation webhook static variables > saved agent placeholders > unresolved {{token}}
```

## 2. Pull And Enter The Branch

```powershell
cd C:\projects\quickintell\QuickVoice
git fetch origin
git switch aman-dynamic-variables
git pull origin aman-dynamic-variables
```

If the branch does not exist locally:

```powershell
cd C:\projects\quickintell\QuickVoice
git fetch origin
git switch -c aman-dynamic-variables origin/aman-dynamic-variables
```

## 3. Windows Setup Notes

Use a short path such as:

```powershell
C:\projects\quickintell\QuickVoice
```

This avoids Python and Torch long-path install failures.

If Python dependency install still fails with long paths, enable Windows long paths from an Administrator PowerShell:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

Restart the terminal after changing this setting.

## 4. Prerequisites

Install:

- Node.js 18 or newer
- Corepack / pnpm
- Python 3.11 or 3.12
- Docker Desktop
- Git

Enable pnpm:

```powershell
corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm --version
```

## 5. Install Dependencies

From repo root:

```powershell
cd C:\projects\quickintell\QuickVoice
pnpm install
```

Create the AI virtual environment:

```powershell
cd C:\projects\quickintell\QuickVoice\apps\ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
deactivate
```

If PowerShell blocks venv activation:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 6. Create Env Files

Copy the examples:

```powershell
cd C:\projects\quickintell\QuickVoice
copy .env.dev.example .env.dev
copy apps\server\.env.dev.example apps\server\.env.dev
copy apps\console\.env.dev.example apps\console\.env.dev
copy apps\ai\.env.dev.example apps\ai\.env.dev
copy apps\web\.env.dev.example apps\web\.env.dev
```

Minimum local defaults:

- Root `.env.dev`
  - `SERVER_PORT=5000`
  - `CONSOLE_PORT=3000`
  - `POSTGRES_PORT=5432`
  - `REDIS_PORT=6379`
- `apps/server/.env.dev`
  - `DATABASE_URL=postgresql://quickvoice:quickvoice@localhost:5432/quickvoice`
  - `REDIS_URL=redis://localhost:6379`
  - `INTERNAL_API_KEY=dev-internal-key-change-me`
- `apps/console/.env.dev`
  - `NEXT_PUBLIC_SERVER_URL=http://localhost:5000`
  - `NEXT_PUBLIC_API_VERSION=v1`
- `apps/ai/.env.dev`
  - `SERVER_API_URL=http://localhost:5000/api/v1`
  - `INTERNAL_API_KEY=dev-internal-key-change-me`

For real voice calls, replace LiveKit, Twilio/Telnyx, STT, TTS, and LLM keys with real values.

## 7. Start Local Services On Windows

Do not use `task up:dev` on native Windows because it calls `.sh` scripts. Use these manual steps.

Start Postgres and Redis:

```powershell
cd C:\projects\quickintell\QuickVoice
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d postgres redis
```

Apply Prisma migrations:

```powershell
cd C:\projects\quickintell\QuickVoice\apps\server
$env:DOTENV_CONFIG_PATH=".env.dev"
pnpm exec prisma migrate dev
```

Start the server API:

```powershell
cd C:\projects\quickintell\QuickVoice\apps\server
$env:DOTENV_CONFIG_PATH=".env.dev"
pnpm dev
```

Start the console in a second terminal:

```powershell
cd C:\projects\quickintell\QuickVoice\apps\console
pnpm dev
```

Open:

```text
http://localhost:3000
```

Optional: start the AI API in a third terminal:

```powershell
cd C:\projects\quickintell\QuickVoice\apps\ai
.\.venv\Scripts\Activate.ps1
Get-Content .env.dev | ForEach-Object {
  if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
  }
}
python main.py api
```

Optional: start the AI worker for real LiveKit calls:

```powershell
cd C:\projects\quickintell\QuickVoice\apps\ai
.\.venv\Scripts\Activate.ps1
Get-Content .env.dev | ForEach-Object {
  if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
  }
}
python main.py dev
```

## 8. Automated Checks

Run the targeted dependency-light dynamic variable guard test:

```powershell
cd C:\projects\quickintell\QuickVoice
node --test apps/console/tests/dynamic-variables.test.mjs
```

Expected:

```text
tests 6
pass 6
fail 0
```

Run TypeScript checks after dependencies are installed:

```powershell
cd C:\projects\quickintell\QuickVoice
pnpm --filter console check-types
pnpm --filter server check-types
```

Run server tests:

```powershell
cd C:\projects\quickintell\QuickVoice
pnpm --filter server test -- tests/outbound/outbound-call.service.test.ts
```

Run AI syntax check:

```powershell
cd C:\projects\quickintell\QuickVoice
python -m py_compile apps\ai\handlers\worker_handler.py apps\ai\main.py
```

Run AI helper tests after AI dependencies are installed:

```powershell
cd C:\projects\quickintell\QuickVoice\apps\ai
.\.venv\Scripts\Activate.ps1
python -m unittest tests.test_worker_helpers
```

## 9. Manual Test Data

Use this agent prompt setup for most tests.

First message:

```text
Hi {{first_name}}, this is QuickVoice calling about {{city}}.
```

System prompt:

```text
You are calling {{first_name}} in {{city}} about the {{plan}} plan. If {{priority}} is urgent, keep the call short.
```

Fallback values:

```text
first_name = Customer
city = Dallas
plan = Starter
priority = normal
```

## 10. Feature Test 1: Agent Behavior Variable Detection

Steps:

1. Open Console.
2. Go to an active configured agent.
3. Open the `Behavior` tab.
4. Paste the first message and system prompt from section 9.
5. Confirm a `Dynamic variables` panel appears.
6. Confirm it shows all variables:
   - `{{first_name}}`
   - `{{city}}`
   - `{{plan}}`
   - `{{priority}}`
7. Confirm status says fallbacks are needed.
8. Click `Set values`.
9. Enter all fallback values from section 9.
10. Click `Done`.
11. Save changes.

Expected:

- Save succeeds.
- Variable panel changes to ready.
- Reopening the agent keeps the variable panel and fallback values.
- Editing another tab and saving does not remove variables.

Failure signs:

- `{{variable}}` text does not produce the panel.
- Save loses `variables.placeholders`.
- Variables disappear after saving another tab.

## 11. Feature Test 2: Duplicate And Whitespace Tokens

Steps:

1. In Behavior tab set:

```text
Hi {{ first_name }}. Again: {{first_name}}.
```

2. Save fallback `first_name = Ada`.

Expected:

- Only one `{{first_name}}` variable appears.
- `{{ first_name }}` and `{{first_name}}` are treated as the same variable.
- Saved metadata contains one `first_name`.

Invalid examples that should not become variables:

```text
{{123bad}}
{{has-dash}}
{single_brace}
```

## 12. Feature Test 3: Quick Call Variable Inputs

Steps:

1. Assign a phone number to the configured agent.
2. Open the outbound `Quick call` screen.
3. Select the agent.
4. Confirm a `Call variables` section appears.
5. Enter:
   - `first_name = Aman`
   - `city = Austin`
   - `plan = Pro`
   - `priority = urgent`
6. Fill `To` and `From`.
7. Start the call.

Expected:

- Quick call request includes:

```json
{
  "dynamicVariables": {
    "first_name": "Aman",
    "city": "Austin",
    "plan": "Pro",
    "priority": "urgent"
  }
}
```

- Server stores these in `OutboundCall.optionalData.dynamicVariables`.
- LiveKit metadata includes:

```json
{
  "dynamic_variables": {
    "first_name": "Aman",
    "city": "Austin",
    "plan": "Pro",
    "priority": "urgent"
  }
}
```

Runtime expected prompt:

```text
Hi Aman, this is QuickVoice calling about Austin.
```

And system prompt should use `Aman`, `Austin`, `Pro`, and `urgent`.

## 13. Feature Test 4: Quick Call Empty Values

Steps:

1. Open Quick Call for the same agent.
2. Leave `plan` and `priority` blank.
3. Fill:
   - `first_name = Aman`
   - `city = Austin`
4. Start the call.

Expected:

- Request only sends non-empty values:

```json
{
  "dynamicVariables": {
    "first_name": "Aman",
    "city": "Austin"
  }
}
```

- AI runtime uses saved placeholders for missing values:
  - `plan = Starter`
  - `priority = normal`

## 14. Feature Test 5: Batch CSV Template Generation

Steps:

1. Open outbound `Batch calls`.
2. Select the configured agent.
3. Look at the recipient file upload box.
4. Click `Copy header`.
5. Paste into Notepad.
6. Click `Download CSV`.
7. Open the downloaded CSV.

Expected header:

```csv
phone_number,language,voice_id,first_message,prompt,first_name,city,plan,priority
```

Expected UI:

- `Template variables` panel appears.
- It lists:
  - `{{first_name}}`
  - `{{city}}`
  - `{{plan}}`
  - `{{priority}}`

## 15. Feature Test 6: Batch Campaign Dynamic Variables

Create a CSV:

```csv
phone_number,language,voice_id,first_message,prompt,first_name,city,plan,priority
+15550001111,en-US,,Hi {{first_name}} from {{city}},Keep this about {{plan}}.,Sam,Austin,Enterprise,urgent
+15550002222,,,,,Pat,Dallas,Starter,normal
```

Steps:

1. Open `Batch calls`.
2. Select the configured agent.
3. Upload the CSV.
4. Queue the batch.
5. Start or dispatch the campaign depending on your local setup.

Expected:

- Batch parser treats `first_name`, `city`, `plan`, and `priority` as dynamic variables.
- Special columns do not become dynamic variables:
  - `phone_number`
  - `language`
  - `voice_id`
  - `first_message`
  - `prompt`
  - `system_prompt`
- LiveKit metadata for each row includes row-specific `dynamic_variables`.

Expected first row:

```json
{
  "dynamic_variables": {
    "first_name": "Sam",
    "city": "Austin",
    "plan": "Enterprise",
    "priority": "urgent"
  }
}
```

## 16. Feature Test 7: Initiation Webhook Static Variables UI

Steps:

1. Open the agent `Webhooks` tab.
2. Enable `Initiation webhook`.
3. Enter a URL. For UI-only testing, use:

```text
https://example.com/initiation
```

4. In `Static variables`, add:
   - `plan = Business`
   - `priority = high`
5. Save webhooks.
6. Reopen the Webhooks tab.

Expected:

- Static variable rows persist.
- Save button is enabled when rows change.
- Empty partial rows show an error.
- Duplicate names show an error.
- Invalid names like `bad-name` show an error.

Valid variable names:

```text
customer_name
_internal_id
plan2
```

Invalid variable names:

```text
2plan
plan-name
plan name
```

## 17. Feature Test 8: Initiation Webhook Runtime Response

Use a temporary local webhook server. Create `init-webhook-test.js` anywhere:

```js
const http = require("node:http");

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    console.log("Webhook request:", req.method, req.url, body);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      dynamic_variables: {
        city: "Webhook City",
        plan: "Webhook Plan"
      }
    }));
  });
});

server.listen(8787, () => {
  console.log("Webhook listening on http://localhost:8787/init");
});
```

Start it:

```powershell
node init-webhook-test.js
```

Configure initiation webhook URL:

```text
http://localhost:8787/init
```

Important: server-side safe URL validation may reject localhost webhook URLs depending on current SSRF settings. If it rejects localhost, use a temporary public tunnel and point the webhook URL to that tunnel.

Expected runtime:

- AI worker calls the initiation webhook at call start.
- Webhook response `dynamic_variables` joins the metadata.
- If quick/campaign values contain `city`, quick/campaign value wins over webhook value.
- If quick/campaign values do not contain `plan`, webhook `plan` wins over saved placeholder.

## 18. Feature Test 9: Runtime Precedence

Configure saved placeholders:

```text
city = Placeholder City
plan = Placeholder Plan
priority = Placeholder Priority
```

Configure initiation static variables:

```text
city = Static City
priority = Static Priority
```

Configure webhook response:

```json
{
  "dynamic_variables": {
    "city": "Webhook City",
    "plan": "Webhook Plan"
  }
}
```

Start a quick call with:

```text
city = Quick City
```

Expected final values:

```text
city = Quick City
plan = Webhook Plan
priority = Static Priority
```

If `priority` is not in static variables, expected:

```text
priority = Placeholder Priority
```

If a variable has no value anywhere:

```text
{{variable_name}}
```

should remain unresolved in the rendered prompt.

## 19. Feature Test 10: Agent Config Preservation

Steps:

1. Save Behavior variables.
2. Open Voice tab and save any normal voice setting.
3. Open Webhooks tab and save.
4. Open Behavior tab again.

Expected:

- Dynamic variables are still detected.
- Placeholder values are still present.
- No save from another tab wipes `variables`.

## 20. Feature Test 11: Regression Test Commands

Run:

```powershell
node --test apps/console/tests/dynamic-variables.test.mjs
```

Expected:

```text
pass 6
fail 0
```

Run:

```powershell
python -m py_compile apps\ai\handlers\worker_handler.py apps\ai\main.py
```

Expected:

```text
no output and exit code 0
```

Run after dependencies:

```powershell
pnpm --filter console check-types
pnpm --filter server check-types
pnpm --filter server test -- tests/outbound/outbound-call.service.test.ts
```

Expected:

- No TypeScript errors
- Server outbound tests pass

## 21. Database Verification

Use Prisma Studio:

```powershell
cd C:\projects\quickintell\QuickVoice\apps\server
$env:DOTENV_CONFIG_PATH=".env.dev"
pnpm exec prisma studio
```

Open the displayed Prisma Studio URL.

Check `AgentConfiguration.variables`:

```json
{
  "firstMessage": ["first_name", "city"],
  "systemPrompt": ["first_name", "city", "plan", "priority"],
  "placeholders": {
    "first_name": "Customer",
    "city": "Dallas",
    "plan": "Starter",
    "priority": "normal"
  }
}
```

Check quick call `OutboundCall.optionalData`:

```json
{
  "username": "Aman",
  "provider": "TWILIO",
  "sid": "...",
  "dynamicVariables": {
    "first_name": "Aman",
    "city": "Austin"
  }
}
```

## 22. Known Limitations To Verify Later

- The Webhooks tab now edits initiation static variables, but full advanced UI for custom initiation headers/body is not included.
- Real voice-call testing requires valid LiveKit and telephony credentials.
- Localhost initiation webhook URLs may be blocked by server safe-URL validation; use a tunnel if needed.
- Full CI requires all Node and Python dependencies installed.

## 23. Pass Criteria

The implementation is acceptable when:

- Behavior tab detects and saves all valid `{{variable}}` tokens.
- Fallback values persist after reload.
- Quick Call shows selected-agent variable inputs.
- Quick Call sends non-empty dynamic variables.
- Server stores quick-call dynamic variables.
- LiveKit metadata includes `dynamic_variables`.
- Batch template header is generated from selected agent variables.
- Batch parser maps custom columns to dynamic variables.
- Initiation webhook static variables persist.
- AI runtime renders prompts using the documented precedence.
- Regression tests and type checks pass after dependencies are installed.
