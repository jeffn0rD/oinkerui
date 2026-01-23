"""
Pytest configuration and fixtures for backend_python tests.
"""

import sys
from pathlib import Path

# Add the backend_python directory to the Python path
backend_python_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_python_dir))

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def test_client():
    """Create a test client for the FastAPI app."""
    from src.main import app
    return TestClient(app)


@pytest.fixture
def mock_config():
    """Mock configuration for tests."""
    return {
        "openrouter_api_key": "test-key",
        "workspace_root": "./test_workspaces",
        "templates_dir": "./test_templates",
        "sandboxes_dir": "./test_sandboxes"
    }