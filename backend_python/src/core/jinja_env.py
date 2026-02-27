"""
Sandboxed Jinja2 environment for safe template rendering.
Uses SandboxedEnvironment to prevent unsafe operations.
"""

import json
from datetime import datetime
from jinja2 import meta
from jinja2.sandbox import SandboxedEnvironment
from jinja2 import StrictUndefined, Undefined, TemplateSyntaxError, UndefinedError


# Safe filters whitelist
SAFE_FILTERS = {
    "upper": {"fn": str.upper, "description": "Convert to uppercase"},
    "lower": {"fn": str.lower, "description": "Convert to lowercase"},
    "title": {"fn": str.title, "description": "Convert to title case"},
    "trim": {"fn": str.strip, "description": "Remove leading/trailing whitespace"},
    "default": {
        "fn": lambda value, default_value="": value if value else default_value,
        "description": "Use default value if variable is empty/undefined",
    },
    "json": {
        "fn": lambda value, indent=2: json.dumps(value, indent=indent, default=str),
        "description": "Convert to JSON string",
    },
    "indent": {
        "fn": lambda text, width=4, first=False: _indent_filter(text, width, first),
        "description": "Indent text by specified width",
    },
    "date": {
        "fn": lambda value, fmt="%Y-%m-%d": _date_filter(value, fmt),
        "description": "Format date/datetime value",
    },
    "truncate": {
        "fn": lambda value, length=255, end="...": value[:length] + end if len(str(value)) > length else str(value),
        "description": "Truncate string to specified length",
    },
    "replace": {
        "fn": lambda value, old, new: str(value).replace(old, new),
        "description": "Replace occurrences of a substring",
    },
    "wordcount": {
        "fn": lambda value: len(str(value).split()),
        "description": "Count words in string",
    },
    "length": {
        "fn": len,
        "description": "Return length of value",
    },
    "join": {
        "fn": lambda value, separator="": separator.join(str(v) for v in value),
        "description": "Join list items with separator",
    },
    "first": {
        "fn": lambda value: value[0] if value else None,
        "description": "Return first item of list",
    },
    "last": {
        "fn": lambda value: value[-1] if value else None,
        "description": "Return last item of list",
    },
    "sort": {
        "fn": sorted,
        "description": "Sort a list",
    },
    "reverse": {
        "fn": lambda value: list(reversed(value)) if isinstance(value, list) else str(value)[::-1],
        "description": "Reverse a list or string",
    },
}


def _indent_filter(text: str, width: int = 4, first: bool = False) -> str:
    """Indent each line of text."""
    lines = str(text).split("\n")
    indent = " " * width
    if first:
        return "\n".join(indent + line for line in lines)
    else:
        result = [lines[0]] + [indent + line for line in lines[1:]]
        return "\n".join(result)


def _date_filter(value, fmt: str = "%Y-%m-%d") -> str:
    """Format a date value."""
    if value is None:
        return ""
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except (ValueError, TypeError):
            return str(value)
    if isinstance(value, datetime):
        return value.strftime(fmt)
    return str(value)


def create_safe_environment(strict: bool = False, autoescape: bool = False) -> SandboxedEnvironment:
    """
    Create a sandboxed Jinja2 environment with only safe filters.
    
    Args:
        strict: If True, raise error on undefined variables
        autoescape: If True, HTML-escape output
        
    Returns:
        Configured SandboxedEnvironment
    """
    env = SandboxedEnvironment(
        autoescape=autoescape,
        undefined=StrictUndefined if strict else Undefined,
        keep_trailing_newline=True,
    )

    # Register only safe filters
    for name, filter_info in SAFE_FILTERS.items():
        env.filters[name] = filter_info["fn"]

    return env


def get_available_filters() -> list:
    """Return list of available safe filters with descriptions."""
    return [
        {"name": name, "description": info["description"]}
        for name, info in SAFE_FILTERS.items()
    ]


def extract_variables(env: SandboxedEnvironment, template_content: str) -> list:
    """Extract undeclared variables from a template."""
    ast = env.parse(template_content)
    return sorted(list(meta.find_undeclared_variables(ast)))