import contextlib
import io
import importlib.util
from pathlib import Path
import shutil
import sys
import tempfile
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = REPO_ROOT / "scripts" / "codex_viral_launch.py"


def load_runner():
    spec = importlib.util.spec_from_file_location("codex_viral_launch", RUNNER_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class CodexViralLaunchTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    def result(self, runner, pass_name="time-to-wow", status="completed"):
        return runner.ViralLaunchResult(
            pass_name=pass_name,
            title="Time to Wow",
            status=status,
            returncode=0 if status == "completed" else 1,
            duration_seconds=1.5,
            final_message="Updated launch copy.",
            stdout_path=Path(".viral_launch_runs/run/time-to-wow.stdout.jsonl"),
            stderr_path=Path(".viral_launch_runs/run/time-to-wow.stderr.log"),
            changed_files=[" M README.md"],
            verification_results=[
                runner.VerificationResult(
                    label="diff check",
                    argv=["git", "diff", "--check"],
                    returncode=0,
                    stdout="",
                    stderr="",
                )
            ],
        )

    def test_default_passes_match_viral_playbook_order(self):
        runner = load_runner()

        names = [launch_pass.name for launch_pass in runner.DEFAULT_LAUNCH_PASSES]

        self.assertEqual(
            names,
            [
                "time-to-wow",
                "launchpad-playbook",
                "narrative-positioning",
                "star-clipper",
                "launch-day-responsiveness",
            ],
        )

    def test_gitignore_excludes_viral_launch_run_logs(self):
        gitignore = (REPO_ROOT / ".gitignore").read_text(encoding="utf-8")

        self.assertIn(".viral_launch_runs/", gitignore)

    def test_build_codex_command_uses_full_permission_session(self):
        runner = load_runner()
        launch_pass = runner.select_passes(["time-to-wow"])[0]

        command = runner.build_codex_command(
            repo_root=REPO_ROOT,
            launch_pass=launch_pass,
            output_last_message=REPO_ROOT
            / ".viral_launch_runs"
            / "run"
            / "time-to-wow.final.md",
        )

        self.assertEqual(command[:2], ["codex", "exec"])
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", command)
        self.assertIn("--ephemeral", command)
        self.assertIn("--json", command)
        self.assertIn("--cd", command)
        self.assertIn(str(REPO_ROOT), command)
        self.assertIn("--output-last-message", command)

    def test_prompt_allows_marketing_and_product_ui_but_blocks_push_and_commit(self):
        runner = load_runner()
        launch_pass = runner.select_passes(["time-to-wow"])[0]

        prompt = runner.build_viral_launch_prompt(
            launch_pass=launch_pass,
            git_sha="abc123",
            allow_any_file=False,
        )

        self.assertIn("README.md", prompt)
        self.assertIn("docs/launch", prompt)
        self.assertIn("apps/web", prompt)
        self.assertIn("apps/console", prompt)
        self.assertIn("Do not push", prompt)
        self.assertIn("Do not commit", prompt)
        self.assertIn("Time to Wow", prompt)
        self.assertIn("abc123", prompt)

    def test_main_runs_git_pull_all_before_codex_sessions(self):
        runner = load_runner()
        calls = []

        def fake_require(repo_root):
            calls.append("require")

        def fake_pull(repo_root):
            calls.append("pull")
            return runner.VerificationResult(
                label="git pull --all",
                argv=["git", "pull", "--all"],
                returncode=0,
                stdout="Already up to date.",
                stderr="",
            )

        def fake_run_selected_passes(**kwargs):
            calls.append("run")
            return [self.result(runner)]

        original_require = runner.require_git_repo
        original_pull = runner.run_git_pull_all
        original_run = runner.run_selected_passes
        runner.require_git_repo = fake_require
        runner.run_git_pull_all = fake_pull
        runner.run_selected_passes = fake_run_selected_passes
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                exit_code = runner.main(
                    [
                        "--repo-root",
                        str(REPO_ROOT),
                        "--pass",
                        "time-to-wow",
                        "--run-dir",
                        str(self.temp_dir / "run"),
                        "--report-path",
                        str(self.temp_dir / "report.md"),
                    ]
                )
        finally:
            runner.require_git_repo = original_require
            runner.run_git_pull_all = original_pull
            runner.run_selected_passes = original_run

        self.assertEqual(exit_code, 0)
        self.assertEqual(calls, ["require", "pull", "run"])

    def test_skip_pull_avoids_git_pull_all(self):
        runner = load_runner()
        calls = []

        def fake_pull(repo_root):
            calls.append("pull")
            raise AssertionError("git pull --all should not run")

        def fake_run_selected_passes(**kwargs):
            calls.append("run")
            return [self.result(runner)]

        original_require = runner.require_git_repo
        original_pull = runner.run_git_pull_all
        original_run = runner.run_selected_passes
        runner.require_git_repo = lambda repo_root: None
        runner.run_git_pull_all = fake_pull
        runner.run_selected_passes = fake_run_selected_passes
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                exit_code = runner.main(
                    [
                        "--skip-pull",
                        "--repo-root",
                        str(REPO_ROOT),
                        "--pass",
                        "time-to-wow",
                        "--run-dir",
                        str(self.temp_dir / "run"),
                        "--report-path",
                        str(self.temp_dir / "report.md"),
                    ]
                )
        finally:
            runner.require_git_repo = original_require
            runner.run_git_pull_all = original_pull
            runner.run_selected_passes = original_run

        self.assertEqual(exit_code, 0)
        self.assertEqual(calls, ["run"])

    def test_run_selected_passes_stops_after_failed_pass(self):
        runner = load_runner()
        passes = runner.select_passes(["time-to-wow", "launchpad-playbook"])
        calls = []

        def fake_run_viral_pass(**kwargs):
            launch_pass = kwargs["launch_pass"]
            calls.append(launch_pass.name)
            return self.result(runner, launch_pass.name, status="failed")

        original = runner.run_viral_pass
        runner.run_viral_pass = fake_run_viral_pass
        try:
            results = runner.run_selected_passes(
                repo_root=REPO_ROOT,
                launch_passes=passes,
                run_dir=self.temp_dir / "run",
                timeout_minutes=1,
                model=None,
                allow_any_file=False,
            )
        finally:
            runner.run_viral_pass = original

        self.assertEqual(calls, ["time-to-wow"])
        self.assertEqual([result.status for result in results], ["failed"])

    def test_default_scope_allows_marketing_docs_and_product_ui_only(self):
        runner = load_runner()

        self.assertTrue(runner.changed_file_allowed(" M README.md", False))
        self.assertTrue(runner.changed_file_allowed("?? docs/launch/show-hn.md", False))
        self.assertTrue(
            runner.changed_file_allowed("?? .github/pull_request_template.md", False)
        )
        self.assertTrue(runner.changed_file_allowed(" M apps/web/src/app/page.tsx", False))
        self.assertTrue(
            runner.changed_file_allowed(" M apps/console/src/app/page.tsx", False)
        )
        self.assertFalse(runner.changed_file_allowed(" M apps/server/src/index.ts", False))
        self.assertTrue(runner.changed_file_allowed(" M apps/server/src/index.ts", True))

    def test_render_report_includes_status_logs_changes_and_verification(self):
        runner = load_runner()

        report = runner.render_viral_launch_report(
            repo_root=REPO_ROOT,
            git_sha="abc123",
            results=[self.result(runner)],
            started_at="2026-06-20T00:00:00Z",
            finished_at="2026-06-20T00:05:00Z",
            pull_result=runner.VerificationResult(
                label="git pull --all",
                argv=["git", "pull", "--all"],
                returncode=0,
                stdout="Already up to date.",
                stderr="",
            ),
        )

        self.assertIn("# QuickVoice Viral Launch Report", report)
        self.assertIn("time-to-wow", report)
        self.assertIn("completed", report)
        self.assertIn("README.md", report)
        self.assertIn(".viral_launch_runs/run/time-to-wow.stdout.jsonl", report)
        self.assertIn("git pull --all", report)
        self.assertIn("diff check", report)


if __name__ == "__main__":
    unittest.main()
