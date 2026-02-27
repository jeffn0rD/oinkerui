"""
Sandbox service for isolated code execution.
Manages project-scoped execution environments with security restrictions.
"""

import os
import sys
import json
import uuid
import shutil
import subprocess
from datetime import datetime
from typing import Optional, Dict

from src.core.path_validator import validate_project_path, PathValidationError


class SandboxError(Exception):
    """Raised when sandbox operations fail."""
    pass


class SandboxManager:
    """Manages execution sandboxes for projects."""

    def __init__(self):
        self._cache: Dict[str, dict] = {}

    def create_sandbox(
        self,
        project_path: str,
        options: Optional[dict] = None,
    ) -> dict:
        """
        Create or retrieve an execution sandbox for a project.
        
        Args:
            project_path: Project root directory
            options: Sandbox configuration (packages, etc.)
            
        Returns:
            Sandbox object with paths and status
            
        Raises:
            SandboxError: If sandbox creation fails
            PathValidationError: If project path is invalid
        """
        options = options or {}
        project_path = validate_project_path(project_path)

        # Check cache for existing sandbox
        if project_path in self._cache:
            sandbox = self._cache[project_path]
            if self._validate_sandbox(sandbox):
                return sandbox

        # Setup paths
        venv_path = os.path.join(project_path, ".venv")
        python_path = os.path.join(venv_path, "bin", "python")
        pip_path = os.path.join(venv_path, "bin", "pip")

        # Check for existing valid venv
        if os.path.exists(venv_path):
            if os.path.exists(python_path):
                sandbox = self._load_sandbox(venv_path)
                self._cache[project_path] = sandbox
                return sandbox
            else:
                # Corrupted venv, remove and recreate
                shutil.rmtree(venv_path)

        # Create new venv
        sandbox_id = str(uuid.uuid4())

        try:
            subprocess.run(
                [sys.executable, "-m", "venv", venv_path],
                check=True,
                capture_output=True,
                timeout=60,
            )
        except subprocess.CalledProcessError as e:
            raise SandboxError(
                f"Failed to create virtual environment: {e.stderr.decode() if e.stderr else 'Unknown error'}"
            )
        except subprocess.TimeoutExpired:
            raise SandboxError("Virtual environment creation timed out")

        # Upgrade pip
        try:
            subprocess.run(
                [pip_path, "install", "--upgrade", "pip", "-q"],
                capture_output=True,
                timeout=120,
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            pass  # Non-critical, continue with existing pip

        # Install requested packages
        packages = options.get("packages", [])
        if packages:
            try:
                subprocess.run(
                    [pip_path, "install", "-q"] + packages,
                    check=True,
                    capture_output=True,
                    timeout=300,
                )
            except subprocess.CalledProcessError as e:
                raise SandboxError(
                    f"Failed to install packages: {e.stderr.decode() if e.stderr else 'Unknown error'}"
                )
            except subprocess.TimeoutExpired:
                raise SandboxError("Package installation timed out")

        # Write metadata
        metadata = {
            "id": sandbox_id,
            "project_path": project_path,
            "created_at": datetime.now().isoformat(),
            "packages": packages,
        }

        metadata_path = os.path.join(venv_path, "sandbox.json")
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

        sandbox = {
            "id": sandbox_id,
            "project_path": project_path,
            "venv_path": venv_path,
            "python_path": python_path,
            "created_at": metadata["created_at"],
            "status": "ready",
        }

        self._cache[project_path] = sandbox
        return sandbox

    def create_sandbox_env(self, project_path: str) -> dict:
        """
        Create restricted environment variables for sandboxed execution.
        
        Args:
            project_path: Project root directory
            
        Returns:
            Environment variable dict for subprocess
        """
        return {
            "PATH": "/usr/bin:/bin:/usr/local/bin",
            "HOME": project_path,
            "PYTHONPATH": "",
            "PROJECT_ROOT": project_path,
            "LANG": "C.UTF-8",
            "LC_ALL": "C.UTF-8",
            # Prevent network access hints
            "http_proxy": "",
            "https_proxy": "",
        }

    def _validate_sandbox(self, sandbox: dict) -> bool:
        """Check if a cached sandbox is still valid."""
        return os.path.exists(sandbox.get("python_path", ""))

    def _load_sandbox(self, venv_path: str) -> dict:
        """Load sandbox metadata from existing venv."""
        metadata_path = os.path.join(venv_path, "sandbox.json")
        if os.path.exists(metadata_path):
            with open(metadata_path) as f:
                metadata = json.load(f)
        else:
            metadata = {"id": str(uuid.uuid4())}

        return {
            "id": metadata.get("id", str(uuid.uuid4())),
            "project_path": os.path.dirname(venv_path),
            "venv_path": venv_path,
            "python_path": os.path.join(venv_path, "bin", "python"),
            "created_at": metadata.get("created_at"),
            "status": "ready",
        }

    def cleanup_sandbox(self, project_path: str) -> bool:
        """
        Remove sandbox for a project.
        
        Args:
            project_path: Project root directory
            
        Returns:
            True if sandbox was removed
        """
        project_path = os.path.realpath(project_path)
        venv_path = os.path.join(project_path, ".venv")

        if os.path.exists(venv_path):
            shutil.rmtree(venv_path)

        if project_path in self._cache:
            del self._cache[project_path]

        return True


# Global sandbox manager instance
sandbox_manager = SandboxManager()