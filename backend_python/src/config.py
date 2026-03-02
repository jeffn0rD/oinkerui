"""
Configuration management for OinkerUI Python Tools Backend.
Uses Pydantic Settings to load and validate environment variables.
"""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

# Compute project root: two levels up from this file (src/config.py -> backend_python -> project_root)
_config_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(os.path.dirname(_config_dir))


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=os.path.join(_project_root, ".env"),
        case_sensitive=False,
        extra="ignore",  # Ignore unknown env vars gracefully
    )

    # Server Configuration
    node_env: str = "development"
    python_port: int = 8000
    frontend_port: int = 5173
    host: str = "0.0.0.0"

    # OpenRouter API Configuration
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    api_timeout: int = 60000

    # Workspace Configuration
    workspace_root: str = "./workspaces"
    data_dir: str = "./data"
    templates_dir: str = "./backend_python/templates"
    sandboxes_dir: str = "./backend_python/sandboxes"

    # Git Configuration
    git_user_name: str = "OinkerUI"
    git_user_email: str = "oinkerui@example.com"
    auto_commit_enabled: bool = True

    # Security
    secret_key: str = "change-this-in-production"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Development
    debug: bool = True
    log_level: str = "info"
    log_format: str = "json"

    # Node.js Backend
    node_port: int = 3000
    node_base_url: str = "http://localhost:3000"

    # Model Configuration (used by Node.js backend, but present in shared .env)
    default_model: str = "openai/gpt-4o-mini"
    models: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(',')]

    def validate_required(self) -> None:
        """Validate required configuration."""
        if not self.openrouter_api_key and self.node_env != "test":
            print("Warning: OPENROUTER_API_KEY is not set")


# Create global settings instance
settings = Settings()
settings.validate_required()