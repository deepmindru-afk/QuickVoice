import contextlib
import importlib.util
import io
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = REPO_ROOT / "scripts" / "codex_ui_ux_fix.py"


def load_runner():
    spec = importlib.util.spec_from_file_location("codex_ui_ux_fix", RUNNER_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class CodexUiUxFixTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    def complete_fix_report(self):
        headings = [
            "## Summary",
            "## Fixed UI/UX Findings",
            "## Deferred Or Unresolved",
            "## Files Changed",
            "## Verification Run",
        ]
        return "\n\n".join(f"{heading}\n\nContent for {heading}." for heading in headings)

    def test_build_codex_command_uses_full_permission_session(self):
        runner = load_runner()
        module = runner.select_modules(["apps-console"])[0]

        command = runner.build_codex_command(
            repo_root=REPO_ROOT,
            module=module,
            output_last_message=REPO_ROOT
            / ".ui_ux_fix_runs"
            / "run"
            / "apps-console.final.md",
        )

        self.assertEqual(command[:2], ["codex", "exec"])
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", command)
        self.assertIn("--ephemeral", command)
        self.assertIn("--json", command)
        self.assertIn("--cd", command)
        self.assertIn(str(REPO_ROOT), command)
        self.assertIn("--output-last-message", command)

    def test_find_latest_ui_ux_audit_run_prefers_run_with_module_files(self):
        runner = load_runner()
        older = self.temp_dir / ".ui_ux_audit_runs" / "2026-01-01T000000Z"
        newer = self.temp_dir / ".ui_ux_audit_runs" / "2026-02-01T000000Z"
        older.mkdir(parents=True)
        newer.mkdir(parents=True)
        (older / "apps-web.final.md").write_text("old", encoding="utf-8")
        (newer / "apps-web.final.md").write_text("new", encoding="utf-8")

        latest = runner.find_latest_ui_ux_audit_run(self.temp_dir, ["apps-web"])

        self.assertEqual(latest, newer)

    def test_load_ui_ux_audit_text_falls_back_to_aggregated_report_section(self):
        runner = load_runner()
        module = runner.select_modules(["apps-web"])[0]
        audit_path = self.temp_dir / "ui_ux_audit.md"
        audit_path.write_text(
            """
### apps-web: Marketing website and public UX

## Summary
web findings

### apps-console: Authenticated console UX and frontend logic

## Summary
console findings
""",
            encoding="utf-8",
        )

        audit_text = runner.load_ui_ux_audit_text(
            repo_root=self.temp_dir,
            module=module,
            audit_path=audit_path,
        )

        self.assertIn("web findings", audit_text)
        self.assertNotIn("console findings", audit_text)

    def test_build_fix_prompt_contains_ui_ux_rules_scope_and_required_headings(self):
        runner = load_runner()
        module = runner.select_modules(["apps-web"])[0]

        prompt = runner.build_ui_ux_fix_prompt(
            module=module,
            audit_text="## Top UX Risks\n- Fake success message",
            git_sha="abc123",
            allow_cross_module=False,
            skip_deps=False,
            allow_no_changes=False,
        )

        self.assertIn("apps-web", prompt)
        self.assertIn("apps/web", prompt)
        self.assertIn("Fix UI/UX findings one at a time", prompt)
        self.assertIn("Do not push", prompt)
        self.assertIn("Do not commit", prompt)
        self.assertIn("## Fixed UI/UX Findings", prompt)
        self.assertIn("## Verification Run", prompt)
        self.assertIn("Fake success message", prompt)
        self.assertIn("abc123", prompt)

    def test_missing_required_headings_reports_exact_gaps(self):
        runner = load_runner()

        missing = runner.missing_required_headings("## Summary\n")

        self.assertNotIn("## Summary", missing)
        self.assertIn("## Fixed UI/UX Findings", missing)
        self.assertIn("## Verification Run", missing)

    def test_dry_run_prints_sources_command_verification_and_report_path(self):
        runner = load_runner()
        audit_path = self.temp_dir / "ui_ux_audit.md"
        audit_path.write_text(
            "### apps-web: Marketing website and public UX\n\n## Summary\nfindings\n",
            encoding="utf-8",
        )
        report_path = self.temp_dir / "ui_ux_fix_report.md"
        run_dir = self.temp_dir / ".ui_ux_fix_runs" / "dry-run"

        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            exit_code = runner.main(
                [
                    "--dry-run",
                    "--repo-root",
                    str(REPO_ROOT),
                    "--module",
                    "apps-web",
                    "--audit-path",
                    str(audit_path),
                    "--report-path",
                    str(report_path),
                    "--run-dir",
                    str(run_dir),
                ]
            )

        output = buffer.getvalue()
        self.assertEqual(exit_code, 0)
        self.assertIn("apps-web", output)
        self.assertIn(str(audit_path.resolve()), output)
        self.assertIn(str(report_path.resolve()), output)
        self.assertIn(str(run_dir.resolve() / "apps-web.final.md"), output)
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", output)
        self.assertIn("Verification:", output)

    def test_run_selected_modules_stops_after_failed_module(self):
        runner = load_runner()
        modules = runner.select_modules(["apps-web", "apps-console"])
        audit_path = self.temp_dir / "ui_ux_audit.md"
        audit_path.write_text(
            """
### apps-web: Marketing website and public UX

## Summary
web findings

### apps-console: Authenticated console UX and frontend logic

## Summary
console findings
""",
            encoding="utf-8",
        )
        calls = []

        def fake_run_module_ui_ux_fix(**kwargs):
            module = kwargs["module"]
            calls.append(module.name)
            return runner.ModuleUiUxFixResult(
                module=module.name,
                title=module.title,
                status="failed",
                returncode=1,
                duration_seconds=0.5,
                final_message="failed",
                stdout_path=Path("stdout"),
                stderr_path=Path("stderr"),
                changed_files=[],
                verification_results=[],
                missing_headings=[],
            )

        original = runner.run_module_ui_ux_fix
        runner.run_module_ui_ux_fix = fake_run_module_ui_ux_fix
        try:
            results = runner.run_selected_modules(
                repo_root=REPO_ROOT,
                modules=modules,
                run_dir=self.temp_dir / "run",
                timeout_minutes=1,
                model=None,
                allow_cross_module=False,
                skip_deps=True,
                allow_no_changes=False,
                audit_run=None,
                audit_path=audit_path,
            )
        finally:
            runner.run_module_ui_ux_fix = original

        self.assertEqual(calls, ["apps-web"])
        self.assertEqual([result.status for result in results], ["failed"])

    def test_dirty_snapshot_detects_existing_dirty_file_content_change(self):
        runner = load_runner()
        target = self.temp_dir / "README.md"
        target.write_text("before", encoding="utf-8")

        before = runner.snapshot_from_status(self.temp_dir, [" M README.md"])
        target.write_text("after", encoding="utf-8")
        after = runner.snapshot_from_status(self.temp_dir, [" M README.md"])

        changed = runner.changed_files_between(
            before, after, repo_root=self.temp_dir, ignored_roots=[]
        )

        self.assertEqual(changed, [" M README.md"])

    def test_run_module_reports_unsafe_when_existing_dirty_file_is_modified(self):
        runner = load_runner()
        module = runner.select_modules(["apps-web"])[0]
        readme = self.temp_dir / "README.md"
        readme.write_text("before", encoding="utf-8")

        def fake_git_status(repo_root):
            return [" M README.md"]

        def fake_git_sha(repo_root):
            return "abc123"

        def fake_subprocess_run(command, **kwargs):
            output_path = Path(command[command.index("--output-last-message") + 1])
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(self.complete_fix_report(), encoding="utf-8")
            readme.write_text("after", encoding="utf-8")
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")

        original_status = runner.git_status
        original_sha = runner.git_sha
        original_run = runner.subprocess.run
        runner.git_status = fake_git_status
        runner.git_sha = fake_git_sha
        runner.subprocess.run = fake_subprocess_run
        try:
            result = runner.run_module_ui_ux_fix(
                repo_root=self.temp_dir,
                module=module,
                audit_text="## Top UX Risks\n- Fix homepage.",
                run_dir=self.temp_dir / ".ui_ux_fix_runs" / "run",
                timeout_minutes=1,
                model=None,
                allow_cross_module=False,
                skip_deps=True,
                allow_no_changes=False,
            )
        finally:
            runner.git_status = original_status
            runner.git_sha = original_sha
            runner.subprocess.run = original_run

        self.assertEqual(result.status, "unsafe_changes")
        self.assertEqual(result.changed_files, [" M README.md"])
        self.assertIn("outside the module scope", result.final_message)

    def test_no_changed_files_returns_no_changes_by_default(self):
        runner = load_runner()
        module = runner.select_modules(["apps-web"])[0]

        def fake_git_status(repo_root):
            return []

        def fake_git_sha(repo_root):
            return "abc123"

        def fake_subprocess_run(command, **kwargs):
            output_path = Path(command[command.index("--output-last-message") + 1])
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(self.complete_fix_report(), encoding="utf-8")
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")

        original_status = runner.git_status
        original_sha = runner.git_sha
        original_run = runner.subprocess.run
        runner.git_status = fake_git_status
        runner.git_sha = fake_git_sha
        runner.subprocess.run = fake_subprocess_run
        try:
            result = runner.run_module_ui_ux_fix(
                repo_root=self.temp_dir,
                module=module,
                audit_text="## Top UX Risks\n- Nothing to change.",
                run_dir=self.temp_dir / ".ui_ux_fix_runs" / "run",
                timeout_minutes=1,
                model=None,
                allow_cross_module=False,
                skip_deps=True,
                allow_no_changes=False,
            )
        finally:
            runner.git_status = original_status
            runner.git_sha = original_sha
            runner.subprocess.run = original_run

        self.assertEqual(result.status, "no_changes")
        self.assertIn("No repository changes were detected", result.final_message)

    def test_verification_failure_blocks_next_module(self):
        runner = load_runner()
        module = runner.select_modules(["apps-web"])[0]
        scoped_file = self.temp_dir / "apps" / "web" / "src" / "app" / "page.tsx"
        scoped_file.parent.mkdir(parents=True)
        scoped_file.write_text("before", encoding="utf-8")

        status_calls = iter([[], [" M apps/web/src/app/page.tsx"]])

        def fake_git_status(repo_root):
            return next(status_calls)

        def fake_git_sha(repo_root):
            return "abc123"

        def fake_subprocess_run(command, **kwargs):
            output_path = Path(command[command.index("--output-last-message") + 1])
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(self.complete_fix_report(), encoding="utf-8")
            scoped_file.write_text("after", encoding="utf-8")
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")

        def fake_run_verification(repo_root, commands):
            return [
                runner.VerificationResult(
                    label="web lint",
                    argv=["pnpm", "--filter", "web", "lint"],
                    returncode=1,
                    stdout="",
                    stderr="lint failed",
                )
            ]

        original_status = runner.git_status
        original_sha = runner.git_sha
        original_run = runner.subprocess.run
        original_verification = runner.run_verification
        runner.git_status = fake_git_status
        runner.git_sha = fake_git_sha
        runner.subprocess.run = fake_subprocess_run
        runner.run_verification = fake_run_verification
        try:
            result = runner.run_module_ui_ux_fix(
                repo_root=self.temp_dir,
                module=module,
                audit_text="## Top UX Risks\n- Fix homepage.",
                run_dir=self.temp_dir / ".ui_ux_fix_runs" / "run",
                timeout_minutes=1,
                model=None,
                allow_cross_module=False,
                skip_deps=True,
                allow_no_changes=False,
            )
        finally:
            runner.git_status = original_status
            runner.git_sha = original_sha
            runner.subprocess.run = original_run
            runner.run_verification = original_verification

        self.assertEqual(result.status, "verification_failed")
        self.assertEqual(result.changed_files, [" M apps/web/src/app/page.tsx"])
        self.assertEqual(result.verification_results[0].returncode, 1)


if __name__ == "__main__":
    unittest.main()
