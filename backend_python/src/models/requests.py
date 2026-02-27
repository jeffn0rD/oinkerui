"""Request models for Python Tools Backend."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class RenderOptions(BaseModel):
    """Options for template rendering."""
    strict: bool = Field(default=False, description="Fail on undefined variables")
    autoescape: bool = Field(default=False, description="HTML escape output")


class RenderTemplateRequest(BaseModel):
    """Request to render a Jinja2 template."""
    template: str = Field(..., description="Jinja2 template string", min_length=1)
    variables: Dict[str, Any] = Field(default_factory=dict, description="Variables to substitute")
    options: RenderOptions = Field(default_factory=RenderOptions, description="Rendering options")


class ValidateTemplateRequest(BaseModel):
    """Request to validate a Jinja2 template."""
    template: str = Field(..., description="Jinja2 template string", min_length=1)


class ExecuteOptions(BaseModel):
    """Options for code execution."""
    timeout: int = Field(default=30, ge=1, le=300, description="Max execution time in seconds")
    capture_output: bool = Field(default=True, description="Capture stdout/stderr")
    working_dir: Optional[str] = Field(default=None, description="Relative path within project")


class ExecuteCodeRequest(BaseModel):
    """Request to execute code."""
    code: str = Field(..., description="Code or command to execute", min_length=1)
    language: str = Field(..., description="Execution language", pattern="^(python|shell)$")
    project_path: str = Field(..., description="Project root directory")
    options: ExecuteOptions = Field(default_factory=ExecuteOptions, description="Execution options")


class DiffRequest(BaseModel):
    """Request to generate a diff."""
    original: str = Field(..., description="Original text")
    modified: str = Field(..., description="Modified text")
    filename: str = Field(default="file", description="Filename for diff header")


class CountTokensRequest(BaseModel):
    """Request to count tokens."""
    text: str = Field(..., description="Text to count tokens for")
    model: str = Field(default="gpt-4", description="Model for tokenizer selection")