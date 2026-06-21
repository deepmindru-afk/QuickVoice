#!/usr/bin/env python3
"""Run sequential Codex fix sessions from QuickVoice UI/UX audit findings.

Each child Codex session runs with full permissions because that is the requested
execution mode. The parent runner enforces sequencing: a new module starts only
after the previous module exits successfully, returns the required final report,
changes scoped files, and passes module verification.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
from typing import Sequence


SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from codex_audit_fix import (  # noqa: E402
    VerificationCommand,
    VerificationResult,
    command_status,
    dependency_setup_commands,
    final_verification_commands,
    render_verification,
    run_verification,
    verification_commands_for,
)
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


REQUIRED_UI_UX_FIX_HEADINGS: tuple[str, ...] = (
    "## Fixed UI/UX Findings",
    "## Deferred Or Unresolved",
    "## Files Changed",
    "## Verification Run",
)


@dataclass(frozen=True)
class WorktreeSnapshot:
    status_lines: tuple[str, ...]
    file_hashes: dict[str, str]


@dataclass(frozen=True)
class ModuleUiUxFixResult:
    module: str
    title: str
    status: str
    returncode: int | None
    duration_seconds: float
    final_message: str
    stdout_path: Path
    stderr_path: Path
    changed_files: list[str]
    verification_results: list[VerificationResult]
    missing_headings: list[str]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def required_headings() -> tuple[str, ...]:
    return ("## Summary", *REQUIRED_UI_UX_FIX_HEADINGS)


def missing_required_headings(markdown: str) -> list[str]:
    lines = {line.strip() for line in markdown.splitlines()}
    return [heading for heading in required_headings() if heading not in lines]


def find_latest_ui_ux_audit_run(
    repo_root: Path, module_names: Sequence[str]
) -> Path | None:
    audit_root = repo_root / ".ui_ux_audit_runs"
    if not audit_root.exists():
        return None

    candidates: list[Path] = []
    for child in audit_root.iterdir():
        if not child.is_dir():
            continue
        if any((child / f"{module_name}.final.md").exists() for module_name in module_names):
            candidates.append(child)

    if not candidates:
        return None

    return sorted(candidates, key=lambda path: (path.stat().st_mtime, path.name))[-1]


def extract_module_section(audit_text: str, module_name: str) -> str:
    marker = f"### {module_name}:"
    start = audit_text.find(marker)
    if start == -1:
        raise ValueError(f"Module section not found in UI/UX audit report: {module_name}")

    next_start = audit_text.find("\n### ", start + len(marker))
    if next_start == -1:
        return audit_text[start:].strip()
    return audit_text[start:next_start].strip()


def load_ui_ux_audit_text(
    repo_root: Path,
    module: AuditModule,
    audit_run: Path | None = None,
    audit_path: Path | None = None,
) -> str:
    selected_run = audit_run or find_latest_ui_ux_audit_run(repo_root, [module.name])
    if selected_run:
        module_report = selected_run / f"{module.name}.final.md"
        if module_report.exists():
            return module_report.read_text(encoding="utf-8").strip()

    fallback_path = audit_path or repo_root / "ui_ux_audit.md"
    if not fallback_path.exists():
        raise FileNotFoundError(
            "No per-module UI/UX audit report found and ui_ux_audit.md does not exist."
        )
    return extract_module_section(
        fallback_path.read_text(encoding="utf-8"), module.name
    )


def allowed_path_text(module: AuditModule, allow_cross_module: bool) -> str:
    if allow_cross_module or module.name == "root-tooling":
        return "You may edit any repository file needed to fix this module's findings."
    paths = "\n".join(f"- `{path}`" for path in module.paths)
    return (
        "Only edit files under these paths unless a referenced UI/UX finding "
        f"proves a small cross-module change is required:\n{paths}"
    )


def build_ui_ux_fix_prompt(
    module: AuditModule,
    audit_text: str,
    git_sha: str,
    *,
    allow_cross_module: bool,
    skip_deps: bool,
    allow_no_changes: bool,
) -> str:
    deps_policy = (
        "Dependency installation is allowed for verification when needed."
        if not skip_deps
        else "Do not install dependencies; use existing tools and static checks only."
    )
    no_changes_policy = (
        "If every finding is already fixed, explain why no repository change is needed."
        if allow_no_changes
        else "Make concrete repository changes for actionable findings; a no-change session is incomplete."
    )
    headings = "\n".join(f"- `{heading}`" for heading in required_headings())

    return f"""You are fixing QuickVoice UI/UX audit findings for one module.

Module: {module.name}
Title: {module.title}
Repository commit at runner start: {git_sha}

Scope:
- Fix UI/UX findings one at a time, in audit priority order.
- Focus on concrete user-facing, developer-facing, accessibility, responsive, empty/loading/error state, navigation, visual polish, and usability issues from the audit text below.
- Do not attempt broad product ideas that require unavailable credentials, external vendors, or a product policy decision; list those as deferred in your final message.
- {allowed_path_text(module, allow_cross_module)}

Hard rules:
- Do not push.
- Do not commit.
- Do not rewrite unrelated code.
- Do not hide unresolved findings; state what remains and why.
- Prefer tests or focused verification for every change.
- Preserve existing repository style and framework patterns.
- {deps_policy}
- {no_changes_policy}

Return Markdown only. It must contain these exact headings:
{headings}

Audit text to fix:

{audit_text}
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


def file_fingerprint(repo_root: Path, path_text: str) -> str:
    path = Path(path_text)
    absolute_path = path if path.is_absolute() else repo_root / path
    if not absolute_path.exists():
        return "missing"
    if absolute_path.is_dir():
        digest = hashlib.sha256()
        for child in sorted(absolute_path.rglob("*")):
            if child.is_dir():
                continue
            try:
                relative = child.relative_to(absolute_path).as_posix()
                digest.update(relative.encode("utf-8", errors="surrogateescape"))
                digest.update(b"\0")
                digest.update(child.read_bytes())
                digest.update(b"\0")
            except OSError as exc:
                digest.update(f"<unreadable:{exc}>".encode("utf-8"))
        return f"dir:{digest.hexdigest()}"
    try:
        return "file:" + hashlib.sha256(absolute_path.read_bytes()).hexdigest()
    except OSError as exc:
        return f"unreadable:{exc}"


def snapshot_from_status(repo_root: Path, status_lines: Sequence[str]) -> WorktreeSnapshot:
    paths = sorted({status_path(line) for line in status_lines if line.strip()})
    return WorktreeSnapshot(
        status_lines=tuple(line for line in status_lines if line.strip()),
        file_hashes={path: file_fingerprint(repo_root, path) for path in paths},
    )


def snapshot_worktree(repo_root: Path) -> WorktreeSnapshot:
    return snapshot_from_status(repo_root, git_status(repo_root))


def status_line_ignored(
    status_line: str, repo_root: Path, ignored_roots: Sequence[Path]
) -> bool:
    raw_path = status_path(status_line)
    path = Path(raw_path)
    absolute_path = path if path.is_absolute() else repo_root / path
    return any(is_under(absolute_path, ignored_root) for ignored_root in ignored_roots)


def changed_files_between(
    before: WorktreeSnapshot,
    after: WorktreeSnapshot,
    *,
    repo_root: Path,
    ignored_roots: Sequence[Path],
) -> list[str]:
    before_lines = set(before.status_lines)
    after_lines = set(after.status_lines)
    changed: set[str] = set()

    for line in before_lines | after_lines:
        if status_line_ignored(line, repo_root, ignored_roots):
            continue
        path = status_path(line)
        if line not in before_lines or line not in after_lines:
            changed.add(line)
        elif before.file_hashes.get(path) != after.file_hashes.get(path):
            changed.add(line)

    return sorted(changed)


def module_allows_changed_file(
    module: AuditModule,
    status_line: str,
    *,
    allow_cross_module: bool,
) -> bool:
    if allow_cross_module or module.name == "root-tooling":
        return True
    path = status_path(status_line)
    return any(path == allowed or path.startswith(f"{allowed}/") for allowed in module.paths)


def read_final_message(final_path: Path) -> str:
    if not final_path.exists():
        return ""
    return final_path.read_text(encoding="utf-8").strip()


def run_module_ui_ux_fix(
    repo_root: Path,
    module: AuditModule,
    audit_text: str,
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None,
    allow_cross_module: bool,
    skip_deps: bool,
    allow_no_changes: bool,
) -> ModuleUiUxFixResult:
    module_prefix = run_dir / module.name
    stdout_path = module_prefix.with_suffix(".stdout.jsonl")
    stderr_path = module_prefix.with_suffix(".stderr.log")
    final_path = module_prefix.with_suffix(".final.md")
    prompt_path = module_prefix.with_suffix(".prompt.md")

    prompt = build_ui_ux_fix_prompt(
        module=module,
        audit_text=audit_text,
        git_sha=git_sha(repo_root),
        allow_cross_module=allow_cross_module,
        skip_deps=skip_deps,
        allow_no_changes=allow_no_changes,
    )
    write_text(prompt_path, prompt)

    before_snapshot = snapshot_worktree(repo_root)
    before_head = git_sha(repo_root)
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
        status = "fixed" if result.returncode == 0 else "failed"
    except subprocess.TimeoutExpired as exc:
        returncode = None
        stdout = exc.stdout if isinstance(exc.stdout, str) else ""
        stderr = exc.stderr if isinstance(exc.stderr, str) else ""
        stderr = f"{stderr}\nTimed out after {timeout_minutes} minutes.\n"
        status = "timed_out"

    duration = time.monotonic() - started
    final_message = read_final_message(final_path)
    if not final_message:
        final_message = stderr.strip() or stdout.strip() or "No final message captured."

    after_head = git_sha(repo_root)
    after_snapshot = snapshot_worktree(repo_root)
    changed_files = changed_files_between(
        before_snapshot,
        after_snapshot,
        repo_root=repo_root,
        ignored_roots=[run_dir],
    )

    write_text(stdout_path, stdout)
    write_text(stderr_path, stderr)

    verification_results: list[VerificationResult] = []
    missing_headings: list[str] = []

    if after_head != before_head:
        status = "head_changed"
        final_message += "\n\nRunner stopped because the Codex session changed HEAD."
    elif any(
        not module_allows_changed_file(
            module, status_line, allow_cross_module=allow_cross_module
        )
        for status_line in changed_files
    ):
        status = "unsafe_changes"
        final_message += (
            "\n\nRunner stopped because files outside the module scope changed."
        )
    elif status == "fixed":
        missing_headings = missing_required_headings(final_message)
        if missing_headings:
            status = "invalid_report"
            final_message += (
                "\n\nRunner stopped because the report missed required headings:\n"
                + "\n".join(f"- `{heading}`" for heading in missing_headings)
            )
        elif not changed_files and not allow_no_changes:
            status = "no_changes"
            final_message += (
                "\n\nNo repository changes were detected, so the module is not considered fixed."
            )
        else:
            verification_results = run_verification(
                repo_root, verification_commands_for(module.name)
            )
            if command_status(verification_results) == "failed":
                status = "verification_failed"

    return ModuleUiUxFixResult(
        module=module.name,
        title=module.title,
        status=status,
        returncode=returncode,
        duration_seconds=duration,
        final_message=final_message,
        stdout_path=display_path(stdout_path, repo_root),
        stderr_path=display_path(stderr_path, repo_root),
        changed_files=changed_files,
        verification_results=verification_results,
        missing_headings=missing_headings,
    )


def run_selected_modules(
    repo_root: Path,
    modules: Sequence[AuditModule],
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None,
    allow_cross_module: bool,
    skip_deps: bool,
    allow_no_changes: bool,
    audit_run: Path | None,
    audit_path: Path | None,
) -> list[ModuleUiUxFixResult]:
    results: list[ModuleUiUxFixResult] = []
    for module in modules:
        audit_text = load_ui_ux_audit_text(
            repo_root=repo_root,
            module=module,
            audit_run=audit_run,
            audit_path=audit_path,
        )
        result = run_module_ui_ux_fix(
            repo_root=repo_root,
            module=module,
            audit_text=audit_text,
            run_dir=run_dir,
            timeout_minutes=timeout_minutes,
            model=model,
            allow_cross_module=allow_cross_module,
            skip_deps=skip_deps,
            allow_no_changes=allow_no_changes,
        )
        results.append(result)
        if result.status != "fixed":
            break
    return results


def status_summary(results: Sequence[ModuleUiUxFixResult]) -> str:
    status_counts: dict[str, int] = {}
    for result in results:
        status_counts[result.status] = status_counts.get(result.status, 0) + 1
    if not status_counts:
        return "No module fixes ran"
    return ", ".join(
        f"{count} {status}" for status, count in sorted(status_counts.items())
    )


def render_fix_report(
    repo_root: Path,
    modules: Sequence[AuditModule],
    results: Sequence[ModuleUiUxFixResult],
    git_sha: str,
    started_at: str,
    finished_at: str,
    final_verification: Sequence[VerificationResult] | None = None,
) -> str:
    result_by_module = {result.module: result for result in results}
    lines = [
        "# QuickVoice UI/UX Fix Report",
        "",
        "## Executive Summary",
        "",
        f"- Repository: `{repo_root}`",
        f"- Starting commit: `{git_sha}`",
        f"- Started: `{started_at}`",
        f"- Finished: `{finished_at}`",
        f"- Module fix status: {status_summary(results)}",
        "- Push status: not pushed",
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

    lines.extend(["", "## Fixes By Module", ""])
    for module in modules:
        result = result_by_module.get(module.name)
        lines.extend([f"### {module.name}: {module.title}", ""])
        if result is None:
            lines.extend(
                [
                    "- Status: `not_run`",
                    "",
                    "This module was not started because an earlier module did not finish.",
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
        if result.verification_results:
            lines.append("#### Verification")
            for verification in result.verification_results:
                lines.extend(render_verification(verification))
            lines.append("")

    if final_verification is not None:
        lines.extend(["## Final Aggregate Verification", ""])
        for verification in final_verification:
            lines.extend(render_verification(verification))
        lines.append("")

    lines.extend(
        [
            "## Appendix: Runner Notes",
            "",
            "- The runner never commits or pushes.",
            "- Generated logs are stored under `.ui_ux_fix_runs/` and ignored by git.",
            "- The runner stops before the next module unless the current module status is `fixed`.",
            "- `unsafe_changes` means the child session changed files outside the module scope.",
            "- `no_changes` means the child session completed but did not modify repository files.",
            "",
        ]
    )
    return "\n".join(lines)


def results_json(results: Sequence[ModuleUiUxFixResult]) -> str:
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
            "verification_results": [
                {
                    "label": verification.label,
                    "argv": verification.argv,
                    "returncode": verification.returncode,
                    "stdout": verification.stdout,
                    "stderr": verification.stderr,
                }
                for verification in result.verification_results
            ],
        }
        for result in results
    ]
    return json.dumps(payload, indent=2) + "\n"


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run sequential full-permission Codex fix sessions from UI/UX audit findings."
    )
    parser.add_argument(
        "--module",
        action="append",
        dest="modules",
        help="Module to fix. Repeat for multiple modules. Defaults to all modules.",
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
        help="Directory for fix logs. Defaults to .ui_ux_fix_runs/<timestamp>.",
    )
    parser.add_argument(
        "--audit-run",
        type=Path,
        default=None,
        help="Specific .ui_ux_audit_runs directory to read before falling back to the aggregate report.",
    )
    parser.add_argument(
        "--audit-path",
        type=Path,
        default=Path("ui_ux_audit.md"),
        help="Aggregate UI/UX audit report path. Default: ui_ux_audit.md.",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=Path("ui_ux_fix_report.md"),
        help="Aggregated fix report path. Default: ui_ux_fix_report.md.",
    )
    parser.add_argument(
        "--timeout-minutes",
        type=int,
        default=90,
        help="Timeout for each module Codex session. Default: 90.",
    )
    parser.add_argument("--model", default=None, help="Optional Codex model override.")
    parser.add_argument(
        "--skip-deps",
        action="store_true",
        help="Skip dependency setup before running fixes.",
    )
    parser.add_argument(
        "--allow-cross-module",
        action="store_true",
        help="Allow module fix sessions to edit outside their nominal module paths.",
    )
    parser.add_argument(
        "--allow-no-changes",
        action="store_true",
        help="Treat a successful no-change module session as fixed.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print selected modules, audit sources, commands, and verification without running Codex.",
    )
    return parser.parse_args(argv)


def resolve_path(repo_root: Path, path: Path) -> Path:
    return path.resolve() if path.is_absolute() else (repo_root / path).resolve()


def audit_source_for(
    repo_root: Path,
    module: AuditModule,
    audit_run: Path | None,
    audit_path: Path,
) -> Path:
    selected_run = audit_run or find_latest_ui_ux_audit_run(repo_root, [module.name])
    if selected_run:
        module_report = selected_run / f"{module.name}.final.md"
        if module_report.exists():
            return module_report
    return audit_path


def print_dry_run(
    repo_root: Path,
    modules: Sequence[AuditModule],
    run_dir: Path,
    report_path: Path,
    *,
    audit_run: Path | None,
    audit_path: Path,
    model: str | None,
    skip_deps: bool,
) -> None:
    print(f"Repo root: {repo_root}")
    print(f"Report path: {report_path}")
    print(f"Run dir: {run_dir}")
    print(f"Audit run: {audit_run or 'latest .ui_ux_audit_runs module reports'}")
    print(f"Audit fallback: {audit_path}")
    if skip_deps:
        print("Dependency setup: skipped")
    else:
        print("Dependency setup:")
        for command in dependency_setup_commands():
            print(f"- {command.label}: {' '.join(command.argv)}")

    for module in modules:
        final_path = run_dir / f"{module.name}.final.md"
        command = build_codex_command(
            repo_root=repo_root,
            module=module,
            output_last_message=final_path,
            model=model,
        )
        print(f"\n[{module.name}] {module.title}")
        print(f"Audit source: {audit_source_for(repo_root, module, audit_run, audit_path)}")
        print("Command: " + " ".join(command))
        print("Verification:")
        for verify in verification_commands_for(module.name):
            print(f"- {verify.label}: {' '.join(verify.argv)}")


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
    run_dir = resolve_path(repo_root, args.run_dir or Path(".ui_ux_fix_runs") / stamp)
    report_path = resolve_path(repo_root, args.report_path)
    audit_run = resolve_path(repo_root, args.audit_run) if args.audit_run else None
    audit_path = resolve_path(repo_root, args.audit_path)

    if args.dry_run:
        print_dry_run(
            repo_root=repo_root,
            modules=modules,
            run_dir=run_dir,
            report_path=report_path,
            audit_run=audit_run,
            audit_path=audit_path,
            model=args.model,
            skip_deps=args.skip_deps,
        )
        return 0

    try:
        require_git_repo(repo_root)
        for module in modules:
            load_ui_ux_audit_text(
                repo_root=repo_root,
                module=module,
                audit_run=audit_run,
                audit_path=audit_path,
            )
    except (RuntimeError, FileNotFoundError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 2

    starting_sha = git_sha(repo_root)
    run_dir.mkdir(parents=True, exist_ok=True)
    results: list[ModuleUiUxFixResult] = []
    final_verification: list[VerificationResult] | None = None

    print(f"Running {len(modules)} module UI/UX fix session(s) in {repo_root}")
    print(f"Logs: {run_dir}")

    if not args.skip_deps:
        print("\n==> Setting up dependencies")
        dep_results = run_verification(repo_root, dependency_setup_commands())
        if command_status(dep_results) == "failed":
            finished_at = utc_now()
            report = render_fix_report(
                repo_root=repo_root,
                modules=modules,
                results=[],
                git_sha=starting_sha,
                started_at=started_at,
                finished_at=finished_at,
                final_verification=dep_results,
            )
            write_text(report_path, report)
            print(f"Dependency setup failed; wrote {report_path}", file=sys.stderr)
            return 1

    results = run_selected_modules(
        repo_root=repo_root,
        modules=modules,
        run_dir=run_dir,
        timeout_minutes=args.timeout_minutes,
        model=args.model,
        allow_cross_module=args.allow_cross_module,
        skip_deps=args.skip_deps,
        allow_no_changes=args.allow_no_changes,
        audit_run=audit_run,
        audit_path=audit_path,
    )

    for result in results:
        print(f"{result.module}: {result.status} in {result.duration_seconds:.1f}s")

    if len(results) == len(modules) and all(result.status == "fixed" for result in results):
        print("\n==> Running final aggregate verification")
        final_verification = run_verification(repo_root, final_verification_commands())

    finished_at = utc_now()
    write_text(run_dir / "results.json", results_json(results))
    report = render_fix_report(
        repo_root=repo_root,
        modules=modules,
        results=results,
        git_sha=starting_sha,
        started_at=started_at,
        finished_at=finished_at,
        final_verification=final_verification,
    )
    write_text(report_path, report)
    print(f"\nWrote {display_path(report_path, repo_root)}")

    failed = len(results) != len(modules) or any(
        result.status != "fixed" for result in results
    )
    if final_verification is not None:
        failed = failed or command_status(final_verification) == "failed"
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
