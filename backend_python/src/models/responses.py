"""Response models for Python Tools Backend."""

from pydantic import BaseModel, Field
from typing import List, Optional


class RenderResult(BaseModel):
    """Result of template rendering."""
    content: str = Field(..., description="Rendered template content")
    variables_used: List[str] = Field(default_factory=list, description="Variables found in template")
    warnings: List[str] = Field(default_factory=list, description="Warnings during rendering")


class ValidateResult(BaseModel):
    """Result of template validation."""
    valid: bool = Field(..., description="Whether template syntax is valid")
    variables: List[str] = Field(default_factory=list, description="Variables found in template")
    error: Optional[str] = Field(default=None, description="Error message if invalid")
    line: Optional[int] = Field(default=None, description="Error line number")


class TemplateFilter(BaseModel):
    """Description of an available template filter."""
    name: str = Field(..., description="Filter name")
    description: str = Field(..., description="Filter description")


class TemplateFiltersResult(BaseModel):
    """List of available template filters."""
    filters: List[TemplateFilter] = Field(default_factory=list)


class ExecuteResult(BaseModel):
    """Result of code execution."""
    success: bool = Field(..., description="Whether execution succeeded")
    exit_code: int = Field(..., description="Process exit code")
    stdout: str = Field(default="", description="Standard output")
    stderr: str = Field(default="", description="Standard error")
    duration_ms: int = Field(..., description="Execution duration in milliseconds")
    files_modified: List[str] = Field(default_factory=list, description="Files modified during execution")
    timed_out: bool = Field(default=False, description="Whether execution timed out")


class DiffResult(BaseModel):
    """Result of diff generation."""
    diff: str = Field(..., description="Unified diff output")
    has_changes: bool = Field(..., description="Whether there are differences")
    additions: int = Field(default=0, description="Number of added lines")
    deletions: int = Field(default=0, description="Number of deleted lines")


class CountTokensResult(BaseModel):
    """Result of token counting."""
    token_count: int = Field(..., description="Number of tokens")
    model: str = Field(..., description="Model used for tokenization")


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(default=None, description="Additional error details")