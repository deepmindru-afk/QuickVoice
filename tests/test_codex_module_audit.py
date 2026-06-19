import importlib.util
from pathlib import Path
import sys
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = REPO_ROOT / "scripts" / "codex_module_audit.py"


def load_runner():
    spec = importlib.util.spec_from_file_location("codex_module_audit", RUNNER_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class CodexModuleAuditTests(unittest.TestCase):
    def test_select_modules_returns_requested_module_only(self):
        runner = load_runner()

        modules = runner.select_modules(["apps-console"])

        self.assertEqual([module.name for module in modules], ["apps-console"])
        self.assertIn("apps/console", modules[0].paths)

    def test_packages_config_scope_includes_workspace_consumers(self):
        runner = load_runner()

        module = runner.select_modules(["packages-config"])[0]

        self.assertIn("packages/eslint-config", module.paths)
        self.assertIn("packages/typescript-config", module.paths)
        self.assertIn("apps/web/eslint.config.mjs", module.paths)
        self.assertIn("apps/console/eslint.config.mjs", module.paths)
        self.assertIn("pnpm-lock.yaml", module.paths)

    def test_select_modules_rejects_unknown_module(self):
        runner = load_runner()

        with self.assertRaisesRegex(ValueError, "unknown-module"):
            runner.select_modules(["unknown-module"])

    def test_build_codex_command_uses_full_permission_ephemeral_json_session(self):
        runner = load_runner()
        module = runner.select_modules(["apps-ai"])[0]

        command = runner.build_codex_command(
            repo_root=REPO_ROOT,
            module=module,
            output_last_message=REPO_ROOT / ".audit_runs" / "run" / "apps-ai.final.md",
        )

        self.assertEqual(command[:2], ["codex", "exec"])
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", command)
        self.assertIn("--ephemeral", command)
        self.assertIn("--json", command)
        self.assertIn("--cd", command)
        self.assertIn(str(REPO_ROOT), command)
        self.assertIn("--output-last-message", command)

    def test_build_audit_prompt_forbids_edits_and_scopes_paths(self):
        runner = load_runner()
        module = runner.select_modules(["apps-web"])[0]

        prompt = runner.build_audit_prompt(module=module, git_sha="abc123")

        self.assertIn("apps-web", prompt)
        self.assertIn("apps/web", prompt)
        self.assertIn("Do not edit", prompt)
        self.assertIn("bugs", prompt)
        self.assertIn("UI/UX", prompt)
        self.assertIn("missing features", prompt)
        self.assertIn("new feature", prompt)
        self.assertIn("abc123", prompt)

    def test_render_audit_markdown_includes_failures_and_findings(self):
        runner = load_runner()
        result = runner.ModuleAuditResult(
            module="apps-server",
            title="API server",
            status="failed",
            returncode=1,
            duration_seconds=12.5,
            final_message="Found auth scoping issue.",
            stdout_path=Path(".audit_runs/run/apps-server.stdout.jsonl"),
            stderr_path=Path(".audit_runs/run/apps-server.stderr.log"),
            changed_files=["apps/server/src/index.ts"],
        )

        markdown = runner.render_audit_markdown(
            repo_root=REPO_ROOT,
            git_sha="abc123",
            results=[result],
            started_at="2026-06-19T00:00:00Z",
            finished_at="2026-06-19T00:05:00Z",
        )

        self.assertIn("# QuickVoice Audit", markdown)
        self.assertIn("abc123", markdown)
        self.assertIn("apps-server", markdown)
        self.assertIn("failed", markdown)
        self.assertIn("Found auth scoping issue.", markdown)
        self.assertIn("apps/server/src/index.ts", markdown)


if __name__ == "__main__":
    unittest.main()
