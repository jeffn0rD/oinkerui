"""
Template rendering API endpoints.
Provides Jinja2 template rendering, validation, and filter listing.
"""

from fastapi import APIRouter, HTTPException

from src.models.requests import RenderTemplateRequest, ValidateTemplateRequest
from src.models.responses import RenderResult, ValidateResult, TemplateFiltersResult, ErrorResponse
from src.services.template_service import (
    render_template,
    validate_template,
    list_template_filters,
    TemplateError,
    TemplateSecurityError,
)

router = APIRouter(prefix="/tools", tags=["templates"])


@router.post(
    "/render-template",
    response_model=RenderResult,
    responses={
        400: {"model": ErrorResponse, "description": "Template error"},
        403: {"model": ErrorResponse, "description": "Security violation"},
    },
)
async def render_template_endpoint(request: RenderTemplateRequest) -> RenderResult:
    """
    Render a Jinja2 template with provided variables.
    Uses a sandboxed environment to prevent unsafe operations.
    """
    try:
        result = render_template(
            template_content=request.template,
            variables=request.variables,
            options={
                "strict": request.options.strict,
                "autoescape": request.options.autoescape,
            },
        )
        return result
    except TemplateSecurityError as e:
        raise HTTPException(
            status_code=403,
            detail={"error": "SECURITY_ERROR", "message": str(e)},
        )
    except TemplateError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "TEMPLATE_ERROR",
                "message": e.message,
                "line": e.line,
            },
        )


@router.post(
    "/validate-template",
    response_model=ValidateResult,
)
async def validate_template_endpoint(request: ValidateTemplateRequest) -> ValidateResult:
    """
    Validate Jinja2 template syntax without rendering.
    Returns variable list and any syntax errors.
    """
    return validate_template(request.template)


@router.get(
    "/template-filters",
    response_model=TemplateFiltersResult,
)
async def list_filters_endpoint() -> TemplateFiltersResult:
    """
    List available safe Jinja2 filters.
    Only whitelisted filters are available for template rendering.
    """
    return list_template_filters()