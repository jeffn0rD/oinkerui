"""
Integration tests for health check endpoint.
"""

import pytest


@pytest.mark.integration
def test_health_check(test_client):
    """Test health check endpoint returns correct response."""
    response = test_client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "python-tools"


@pytest.mark.integration
def test_health_check_structure(test_client):
    """Test health check response has correct structure."""
    response = test_client.get("/health")
    data = response.json()
    
    assert "status" in data
    assert "service" in data
    assert isinstance(data["status"], str)
    assert isinstance(data["service"], str)