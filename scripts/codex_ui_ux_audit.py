#!/usr/bin/env python3
"""Run sequential Codex UI/UX audit sessions for QuickVoice modules.

The child Codex sessions run with full permissions because that is the requested
execution mode, but their prompt is audit-only. The parent runner captures logs,
validates the final Markdown contract, stops on the first incomplete module, and
always writes a module-wise report for the work completed so far.
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
    AuditModule,
    build_codex_command,
    display_path,
    git_sha,
    git_status,
    require_git_repo,
    select_modules,
    write_text,
)


REQUIRED_UI_UX_AUDIT_HEADINGS: tuple[str, ...] = (
    "## Top UX Risks",
    "## Navigation And Information Architecture",
    "## Usability And Ease Of Use",
    "## Visual Design, Colors, And Theme Modernization",
    "## Accessibility And Responsive Behavior",
    "## Empty, Loading, Error, And Edge States",
    "## Module-Specific Recommendations",
    "## Evidence And Files Reviewed",
    "## Blocked Or Unverified",
)


@dataclass(frozen=True)
class ModuleUiUxAuditResult:
    module: str
    title: str
    status: str
    returncode: int | None
    duration_seconds: float
    final_message: str
    stdout_path: Path
    stderr_path: Path
    changed_files: list[str]
    missing_headings: list[str]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def required_headings() -> tuple[str, ...]:
    return ("## Summary", *REQUIRED_UI_UX_AUDIT_HEADINGS)


def missing_required_headings(markdown: str) -> list[str]:
    lines = {line.strip() for line in markdown.splitlines()}
    return [heading for heading in required_headings() if heading not in lines]


def build_ui_ux_audit_prompt(module: AuditModule, git_sha: str) -> str:
    paths = "\n".join(f"- `{path}`" for path in module.paths)
    headings = "\n".join(f"- `{heading}`" for heading in required_headings())
    return f"""You are performing an audit-only UI/UX review for one QuickVoice module.

Module: {module.name}
Title: {module.title}
Repository commit: {git_sha}

Scope paths:
{paths}

Module focus:
{module.focus}

Audit focus:
- Evaluate usability and ease of use for the module's product surface.
- Evaluate navigation and information architecture, including route flow, labels, grouping, discoverability, and repeated user workflows.
- Evaluate colors, visual hierarchy, contrast, theme modernization, layout density, spacing, component consistency, and overall polish.
- Evaluate accessibility, keyboard behavior, responsive behavior, mobile ergonomics, and readable states.
- Evaluate empty, loading, error, disabled, permission, offline, and edge states.
- Identify missing UX features and high-value modern product improvements.
- For non-visual modules, audit developer/operator UX: setup clarity, configuration, API ergonomics, error messages, observability, docs, and product impact.

Rules:
- Do not edit any repository files.
- Do not create, delete, format, migrate, or commit any repository files.
- Do not write the final report file yourself; the parent runner will save your final Markdown if it passes validation.
- You may inspect files and run read-only checks, but do not run commands that rewrite tracked files.
- This is one module in a sequential UI/UX audit run; return a complete report for this module only.
- Do not ask to move to the next module. The runner will stop unless this module is finished successfully.
- Prefer concrete findings with file paths, route/component references, user impact, severity, and recommended improvements.
- Distinguish proven issues from hypotheses.
- If credentials, paid services, browser access, or live vendors are unavailable, mark the check as blocked rather than guessing.

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


def run_module_ui_ux_audit(
    repo_root: Path,
    module: AuditModule,
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None,
) -> ModuleUiUxAuditResult:
    module_prefix = run_dir / module.name
    stdout_path = module_prefix.with_suffix(".stdout.jsonl")
    stderr_path = module_prefix.with_suffix(".stderr.log")
    final_path = module_prefix.with_suffix(".final.md")
    prompt_path = module_prefix.with_suffix(".prompt.md")

    prompt = build_ui_ux_audit_prompt(module, git_sha=git_sha(repo_root))
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
        status = "empty_report"
        final_message = stderr.strip() or stdout.strip() or "No final report captured."
        missing_headings = list(required_headings())
    elif status == "completed":
        missing_headings = missing_required_headings(final_message)
        if missing_headings:
            status = "invalid_report"
            final_message = (
                f"{final_message}\n\n"
                "Runner stopped because the report missed required headings:\n"
                + "\n".join(f"- `{heading}`" for heading in missing_headings)
            )
    else:
        final_message = final_message or stderr.strip() or stdout.strip()
        if not final_message:
            final_message = "No final report captured."
        missing_headings = []

    return ModuleUiUxAuditResult(
        module=module.name,
        title=module.title,
        status=status,
        returncode=returncode,
        duration_seconds=duration,
        final_message=final_message,
        stdout_path=display_path(stdout_path, repo_root),
        stderr_path=display_path(stderr_path, repo_root),
        changed_files=changed_files,
        missing_headings=missing_headings,
    )


def run_selected_modules(
    repo_root: Path,
    modules: Sequence[AuditModule],
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None,
) -> list[ModuleUiUxAuditResult]:
    results: list[ModuleUiUxAuditResult] = []
    for module in modules:
        result = run_module_ui_ux_audit(
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


def status_summary(results: Sequence[ModuleUiUxAuditResult]) -> str:
    status_counts: dict[str, int] = {}
    for result in results:
        status_counts[result.status] = status_counts.get(result.status, 0) + 1
    if not status_counts:
        return "No module audits ran"
    return ", ".join(
        f"{count} {status}" for status, count in sorted(status_counts.items())
    )


def render_ui_ux_audit_markdown(
    repo_root: Path,
    modules: Sequence[AuditModule],
    results: Sequence[ModuleUiUxAuditResult],
    git_sha: str,
    started_at: str,
    finished_at: str,
) -> str:
    result_by_module = {result.module: result for result in results}
    lines = [
        "# QuickVoice UI/UX Audit",
        "",
        "## Executive Summary",
        "",
        f"- Repository: `{repo_root}`",
        f"- Commit: `{git_sha}`",
        f"- Started: `{started_at}`",
        f"- Finished: `{finished_at}`",
        f"- Module session status: {status_summary(results)}",
        "",
        "This report was generated by `scripts/codex_ui_ux_audit.py`, which runs one read-only Codex UI/UX audit session per module and stops before the next module unless the previous report validates.",
        "",
        "## Module Status",
        "",
        "| Module | Status | Return Code | Duration | Logs |",
        "| --- | --- | ---: | ---: | --- |",
    ]

    for module in modules:
        result = result_by_module.get(module.name)
        if result is None:
            lines.append(f"| `{module.name}` | not_run |  |  |  |")
            continue
        returncode = "" if result.returncode is None else str(result.returncode)
        lines.append(
            f"| `{result.module}` | {result.status} | {returncode} | "
            f"{result.duration_seconds:.1f}s | `{result.stdout_path}`, `{result.stderr_path}` |"
        )

    lines.extend(["", "## Module Reports", ""])
    for module in modules:
        result = result_by_module.get(module.name)
        lines.extend([f"### {module.name}: {module.title}", ""])
        if result is None:
            lines.extend(
                [
                    "- Status: `not_run`",
                    "",
                    "This module was not started because an earlier module did not complete.",
                    "",
                ]
            )
            continue

        lines.extend(
            [
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
        if result.missing_headings:
            lines.append("- Missing required headings:")
            lines.extend(f"  - `{heading}`" for heading in result.missing_headings)
        lines.extend(["", result.final_message.strip(), ""])

    lines.extend(
        [
            "## Appendix: Runner Notes",
            "",
            "- Each module prompt explicitly instructed Codex not to edit repository files.",
            "- Generated logs are stored under `.ui_ux_audit_runs/` and ignored by git.",
            "- The runner stops on the first non-completed module and writes this report with partial status.",
            "- An `unsafe_changes` status means a module session modified files outside the ignored run directory and requires manual inspection before trusting the report.",
            "",
        ]
    )
    return "\n".join(lines)


def results_json(results: Sequence[ModuleUiUxAuditResult]) -> str:
    payload = [
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
            "missing_headings": result.missing_headings,
        }
        for result in results
    ]
    return json.dumps(payload, indent=2) + "\n"


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run sequential full-permission Codex sessions for module UI/UX audits."
    )
    parser.add_argument(
        "--module",
        action="append",
        dest="modules",
        help="Module to audit. Repeat for multiple modules. Defaults to all modules.",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path.cwd(),
        help="Repository root. Defaults to current directory.",
    )
    parser.add_argument(
        "--run-dir",
        type=Path,
        default=None,
        help="Directory for run logs. Defaults to .ui_ux_audit_runs/<timestamp>.",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=Path("ui_ux_audit.md"),
        help="Aggregated Markdown report path. Default: ui_ux_audit.md.",
    )
    parser.add_argument(
        "--timeout-minutes",
        type=int,
        default=90,
        help="Timeout for each module Codex session. Default: 90.",
    )
    parser.add_argument("--model", default=None, help="Optional Codex model override.")
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
    modules: Sequence[AuditModule],
    run_dir: Path,
    report_path: Path,
    *,
    model: str | None,
) -> None:
    print(f"Repo root: {repo_root}")
    print(f"Report path: {report_path}")
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
        print("Command: " + " ".join(command))


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

    started_at = utc_now()
    stamp = started_at.replace(":", "").replace("+00:00", "Z")
    run_dir = resolve_path(repo_root, args.run_dir or Path(".ui_ux_audit_runs") / stamp)
    report_path = resolve_path(repo_root, args.report_path)

    if args.dry_run:
        print_dry_run(
            repo_root=repo_root,
            modules=modules,
            run_dir=run_dir,
            report_path=report_path,
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

    print(f"Running {len(modules)} module UI/UX audit session(s) in {repo_root}")
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
    report = render_ui_ux_audit_markdown(
        repo_root=repo_root,
        modules=modules,
        results=results,
        git_sha=starting_sha,
        started_at=started_at,
        finished_at=finished_at,
    )
    write_text(report_path, report)
    print(f"Wrote {display_path(report_path, repo_root)}")

    if len(results) != len(modules) or any(
        result.status != "completed" for result in results
    ):
        print(
            "Stopping after writing a partial UI/UX audit because a module did not complete.",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
