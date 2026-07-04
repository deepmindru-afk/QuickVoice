#!/usr/bin/env python3
"""Generate end-user QuickVoice video tutorial assets with sequential Codex runs.

The child Codex sessions run with full permissions because that is the requested
execution mode, but their prompt is read-only. The parent runner only writes the
committed tutorial files after every selected module returns a valid script.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import time
from typing import Sequence


SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from codex_module_audit import (  # noqa: E402
    build_codex_command as build_base_codex_command,
    display_path,
    git_sha,
    git_status,
    require_git_repo,
    write_text,
)


DEFAULT_CODEX_MODEL = "codex1"

REQUIRED_TUTORIAL_HEADINGS: tuple[str, ...] = (
    "## Audience And Outcome",
    "## Prerequisites And Demo Data",
    "## Tutorial Arc",
    "## Scene-By-Scene Storyboard",
    "## Voiceover Script",
    "## On-Screen Actions",
    "## Demo Data And Expected Results",
    "## Captions And Lower Thirds",
    "## Callouts And Zoom Moments",
    "## Errors, Empty States, And Recovery",
    "## Security, Privacy, And Permissions Notes",
    "## Recording Checklist",
    "## Post-Production Notes",
)


@dataclass(frozen=True)
class ProductTutorialModule:
    name: str
    title: str
    paths: tuple[str, ...]
    outcome: str
    workflows: tuple[str, ...]
    demo_data: tuple[str, ...]


@dataclass(frozen=True)
class ModuleTutorialResult:
    module: str
    title: str
    status: str
    returncode: int | None
    duration_seconds: float
    final_message: str
    tutorial_path: Path | None
    stdout_path: Path
    stderr_path: Path
    changed_files: list[str]
    missing_headings: list[str]


PRODUCT_MODULES: tuple[ProductTutorialModule, ...] = (
    ProductTutorialModule(
        name="product-overview",
        title="QuickVoice Product Overview",
        paths=(
            "README.md",
            "apps/web/src/app/page.tsx",
            "apps/web/src/app/solutions",
            "apps/web/src/app/use-cases",
            "apps/console/src/app/(app)/dashboard/page.tsx",
            "testing-guides/index.md",
        ),
        outcome=(
            "A first-time business user understands what QuickVoice does, which "
            "workflows exist, and how the console fits their phone operations."
        ),
        workflows=(
            "Explain inbound AI receptionists, outbound campaigns, knowledge-backed answers, and call review.",
            "Map the top navigation to the business lifecycle: configure, connect, run, review, optimize.",
            "Clarify which workflows work with seeded demo data and which require provider credentials.",
        ),
        demo_data=(
            "Use seed organization, demo agents, phone numbers, call logs, and transcripts from apps/server/prisma/seed.ts when available.",
            "Use repo-provided dashboard imagery only when a real local console capture is unavailable.",
        ),
    ),
    ProductTutorialModule(
        name="signup-onboarding",
        title="Signup And Organization Onboarding",
        paths=(
            "apps/console/src/app/(auth)",
            "apps/console/src/app/(onboarding)",
            "apps/console/src/app/page.tsx",
            "apps/server/src/lib/auth.ts",
            "apps/server/prisma/seed.ts",
            "testing-guides/apps-console.md",
        ),
        outcome=(
            "A new business user can create an account, sign in, understand organization setup, "
            "and reach the console with the right workspace context."
        ),
        workflows=(
            "Register, verify, log in, recover password, and reset password where the UI supports it.",
            "Create or choose an organization and understand tenant boundaries.",
            "Handle auth errors, missing sessions, and blocked provider credentials honestly.",
        ),
        demo_data=(
            "Use seeded account and organization examples from apps/server/prisma/seed.ts if discoverable.",
            "Use clearly labeled demo email addresses such as owner@quickvoice.test.",
        ),
    ),
    ProductTutorialModule(
        name="dashboard",
        title="Dashboard And Performance Review",
        paths=(
            "apps/console/src/app/(app)/dashboard/page.tsx",
            "apps/console/src/hooks/queries/dashboard.ts",
            "apps/console/src/lib/api/resources/dashboard.ts",
            "apps/server/src/modules/dashboard",
            "apps/server/prisma/seed.ts",
            "testing-guides/apps-console.md",
            "testing-guides/apps-server.md",
        ),
        outcome=(
            "A business user can read performance metrics, spot operational issues, "
            "and know which module to open next for investigation."
        ),
        workflows=(
            "Review call volume, success states, usage, and trend breakdowns.",
            "Interpret loading, empty, and error states without guessing.",
            "Use dashboard insights to navigate to calls, agents, numbers, or outbound campaigns.",
        ),
        demo_data=(
            "Use seeded call logs, statuses, durations, and transcripts from apps/server/prisma/seed.ts.",
            "Avoid invented growth metrics; describe only visible demo metrics or placeholders.",
        ),
    ),
    ProductTutorialModule(
        name="agents",
        title="Agent Builder",
        paths=(
            "apps/console/src/app/(app)/agents/page.tsx",
            "apps/console/src/lib/agents/config-defaults.ts",
            "apps/console/data/voices.ts",
            "apps/console/src/hooks/queries/agents.ts",
            "apps/server/src/modules/agent",
            "apps/server/prisma/seed.ts",
            "testing-guides/apps-console.md",
            "testing-guides/apps-server.md",
            "testing-guides/apps-ai.md",
        ),
        outcome=(
            "A business user can create, configure, review, and safely iterate an AI voice agent "
            "before assigning calls to it."
        ),
        workflows=(
            "Create an agent from visible fields and templates.",
            "Choose voice, business instructions, greeting, escalation behavior, and runtime settings.",
            "Review validation errors, save states, and operational risks before publishing.",
        ),
        demo_data=(
            "Use seeded agents and voice catalog values when discoverable.",
            "Use a realistic practice, clinic, support desk, or sales team scenario without claiming real customers.",
        ),
    ),
    ProductTutorialModule(
        name="phone-numbers",
        title="Phone Numbers And Routing",
        paths=(
            "apps/console/src/app/(app)/numbers/page.tsx",
            "apps/console/src/hooks/queries/numbers.ts",
            "apps/console/src/lib/api/resources/numbers.ts",
            "apps/server/src/modules/numbers",
            "apps/server/src/config/twilio.ts",
            "apps/server/src/config/telnyx.ts",
            "apps/server/prisma/seed.ts",
            "testing-guides/apps-console.md",
            "testing-guides/apps-server.md",
        ),
        outcome=(
            "A business user can understand provider choice, number search or connection, "
            "and how to route a phone number to the right agent."
        ),
        workflows=(
            "Search, buy, connect, or review numbers supported by the UI.",
            "Assign numbers to agents and explain provider-specific blocked checks.",
            "Show what a user should verify before sending live callers to an agent.",
        ),
        demo_data=(
            "Use seeded phone numbers and provider labels from the repo when discoverable.",
            "Mark Twilio, Telnyx, and LiveKit live-call steps as credential-gated when credentials are absent.",
        ),
    ),
    ProductTutorialModule(
        name="knowledge-base",
        title="Knowledge Base Setup",
        paths=(
            "apps/console/src/app/(app)/kb/page.tsx",
            "apps/console/src/hooks/queries/kb.ts",
            "apps/console/src/lib/api/resources/kb.ts",
            "apps/server/src/modules/kb",
            "apps/server/src/workers/kb.worker.ts",
            "apps/ai/handlers/kb_handler.py",
            "apps/ai/handlers/rag_handler.py",
            "apps/server/prisma/seed.ts",
            "testing-guides/apps-console.md",
            "testing-guides/apps-server.md",
            "testing-guides/apps-ai.md",
        ),
        outcome=(
            "A business user can add knowledge sources, understand processing states, "
            "and know how knowledge affects agent answers."
        ),
        workflows=(
            "Add documents, URLs, or visible source types supported by the UI.",
            "Explain queued, processing, succeeded, and failed states.",
            "Connect knowledge sources to agent behavior and test expected answers.",
        ),
        demo_data=(
            "Use seeded knowledge sources from apps/server/prisma/seed.ts.",
            "Use simple FAQ-style source examples that avoid private or regulated data.",
        ),
    ),
    ProductTutorialModule(
        name="tools-integrations",
        title="Tools And Integrations",
        paths=(
            "apps/console/src/app/(app)/tools/page.tsx",
            "apps/console/src/hooks/queries/tools.ts",
            "apps/console/src/hooks/queries/mcp.ts",
            "apps/console/src/lib/api/resources/tools.ts",
            "apps/console/src/lib/api/resources/mcp.ts",
            "apps/console/src/components/settings/PermissionMatrix.tsx",
            "apps/server/src/modules/tools",
            "apps/server/src/modules/mcp",
            "apps/server/src/modules/secrets",
            "testing-guides/apps-console.md",
            "testing-guides/apps-server.md",
        ),
        outcome=(
            "A business user can understand what tools and integrations do, how secrets and permissions "
            "protect workflows, and what to test before enabling automation."
        ),
        workflows=(
            "Browse available tools or MCP integrations.",
            "Add connection details, secrets, and permissions where the UI supports it.",
            "Explain safe enablement, permission review, and blocked external checks.",
        ),
        demo_data=(
            "Use catalog items or seeded integrations when present.",
            "Use redacted placeholder credentials and explicitly avoid exposing real secrets.",
        ),
    ),
    ProductTutorialModule(
        name="calls",
        title="Call Review And Quality Assurance",
        paths=(
            "apps/console/src/app/(app)/calls/page.tsx",
            "apps/console/src/components/calls",
            "apps/console/src/hooks/queries/calls.ts",
            "apps/console/src/lib/api/resources/calls.ts",
            "apps/server/src/modules/calllogs",
            "apps/server/prisma/seed.ts",
            "apps/ai/handlers/calllog_handler.py",
            "testing-guides/apps-console.md",
            "testing-guides/apps-server.md",
            "testing-guides/apps-ai.md",
        ),
        outcome=(
            "A business user can review calls, inspect transcripts and recordings, filter outcomes, "
            "and identify follow-up actions."
        ),
        workflows=(
            "Open call logs, filter by relevant fields, and inspect call detail.",
            "Review transcript, metadata, extracted data, recording playback, and failure reasons.",
            "Turn QA observations into agent, knowledge base, or routing improvements.",
        ),
        demo_data=(
            "Use seeded completed, failed, and in-progress calls from apps/server/prisma/seed.ts.",
            "Use demo transcripts and recordings only if they are present in the repo or seeded data.",
        ),
    ),
    ProductTutorialModule(
        name="outbound",
        title="Outbound Calls And Campaigns",
        paths=(
            "apps/console/src/app/(app)/outbound/page.tsx",
            "apps/console/src/models/outbound",
            "apps/console/src/hooks/queries/outbound.ts",
            "apps/console/src/lib/api/resources/outbound.ts",
            "apps/server/src/modules/outbound",
            "apps/server/src/workers/outbound-batch.worker.ts",
            "apps/server/prisma/seed.ts",
            "testing-guides/apps-console.md",
            "testing-guides/apps-server.md",
        ),
        outcome=(
            "A business user can place a quick outbound call, prepare a batch campaign, "
            "review import results, and monitor campaign outcomes."
        ),
        workflows=(
            "Create a Quick outbound call with a selected agent, number, recipient, and objective.",
            "Prepare CSV or XLSX batch data, upload it, schedule a campaign, and review invalid rows.",
            "Monitor dispatch, retries, cancellations, quota limits, and call outcomes.",
        ),
        demo_data=(
            "Use seeded outbound calls and campaign examples from apps/server/prisma/seed.ts.",
            "Use clearly fake phone numbers and recipients such as Alex Demo or Jordan Example.",
        ),
    ),
    ProductTutorialModule(
        name="settings-billing-security",
        title="Settings Billing And Security",
        paths=(
            "apps/console/src/app/(app)/settings",
            "apps/console/src/components/settings",
            "apps/console/data/plans.ts",
            "apps/server/src/modules/billing",
            "apps/server/src/modules/audit",
            "apps/server/src/lib/permissions.ts",
            "apps/server/src/lib/secrets.ts",
            "apps/server/src/lib/redaction.ts",
            "testing-guides/apps-console.md",
            "testing-guides/apps-server.md",
        ),
        outcome=(
            "A business user or workspace owner can manage organization settings, roles, billing context, "
            "API access, and privacy/security expectations."
        ),
        workflows=(
            "Review organization settings, role or permission controls, and API access where visible.",
            "Explain plan and usage surfaces without inventing billing behavior.",
            "Show privacy, audit, secret redaction, and retention considerations relevant to business owners.",
        ),
        demo_data=(
            "Use plan names and usage values from repo data when discoverable.",
            "Use redacted API keys and secrets only; never include live credentials.",
        ),
    ),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def tutorial_filename(module: ProductTutorialModule) -> str:
    return f"{module.name}.md"


def expected_title_heading(module: ProductTutorialModule) -> str:
    return f"# {module.title} Video Tutorial"


def required_headings(module: ProductTutorialModule) -> tuple[str, ...]:
    return (expected_title_heading(module), *REQUIRED_TUTORIAL_HEADINGS)


def select_product_modules(names: Sequence[str] | None = None) -> list[ProductTutorialModule]:
    """Return product tutorial modules in default order, optionally filtered by name."""
    if not names:
        return list(PRODUCT_MODULES)

    by_name = {module.name: module for module in PRODUCT_MODULES}
    selected: list[ProductTutorialModule] = []
    unknown: list[str] = []
    for name in names:
        module = by_name.get(name)
        if module is None:
            unknown.append(name)
        else:
            selected.append(module)

    if unknown:
        valid = ", ".join(module.name for module in PRODUCT_MODULES)
        raise ValueError(
            f"Unknown module(s): {', '.join(unknown)}. Valid modules: {valid}"
        )

    return selected


def build_codex_command(
    repo_root: Path,
    module: ProductTutorialModule,
    output_last_message: Path,
    *,
    model: str | None = None,
) -> list[str]:
    """Build the Codex command for one product video tutorial session."""
    return build_base_codex_command(
        repo_root=repo_root,
        module=module,
        output_last_message=output_last_message,
        model=model if model is not None else DEFAULT_CODEX_MODEL,
    )


def missing_required_headings(module: ProductTutorialModule, markdown: str) -> list[str]:
    lines = {line.strip() for line in markdown.splitlines()}
    return [heading for heading in required_headings(module) if heading not in lines]


def build_video_tutorial_prompt(module: ProductTutorialModule, git_sha: str) -> str:
    paths = "\n".join(f"- `{path}`" for path in module.paths)
    workflows = "\n".join(f"- {workflow}" for workflow in module.workflows)
    demo_data = "\n".join(f"- {item}" for item in module.demo_data)
    headings = "\n".join(f"- `{heading}`" for heading in required_headings(module))
    return f"""You are creating written video-production assets for one QuickVoice product tutorial.

Module: {module.name}
Title: {module.title}
Repository commit: {git_sha}

Scope paths:
{paths}

Business outcome:
{module.outcome}

Key workflows to show:
{workflows}

Demo data guidance:
{demo_data}

Rules:
- Do not edit any repository files.
- Do not create, delete, format, migrate, or commit any repository files.
- Do not write tutorial files yourself; the parent runner will save your final Markdown if it passes validation.
- You may inspect files and run read-only checks, but do not run commands that rewrite tracked files.
- This is one module in a sequential tutorial run; return a complete tutorial package for this module only.
- Do not ask to move to the next module. The runner will stop unless this module is finished successfully.
- Write for an end business user, workspace owner, operations lead, or customer success team member, not for an engineer.
- Create production-ready written assets for a video tutorial: scene-by-scene storyboard, voiceover, screen actions, captions, callouts, demo data, and recording checklist.
- Show every important feature in scope with exact UI routes, visible labels, states, forms, tables, dialogs, filters, empty states, errors, and confirmation flows when you can prove them from the repository.
- Include realistic test data and expected results from repo seed files, fixtures, testing guides, source code, and visible UI copy when discoverable.
- No invented customers, fake production metrics, unsupported vendor claims, or real credentials.
- Clearly mark provider-gated or credential-gated steps as blocked or optional instead of pretending they work in a fresh clone.
- Cover business outcomes: what the user is trying to accomplish, why each step matters, and what success looks like.
- Cover trust and safety: tenant boundaries, roles, permissions, billing implications, privacy, call recordings, transcripts, secrets, and auditability where relevant.
- Make the video self-contained enough that a producer can record it without guessing what to click, say, zoom into, or verify.
- Keep the module focused; reference adjacent modules only when the user naturally navigates there.

Return Markdown only. It must contain these exact headings:
{headings}
"""


def status_path(status_line: str) -> str:
    path = status_line[3:].strip() if len(status_line) > 3 else status_line.strip()
    return path.split(" -> ")[-1]


def is_under(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def status_delta(
    before_status: Sequence[str],
    after_status: Sequence[str],
    repo_root: Path,
    ignored_roots: Sequence[Path],
) -> list[str]:
    before = set(before_status)
    changed: list[str] = []
    for line in after_status:
        if line in before:
            continue
        raw_path = status_path(line)
        path = Path(raw_path)
        absolute_path = path if path.is_absolute() else repo_root / path
        if any(is_under(absolute_path, ignored_root) for ignored_root in ignored_roots):
            continue
        changed.append(line)
    return sorted(changed)


def read_final_message(final_path: Path) -> str:
    if not final_path.exists():
        return ""
    return final_path.read_text(encoding="utf-8").strip()


def run_module_tutorial(
    repo_root: Path,
    module: ProductTutorialModule,
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None,
) -> ModuleTutorialResult:
    module_prefix = run_dir / module.name
    stdout_path = module_prefix.with_suffix(".stdout.jsonl")
    stderr_path = module_prefix.with_suffix(".stderr.log")
    final_path = module_prefix.with_suffix(".final.md")
    prompt_path = module_prefix.with_suffix(".prompt.md")

    prompt = build_video_tutorial_prompt(module, git_sha=git_sha(repo_root))
    write_text(prompt_path, prompt)

    before_status = git_status(repo_root)
    command = build_codex_command(
        repo_root=repo_root,
        module=module,
        output_last_message=final_path,
        model=model,
    )

    started = time.monotonic()
    try:
        result = subprocess.run(
            command,
            cwd=repo_root,
            input=prompt,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout_minutes * 60,
            check=False,
        )
        returncode: int | None = result.returncode
        stdout = result.stdout
        stderr = result.stderr
        status = "completed" if result.returncode == 0 else "failed"
    except subprocess.TimeoutExpired as exc:
        returncode = None
        stdout = exc.stdout if isinstance(exc.stdout, str) else ""
        stderr = exc.stderr if isinstance(exc.stderr, str) else ""
        stderr = f"{stderr}\nTimed out after {timeout_minutes} minutes.\n"
        status = "timed_out"

    duration = time.monotonic() - started
    final_message = read_final_message(final_path)

    after_status = git_status(repo_root)
    changed_files = status_delta(before_status, after_status, repo_root, [run_dir])

    write_text(stdout_path, stdout)
    write_text(stderr_path, stderr)

    if changed_files:
        status = "unsafe_changes"
        diagnostic = (
            "\n\nRunner stopped because the Codex session changed tracked files:\n"
            + "\n".join(f"- `{path}`" for path in changed_files)
        )
        final_message = (final_message or stderr.strip() or stdout.strip()).strip()
        final_message = f"{final_message}{diagnostic}" if final_message else diagnostic
        missing_headings: list[str] = []
    elif status == "completed" and not final_message:
        status = "empty_tutorial"
        final_message = stderr.strip() or stdout.strip() or "No final tutorial captured."
        missing_headings = list(required_headings(module))
    elif status == "completed":
        missing_headings = missing_required_headings(module, final_message)
        if missing_headings:
            status = "invalid_tutorial"
            final_message = (
                f"{final_message}\n\n"
                "Runner stopped because the tutorial missed required headings:\n"
                + "\n".join(f"- `{heading}`" for heading in missing_headings)
            )
    else:
        final_message = final_message or stderr.strip() or stdout.strip()
        if not final_message:
            final_message = "No final tutorial captured."
        missing_headings = []

    return ModuleTutorialResult(
        module=module.name,
        title=module.title,
        status=status,
        returncode=returncode,
        duration_seconds=duration,
        final_message=final_message,
        tutorial_path=None,
        stdout_path=display_path(stdout_path, repo_root),
        stderr_path=display_path(stderr_path, repo_root),
        changed_files=changed_files,
        missing_headings=missing_headings,
    )


def run_selected_modules(
    repo_root: Path,
    modules: Sequence[ProductTutorialModule],
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None,
) -> list[ModuleTutorialResult]:
    results: list[ModuleTutorialResult] = []
    for module in modules:
        result = run_module_tutorial(
            repo_root=repo_root,
            module=module,
            run_dir=run_dir,
            timeout_minutes=timeout_minutes,
            model=model,
        )
        results.append(result)
        if result.status != "completed":
            break
    return results


def render_index_markdown(
    repo_root: Path,
    modules: Sequence[ProductTutorialModule],
    results: Sequence[ModuleTutorialResult],
    git_sha: str,
    started_at: str,
    finished_at: str,
) -> str:
    result_by_module = {result.module: result for result in results}
    lines = [
        "# QuickVoice Video Tutorials",
        "",
        f"- Repository: `{repo_root}`",
        f"- Commit: `{git_sha}`",
        f"- Started: `{started_at}`",
        f"- Finished: `{finished_at}`",
        "",
        "These end-user video tutorial assets were generated by `scripts/codex_product_video_tutorial.py`, which runs one read-only Codex session per product module and saves tutorials only after every selected module succeeds.",
        "",
        "## Modules",
        "",
    ]
    for module in modules:
        result = result_by_module[module.name]
        lines.append(
            f"- [{module.title}]({tutorial_filename(module)}) - `{module.name}` ({result.status})"
        )
    lines.append("")
    return "\n".join(lines)


def write_video_tutorials(
    repo_root: Path,
    output_dir: Path,
    modules: Sequence[ProductTutorialModule],
    results: Sequence[ModuleTutorialResult],
    *,
    git_sha: str,
    started_at: str,
    finished_at: str,
) -> list[Path]:
    if len(results) != len(modules) or any(
        result.status != "completed" for result in results
    ):
        raise RuntimeError(
            "Cannot write video tutorials until all module tutorial sessions complete."
        )

    result_by_module = {result.module: result for result in results}
    for module in modules:
        result = result_by_module.get(module.name)
        if result is None:
            raise RuntimeError(f"Missing tutorial result for module: {module.name}")
        missing_headings = missing_required_headings(module, result.final_message)
        if missing_headings:
            raise RuntimeError(
                f"Tutorial for {module.name} is missing headings: "
                + ", ".join(missing_headings)
            )

    written: list[Path] = []
    for module in modules:
        result = result_by_module[module.name]
        tutorial_path = output_dir / tutorial_filename(module)
        write_text(tutorial_path, result.final_message.strip() + "\n")
        written.append(tutorial_path)

    index_path = output_dir / "index.md"
    write_text(
        index_path,
        render_index_markdown(
            repo_root=repo_root,
            modules=modules,
            results=results,
            git_sha=git_sha,
            started_at=started_at,
            finished_at=finished_at,
        ),
    )
    written.append(index_path)
    return written


def results_json(results: Sequence[ModuleTutorialResult]) -> str:
    payload = [
        {
            "module": result.module,
            "title": result.title,
            "status": result.status,
            "returncode": result.returncode,
            "duration_seconds": result.duration_seconds,
            "final_message": result.final_message,
            "tutorial_path": str(result.tutorial_path) if result.tutorial_path else None,
            "stdout_path": str(result.stdout_path),
            "stderr_path": str(result.stderr_path),
            "changed_files": result.changed_files,
            "missing_headings": result.missing_headings,
        }
        for result in results
    ]
    return json.dumps(payload, indent=2) + "\n"


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run sequential full-permission Codex sessions to generate product video tutorials."
    )
    parser.add_argument(
        "--module",
        action="append",
        dest="modules",
        help="Product module to document. Repeat for multiple modules. Defaults to all modules.",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path.cwd(),
        help="Repository root. Defaults to current directory.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("video-tutorials"),
        help="Directory for committed video tutorial assets. Default: video-tutorials.",
    )
    parser.add_argument(
        "--run-dir",
        type=Path,
        default=None,
        help="Directory for run logs. Defaults to .video_tutorial_runs/<timestamp>.",
    )
    parser.add_argument(
        "--timeout-minutes",
        type=int,
        default=120,
        help="Timeout for each module Codex session. Default: 120.",
    )
    parser.add_argument(
        "--model",
        default=None,
        help=f"Optional Codex model override. Defaults to {DEFAULT_CODEX_MODEL}.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print selected modules and commands without running Codex.",
    )
    return parser.parse_args(argv)


def resolve_path(repo_root: Path, path: Path) -> Path:
    return path.resolve() if path.is_absolute() else (repo_root / path).resolve()


def print_dry_run(
    repo_root: Path,
    modules: Sequence[ProductTutorialModule],
    output_dir: Path,
    run_dir: Path,
    *,
    model: str | None,
) -> None:
    print(f"Repo root: {repo_root}")
    print(f"Output dir: {output_dir}")
    print(f"Run dir: {run_dir}")
    for module in modules:
        final_path = run_dir / f"{module.name}.final.md"
        command = build_codex_command(
            repo_root=repo_root,
            module=module,
            output_last_message=final_path,
            model=model,
        )
        print(f"\n[{module.name}] {module.title}")
        print("Paths: " + ", ".join(module.paths))
        print(f"Tutorial output: {output_dir / tutorial_filename(module)}")
        print("Command: " + " ".join(command))


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    repo_root = args.repo_root.resolve()

    try:
        modules = select_product_modules(args.modules)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.timeout_minutes < 1:
        print("--timeout-minutes must be at least 1", file=sys.stderr)
        return 2

    started_at = utc_now()
    stamp = started_at.replace(":", "").replace("+00:00", "Z")
    output_dir = resolve_path(repo_root, args.output_dir)
    run_dir = resolve_path(
        repo_root, args.run_dir or Path(".video_tutorial_runs") / stamp
    )

    if args.dry_run:
        print_dry_run(
            repo_root=repo_root,
            modules=modules,
            output_dir=output_dir,
            run_dir=run_dir,
            model=args.model,
        )
        return 0

    try:
        require_git_repo(repo_root)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    starting_sha = git_sha(repo_root)
    run_dir.mkdir(parents=True, exist_ok=True)

    print(f"Running {len(modules)} product video tutorial session(s) in {repo_root}")
    print(f"Logs: {run_dir}")
    results = run_selected_modules(
        repo_root=repo_root,
        modules=modules,
        run_dir=run_dir,
        timeout_minutes=args.timeout_minutes,
        model=args.model,
    )

    for result in results:
        print(f"{result.module}: {result.status} in {result.duration_seconds:.1f}s")

    finished_at = utc_now()
    write_text(run_dir / "results.json", results_json(results))

    if len(results) != len(modules) or any(
        result.status != "completed" for result in results
    ):
        print(
            "Stopping before writing video tutorials because a module did not complete.",
            file=sys.stderr,
        )
        return 1

    written = write_video_tutorials(
        repo_root=repo_root,
        output_dir=output_dir,
        modules=modules,
        results=results,
        git_sha=starting_sha,
        started_at=started_at,
        finished_at=finished_at,
    )
    print("Wrote video tutorials:")
    for path in written:
        print(f"- {display_path(path, repo_root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
