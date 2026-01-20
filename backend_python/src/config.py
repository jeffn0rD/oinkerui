"""
Configuration management for OinkerUI Python Tools Backend.
Uses Pydantic Settings to load and validate environment variables.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
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
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
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