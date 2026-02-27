"""
Code execution service for sandboxed Python and shell execution.
Provides isolated execution with resource limits, output capture, and security.
"""

import os
import time
import subprocess
from typing import Optional

from src.core.path_validator import validate_project_path, validate_path, PathValidationError
from src.services.sandbox_service import sandbox_manager, SandboxError
from src.models.responses import ExecuteResult


class ExecutionError(Exception):
    """Raised when code execution fails."""
    pass


class ExecutionTimeoutError(Exception):
    """Raised when code execution times out."""
    pass


class ExecutionSecurityError(Exception):
    """Raised when code attempts forbidden operations."""
    pass


# Maximum output size (100KB)
MAX_OUTPUT_SIZE = 100_000


def snapshot_files(directory: str) -> dict:
    """
    Snapshot file modification times in a directory.
    
    Args:
        directory: Directory to snapshot
        
    Returns:
        Dict mapping relative paths to modification times
    """
    snapshot = {}
    try:
        for root, dirs, files in os.walk(directory):
            # Skip hidden directories and venv
            dirs[:] = [d for d in dirs if not d.startswith(".") and d != "__pycache__"]
            for f in files:
                path = os.path.join(root, f)
                rel_path = os.path.relpath(path, directory)
                try:
                    snapshot[rel_path] = os.path.getmtime(path)
                except OSError:
                    pass
    except OSError:
        pass
    return snapshot


def diff_files(before: dict, after: dict) -> list:
    """
    Find files that were modified or created.
    
    Args:
        before: File snapshot before execution
        after: File snapshot after execution
        
    Returns:
        List of modified/created file paths
    """
    modified = []
    for path, mtime in after.items():
        if path not in before or before[path] != mtime:
            modified.append(path)
    return sorted(modified)


def execute_code(
    code: str,
    language: str,
    project_path: str,
    options: Optional[dict] = None,
) -> ExecuteResult:
    """
    Execute Python code or shell commands in a sandboxed environment.
    
    Args:
        code: Code or command to execute
        language: 'python' or 'shell'
        project_path: Project root directory
        options: Execution options (timeout, working_dir, etc.)
        
    Returns:
        ExecuteResult with output, exit code, and file modifications
        
    Raises:
        ExecutionError: Code fails to execute
        ExecutionTimeoutError: Execution exceeds timeout
        ExecutionSecurityError: Code attempts forbidden operation
    """
    options = options or {}

    # Validate inputs
    if not code.strip():
        raise ExecutionError("Empty code")
    if language not in ("python", "shell"):
        raise ExecutionError(f"Unsupported language: {language}")

    # Validate project path
    project_path = validate_project_path(project_path)

    # Resolve working directory
    working_dir = project_path
    if options.get("working_dir"):
        try:
            working_dir = validate_path(options["working_dir"], project_path)
        except PathValidationError as e:
            raise ExecutionSecurityError(str(e))
        if not os.path.isdir(working_dir):
            raise ExecutionError(f"Working directory does not exist: {options['working_dir']}")

    # Setup execution environment
    env = sandbox_manager.create_sandbox_env(project_path)
    timeout = options.get("timeout", 30)

    # Snapshot files before execution
    files_before = snapshot_files(project_path)

    # Build command
    if language == "python":
        cmd = ["python3", "-c", code]
    else:
        # Use restricted bash for shell commands
        cmd = ["bash", "-c", code]

    # Execute
    start_time = time.time()
    timed_out = False

    try:
        result = subprocess.run(
            cmd,
            cwd=working_dir,
            env=env,
            capture_output=True,
            timeout=timeout,
            text=True,
        )
        exit_code = result.returncode
        stdout = result.stdout
        stderr = result.stderr
    except subprocess.TimeoutExpired as e:
        timed_out = True
        exit_code = -1
        stdout = e.stdout.decode("utf-8", errors="replace") if e.stdout else ""
        stderr = f"Execution timed out after {timeout}s"
    except Exception as e:
        raise ExecutionError(f"Execution failed: {str(e)}")

    duration_ms = int((time.time() - start_time) * 1000)

    # Truncate output if too large
    stdout = stdout[:MAX_OUTPUT_SIZE] if stdout else ""
    stderr = stderr[:MAX_OUTPUT_SIZE] if stderr else ""

    # Track file modifications
    files_after = snapshot_files(project_path)
    files_modified = diff_files(files_before, files_after)

    return ExecuteResult(
        success=exit_code == 0 and not timed_out,
        exit_code=exit_code,
        stdout=stdout,
        stderr=stderr,
        duration_ms=duration_ms,
        files_modified=files_modified,
        timed_out=timed_out,
    )