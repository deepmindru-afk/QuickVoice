#!/usr/bin/env python3
"""Run sequential Codex audit sessions for QuickVoice modules.

The runner is intentionally conservative: each Codex session is asked to audit
only, logs are captured per module, and git status is checked before and after
each session so accidental edits are visible.
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


@dataclass(frozen=True)
class AuditModule:
    name: str
    title: str
    paths: tuple[str, ...]
    focus: str


@dataclass(frozen=True)
class ModuleAuditResult:
    module: str
    title: str
    status: str
    returncode: int | None
    duration_seconds: float
    final_message: str
    stdout_path: Path
    stderr_path: Path
    changed_files: list[str]


DEFAULT_MODULES: tuple[AuditModule, ...] = (
    AuditModule(
        name="root-tooling",
        title="Root tooling, CI, and developer experience",
        paths=(
            "package.json",
            "pnpm-lock.yaml",
            "pnpm-workspace.yaml",
            "turbo.json",
            "Taskfile.yml",
            "docker-compose.dev.yml",
            ".github",
            "scripts",
            ".env.dev.example",
        ),
        focus=(
            "workspace orchestration, CI/CD, dependency hygiene, local setup, "
            "environment templates, Docker, and release/deployment gaps"
        ),
    ),
    AuditModule(
        name="apps-web",
        title="Marketing website and public UX",
        paths=("apps/web",),
        focus=(
            "Next.js public pages, SEO/schema, landing-page conversion, content "
            "accuracy, accessibility, responsiveness, performance, and public UX"
        ),
    ),
    AuditModule(
        name="apps-console",
        title="Authenticated console UX and frontend logic",
        paths=("apps/console",),
        focus=(
            "auth screens, onboarding, dashboard, agents, calls, numbers, KB, "
            "outbound calls, settings, billing, roles, forms, data states, mobile UX, "
            "accessibility, and frontend correctness"
        ),
    ),
    AuditModule(
        name="apps-server",
        title="API server, auth, data model, and integrations",
        paths=("apps/server",),
        focus=(
            "Express routes, Better Auth, organization scoping, RBAC, Prisma schema, "
            "validation, billing, telephony, LiveKit, S3, queues, workers, API errors, "
            "security, privacy, and reliability"
        ),
    ),
    AuditModule(
        name="apps-ai",
        title="Python AI service, LiveKit worker, and RAG runtime",
        paths=("apps/ai",),
        focus=(
            "FastAPI handlers, LiveKit worker runtime, call logging, runtime config, "
            "knowledge-base ingestion, RAG, provider failures, tests, observability, "
            "and Python packaging"
        ),
    ),
    AuditModule(
        name="packages-config",
        title="Shared lint and TypeScript configuration",
        paths=(
            "packages/eslint-config",
            "packages/typescript-config",
            "apps/console/eslint.config.mjs",
            "apps/console/package.json",
            "apps/web/eslint.config.mjs",
            "apps/web/package.json",
            "package.json",
            "pnpm-lock.yaml",
            "turbo.json",
        ),
        focus=(
            "shared configuration consistency, rule coverage, package exports, "
            "workspace compatibility, and missing quality gates"
        ),
    ),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def select_modules(names: Sequence[str] | None = None) -> list[AuditModule]:
    """Return modules in default order, optionally filtered by name."""
    if not names:
        return list(DEFAULT_MODULES)

    by_name = {module.name: module for module in DEFAULT_MODULES}
    selected: list[AuditModule] = []
    unknown: list[str] = []
    for name in names:
        module = by_name.get(name)
        if module is None:
            unknown.append(name)
        else:
            selected.append(module)

    if unknown:
        valid = ", ".join(module.name for module in DEFAULT_MODULES)
        raise ValueError(
            f"Unknown module(s): {', '.join(unknown)}. Valid modules: {valid}"
        )

    return selected


def run_git(repo_root: Path, args: Sequence[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=repo_root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


def require_git_repo(repo_root: Path) -> None:
    result = run_git(repo_root, ["rev-parse", "--show-toplevel"])
    if result.returncode != 0:
        raise RuntimeError(f"{repo_root} is not a git repository: {result.stderr.strip()}")

    actual = Path(result.stdout.strip()).resolve()
    if actual != repo_root.resolve():
        raise RuntimeError(f"Expected repo root {repo_root}, got {actual}")


def git_sha(repo_root: Path) -> str:
    result = run_git(repo_root, ["rev-parse", "HEAD"])
    if result.returncode != 0:
        return "unknown"
    return result.stdout.strip()


def git_status(repo_root: Path) -> list[str]:
    result = run_git(repo_root, ["status", "--short"])
    if result.returncode != 0:
        return [f"<git status failed: {result.stderr.strip()}>"]
    return [line for line in result.stdout.splitlines() if line.strip()]


def build_codex_command(
    repo_root: Path,
    module: AuditModule,
    output_last_message: Path,
    *,
    model: str | None = None,
) -> list[str]:
    """Build the Codex non-interactive command for one module."""
    command = [
        "codex",
        "exec",
        "--dangerously-bypass-approvals-and-sandbox",
        "--cd",
        str(repo_root),
        "--json",
        "--ephemeral",
        "--output-last-message",
        str(output_last_message),
        "-",
    ]
    if model:
        command[2:2] = ["--model", model]
    return command


def build_audit_prompt(module: AuditModule, git_sha: str) -> str:
    paths = "\n".join(f"- `{path}`" for path in module.paths)
    return f"""You are auditing the QuickVoice repository.

Module: {module.name}
Title: {module.title}
Repository commit: {git_sha}

Scope paths:
{paths}

Focus:
{module.focus}

Rules:
- Do not edit, create, delete, format, migrate, or commit any repository files.
- You may inspect files and run read-only or verification commands such as tests, builds, typechecks, linters, and static analysis.
- If a command would rewrite tracked files, do not run it.
- Prefer concrete findings with file paths, line numbers, reproduction notes, severity, impact, and recommended fixes.
- Distinguish proven issues from hypotheses.
- Include UI/UX issues where this module has user-facing surfaces.
- Identify bugs, runtime errors, security/privacy risks, reliability gaps, missing features, and new feature opportunities.
- If credentials or services are unavailable, record the check as blocked instead of guessing.

Return a concise Markdown audit for only this module with these headings:
## Summary
## Critical/High Findings
## Medium Findings
## Low Findings
## UI/UX Issues
## Missing Features
## New Feature Opportunities
## Checks Run
## Blocked Or Unverified
"""


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def display_path(path: Path, repo_root: Path) -> Path:
    try:
        return path.resolve().relative_to(repo_root.resolve())
    except ValueError:
        return path


def run_module_audit(
    repo_root: Path,
    module: AuditModule,
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None = None,
    stop_on_changes: bool = True,
) -> ModuleAuditResult:
    module_prefix = run_dir / module.name
    stdout_path = module_prefix.with_suffix(".stdout.jsonl")
    stderr_path = module_prefix.with_suffix(".stderr.log")
    final_path = module_prefix.with_suffix(".final.md")
    prompt_path = module_prefix.with_suffix(".prompt.md")
    prompt = build_audit_prompt(module=module, git_sha=git_sha(repo_root))
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
        status = "passed" if result.returncode == 0 else "failed"
    except subprocess.TimeoutExpired as exc:
        returncode = None
        stdout = exc.stdout if isinstance(exc.stdout, str) else ""
        stderr = exc.stderr if isinstance(exc.stderr, str) else ""
        stderr = f"{stderr}\nTimed out after {timeout_minutes} minutes.\n"
        status = "timed_out"

    duration = time.monotonic() - started
    write_text(stdout_path, stdout)
    write_text(stderr_path, stderr)

    final_message = ""
    if final_path.exists():
        final_message = final_path.read_text(encoding="utf-8").strip()
    if not final_message:
        final_message = stderr.strip() or stdout.strip() or "No final message captured."

    after_status = git_status(repo_root)
    changed_files = sorted(set(after_status) - set(before_status))
    if changed_files:
        status = "changed_files"

    if changed_files and stop_on_changes:
        final_message = (
            f"{final_message}\n\n"
            "Runner stopped because the Codex session changed tracked files:\n"
            + "\n".join(f"- {path}" for path in changed_files)
        )

    return ModuleAuditResult(
        module=module.name,
        title=module.title,
        status=status,
        returncode=returncode,
        duration_seconds=duration,
        final_message=final_message,
        stdout_path=display_path(stdout_path, repo_root),
        stderr_path=display_path(stderr_path, repo_root),
        changed_files=changed_files,
    )


def render_audit_markdown(
    repo_root: Path,
    git_sha: str,
    results: Sequence[ModuleAuditResult],
    started_at: str,
    finished_at: str,
) -> str:
    status_counts: dict[str, int] = {}
    for result in results:
        status_counts[result.status] = status_counts.get(result.status, 0) + 1

    summary = ", ".join(
        f"{count} {status}" for status, count in sorted(status_counts.items())
    )
    if not summary:
        summary = "No module audits ran"

    lines = [
        "# QuickVoice Audit",
        "",
        "## Executive Summary",
        "",
        f"- Repository: `{repo_root}`",
        f"- Commit: `{git_sha}`",
        f"- Started: `{started_at}`",
        f"- Finished: `{finished_at}`",
        f"- Module session status: {summary}",
        "",
        "This report was generated by `scripts/codex_module_audit.py`, which runs one isolated Codex audit session per module and aggregates the final module reports.",
        "",
        "## Module Status",
        "",
        "| Module | Status | Return Code | Duration | Logs |",
        "| --- | --- | ---: | ---: | --- |",
    ]

    for result in results:
        returncode = "" if result.returncode is None else str(result.returncode)
        lines.append(
            f"| `{result.module}` | {result.status} | {returncode} | "
            f"{result.duration_seconds:.1f}s | `{result.stdout_path}`, `{result.stderr_path}` |"
        )

    lines.extend(["", "## Findings By Module", ""])
    for result in results:
        lines.extend(
            [
                f"### {result.module}: {result.title}",
                "",
                f"- Status: `{result.status}`",
                f"- Return code: `{result.returncode}`",
                f"- Duration: `{result.duration_seconds:.1f}s`",
                f"- Stdout log: `{result.stdout_path}`",
                f"- Stderr log: `{result.stderr_path}`",
            ]
        )
        if result.changed_files:
            lines.append("- Changed files detected:")
            lines.extend(f"  - `{path}`" for path in result.changed_files)
        lines.extend(["", result.final_message.strip(), ""])

    lines.extend(
        [
            "## Appendix: Runner Notes",
            "",
            "- Each module prompt explicitly instructed Codex not to edit repository files.",
            "- Generated logs are stored under `.audit_runs/` and ignored by git.",
            "- A `changed_files` status means a module session modified tracked files and requires manual inspection before trusting the report.",
            "",
        ]
    )
    return "\n".join(lines)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run sequential full-permission Codex audit sessions by module."
    )
    parser.add_argument(
        "--module",
        action="append",
        dest="modules",
        help="Module name to audit. Repeat to audit multiple modules. Defaults to all modules.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print modules and Codex commands without running Codex.",
    )
    parser.add_argument(
        "--timeout-minutes",
        type=int,
        default=45,
        help="Timeout for each module Codex session. Default: 45.",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path.cwd(),
        help="Repository root. Defaults to the current working directory.",
    )
    parser.add_argument(
        "--run-dir",
        type=Path,
        default=None,
        help="Directory for run logs. Defaults to .audit_runs/<timestamp>.",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Optional Codex model override passed to codex exec.",
    )
    parser.add_argument(
        "--continue-on-changes",
        action="store_true",
        help="Continue module audits even if a Codex session changes tracked files.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    repo_root = args.repo_root.resolve()

    try:
        modules = select_modules(args.modules)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.timeout_minutes < 1:
        print("--timeout-minutes must be at least 1", file=sys.stderr)
        return 2

    if args.dry_run:
        run_dir = (args.run_dir or repo_root / ".audit_runs" / "dry-run").resolve()
        print(f"Repo root: {repo_root}")
        print(f"Run dir: {run_dir}")
        for module in modules:
            final_path = run_dir / f"{module.name}.final.md"
            command = build_codex_command(
                repo_root=repo_root,
                module=module,
                output_last_message=final_path,
                model=args.model,
            )
            print(f"\n[{module.name}] {module.title}")
            print("Paths: " + ", ".join(module.paths))
            print("Command: " + " ".join(command))
        return 0

    try:
        require_git_repo(repo_root)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    started_at = utc_now()
    stamp = started_at.replace(":", "").replace("+00:00", "Z")
    run_dir = (args.run_dir or repo_root / ".audit_runs" / stamp).resolve()
    run_dir.mkdir(parents=True, exist_ok=True)

    print(f"Running {len(modules)} module audit(s) in {repo_root}")
    print(f"Logs: {run_dir}")

    results: list[ModuleAuditResult] = []
    stop_on_changes = not args.continue_on_changes
    for module in modules:
        print(f"\n==> Auditing {module.name}: {module.title}")
        result = run_module_audit(
            repo_root=repo_root,
            module=module,
            run_dir=run_dir,
            timeout_minutes=args.timeout_minutes,
            model=args.model,
            stop_on_changes=stop_on_changes,
        )
        results.append(result)
        print(f"<== {module.name}: {result.status} in {result.duration_seconds:.1f}s")
        if result.changed_files and stop_on_changes:
            print(
                "Tracked files changed during audit; stopping. "
                "Re-run with --continue-on-changes to continue.",
                file=sys.stderr,
            )
            break

    finished_at = utc_now()
    report = render_audit_markdown(
        repo_root=repo_root,
        git_sha=git_sha(repo_root),
        results=results,
        started_at=started_at,
        finished_at=finished_at,
    )
    report_path = repo_root / "audit.md"
    write_text(report_path, report)
    write_text(
        run_dir / "results.json",
        json.dumps(
            [
                {
                    "module": result.module,
                    "title": result.title,
                    "status": result.status,
                    "returncode": result.returncode,
                    "duration_seconds": result.duration_seconds,
                    "final_message": result.final_message,
                    "stdout_path": str(result.stdout_path),
                    "stderr_path": str(result.stderr_path),
                    "changed_files": result.changed_files,
                }
                for result in results
            ],
            indent=2,
        )
        + "\n",
    )
    print(f"\nWrote {report_path}")
    return 1 if any(result.status != "passed" for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
