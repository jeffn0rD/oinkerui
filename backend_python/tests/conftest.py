"""
Pytest configuration and fixtures for backend_python tests.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def test_client():
    """Create a test client for the FastAPI app."""
    from backend_python.src.main import app
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