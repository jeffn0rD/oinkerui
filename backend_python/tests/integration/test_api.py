"""Integration tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient
from src.main import app
import tempfile
import os
import shutil


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def temp_project():
    """Create a temporary project directory for testing."""
    project_dir = tempfile.mkdtemp(prefix="oinker_api_test_")
    yield project_dir
    shutil.rmtree(project_dir, ignore_errors=True)


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, client):
        """Health endpoint returns ok status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "python-tools"


class TestTemplateEndpoints:
    """Tests for template rendering endpoints."""

    def test_render_template(self, client):
        """POST /tools/render-template renders correctly."""
        response = client.post("/tools/render-template", json={
            "template": "Hello, {{ name }}!",
            "variables": {"name": "World"},
        })
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "Hello, World!"
        assert "name" in data["variables_used"]

    def test_render_template_with_filters(self, client):
        """Render template with filters."""
        response = client.post("/tools/render-template", json={
            "template": "{{ name | upper }}",
            "variables": {"name": "hello"},
        })
        assert response.status_code == 200
        assert response.json()["content"] == "HELLO"

    def test_render_template_strict_mode(self, client):
        """Strict mode returns 400 on undefined variable."""
        response = client.post("/tools/render-template", json={
            "template": "Hello, {{ name }}!",
            "variables": {},
            "options": {"strict": True},
        })
        assert response.status_code == 400

    def test_render_template_invalid_syntax(self, client):
        """Invalid syntax returns 400."""
        response = client.post("/tools/render-template", json={
            "template": "{{ unclosed",
        })
        assert response.status_code == 400

    def test_render_template_empty_body(self, client):
        """Empty template returns 422 validation error."""
        response = client.post("/tools/render-template", json={
            "template": "",
        })
        assert response.status_code == 422

    def test_validate_template_valid(self, client):
        """POST /tools/validate-template with valid template."""
        response = client.post("/tools/validate-template", json={
            "template": "Hello, {{ name }}!",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert "name" in data["variables"]

    def test_validate_template_invalid(self, client):
        """POST /tools/validate-template with invalid template."""
        response = client.post("/tools/validate-template", json={
            "template": "{{ unclosed",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["error"] is not None

    def test_list_template_filters(self, client):
        """GET /tools/template-filters returns filter list."""
        response = client.get("/tools/template-filters")
        assert response.status_code == 200
        data = response.json()
        assert len(data["filters"]) > 0
        filter_names = [f["name"] for f in data["filters"]]
        assert "upper" in filter_names
        assert "lower" in filter_names
        assert "json" in filter_names


class TestExecutionEndpoints:
    """Tests for code execution endpoints."""

    def test_execute_python(self, client, temp_project):
        """POST /tools/execute runs Python code."""
        response = client.post("/tools/execute", json={
            "code": "print('Hello from Python')",
            "language": "python",
            "project_path": temp_project,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Hello from Python" in data["stdout"]

    def test_execute_shell(self, client, temp_project):
        """POST /tools/execute runs shell commands."""
        response = client.post("/tools/execute", json={
            "code": "echo 'Hello from Shell'",
            "language": "shell",
            "project_path": temp_project,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Hello from Shell" in data["stdout"]

    def test_execute_invalid_language(self, client, temp_project):
        """Invalid language returns 422."""
        response = client.post("/tools/execute", json={
            "code": "console.log('hi')",
            "language": "javascript",
            "project_path": temp_project,
        })
        assert response.status_code == 422

    def test_execute_invalid_project_path(self, client):
        """Invalid project path returns 403."""
        response = client.post("/tools/execute", json={
            "code": "print('hi')",
            "language": "python",
            "project_path": "/nonexistent/path",
        })
        assert response.status_code == 403

    def test_execute_timeout(self, client, temp_project):
        """Execution timeout returns result with timed_out=True."""
        response = client.post("/tools/execute", json={
            "code": "import time; time.sleep(10)",
            "language": "python",
            "project_path": temp_project,
            "options": {"timeout": 1},
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["timed_out"] is True


class TestUtilityEndpoints:
    """Tests for utility endpoints."""

    def test_generate_diff(self, client):
        """POST /tools/diff generates unified diff."""
        response = client.post("/tools/diff", json={
            "original": "line1\nline2\nline3",
            "modified": "line1\nmodified\nline3",
            "filename": "test.txt",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["has_changes"] is True
        assert data["additions"] > 0
        assert data["deletions"] > 0

    def test_generate_diff_no_changes(self, client):
        """Diff with identical texts shows no changes."""
        response = client.post("/tools/diff", json={
            "original": "same text",
            "modified": "same text",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["has_changes"] is False

    def test_count_tokens(self, client):
        """POST /tools/count-tokens counts tokens."""
        response = client.post("/tools/count-tokens", json={
            "text": "Hello, world!",
            "model": "gpt-4",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["token_count"] > 0
        assert data["model"] == "gpt-4"