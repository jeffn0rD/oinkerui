"""
Path validation utilities for security.
Ensures all file operations stay within project boundaries.
"""

import os
from pathlib import Path


class PathValidationError(Exception):
    """Raised when a path violates security constraints."""
    pass


def validate_path(path: str, base_dir: str) -> str:
    """
    Validate that a path is within the base directory.
    
    Args:
        path: Path to validate
        base_dir: Base directory that path must be within
        
    Returns:
        Resolved absolute path
        
    Raises:
        PathValidationError: If path is outside base directory
    """
    base_real = os.path.realpath(base_dir)
    target_real = os.path.realpath(os.path.join(base_dir, path))

    if not target_real.startswith(base_real + os.sep) and target_real != base_real:
        raise PathValidationError(
            f"Path '{path}' resolves outside project directory"
        )

    return target_real


def validate_project_path(project_path: str) -> str:
    """
    Validate that a project path exists and is a directory.
    
    Args:
        project_path: Path to validate
        
    Returns:
        Resolved absolute path
        
    Raises:
        PathValidationError: If path doesn't exist or isn't a directory
    """
    real_path = os.path.realpath(project_path)

    if not os.path.exists(real_path):
        raise PathValidationError(f"Project path does not exist: {project_path}")

    if not os.path.isdir(real_path):
        raise PathValidationError(f"Project path is not a directory: {project_path}")

    return real_path