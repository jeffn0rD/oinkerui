"""
Unit tests for configuration module.
"""

import pytest
from src.config import settings


@pytest.mark.unit
def test_settings_loaded():
    """Test that settings are loaded successfully."""
    assert settings is not None
    assert settings.python_port == 8000


@pytest.mark.unit
def test_settings_has_required_fields():
    """Test that settings has all required fields."""
    assert hasattr(settings, 'python_port')
    assert hasattr(settings, 'openrouter_api_key')
    assert hasattr(settings, 'workspace_root')
    assert hasattr(settings, 'templates_dir')
    assert hasattr(settings, 'sandboxes_dir')


@pytest.mark.unit
def test_cors_origins_list():
    """Test that CORS origins are parsed into a list."""
    origins = settings.cors_origins_list
    assert isinstance(origins, list)
    assert len(origins) > 0