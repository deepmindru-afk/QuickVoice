#!/usr/bin/env python3
"""Run sequential Codex launch-polish sessions for QuickVoice.

The runner coordinates five full-permission Codex sessions, one for each viral
launch playbook pass. It starts with git pull --all by default, stops on the
first failed pass, captures logs, and refuses unsafe file changes unless the
operator explicitly allows any file.
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
    display_path,
    git_sha,
    git_status,
    require_git_repo,
    write_text,
)


@dataclass(frozen=True)
class ViralLaunchPass:
    name: str
    title: str
    playbook_point: str
    objective: str
    suggested_outputs: tuple[str, ...]


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
class ViralLaunchResult:
    pass_name: str
    title: str
    status: str
    returncode: int | None
    duration_seconds: float
    final_message: str
    stdout_path: Path
    stderr_path: Path
    changed_files: list[str]
    verification_results: list[VerificationResult]


DEFAULT_LAUNCH_PASSES: tuple[ViralLaunchPass, ...] = (
    ViralLaunchPass(
        name="time-to-wow",
        title="Time to Wow",
        playbook_point="Nail the Time to Wow",
        objective=(
            "Make a new GitHub visitor understand QuickVoice and see the value "
            "within 30 seconds."
        ),
        suggested_outputs=(
            "Tighten the README hook and opening flow.",
            "Add or improve demo/visual placement using existing assets or low-risk new docs.",
            "Keep quick start copy-paste friendly and one-command where possible.",
            "Improve first-impression web or console UI only when it directly helps TTW.",
        ),
    ),
    ViralLaunchPass(
        name="launchpad-playbook",
        title="Launchpad Playbook",
        playbook_point="Gamify the GitHub Trending Algorithm",
        objective=(
            "Create coordinated launch collateral that can drive concentrated "
            "traffic during a 24-to-48-hour launch window."
        ),
        suggested_outputs=(
            "Create docs/launch drafts for Show HN, Reddit, X/Twitter, and Product Hunt.",
            "Keep copy transparent, technical, and non-corporate.",
            "Include launch-day timing and response notes.",
        ),
    ),
    ViralLaunchPass(
        name="narrative-positioning",
        title="Narrative Positioning",
        playbook_point="Leverage the Us vs. Them Narrative",
        objective=(
            "Sharpen QuickVoice's underdog narrative without toxic competitor copy."
        ),
        suggested_outputs=(
            "Clarify the open-source Retell alternative position.",
            "Emphasize control, self-hosting, privacy, cost, and extensibility.",
            "Avoid unverifiable performance claims and punching down.",
        ),
    ),
    ViralLaunchPass(
        name="star-clipper",
        title="Star Clipper",
        playbook_point="Build a Star Clipper into the Project",
        objective=(
            "Add tasteful, non-intrusive GitHub star prompts and momentum signals."
        ),
        suggested_outputs=(
            "Add a README star-history or star CTA section.",
            "Add a subtle star reminder only in docs or setup output if appropriate.",
            "Do not add annoying prompts to production user workflows.",
        ),
    ),
    ViralLaunchPass(
        name="launch-day-responsiveness",
        title="Launch Day Responsiveness",
        playbook_point="Be Obsessively Responsive on Launch Day",
        objective=(
            "Prepare the repo to receive launch-day issues, PRs, and new contributors."
        ),
        suggested_outputs=(
            "Improve issue templates, PR template, or triage docs.",
            "Document good-first-issue criteria and response expectations.",
            "Improve CONTRIBUTING.md only where it helps first-time contributors.",
        ),
    ),
)


ALLOWED_EXACT_PATHS: tuple[str, ...] = (
    "README.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "SECURITY.md",
    "package.json",
    ".github/ISSUE_TEMPLATE.md",
    ".github/PULL_REQUEST_TEMPLATE.md",
    ".github/pull_request_template.md",
)

ALLOWED_PREFIXES: tuple[str, ...] = (
    "docs/launch/",
    "docs/",
    "assets/",
    ".github/ISSUE_TEMPLATE/",
    ".github/PULL_REQUEST_TEMPLATE/",
    "apps/web/",
    "apps/console/",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def select_passes(names: Sequence[str] | None = None) -> list[ViralLaunchPass]:
    if not names:
        return list(DEFAULT_LAUNCH_PASSES)

    by_name = {launch_pass.name: launch_pass for launch_pass in DEFAULT_LAUNCH_PASSES}
    selected: list[ViralLaunchPass] = []
    unknown: list[str] = []
    for name in names:
        launch_pass = by_name.get(name)
        if launch_pass is None:
            unknown.append(name)
        else:
            selected.append(launch_pass)

    if unknown:
        valid = ", ".join(launch_pass.name for launch_pass in DEFAULT_LAUNCH_PASSES)
        raise ValueError(f"Unknown pass(es): {', '.join(unknown)}. Valid passes: {valid}")
    return selected


def path_from_status(status_line: str) -> str:
    path = status_line[3:].strip() if len(status_line) > 3 else status_line.strip()
    return path.split(" -> ")[-1]


def changed_file_allowed(status_line: str, allow_any_file: bool) -> bool:
    if allow_any_file:
        return True
    path = path_from_status(status_line)
    if path in ALLOWED_EXACT_PATHS:
        return True
    return any(path.startswith(prefix) for prefix in ALLOWED_PREFIXES)


def run_command(repo_root: Path, command: VerificationCommand) -> VerificationResult:
    result = subprocess.run(
        command.argv,
        cwd=repo_root / command.cwd,
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


def run_git_pull_all(repo_root: Path) -> VerificationResult:
    return run_command(
        repo_root,
        VerificationCommand("git pull --all", ["git", "pull", "--all"]),
    )


def verification_commands_for_changes(
    changed_files: Sequence[str],
) -> list[VerificationCommand]:
    paths = [path_from_status(line) for line in changed_files]
    commands = [VerificationCommand("diff check", ["git", "diff", "--check"])]

    if any(path.startswith("apps/web/") for path in paths):
        commands.extend(
            [
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
            ]
        )

    if any(path.startswith("apps/console/") for path in paths):
        commands.extend(
            [
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
            ]
        )

    if any(
        path == "package.json"
        or path.startswith("scripts/")
        or path.startswith("tests/")
        or path.startswith(".github/workflows/")
        for path in paths
    ):
        commands.append(
            VerificationCommand(
                "root node tests", ["bash", "-lc", "node --test tests/*.test.mjs"]
            )
        )

    return commands


def build_codex_command(
    repo_root: Path,
    launch_pass: ViralLaunchPass,
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


def allowed_paths_text(allow_any_file: bool) -> str:
    if allow_any_file:
        return "You may edit any repository file needed for this launch pass."
    exact = "\n".join(f"- `{path}`" for path in ALLOWED_EXACT_PATHS)
    prefixes = "\n".join(f"- `{prefix}`" for prefix in ALLOWED_PREFIXES)
    return (
        "Only edit repository marketing, launch docs, GitHub community files, "
        "and product UI files in these locations.\n\nExact files:\n"
        f"{exact}\n\nDirectories/prefixes:\n{prefixes}"
    )


def build_viral_launch_prompt(
    *,
    launch_pass: ViralLaunchPass,
    git_sha: str,
    allow_any_file: bool,
) -> str:
    suggested_outputs = "\n".join(
        f"- {output}" for output in launch_pass.suggested_outputs
    )
    return f"""You are improving QuickVoice launch readiness.

Pass: {launch_pass.name}
Title: {launch_pass.title}
Playbook point: {launch_pass.playbook_point}
Repository commit at pass start: {git_sha}

Objective:
{launch_pass.objective}

Expected outputs:
{suggested_outputs}

Editable scope:
{allowed_paths_text(allow_any_file)}

Hard rules:
- Make concrete repository changes for this pass.
- Do not push.
- Do not commit.
- Do not rewrite unrelated code.
- Do not fabricate screenshots, metrics, benchmarks, customers, or claims.
- Do not add annoying star prompts to production user workflows.
- Prefer existing design and copy patterns.
- If a change requires live credentials, paid services, or a product decision, document it in your final message instead of guessing.
- Move to the next pass only by exiting successfully; the parent runner will start the next Codex session after this one finishes.

Return Markdown with:
## Summary
## Changes Made
## Deferred Or Unresolved
## Verification Run
"""


def status_delta(before_status: Sequence[str], after_status: Sequence[str]) -> list[str]:
    before = set(before_status)
    return sorted(line for line in after_status if line not in before)


def read_final_message(final_path: Path) -> str:
    if not final_path.exists():
        return ""
    return final_path.read_text(encoding="utf-8").strip()


def run_viral_pass(
    repo_root: Path,
    launch_pass: ViralLaunchPass,
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None,
    allow_any_file: bool,
) -> ViralLaunchResult:
    pass_prefix = run_dir / launch_pass.name
    stdout_path = pass_prefix.with_suffix(".stdout.jsonl")
    stderr_path = pass_prefix.with_suffix(".stderr.log")
    final_path = pass_prefix.with_suffix(".final.md")
    prompt_path = pass_prefix.with_suffix(".prompt.md")

    prompt = build_viral_launch_prompt(
        launch_pass=launch_pass,
        git_sha=git_sha(repo_root),
        allow_any_file=allow_any_file,
    )
    write_text(prompt_path, prompt)

    before_status = git_status(repo_root)
    before_head = git_sha(repo_root)
    command = build_codex_command(
        repo_root=repo_root,
        launch_pass=launch_pass,
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
    write_text(stdout_path, stdout)
    write_text(stderr_path, stderr)

    final_message = read_final_message(final_path)
    if not final_message:
        final_message = stderr.strip() or stdout.strip() or "No final message captured."

    after_head = git_sha(repo_root)
    after_status = git_status(repo_root)
    changed_files = status_delta(before_status, after_status)
    verification_results: list[VerificationResult] = []

    if after_head != before_head:
        status = "head_changed"
        final_message += "\n\nRunner stopped because the Codex session changed HEAD."
    elif any(not changed_file_allowed(line, allow_any_file) for line in changed_files):
        status = "unsafe_changes"
        final_message += (
            "\n\nRunner stopped because files outside the allowed launch scope changed."
        )
    elif status == "completed":
        verification_results = run_verification(
            repo_root, verification_commands_for_changes(changed_files)
        )
        if command_status(verification_results) == "failed":
            status = "verification_failed"

    return ViralLaunchResult(
        pass_name=launch_pass.name,
        title=launch_pass.title,
        status=status,
        returncode=returncode,
        duration_seconds=duration,
        final_message=final_message,
        stdout_path=display_path(stdout_path, repo_root),
        stderr_path=display_path(stderr_path, repo_root),
        changed_files=changed_files,
        verification_results=verification_results,
    )


def run_selected_passes(
    repo_root: Path,
    launch_passes: Sequence[ViralLaunchPass],
    run_dir: Path,
    *,
    timeout_minutes: int,
    model: str | None,
    allow_any_file: bool,
) -> list[ViralLaunchResult]:
    results: list[ViralLaunchResult] = []
    for launch_pass in launch_passes:
        result = run_viral_pass(
            repo_root=repo_root,
            launch_pass=launch_pass,
            run_dir=run_dir,
            timeout_minutes=timeout_minutes,
            model=model,
            allow_any_file=allow_any_file,
        )
        results.append(result)
        if result.status != "completed":
            break
    return results


def render_verification(result: VerificationResult) -> list[str]:
    lines = [
        f"- `{result.label}`: return code `{result.returncode}`",
        f"  - Command: `{' '.join(result.argv)}`",
    ]
    if result.stdout.strip():
        lines.extend(["  - Stdout:", "```", result.stdout.strip()[-4000:], "```"])
    if result.stderr.strip():
        lines.extend(["  - Stderr:", "```", result.stderr.strip()[-4000:], "```"])
    return lines


def render_viral_launch_report(
    repo_root: Path,
    git_sha: str,
    results: Sequence[ViralLaunchResult],
    started_at: str,
    finished_at: str,
    pull_result: VerificationResult | None,
) -> str:
    status_counts: dict[str, int] = {}
    for result in results:
        status_counts[result.status] = status_counts.get(result.status, 0) + 1
    summary = ", ".join(
        f"{count} {status}" for status, count in sorted(status_counts.items())
    )
    if not summary:
        summary = "No launch passes ran"

    lines = [
        "# QuickVoice Viral Launch Report",
        "",
        "## Executive Summary",
        "",
        f"- Repository: `{repo_root}`",
        f"- Starting commit: `{git_sha}`",
        f"- Started: `{started_at}`",
        f"- Finished: `{finished_at}`",
        f"- Pass status: {summary}",
        "- Push status: not pushed",
        "",
    ]

    if pull_result is not None:
        lines.extend(["## Initial Pull", ""])
        lines.extend(render_verification(pull_result))
        lines.append("")

    lines.extend(
        [
            "## Pass Status",
            "",
            "| Pass | Status | Return Code | Duration | Logs |",
            "| --- | --- | ---: | ---: | --- |",
        ]
    )
    for result in results:
        returncode = "" if result.returncode is None else str(result.returncode)
        lines.append(
            f"| `{result.pass_name}` | {result.status} | {returncode} | "
            f"{result.duration_seconds:.1f}s | `{result.stdout_path}`, `{result.stderr_path}` |"
        )

    lines.extend(["", "## Results By Pass", ""])
    for result in results:
        lines.extend(
            [
                f"### {result.pass_name}: {result.title}",
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

    lines.extend(
        [
            "## Appendix: Runner Notes",
            "",
            "- The runner never commits or pushes.",
            "- Generated logs are stored under `.viral_launch_runs/` and ignored by git.",
            "- A non-completed status stops later launch passes.",
            "",
        ]
    )
    return "\n".join(lines)


def results_json(results: Sequence[ViralLaunchResult]) -> str:
    payload = [
        {
            "pass_name": result.pass_name,
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
    ]
    return json.dumps(payload, indent=2) + "\n"


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run sequential full-permission Codex sessions for launch polish."
    )
    parser.add_argument(
        "--pass",
        action="append",
        dest="passes",
        help="Launch pass to run. Repeat for multiple passes. Defaults to all passes.",
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
        help="Directory for logs. Defaults to .viral_launch_runs/<timestamp>.",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=Path("viral_launch_report.md"),
        help="Markdown report path. Default: viral_launch_report.md.",
    )
    parser.add_argument(
        "--timeout-minutes",
        type=int,
        default=90,
        help="Timeout for each Codex session. Default: 90.",
    )
    parser.add_argument("--model", default=None, help="Optional Codex model override.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print selected passes and commands without pulling or running Codex.",
    )
    parser.add_argument(
        "--skip-pull",
        action="store_true",
        help="Skip the initial git pull --all.",
    )
    parser.add_argument(
        "--allow-any-file",
        action="store_true",
        help="Allow Codex sessions to change any repository file.",
    )
    return parser.parse_args(argv)


def resolve_path(repo_root: Path, path: Path) -> Path:
    return path.resolve() if path.is_absolute() else (repo_root / path).resolve()


def print_dry_run(
    repo_root: Path,
    launch_passes: Sequence[ViralLaunchPass],
    run_dir: Path,
    report_path: Path,
    *,
    model: str | None,
    allow_any_file: bool,
    skip_pull: bool,
) -> None:
    print(f"Repo root: {repo_root}")
    print(f"Run dir: {run_dir}")
    print(f"Report path: {report_path}")
    print(f"Initial pull: {'skipped' if skip_pull else 'git pull --all'}")
    print(f"Allow any file: {allow_any_file}")
    for launch_pass in launch_passes:
        final_path = run_dir / f"{launch_pass.name}.final.md"
        command = build_codex_command(
            repo_root=repo_root,
            launch_pass=launch_pass,
            output_last_message=final_path,
            model=model,
        )
        print(f"\n[{launch_pass.name}] {launch_pass.title}")
        print(f"Playbook point: {launch_pass.playbook_point}")
        print("Command: " + " ".join(command))


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    repo_root = args.repo_root.resolve()

    try:
        launch_passes = select_passes(args.passes)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.timeout_minutes < 1:
        print("--timeout-minutes must be at least 1", file=sys.stderr)
        return 2

    started_at = utc_now()
    stamp = started_at.replace(":", "").replace("+00:00", "Z")
    run_dir = resolve_path(
        repo_root, args.run_dir or Path(".viral_launch_runs") / stamp
    )
    report_path = resolve_path(repo_root, args.report_path)

    if args.dry_run:
        print_dry_run(
            repo_root=repo_root,
            launch_passes=launch_passes,
            run_dir=run_dir,
            report_path=report_path,
            model=args.model,
            allow_any_file=args.allow_any_file,
            skip_pull=args.skip_pull,
        )
        return 0

    try:
        require_git_repo(repo_root)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    starting_sha = git_sha(repo_root)
    run_dir.mkdir(parents=True, exist_ok=True)

    pull_result: VerificationResult | None = None
    if not args.skip_pull:
        print("Running git pull --all")
        pull_result = run_git_pull_all(repo_root)
        if pull_result.returncode != 0:
            finished_at = utc_now()
            report = render_viral_launch_report(
                repo_root=repo_root,
                git_sha=starting_sha,
                results=[],
                started_at=started_at,
                finished_at=finished_at,
                pull_result=pull_result,
            )
            write_text(report_path, report)
            print("git pull --all failed; stopping before Codex sessions.", file=sys.stderr)
            return 1

    print(f"Running {len(launch_passes)} viral launch pass(es) in {repo_root}")
    print(f"Logs: {run_dir}")
    results = run_selected_passes(
        repo_root=repo_root,
        launch_passes=launch_passes,
        run_dir=run_dir,
        timeout_minutes=args.timeout_minutes,
        model=args.model,
        allow_any_file=args.allow_any_file,
    )

    for result in results:
        print(f"{result.pass_name}: {result.status} in {result.duration_seconds:.1f}s")

    finished_at = utc_now()
    write_text(run_dir / "results.json", results_json(results))
    write_text(
        report_path,
        render_viral_launch_report(
            repo_root=repo_root,
            git_sha=starting_sha,
            results=results,
            started_at=started_at,
            finished_at=finished_at,
            pull_result=pull_result,
        ),
    )

    if len(results) != len(launch_passes) or any(
        result.status != "completed" for result in results
    ):
        print("Stopping because a launch pass did not complete.", file=sys.stderr)
        return 1

    print(f"Wrote launch report: {display_path(report_path, repo_root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
