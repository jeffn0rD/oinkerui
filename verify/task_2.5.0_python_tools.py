#!/usr/bin/env python3
"""Verification script for Task 2.5.0: Python Tools Backend."""

import os
import sys

CHECKS = []
PASS = 0
FAIL = 0


def check(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✓ {name}")
    else:
        FAIL += 1
        print(f"  ✗ {name} - {detail}")


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    py_base = os.path.join(base, "backend_python")
    node_base = os.path.join(base, "backend")

    print("=" * 60)
    print("Task 2.5.0 Verification: Python Tools Backend")
    print("=" * 60)

    # 1. Project Structure
    print("\n1. Project Structure")
    required_files = [
        "src/main.py",
        "src/config.py",
        "src/__init__.py",
        "src/models/__init__.py",
        "src/models/requests.py",
        "src/models/responses.py",
        "src/core/__init__.py",
        "src/core/jinja_env.py",
        "src/core/path_validator.py",
        "src/services/__init__.py",
        "src/services/template_service.py",
        "src/services/execution_service.py",
        "src/services/sandbox_service.py",
        "src/routers/__init__.py",
        "src/routers/templates.py",
        "src/routers/execution.py",
        "src/routers/utilities.py",
        "requirements.txt",
        "pytest.ini",
        "tests/conftest.py",
        "tests/unit/test_template_service.py",
        "tests/unit/test_execution_service.py",
        "tests/integration/test_api.py",
    ]
    for f in required_files:
        path = os.path.join(py_base, f)
        check(f"File exists: {f}", os.path.exists(path), f"Missing: {path}")

    # 2. FastAPI App
    print("\n2. FastAPI Application")
    main_py = os.path.join(py_base, "src", "main.py")
    if os.path.exists(main_py):
        content = open(main_py).read()
        check("FastAPI app created", "FastAPI(" in content)
        check("CORS middleware configured", "CORSMiddleware" in content)
        check("Health check endpoint", '"/health"' in content)
        check("Templates router registered", "templates.router" in content)
        check("Execution router registered", "execution.router" in content)
        check("Utilities router registered", "utilities.router" in content)
        check("Error handling middleware", "exception_handler" in content)

    # 3. Template Rendering
    print("\n3. Template Rendering Service")
    tmpl_svc = os.path.join(py_base, "src", "services", "template_service.py")
    if os.path.exists(tmpl_svc):
        content = open(tmpl_svc).read()
        check("render_template function", "def render_template" in content)
        check("validate_template function", "def validate_template" in content)
        check("list_template_filters function", "def list_template_filters" in content)
        check("SandboxedEnvironment used", "SandboxedEnvironment" in content)
        check("TemplateError defined", "class TemplateError" in content)
        check("TemplateSecurityError defined", "class TemplateSecurityError" in content)

    # 4. Jinja2 Environment
    print("\n4. Jinja2 Sandboxed Environment")
    jinja_env = os.path.join(py_base, "src", "core", "jinja_env.py")
    if os.path.exists(jinja_env):
        content = open(jinja_env).read()
        check("SandboxedEnvironment import", "SandboxedEnvironment" in content)
        check("Safe filters defined", "SAFE_FILTERS" in content)
        check("upper filter", '"upper"' in content)
        check("lower filter", '"lower"' in content)
        check("json filter", '"json"' in content)
        check("trim filter", '"trim"' in content)
        check("default filter", '"default"' in content)
        check("StrictUndefined support", "StrictUndefined" in content)

    # 5. Code Execution
    print("\n5. Code Execution Service")
    exec_svc = os.path.join(py_base, "src", "services", "execution_service.py")
    if os.path.exists(exec_svc):
        content = open(exec_svc).read()
        check("execute_code function", "def execute_code" in content)
        check("Python execution support", '"python"' in content)
        check("Shell execution support", '"shell"' in content)
        check("Timeout handling", "TimeoutExpired" in content)
        check("Output capture", "capture_output=True" in content)
        check("File modification tracking", "def snapshot_files" in content)
        check("Output size limit", "MAX_OUTPUT_SIZE" in content)

    # 6. Sandbox Service
    print("\n6. Sandbox Service")
    sandbox_svc = os.path.join(py_base, "src", "services", "sandbox_service.py")
    if os.path.exists(sandbox_svc):
        content = open(sandbox_svc).read()
        check("SandboxManager class", "class SandboxManager" in content)
        check("create_sandbox method", "def create_sandbox" in content)
        check("create_sandbox_env method", "def create_sandbox_env" in content)
        check("Venv creation", "venv" in content)
        check("Sandbox caching", "_cache" in content)
        check("Cleanup method", "def cleanup_sandbox" in content)

    # 7. Path Validation
    print("\n7. Path Validation")
    path_val = os.path.join(py_base, "src", "core", "path_validator.py")
    if os.path.exists(path_val):
        content = open(path_val).read()
        check("validate_path function", "def validate_path" in content)
        check("validate_project_path function", "def validate_project_path" in content)
        check("PathValidationError", "class PathValidationError" in content)
        check("realpath used for security", "realpath" in content)

    # 8. Node.js Integration
    print("\n8. Node.js Integration")
    client = os.path.join(node_base, "src", "services", "pythonToolsClient.js")
    check("pythonToolsClient.js exists", os.path.exists(client))
    if os.path.exists(client):
        content = open(client).read()
        check("renderTemplate function", "renderTemplate" in content)
        check("validateTemplate function", "validateTemplate" in content)
        check("executeCode function", "executeCode" in content)
        check("generateDiff function", "generateDiff" in content)
        check("countTokens function", "countTokens" in content)
        check("isAvailable function", "isAvailable" in content)
        check("Error handling", "PYTHON_TOOLS_ERROR" in content)
        check("Timeout handling", "PYTHON_TOOLS_TIMEOUT" in content)

    # 9. Pydantic Models
    print("\n9. Pydantic Models")
    req_models = os.path.join(py_base, "src", "models", "requests.py")
    resp_models = os.path.join(py_base, "src", "models", "responses.py")
    if os.path.exists(req_models):
        content = open(req_models).read()
        check("RenderTemplateRequest model", "class RenderTemplateRequest" in content)
        check("ExecuteCodeRequest model", "class ExecuteCodeRequest" in content)
        check("ValidateTemplateRequest model", "class ValidateTemplateRequest" in content)
    if os.path.exists(resp_models):
        content = open(resp_models).read()
        check("RenderResult model", "class RenderResult" in content)
        check("ExecuteResult model", "class ExecuteResult" in content)
        check("ValidateResult model", "class ValidateResult" in content)
        check("ErrorResponse model", "class ErrorResponse" in content)

    # Summary
    print("\n" + "=" * 60)
    total = PASS + FAIL
    print(f"Results: {PASS}/{total} checks passed")
    if FAIL > 0:
        print(f"  {FAIL} checks FAILED")
        return 1
    else:
        print("  All checks PASSED ✓")
        return 0


if __name__ == "__main__":
    sys.exit(main())