"""Unit tests for code execution service."""

import os
import pytest
import tempfile
import shutil

from src.services.execution_service import (
    execute_code,
    ExecutionError,
    ExecutionSecurityError,
    snapshot_files,
    diff_files,
)


@pytest.fixture
def temp_project():
    """Create a temporary project directory for testing."""
    project_dir = tempfile.mkdtemp(prefix="oinker_test_")
    yield project_dir
    shutil.rmtree(project_dir, ignore_errors=True)


class TestExecuteCode:
    """Tests for execute_code function."""

    def test_executes_python_print(self, temp_project):
        """Simple Python print statement."""
        result = execute_code(
            code="print('Hello')",
            language="python",
            project_path=temp_project,
        )
        assert result.success is True
        assert result.exit_code == 0
        assert "Hello" in result.stdout

    def test_executes_python_calculation(self, temp_project):
        """Python calculation with output."""
        result = execute_code(
            code="print(2 + 3)",
            language="python",
            project_path=temp_project,
        )
        assert result.success is True
        assert "5" in result.stdout

    def test_executes_shell_echo(self, temp_project):
        """Shell echo command."""
        result = execute_code(
            code="echo 'Hello'",
            language="shell",
            project_path=temp_project,
        )
        assert result.success is True
        assert "Hello" in result.stdout

    def test_executes_shell_ls(self, temp_project):
        """Shell ls command in project directory."""
        # Create a test file
        with open(os.path.join(temp_project, "test.txt"), "w") as f:
            f.write("test")

        result = execute_code(
            code="ls",
            language="shell",
            project_path=temp_project,
        )
        assert result.success is True
        assert "test.txt" in result.stdout

    def test_captures_stderr(self, temp_project):
        """Captures stderr output."""
        result = execute_code(
            code="import sys; print('error', file=sys.stderr)",
            language="python",
            project_path=temp_project,
        )
        assert "error" in result.stderr

    def test_handles_nonzero_exit_code(self, temp_project):
        """Non-zero exit code sets success=False."""
        result = execute_code(
            code="import sys; sys.exit(1)",
            language="python",
            project_path=temp_project,
        )
        assert result.success is False
        assert result.exit_code == 1

    def test_handles_timeout(self, temp_project):
        """Execution timeout is enforced."""
        result = execute_code(
            code="import time; time.sleep(10)",
            language="python",
            project_path=temp_project,
            options={"timeout": 1},
        )
        assert result.success is False
        assert result.timed_out is True

    def test_tracks_file_creation(self, temp_project):
        """Tracks files created during execution."""
        result = execute_code(
            code="with open('created.txt', 'w') as f: f.write('hello')",
            language="python",
            project_path=temp_project,
        )
        assert result.success is True
        assert "created.txt" in result.files_modified
        assert os.path.exists(os.path.join(temp_project, "created.txt"))

    def test_reports_duration(self, temp_project):
        """Reports execution duration in milliseconds."""
        result = execute_code(
            code="print('fast')",
            language="python",
            project_path=temp_project,
        )
        assert result.duration_ms >= 0

    def test_rejects_empty_code(self, temp_project):
        """Empty code raises ExecutionError."""
        with pytest.raises(ExecutionError, match="Empty code"):
            execute_code(
                code="   ",
                language="python",
                project_path=temp_project,
            )

    def test_rejects_invalid_language(self, temp_project):
        """Invalid language raises ExecutionError."""
        with pytest.raises(ExecutionError, match="Unsupported language"):
            execute_code(
                code="console.log('hi')",
                language="javascript",
                project_path=temp_project,
            )

    def test_rejects_invalid_project_path(self):
        """Invalid project path raises error."""
        from src.core.path_validator import PathValidationError
        with pytest.raises(PathValidationError):
            execute_code(
                code="print('hi')",
                language="python",
                project_path="/nonexistent/path",
            )

    def test_rejects_working_dir_outside_project(self, temp_project):
        """Working directory outside project raises SecurityError."""
        with pytest.raises(ExecutionSecurityError):
            execute_code(
                code="print('hi')",
                language="python",
                project_path=temp_project,
                options={"working_dir": "../../etc"},
            )

    def test_python_syntax_error(self, temp_project):
        """Python syntax error returns non-zero exit code."""
        result = execute_code(
            code="def broken(",
            language="python",
            project_path=temp_project,
        )
        assert result.success is False
        assert result.exit_code != 0
        assert result.stderr  # Should have error message


class TestSnapshotFiles:
    """Tests for file snapshot utilities."""

    def test_snapshots_files(self, temp_project):
        """Captures file modification times."""
        with open(os.path.join(temp_project, "test.txt"), "w") as f:
            f.write("test")

        snapshot = snapshot_files(temp_project)
        assert "test.txt" in snapshot

    def test_skips_hidden_dirs(self, temp_project):
        """Skips hidden directories."""
        hidden_dir = os.path.join(temp_project, ".hidden")
        os.makedirs(hidden_dir)
        with open(os.path.join(hidden_dir, "secret.txt"), "w") as f:
            f.write("secret")

        snapshot = snapshot_files(temp_project)
        assert not any(".hidden" in path for path in snapshot)

    def test_empty_directory(self, temp_project):
        """Empty directory returns empty snapshot."""
        snapshot = snapshot_files(temp_project)
        assert len(snapshot) == 0


class TestDiffFiles:
    """Tests for file diff utility."""

    def test_detects_new_files(self):
        """Detects newly created files."""
        before = {}
        after = {"new.txt": 1234567890.0}
        modified = diff_files(before, after)
        assert "new.txt" in modified

    def test_detects_modified_files(self):
        """Detects modified files by mtime change."""
        before = {"file.txt": 1234567890.0}
        after = {"file.txt": 1234567899.0}
        modified = diff_files(before, after)
        assert "file.txt" in modified

    def test_ignores_unchanged_files(self):
        """Unchanged files are not reported."""
        before = {"file.txt": 1234567890.0}
        after = {"file.txt": 1234567890.0}
        modified = diff_files(before, after)
        assert len(modified) == 0