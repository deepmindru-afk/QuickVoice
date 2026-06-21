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
RUNNER_PATH = REPO_ROOT / "scripts" / "codex_ui_ux_audit.py"


def load_runner():
    spec = importlib.util.spec_from_file_location("codex_ui_ux_audit", RUNNER_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class CodexUiUxAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    def complete_audit(self):
        headings = [
            "## Summary",
            *load_runner().REQUIRED_UI_UX_AUDIT_HEADINGS,
        ]
        return "\n\n".join(f"{heading}\n\nContent for {heading}." for heading in headings)

    def result(
        self,
        runner,
        *,
        module="apps-web",
        title="Marketing website and public UX",
        status="completed",
        final_message=None,
    ):
        return runner.ModuleUiUxAuditResult(
            module=module,
            title=title,
            status=status,
            returncode=0,
            duration_seconds=1.25,
            final_message=final_message or self.complete_audit(),
            stdout_path=Path(".ui_ux_audit_runs/run/apps-web.stdout.jsonl"),
            stderr_path=Path(".ui_ux_audit_runs/run/apps-web.stderr.log"),
            changed_files=[],
            missing_headings=[],
        )

    def test_required_headings_match_ui_ux_audit_contract(self):
        runner = load_runner()

        self.assertEqual(
            runner.REQUIRED_UI_UX_AUDIT_HEADINGS,
            (
                "## Top UX Risks",
                "## Navigation And Information Architecture",
                "## Usability And Ease Of Use",
                "## Visual Design, Colors, And Theme Modernization",
                "## Accessibility And Responsive Behavior",
                "## Empty, Loading, Error, And Edge States",
                "## Module-Specific Recommendations",
                "## Evidence And Files Reviewed",
                "## Blocked Or Unverified",
            ),
        )

    def test_build_codex_command_uses_full_permission_session(self):
        runner = load_runner()
        module = runner.select_modules(["apps-ai"])[0]

        command = runner.build_codex_command(
            repo_root=REPO_ROOT,
            module=module,
            output_last_message=REPO_ROOT
            / ".ui_ux_audit_runs"
            / "run"
            / "apps-ai.final.md",
        )

        self.assertEqual(command[:2], ["codex", "exec"])
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", command)
        self.assertIn("--ephemeral", command)
        self.assertIn("--json", command)
        self.assertIn("--cd", command)
        self.assertIn(str(REPO_ROOT), command)
        self.assertIn("--output-last-message", command)

    def test_build_prompt_contains_read_only_rules_scope_and_ui_ux_focus(self):
        runner = load_runner()
        module = runner.select_modules(["apps-console"])[0]

        prompt = runner.build_ui_ux_audit_prompt(module, git_sha="abc123")

        self.assertIn("apps-console", prompt)
        self.assertIn("apps/console", prompt)
        self.assertIn("Do not edit", prompt)
        self.assertIn("Do not create", prompt)
        self.assertIn("audit-only", prompt)
        self.assertIn("usability and ease of use", prompt)
        self.assertIn("navigation and information architecture", prompt)
        self.assertIn("colors", prompt)
        self.assertIn("theme modernization", prompt)
        self.assertIn("accessibility", prompt)
        self.assertIn("responsive", prompt)
        self.assertIn("developer/operator UX", prompt)
        self.assertIn("## Visual Design, Colors, And Theme Modernization", prompt)
        self.assertIn("abc123", prompt)

    def test_missing_required_headings_reports_exact_gaps(self):
        runner = load_runner()

        missing = runner.missing_required_headings("## Summary\n")

        self.assertNotIn("## Summary", missing)
        self.assertIn("## Top UX Risks", missing)
        self.assertIn("## Module-Specific Recommendations", missing)

    def test_dry_run_prints_selected_modules_report_path_and_command(self):
        runner = load_runner()
        report_path = self.temp_dir / "ui_ux_audit.md"
        run_dir = self.temp_dir / ".ui_ux_audit_runs" / "dry-run"

        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            exit_code = runner.main(
                [
                    "--dry-run",
                    "--repo-root",
                    str(REPO_ROOT),
                    "--module",
                    "apps-web",
                    "--report-path",
                    str(report_path),
                    "--run-dir",
                    str(run_dir),
                ]
            )

        output = buffer.getvalue()
        self.assertEqual(exit_code, 0)
        self.assertIn("apps-web", output)
        self.assertIn(str(report_path.resolve()), output)
        self.assertIn(str(run_dir.resolve() / "apps-web.final.md"), output)
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", output)

    def test_run_selected_modules_stops_after_invalid_module(self):
        runner = load_runner()
        modules = runner.select_modules(["apps-web", "apps-console"])
        calls = []

        def fake_run_module_ui_ux_audit(**kwargs):
            module = kwargs["module"]
            calls.append(module.name)
            return runner.ModuleUiUxAuditResult(
                module=module.name,
                title=module.title,
                status="invalid_report",
                returncode=0,
                duration_seconds=0.5,
                final_message="missing headings",
                stdout_path=Path("stdout"),
                stderr_path=Path("stderr"),
                changed_files=[],
                missing_headings=["## Top UX Risks"],
            )

        original = runner.run_module_ui_ux_audit
        runner.run_module_ui_ux_audit = fake_run_module_ui_ux_audit
        try:
            results = runner.run_selected_modules(
                repo_root=REPO_ROOT,
                modules=modules,
                run_dir=self.temp_dir / "run",
                timeout_minutes=1,
                model=None,
            )
        finally:
            runner.run_module_ui_ux_audit = original

        self.assertEqual(calls, ["apps-web"])
        self.assertEqual([result.status for result in results], ["invalid_report"])

    def test_child_file_mutation_returns_unsafe_changes(self):
        runner = load_runner()
        module = runner.select_modules(["apps-web"])[0]

        status_calls = iter([[], [" M README.md"]])

        def fake_git_status(repo_root):
            return next(status_calls)

        def fake_git_sha(repo_root):
            return "abc123"

        def fake_subprocess_run(command, **kwargs):
            output_path = Path(command[command.index("--output-last-message") + 1])
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(self.complete_audit(), encoding="utf-8")
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")

        original_status = runner.git_status
        original_sha = runner.git_sha
        original_run = runner.subprocess.run
        runner.git_status = fake_git_status
        runner.git_sha = fake_git_sha
        runner.subprocess.run = fake_subprocess_run
        try:
            result = runner.run_module_ui_ux_audit(
                repo_root=REPO_ROOT,
                module=module,
                run_dir=self.temp_dir / "run",
                timeout_minutes=1,
                model=None,
            )
        finally:
            runner.git_status = original_status
            runner.git_sha = original_sha
            runner.subprocess.run = original_run

        self.assertEqual(result.status, "unsafe_changes")
        self.assertEqual(result.changed_files, [" M README.md"])
        self.assertIn("changed tracked files", result.final_message)

    def test_render_report_includes_partial_status_logs_and_module_content(self):
        runner = load_runner()
        result = self.result(
            runner,
            status="invalid_report",
            final_message="Audit stopped because headings were missing.",
        )

        report = runner.render_ui_ux_audit_markdown(
            repo_root=REPO_ROOT,
            modules=runner.select_modules(["apps-web", "apps-console"]),
            results=[result],
            git_sha="abc123",
            started_at="2026-06-20T00:00:00+00:00",
            finished_at="2026-06-20T00:05:00+00:00",
        )

        self.assertIn("# QuickVoice UI/UX Audit", report)
        self.assertIn("abc123", report)
        self.assertIn("apps-web", report)
        self.assertIn("apps-console", report)
        self.assertIn("not_run", report)
        self.assertIn("invalid_report", report)
        self.assertIn(".ui_ux_audit_runs/run/apps-web.stdout.jsonl", report)
        self.assertIn("Audit stopped because headings were missing.", report)

    def test_results_json_includes_missing_headings_and_logs(self):
        runner = load_runner()
        result = self.result(runner, status="invalid_report")

        payload = runner.results_json([result])

        self.assertIn('"status": "invalid_report"', payload)
        self.assertIn('"missing_headings": []', payload)
        self.assertIn(".ui_ux_audit_runs/run/apps-web.stderr.log", payload)

    def test_gitignore_ignores_ui_ux_audit_runs(self):
        gitignore = (REPO_ROOT / ".gitignore").read_text(encoding="utf-8")

        self.assertIn(".ui_ux_audit_runs/", gitignore)


if __name__ == "__main__":
    unittest.main()
