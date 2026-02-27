"""Unit tests for template rendering service."""

import pytest
from src.services.template_service import (
    render_template,
    validate_template,
    list_template_filters,
    TemplateError,
    TemplateSecurityError,
)


class TestRenderTemplate:
    """Tests for render_template function."""

    def test_renders_simple_template(self):
        """Basic variable substitution."""
        result = render_template("Hello, {{ name }}!", {"name": "World"})
        assert result.content == "Hello, World!"
        assert "name" in result.variables_used
        assert len(result.warnings) == 0

    def test_renders_multiple_variables(self):
        """Multiple variable substitution."""
        result = render_template(
            "{{ greeting }}, {{ name }}!",
            {"greeting": "Hi", "name": "Alice"},
        )
        assert result.content == "Hi, Alice!"
        assert "greeting" in result.variables_used
        assert "name" in result.variables_used

    def test_handles_upper_filter(self):
        """Template with upper filter."""
        result = render_template("{{ name | upper }}", {"name": "hello"})
        assert result.content == "HELLO"

    def test_handles_lower_filter(self):
        """Template with lower filter."""
        result = render_template("{{ name | lower }}", {"name": "HELLO"})
        assert result.content == "hello"

    def test_handles_title_filter(self):
        """Template with title filter."""
        result = render_template("{{ name | title }}", {"name": "hello world"})
        assert result.content == "Hello World"

    def test_handles_trim_filter(self):
        """Template with trim filter."""
        result = render_template("{{ name | trim }}", {"name": "  hello  "})
        assert result.content == "hello"

    def test_handles_default_filter(self):
        """Template with default filter."""
        result = render_template(
            "{{ name | default('Anonymous') }}",
            {},
        )
        assert result.content == "Anonymous"

    def test_handles_json_filter(self):
        """Template with json filter."""
        result = render_template(
            "{{ data | json }}",
            {"data": {"key": "value"}},
        )
        assert '"key"' in result.content
        assert '"value"' in result.content

    def test_handles_undefined_variable_non_strict(self):
        """Missing variable in non-strict mode returns empty."""
        result = render_template(
            "Hello, {{ name }}!",
            {},
            {"strict": False},
        )
        assert result.content == "Hello, !"
        assert len(result.warnings) == 0  # Jinja2 Undefined renders as empty

    def test_throws_on_undefined_in_strict_mode(self):
        """Missing variable in strict mode raises error."""
        with pytest.raises(TemplateError):
            render_template(
                "Hello, {{ name }}!",
                {},
                {"strict": True},
            )

    def test_handles_empty_variables(self):
        """Template with no variables needed."""
        result = render_template("Hello, World!")
        assert result.content == "Hello, World!"
        assert len(result.variables_used) == 0

    def test_handles_conditional_blocks(self):
        """Template with if/else blocks."""
        result = render_template(
            "{% if show %}visible{% else %}hidden{% endif %}",
            {"show": True},
        )
        assert result.content == "visible"

    def test_handles_loop_constructs(self):
        """Template with for loops."""
        result = render_template(
            "{% for item in items %}{{ item }} {% endfor %}",
            {"items": ["a", "b", "c"]},
        )
        assert result.content == "a b c "

    def test_raises_on_invalid_syntax(self):
        """Invalid template syntax raises TemplateError."""
        with pytest.raises(TemplateError):
            render_template("{{ unclosed")

    def test_blocks_unsafe_attribute_access(self):
        """Unsafe attribute access is blocked by sandbox."""
        with pytest.raises((TemplateError, TemplateSecurityError)):
            render_template(
                "{{ ''.__class__.__mro__[2].__subclasses__() }}",
                {},
            )

    def test_renders_nested_variables(self):
        """Template with nested object access."""
        result = render_template(
            "{{ user.name }}",
            {"user": {"name": "Alice"}},
        )
        assert result.content == "Alice"

    def test_handles_autoescape(self):
        """HTML autoescape option."""
        result = render_template(
            "{{ content }}",
            {"content": "<script>alert('xss')</script>"},
            {"autoescape": True},
        )
        assert "<script>" not in result.content
        assert "&lt;script&gt;" in result.content


class TestValidateTemplate:
    """Tests for validate_template function."""

    def test_valid_template(self):
        """Valid template returns valid=True."""
        result = validate_template("Hello, {{ name }}!")
        assert result.valid is True
        assert "name" in result.variables
        assert result.error is None

    def test_invalid_template(self):
        """Invalid template returns valid=False with error."""
        result = validate_template("{{ unclosed")
        assert result.valid is False
        assert result.error is not None

    def test_extracts_multiple_variables(self):
        """Extracts all variables from template."""
        result = validate_template("{{ a }} {{ b }} {{ c }}")
        assert result.valid is True
        assert sorted(result.variables) == ["a", "b", "c"]

    def test_empty_template_body(self):
        """Template with no variables."""
        result = validate_template("Hello, World!")
        assert result.valid is True
        assert len(result.variables) == 0


class TestListTemplateFilters:
    """Tests for list_template_filters function."""

    def test_returns_filters(self):
        """Returns list of available filters."""
        result = list_template_filters()
        assert len(result.filters) > 0

    def test_includes_required_filters(self):
        """Includes all required safe filters."""
        result = list_template_filters()
        filter_names = [f.name for f in result.filters]
        required = ["upper", "lower", "title", "trim", "default", "json"]
        for name in required:
            assert name in filter_names, f"Missing required filter: {name}"

    def test_filters_have_descriptions(self):
        """All filters have descriptions."""
        result = list_template_filters()
        for f in result.filters:
            assert f.name, "Filter missing name"
            assert f.description, f"Filter '{f.name}' missing description"