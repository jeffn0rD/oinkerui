"""
Template rendering service using sandboxed Jinja2.
Provides safe template rendering, validation, and filter listing.
"""

from jinja2 import TemplateSyntaxError, UndefinedError, Undefined
from jinja2.sandbox import SandboxedEnvironment, SecurityError as JinjaSecurityError

from src.core.jinja_env import (
    create_safe_environment,
    extract_variables,
    get_available_filters,
)
from src.models.responses import RenderResult, ValidateResult, TemplateFilter, TemplateFiltersResult


class TemplateError(Exception):
    """Raised for template syntax errors."""
    def __init__(self, message: str, line: int = None):
        self.message = message
        self.line = line
        super().__init__(message)


class TemplateSecurityError(Exception):
    """Raised when template attempts unsafe operations."""
    pass


def render_template(
    template_content: str,
    variables: dict = None,
    options: dict = None,
) -> RenderResult:
    """
    Render a Jinja2 template with provided variables.
    
    Args:
        template_content: Jinja2 template string
        variables: Variables to substitute in template
        options: Rendering options (strict, autoescape)
        
    Returns:
        RenderResult with rendered content, variables used, and warnings
        
    Raises:
        TemplateError: Invalid template syntax
        TemplateSecurityError: Unsafe operation attempted
    """
    variables = variables or {}
    options = options or {}
    strict = options.get("strict", False)
    autoescape = options.get("autoescape", False)

    # Create sandboxed environment
    env = create_safe_environment(strict=strict, autoescape=autoescape)

    # Step 1: Validate syntax by parsing
    try:
        ast = env.parse(template_content)
    except TemplateSyntaxError as e:
        raise TemplateError(
            f"Invalid template syntax at line {e.lineno}: {e.message}",
            line=e.lineno,
        )

    # Step 2: Extract variables from AST
    from jinja2 import meta
    variables_used = sorted(list(meta.find_undeclared_variables(ast)))

    # Step 3: Render template
    warnings = []
    try:
        template = env.from_string(template_content)
        content = template.render(**variables)
    except UndefinedError as e:
        if strict:
            raise TemplateError(f"Undefined variable: {e.message}")
        # In non-strict mode, collect warning and re-render permissively
        warnings.append(str(e))
        permissive_env = create_safe_environment(strict=False, autoescape=autoescape)
        template = permissive_env.from_string(template_content)
        content = template.render(**variables)
    except JinjaSecurityError as e:
        raise TemplateSecurityError(f"Unsafe template operation: {e}")
    except Exception as e:
        raise TemplateError(f"Template rendering error: {str(e)}")

    return RenderResult(
        content=content,
        variables_used=variables_used,
        warnings=warnings,
    )


def validate_template(template_content: str) -> ValidateResult:
    """
    Validate Jinja2 template syntax without rendering.
    
    Args:
        template_content: Jinja2 template string
        
    Returns:
        ValidateResult with validity status and variable list
    """
    env = create_safe_environment()

    try:
        variables = extract_variables(env, template_content)
        return ValidateResult(
            valid=True,
            variables=variables,
            error=None,
            line=None,
        )
    except TemplateSyntaxError as e:
        return ValidateResult(
            valid=False,
            variables=[],
            error=f"Syntax error at line {e.lineno}: {e.message}",
            line=e.lineno,
        )


def list_template_filters() -> TemplateFiltersResult:
    """
    Return list of available safe Jinja2 filters.
    
    Returns:
        TemplateFiltersResult with filter descriptions
    """
    filters = [
        TemplateFilter(name=f["name"], description=f["description"])
        for f in get_available_filters()
    ]
    return TemplateFiltersResult(filters=filters)