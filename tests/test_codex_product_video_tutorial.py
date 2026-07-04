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
RUNNER_PATH = REPO_ROOT / "scripts" / "codex_product_video_tutorial.py"


def load_runner():
    spec = importlib.util.spec_from_file_location(
        "codex_product_video_tutorial", RUNNER_PATH
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class CodexProductVideoTutorialTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    def complete_tutorial(self, title="Agent Builder"):
        headings = [
            f"# {title} Video Tutorial",
            *load_runner().REQUIRED_TUTORIAL_HEADINGS,
        ]
        return "\n\n".join(f"{heading}\n\nContent for {heading}." for heading in headings)

    def result(
        self,
        runner,
        *,
        module="agents",
        title="Agent Builder",
        status="completed",
        final_message=None,
    ):
        return runner.ModuleTutorialResult(
            module=module,
            title=title,
            status=status,
            returncode=0,
            duration_seconds=1.25,
            final_message=final_message or self.complete_tutorial(title),
            tutorial_path=None,
            stdout_path=Path(".video_tutorial_runs/run/agents.stdout.jsonl"),
            stderr_path=Path(".video_tutorial_runs/run/agents.stderr.log"),
            changed_files=[],
            missing_headings=[],
        )

    def test_build_codex_command_uses_codex1_full_permission_session(self):
        runner = load_runner()
        module = runner.select_product_modules(["agents"])[0]

        command = runner.build_codex_command(
            repo_root=REPO_ROOT,
            module=module,
            output_last_message=REPO_ROOT
            / ".video_tutorial_runs"
            / "run"
            / "agents.final.md",
        )

        self.assertEqual(command[:2], ["codex", "exec"])
        self.assertIn("--model", command)
        self.assertEqual(command[command.index("--model") + 1], "codex1")
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", command)
        self.assertIn("--ephemeral", command)
        self.assertIn("--json", command)
        self.assertIn("--cd", command)
        self.assertIn(str(REPO_ROOT), command)
        self.assertIn("--output-last-message", command)

    def test_build_codex_command_allows_model_override(self):
        runner = load_runner()
        module = runner.select_product_modules(["agents"])[0]

        command = runner.build_codex_command(
            repo_root=REPO_ROOT,
            module=module,
            output_last_message=REPO_ROOT
            / ".video_tutorial_runs"
            / "run"
            / "agents.final.md",
            model="codex-custom",
        )

        self.assertEqual(command[command.index("--model") + 1], "codex-custom")

    def test_build_prompt_contains_business_user_video_requirements(self):
        runner = load_runner()
        module = runner.select_product_modules(["outbound"])[0]

        prompt = runner.build_video_tutorial_prompt(module, git_sha="abc123")

        self.assertIn("outbound", prompt)
        self.assertIn("business user", prompt.lower())
        self.assertIn("video tutorial", prompt.lower())
        self.assertIn("scene-by-scene", prompt.lower())
        self.assertIn("voiceover", prompt.lower())
        self.assertIn("captions", prompt.lower())
        self.assertIn("demo data", prompt.lower())
        self.assertIn("Do not edit", prompt)
        self.assertIn("No invented customers", prompt)
        self.assertIn("Quick outbound call", prompt)
        self.assertIn("## Scene-By-Scene Storyboard", prompt)
        self.assertIn("## Recording Checklist", prompt)
        self.assertIn("abc123", prompt)

    def test_missing_required_headings_reports_exact_gaps(self):
        runner = load_runner()
        module = runner.select_product_modules(["dashboard"])[0]

        missing = runner.missing_required_headings(module, "## Tutorial Arc\n")

        self.assertIn("# Dashboard And Performance Review Video Tutorial", missing)
        self.assertIn("## Audience And Outcome", missing)
        self.assertIn("## Recording Checklist", missing)
        self.assertNotIn("## Tutorial Arc", missing)

    def test_dry_run_prints_selected_modules_and_output_paths(self):
        runner = load_runner()
        output_dir = self.temp_dir / "video-tutorials"
        run_dir = self.temp_dir / ".video_tutorial_runs" / "dry-run"

        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            exit_code = runner.main(
                [
                    "--dry-run",
                    "--repo-root",
                    str(REPO_ROOT),
                    "--module",
                    "agents",
                    "--output-dir",
                    str(output_dir),
                    "--run-dir",
                    str(run_dir),
                ]
            )

        output = buffer.getvalue()
        self.assertEqual(exit_code, 0)
        self.assertIn("agents", output)
        self.assertIn(str(output_dir.resolve() / "agents.md"), output)
        self.assertIn(str(run_dir.resolve() / "agents.final.md"), output)
        self.assertIn("--model codex1", output)
        self.assertIn("--dangerously-bypass-approvals-and-sandbox", output)

    def test_run_selected_modules_stops_after_failed_module(self):
        runner = load_runner()
        modules = runner.select_product_modules(["agents", "calls"])
        calls = []

        def fake_run_module_tutorial(**kwargs):
            module = kwargs["module"]
            calls.append(module.name)
            return runner.ModuleTutorialResult(
                module=module.name,
                title=module.title,
                status="failed",
                returncode=1,
                duration_seconds=0.5,
                final_message="failed",
                tutorial_path=None,
                stdout_path=Path("stdout"),
                stderr_path=Path("stderr"),
                changed_files=[],
                missing_headings=[],
            )

        original = runner.run_module_tutorial
        runner.run_module_tutorial = fake_run_module_tutorial
        try:
            results = runner.run_selected_modules(
                repo_root=REPO_ROOT,
                modules=modules,
                run_dir=self.temp_dir / "run",
                timeout_minutes=1,
                model=None,
            )
        finally:
            runner.run_module_tutorial = original

        self.assertEqual(calls, ["agents"])
        self.assertEqual([result.status for result in results], ["failed"])

    def test_tracked_file_mutation_after_child_returns_unsafe_changes(self):
        runner = load_runner()
        module = runner.select_product_modules(["agents"])[0]

        status_calls = iter([[], [" M README.md"]])

        def fake_git_status(repo_root):
            return next(status_calls)

        def fake_git_sha(repo_root):
            return "abc123"

        def fake_subprocess_run(command, **kwargs):
            output_path = Path(command[command.index("--output-last-message") + 1])
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(self.complete_tutorial(module.title), encoding="utf-8")
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")

        original_status = runner.git_status
        original_sha = runner.git_sha
        original_run = runner.subprocess.run
        runner.git_status = fake_git_status
        runner.git_sha = fake_git_sha
        runner.subprocess.run = fake_subprocess_run
        try:
            result = runner.run_module_tutorial(
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

    def test_write_video_tutorials_writes_module_files_and_index_after_success(self):
        runner = load_runner()
        modules = runner.select_product_modules(["agents"])
        output_dir = self.temp_dir / "video-tutorials"
        results = [self.result(runner)]

        written = runner.write_video_tutorials(
            repo_root=REPO_ROOT,
            output_dir=output_dir,
            modules=modules,
            results=results,
            git_sha="abc123",
            started_at="2026-06-30T00:00:00Z",
            finished_at="2026-06-30T00:05:00Z",
        )

        tutorial = output_dir / "agents.md"
        index = output_dir / "index.md"
        self.assertIn(tutorial, written)
        self.assertIn(index, written)
        self.assertIn("# Agent Builder Video Tutorial", tutorial.read_text(encoding="utf-8"))
        self.assertIn("[Agent Builder](agents.md)", index.read_text(encoding="utf-8"))

    def test_write_video_tutorials_rejects_incomplete_results(self):
        runner = load_runner()
        modules = runner.select_product_modules(["agents", "calls"])
        output_dir = self.temp_dir / "video-tutorials"
        results = [self.result(runner)]

        with self.assertRaises(RuntimeError):
            runner.write_video_tutorials(
                repo_root=REPO_ROOT,
                output_dir=output_dir,
                modules=modules,
                results=results,
                git_sha="abc123",
                started_at="2026-06-30T00:00:00Z",
                finished_at="2026-06-30T00:05:00Z",
            )


if __name__ == "__main__":
    unittest.main()
