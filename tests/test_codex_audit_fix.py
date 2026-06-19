import importlib.util
from pathlib import Path
import shutil
import sys
import tempfile
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = REPO_ROOT / "scripts" / "codex_audit_fix.py"


def load_runner():
    spec = importlib.util.spec_from_file_location("codex_audit_fix", RUNNER_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class CodexAuditFixTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    def test_find_latest_audit_run_prefers_run_with_module_files(self):
        runner = load_runner()
        older = self.temp_dir / ".audit_runs" / "2026-01-01T000000Z"
        newer = self.temp_dir / ".audit_runs" / "2026-02-01T000000Z"
        older.mkdir(parents=True)
        newer.mkdir(parents=True)
        (older / "apps-web.final.md").write_text("old", encoding="utf-8")
        (newer / "apps-web.final.md").write_text("new", encoding="utf-8")

        latest = runner.find_latest_audit_run(self.temp_dir, ["apps-web"])

        self.assertEqual(latest, newer)

    def test_extract_module_section_from_audit(self):
        runner = load_runner()
        audit = """
### apps-web: Marketing website and public UX

## Summary
web findings

### apps-console: Authenticated console UX and frontend logic

## Summary
console findings
"""

        section = runner.extract_module_section(audit, "apps-web")

        self.assertIn("web findings", section)
        self.assertNotIn("console findings", section)

    def test_build_codex_command_uses_full_permission_session(self):
        runner = load_runner()
        module = runner.select_modules(["apps-server"])[0]

        command = runner.build_codex_command(
            repo_root=REPO_ROOT,
            module=module,
            output_last_message=REPO_ROOT / ".fix_runs" / "run" / "apps-server.final.md",
        )

        self.assertEqual(command[:2], ["codex", "exec"])
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", command)
        self.assertIn("--ephemeral", command)
        self.assertIn("--json", command)
        self.assertIn("--cd", command)
        self.assertIn(str(REPO_ROOT), command)
        self.assertIn("--output-last-message", command)

    def test_build_fix_prompt_includes_all_actionable_and_push_guards(self):
        runner = load_runner()
        module = runner.select_modules(["apps-ai"])[0]

        prompt = runner.build_fix_prompt(
            module=module,
            audit_text="## Critical/High Findings\n- SSRF issue",
            git_sha="abc123",
            allow_cross_module=False,
            skip_deps=False,
        )

        self.assertIn("all actionable findings", prompt)
        self.assertIn("Do not push", prompt)
        self.assertIn("Do not commit", prompt)
        self.assertIn("SSRF issue", prompt)
        self.assertIn("apps/ai", prompt)
        self.assertIn("abc123", prompt)

    def test_verification_commands_exist_for_each_module(self):
        runner = load_runner()

        for module in runner.select_modules(None):
            commands = runner.verification_commands_for(module.name)
            self.assertGreater(len(commands), 0, module.name)
            self.assertTrue(all(command.label for command in commands))
            self.assertTrue(all(command.argv for command in commands))

    def test_server_prisma_validation_uses_database_url_fallback(self):
        runner = load_runner()

        commands = runner.verification_commands_for("apps-server")
        prisma_command = next(
            command for command in commands if command.label == "prisma validate"
        )
        command_text = " ".join(prisma_command.argv)

        self.assertIn(
            "DATABASE_URL=${DATABASE_URL:-postgresql://user:pass@localhost:5432/quickvoice}",
            command_text,
        )
        self.assertIn("prisma validate", command_text)

    def test_packages_config_allows_consumer_config_changes(self):
        runner = load_runner()
        module = runner.select_modules(["packages-config"])[0]

        self.assertTrue(
            runner.module_allows_changed_file(
                module,
                " M apps/web/eslint.config.mjs",
                allow_cross_module=False,
            )
        )
        self.assertTrue(
            runner.module_allows_changed_file(
                module,
                " M apps/console/eslint.config.mjs",
                allow_cross_module=False,
            )
        )
        self.assertTrue(
            runner.module_allows_changed_file(
                module,
                " M pnpm-lock.yaml",
                allow_cross_module=False,
            )
        )

    def test_render_fix_report_includes_verification_results(self):
        runner = load_runner()
        result = runner.ModuleFixResult(
            module="apps-web",
            title="Marketing website and public UX",
            status="verification_failed",
            returncode=0,
            duration_seconds=3.5,
            final_message="Fixed links.",
            stdout_path=Path(".fix_runs/run/apps-web.stdout.jsonl"),
            stderr_path=Path(".fix_runs/run/apps-web.stderr.log"),
            changed_files=["apps/web/src/app/page.tsx"],
            verification_results=[
                runner.VerificationResult(
                    label="web lint",
                    argv=["pnpm", "--filter", "web", "lint"],
                    returncode=1,
                    stdout="",
                    stderr="lint failed",
                )
            ],
        )

        report = runner.render_fix_report(
            repo_root=REPO_ROOT,
            git_sha="abc123",
            results=[result],
            started_at="2026-06-19T00:00:00Z",
            finished_at="2026-06-19T00:05:00Z",
        )

        self.assertIn("# QuickVoice Audit Fix Report", report)
        self.assertIn("apps-web", report)
        self.assertIn("verification_failed", report)
        self.assertIn("web lint", report)
        self.assertIn("apps/web/src/app/page.tsx", report)


if __name__ == "__main__":
    unittest.main()
