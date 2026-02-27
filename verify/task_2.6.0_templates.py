#!/usr/bin/env python3
"""Verification script for Task 2.6.0: Prompt Templates System."""

import os
import sys

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

    print("=" * 60)
    print("Task 2.6.0 Verification: Prompt Templates System")
    print("=" * 60)

    # 1. Template Files
    print("\n1. Global Template Files")
    templates_dir = os.path.join(base, "templates", "global")
    check("Templates directory exists", os.path.isdir(templates_dir))
    template_files = ["code-review.yaml", "explain-concept.yaml", "write-tests.yaml", "refactor-code.yaml", "summarize.yaml"]
    for f in template_files:
        check(f"Template: {f}", os.path.exists(os.path.join(templates_dir, f)))

    # 2. Backend Template Service
    print("\n2. Backend Template Service")
    svc = os.path.join(base, "backend", "src", "services", "templateService.js")
    check("templateService.js exists", os.path.exists(svc))
    if os.path.exists(svc):
        content = open(svc).read()
        check("listTemplates function", "function listTemplates" in content)
        check("getTemplate function", "function getTemplate" in content)
        check("resolveTemplate function", "async function resolveTemplate" in content)
        check("simpleSubstitute function", "function simpleSubstitute" in content)
        check("Global templates loading", "loadGlobalTemplates" in content)
        check("Project templates loading", "loadProjectTemplates" in content)
        check("Template caching", "globalTemplatesCache" in content)
        check("Variable defaults", "varDef.default" in content)
        check("Jinja2 delegation", "pythonToolsClient" in content)
        check("YAML loading", "yaml.load" in content)

    # 3. Backend Routes
    print("\n3. Backend Template Routes")
    routes = os.path.join(base, "backend", "src", "routes", "templates.js")
    check("templates.js route exists", os.path.exists(routes))
    if os.path.exists(routes):
        content = open(routes).read()
        check("GET /api/templates", "'/api/templates'" in content)
        check("GET /api/templates/:templateId", "'/api/templates/:templateId'" in content)
        check("POST /api/templates/resolve", "'/api/templates/resolve'" in content)
        check("POST /api/templates/render-inline", "'/api/templates/render-inline'" in content)

    # 4. Route Registration
    print("\n4. Route Registration")
    index = os.path.join(base, "backend", "src", "index.js")
    if os.path.exists(index):
        content = open(index).read()
        check("Templates route registered", "routes/templates" in content)

    # 5. Frontend API
    print("\n5. Frontend Template API")
    api = os.path.join(base, "frontend", "src", "lib", "utils", "api.js")
    if os.path.exists(api):
        content = open(api).read()
        check("templateApi exported", "templateApi" in content)
        check("templateApi.list", "list:" in content and "/templates" in content)
        check("templateApi.resolve", "resolve:" in content)
        check("templateApi.renderInline", "renderInline" in content)

    # 6. Frontend Components
    print("\n6. Frontend Components")
    selector = os.path.join(base, "frontend", "src", "lib", "components", "TemplateSelector.svelte")
    check("TemplateSelector.svelte exists", os.path.exists(selector))
    if os.path.exists(selector):
        content = open(selector).read()
        check("Template list display", "filteredTemplates" in content)
        check("Variable input form", "variables" in content)
        check("Preview rendering", "preview" in content)
        check("Search functionality", "searchQuery" in content)
        check("Category filter", "selectedCategory" in content)
        check("Insert action", "handleInsert" in content)
        check("Modal dialog", 'role="dialog"' in content)

    # 7. MessageInput Integration
    print("\n7. MessageInput Integration")
    msg_input = os.path.join(base, "frontend", "src", "lib", "components", "MessageInput.svelte")
    if os.path.exists(msg_input):
        content = open(msg_input).read()
        check("TemplateSelector imported", "TemplateSelector" in content)
        check("Template button", "showTemplateSelector" in content)
        check("Ctrl+T shortcut", "Ctrl+T" in content or "ctrl" in content.lower())
        check("Template select handler", "handleTemplateSelect" in content)

    # 8. Component Index
    print("\n8. Component Index")
    idx = os.path.join(base, "frontend", "src", "lib", "components", "index.js")
    if os.path.exists(idx):
        content = open(idx).read()
        check("TemplateSelector exported", "TemplateSelector" in content)

    # 9. Tests
    print("\n9. Tests")
    test_file = os.path.join(base, "backend", "tests", "services", "templateService.test.js")
    check("templateService.test.js exists", os.path.exists(test_file))
    if os.path.exists(test_file):
        content = open(test_file).read()
        check("simpleSubstitute tests", "simpleSubstitute" in content)
        check("listTemplates tests", "listTemplates" in content)
        check("getTemplate tests", "getTemplate" in content)
        check("resolveTemplate tests", "resolveTemplate" in content)

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