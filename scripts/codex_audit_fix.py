#!/usr/bin/env python3
"""Run sequential Codex fix sessions from QuickVoice audit findings."""

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
    DEFAULT_MODULES,
    display_path,
    git_sha,
    git_status,
    require_git_repo,
    run_git,
    select_modules,
    write_text,
)


@dataclass(frozen=True)
class VerificationCommand:
    label: str
    argv: list[str]
    cwd: str = "."


@dataclass(frozen=True)
class VerificationResult:
    label: str
    argv: list[str]
    returncode: int
    stdout: str
    stderr: str


@dataclass(frozen=True)
class ModuleFixResult:
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


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def find_latest_audit_run(repo_root: Path, module_names: Sequence[str]) -> Path | None:
    audit_root = repo_root / ".audit_runs"
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
        raise ValueError(f"Module section not found in audit.md: {module_name}")

    next_start = audit_text.find("\n### ", start + len(marker))
    if next_start == -1:
        return audit_text[start:].strip()
    return audit_text[start:next_start].strip()


def load_audit_text(
    repo_root: Path,
    module: AuditModule,
    audit_run: Path | None = None,
) -> str:
    audit_run = audit_run or find_latest_audit_run(repo_root, [module.name])
    if audit_run:
        module_report = audit_run / f"{module.name}.final.md"
        if module_report.exists():
            return module_report.read_text(encoding="utf-8").strip()

    audit_path = repo_root / "audit.md"
    if not audit_path.exists():
        raise FileNotFoundError(
            "No per-module audit report found and audit.md does not exist."
        )
    return extract_module_section(audit_path.read_text(encoding="utf-8"), module.name)


def build_codex_command(
    repo_root: Path,
    module: AuditModule,
    output_last_message: Path,
    *,
    model: str | None = None,
) -> list[str]:
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


def allowed_path_text(module: AuditModule, allow_cross_module: bool) -> str:
    if allow_cross_module or module.name == "root-tooling":
        return "You may edit any repository file needed to fix this module's findings."
    paths = "\n".join(f"- `{path}`" for path in module.paths)
    return (
        "Only edit files under these paths unless a referenced finding proves a "
        f"small cross-module change is required:\n{paths}"
    )


def build_fix_prompt(
    module: AuditModule,
    audit_text: str,
    git_sha: str,
    *,
    allow_cross_module: bool,
    skip_deps: bool,
) -> str:
    deps_policy = (
        "Dependency installation is allowed for verification when needed."
        if not skip_deps
        else "Do not install dependencies; use existing tools and static checks only."
    )
    return f"""You are fixing QuickVoice audit findings.

Module: {module.name}
Title: {module.title}
Repository commit at runner start: {git_sha}

Scope:
- Fix all actionable findings in the audit text below: Critical/High, Medium, Low, UI/UX, Missing Features, and concrete New Feature Opportunities.
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

Return Markdown with:
## Summary
## Fixed Findings
## Deferred Or Unresolved
## Files Changed
## Verification Run

Audit text to fix:

{audit_text}
"""


def dependency_setup_commands() -> list[VerificationCommand]:
    return [
        VerificationCommand("enable corepack", ["corepack", "enable"]),
        VerificationCommand(
            "activate pnpm 9.0.0",
            ["corepack", "prepare", "pnpm@9.0.0", "--activate"],
        ),
        VerificationCommand(
            "install node dependencies",
            ["pnpm", "install", "--frozen-lockfile"],
        ),
        VerificationCommand(
            "create ai virtualenv",
            ["python3", "-m", "venv", "apps/ai/.venv"],
        ),
        VerificationCommand(
            "install ai python dependencies",
            [
                "bash",
                "-lc",
                ". apps/ai/.venv/bin/activate && python -m pip install --upgrade pip && python -m pip install -r apps/ai/requirements.txt",
            ],
        ),
    ]


def verification_commands_for(module_name: str) -> list[VerificationCommand]:
    mapping: dict[str, list[VerificationCommand]] = {
        "root-tooling": [
            VerificationCommand(
                "dev script syntax",
                [
                    "bash",
                    "-n",
                    "scripts/dev-clear-processes.sh",
                    "scripts/dev-doctor.sh",
                    "scripts/dev-env.sh",
                    "scripts/dev-node-deps.sh",
                    "scripts/dev-up.sh",
                ],
            ),
            VerificationCommand("task list", ["task", "--list"]),
            VerificationCommand(
                "dev orchestration tests",
                ["node", "--test", "tests/dev-orchestration.test.mjs"],
            ),
        ],
        "apps-web": [
            VerificationCommand("web lint", ["pnpm", "--filter", "web", "lint"]),
            VerificationCommand(
                "web typecheck",
                [
                    "pnpm",
                    "--filter",
                    "web",
                    "exec",
                    "tsc",
                    "--noEmit",
                    "-p",
                    "tsconfig.json",
                ],
            ),
            VerificationCommand("web build", ["pnpm", "--filter", "web", "build"]),
        ],
        "apps-console": [
            VerificationCommand(
                "console lint", ["pnpm", "--filter", "console", "lint"]
            ),
            VerificationCommand(
                "console typecheck",
                [
                    "pnpm",
                    "--filter",
                    "console",
                    "exec",
                    "tsc",
                    "--noEmit",
                    "-p",
                    "tsconfig.json",
                ],
            ),
            VerificationCommand(
                "console build", ["pnpm", "--filter", "console", "build"]
            ),
        ],
        "apps-server": [
            VerificationCommand(
                "server check-types",
                ["pnpm", "--dir", "apps/server", "check-types"],
            ),
            VerificationCommand("server build", ["pnpm", "--dir", "apps/server", "build"]),
            VerificationCommand(
                "prisma validate",
                [
                    "bash",
                    "-lc",
                    "DATABASE_URL=${DATABASE_URL:-postgresql://user:pass@localhost:5432/quickvoice} pnpm --dir apps/server exec prisma validate",
                ],
            ),
        ],
        "apps-ai": [
            VerificationCommand(
                "ai compile",
                [
                    "bash",
                    "-lc",
                    ". apps/ai/.venv/bin/activate && cd apps/ai && python -m compileall .",
                ],
            ),
            VerificationCommand(
                "ai tests",
                [
                    "bash",
                    "-lc",
                    ". apps/ai/.venv/bin/activate && cd apps/ai && python -m pytest tests -q",
                ],
            ),
        ],
        "packages-config": [
            VerificationCommand(
                "eslint config syntax",
                [
                    "bash",
                    "-lc",
                    "node --check packages/eslint-config/base.js && node --check packages/eslint-config/next.js && node --check packages/eslint-config/react-internal.js",
                ],
            ),
            VerificationCommand(
                "typescript config json",
                [
                    "bash",
                    "-lc",
                    "node -e \"for (const f of ['packages/typescript-config/base.json','packages/typescript-config/nextjs.json','packages/typescript-config/react-library.json','packages/typescript-config/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8'))\"",
                ],
            ),
            VerificationCommand("workspace lint", ["pnpm", "lint"]),
        ],
    }
    return mapping.get(module_name, [])


def final_verification_commands() -> list[VerificationCommand]:
    return [
        VerificationCommand("workspace lint", ["pnpm", "lint"]),
        VerificationCommand("workspace check-types", ["pnpm", "check-types"]),
        VerificationCommand("workspace build", ["pnpm", "build"]),
        VerificationCommand(
            "ai tests",
            [
                "bash",
                "-lc",
                ". apps/ai/.venv/bin/activate && cd apps/ai && python -m pytest tests -q",
            ],
        ),
    ]


def run_command(repo_root: Path, command: VerificationCommand) -> VerificationResult:
    cwd = repo_root / command.cwd
    result = subprocess.run(
        command.argv,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    return VerificationResult(
        label=command.label,
        argv=command.argv,
        returncode=result.returncode,
        stdout=result.stdout,
        stderr=result.stderr,
    )


def run_verification(
    repo_root: Path, commands: Sequence[VerificationCommand]
) -> list[VerificationResult]:
    results: list[VerificationResult] = []
    for command in commands:
        result = run_command(repo_root, command)
        results.append(result)
        if result.returncode != 0:
            break
    return results


def command_status(results: Sequence[VerificationResult]) -> str:
    if not results:
        return "not_run"
    return "passed" if all(result.returncode == 0 for result in results) else "failed"


def parse_status_paths(status_lines: Sequence[str]) -> set[str]:
    paths: set[str] = set()
    for line in status_lines:
        if not line.strip():
            continue
        paths.add(line[3:].strip() if len(line) > 3 else line.strip())
    return paths


def module_allows_changed_file(
    module: AuditModule,
    status_line: str,
    *,
    allow_cross_module: bool,
) -> bool:
    if allow_cross_module or module.name == "root-tooling":
        return True
    path = status_line[3:].strip() if len(status_line) > 3 else status_line.strip()
    path = path.split(" -> ")[-1]
    return any(path == allowed or path.startswith(f"{allowed}/") for allowed in module.paths)


def run_module_fix(
    repo_root: Path,
    module: AuditModule,
    audit_text: str,
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None,
    allow_cross_module: bool,
    skip_deps: bool,
) -> ModuleFixResult:
    module_prefix = run_dir / module.name
    stdout_path = module_prefix.with_suffix(".stdout.jsonl")
    stderr_path = module_prefix.with_suffix(".stderr.log")
    final_path = module_prefix.with_suffix(".final.md")
    prompt_path = module_prefix.with_suffix(".prompt.md")

    prompt = build_fix_prompt(
        module=module,
        audit_text=audit_text,
        git_sha=git_sha(repo_root),
        allow_cross_module=allow_cross_module,
        skip_deps=skip_deps,
    )
    write_text(prompt_path, prompt)

    before_status = git_status(repo_root)
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
    write_text(stdout_path, stdout)
    write_text(stderr_path, stderr)

    final_message = ""
    if final_path.exists():
        final_message = final_path.read_text(encoding="utf-8").strip()
    if not final_message:
        final_message = stderr.strip() or stdout.strip() or "No final message captured."

    after_head = git_sha(repo_root)
    after_status = git_status(repo_root)
    changed_files = sorted(set(after_status) - set(before_status))
    verification_results: list[VerificationResult] = []

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
        final_message += "\n\nRunner stopped because files outside the module scope changed."
    elif status == "fixed":
        verification_results = run_verification(
            repo_root, verification_commands_for(module.name)
        )
        if command_status(verification_results) == "failed":
            status = "verification_failed"

    return ModuleFixResult(
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
    )


def render_verification(result: VerificationResult) -> list[str]:
    command = " ".join(result.argv)
    lines = [
        f"- `{result.label}`: return code `{result.returncode}`",
        f"  - Command: `{command}`",
    ]
    if result.stdout.strip():
        lines.append("  - Stdout:")
        lines.append("```")
        lines.append(result.stdout.strip()[-4000:])
        lines.append("```")
    if result.stderr.strip():
        lines.append("  - Stderr:")
        lines.append("```")
        lines.append(result.stderr.strip()[-4000:])
        lines.append("```")
    return lines


def render_fix_report(
    repo_root: Path,
    git_sha: str,
    results: Sequence[ModuleFixResult],
    started_at: str,
    finished_at: str,
    final_verification: Sequence[VerificationResult] | None = None,
) -> str:
    status_counts: dict[str, int] = {}
    for result in results:
        status_counts[result.status] = status_counts.get(result.status, 0) + 1
    summary = ", ".join(
        f"{count} {status}" for status, count in sorted(status_counts.items())
    )
    if not summary:
        summary = "No module fixes ran"

    lines = [
        "# QuickVoice Audit Fix Report",
        "",
        "## Executive Summary",
        "",
        f"- Repository: `{repo_root}`",
        f"- Starting commit: `{git_sha}`",
        f"- Started: `{started_at}`",
        f"- Finished: `{finished_at}`",
        f"- Module fix status: {summary}",
        "- Push status: not pushed",
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

    lines.extend(["", "## Fixes By Module", ""])
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
            "- Generated logs are stored under `.fix_runs/` and ignored by git.",
            "- A failed status means later modules were not attempted.",
            "",
        ]
    )
    return "\n".join(lines)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run sequential full-permission Codex fix sessions from audit findings."
    )
    parser.add_argument(
        "--module",
        action="append",
        dest="modules",
        help="Module to fix. Repeat for multiple modules. Defaults to all modules.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print selected modules, audit sources, commands, and verification without running Codex.",
    )
    parser.add_argument(
        "--timeout-minutes",
        type=int,
        default=90,
        help="Timeout for each module Codex session. Default: 90.",
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
        help="Directory for fix logs. Defaults to .fix_runs/<timestamp>.",
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
    return parser.parse_args(argv)


def print_dry_run(
    repo_root: Path,
    modules: Sequence[AuditModule],
    run_dir: Path,
    *,
    audit_run: Path | None,
    model: str | None,
    skip_deps: bool,
) -> None:
    print(f"Repo root: {repo_root}")
    print(f"Run dir: {run_dir}")
    print(f"Audit run: {audit_run or 'audit.md fallback'}")
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
        audit_source = (
            audit_run / f"{module.name}.final.md"
            if audit_run and (audit_run / f"{module.name}.final.md").exists()
            else repo_root / "audit.md"
        )
        print(f"\n[{module.name}] {module.title}")
        print(f"Audit source: {audit_source}")
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

    audit_run = find_latest_audit_run(repo_root, [module.name for module in modules])
    run_dir = (
        args.run_dir
        or repo_root
        / ".fix_runs"
        / utc_now().replace(":", "").replace("+00:00", "Z")
    ).resolve()

    if args.dry_run:
        print_dry_run(
            repo_root,
            modules,
            run_dir,
            audit_run=audit_run,
            model=args.model,
            skip_deps=args.skip_deps,
        )
        return 0

    try:
        require_git_repo(repo_root)
        for module in modules:
            load_audit_text(repo_root, module, audit_run)
    except (RuntimeError, FileNotFoundError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 2

    started_at = utc_now()
    starting_sha = git_sha(repo_root)
    run_dir.mkdir(parents=True, exist_ok=True)
    results: list[ModuleFixResult] = []
    final_verification: list[VerificationResult] | None = None

    print(f"Running {len(modules)} module fix session(s) in {repo_root}")
    print(f"Logs: {run_dir}")

    if not args.skip_deps:
        print("\n==> Setting up dependencies")
        dep_results = run_verification(repo_root, dependency_setup_commands())
        if command_status(dep_results) == "failed":
            finished_at = utc_now()
            report = render_fix_report(
                repo_root=repo_root,
                git_sha=starting_sha,
                results=[],
                started_at=started_at,
                finished_at=finished_at,
                final_verification=dep_results,
            )
            write_text(repo_root / "fix_report.md", report)
            print("Dependency setup failed; wrote fix_report.md", file=sys.stderr)
            return 1

    for module in modules:
        print(f"\n==> Fixing {module.name}: {module.title}")
        audit_text = load_audit_text(repo_root, module, audit_run)
        result = run_module_fix(
            repo_root=repo_root,
            module=module,
            audit_text=audit_text,
            run_dir=run_dir,
            timeout_minutes=args.timeout_minutes,
            model=args.model,
            allow_cross_module=args.allow_cross_module,
            skip_deps=args.skip_deps,
        )
        results.append(result)
        print(f"<== {module.name}: {result.status} in {result.duration_seconds:.1f}s")
        if result.status != "fixed":
            print("Stopping on first failed or unsafe module.", file=sys.stderr)
            break

    if results and all(result.status == "fixed" for result in results):
        print("\n==> Running final aggregate verification")
        final_verification = run_verification(repo_root, final_verification_commands())

    finished_at = utc_now()
    report = render_fix_report(
        repo_root=repo_root,
        git_sha=starting_sha,
        results=results,
        started_at=started_at,
        finished_at=finished_at,
        final_verification=final_verification,
    )
    write_text(repo_root / "fix_report.md", report)
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
            ],
            indent=2,
        )
        + "\n",
    )
    print("\nWrote fix_report.md")

    failed = any(result.status != "fixed" for result in results)
    if final_verification is not None:
        failed = failed or command_status(final_verification) == "failed"
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
