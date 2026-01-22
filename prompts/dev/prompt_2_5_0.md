# Prompt 2.5.0: Implement Python Tools Backend

## Task Description
Set up the Python FastAPI tools backend for Jinja2 template rendering and code execution support.

## Context Gathering
```bash
# Get Python tools module spec
python3 tools/doc_query.py --query "spec/modules/backend_python_tools.yaml" --mode file --pretty

# Get render_template function spec
python3 tools/doc_query.py --query "spec/functions/backend_python_tools/render_template.yaml" --mode file --pretty

# Get current Python backend structure
ls -la backend_python/src/
```

## Requirements

### Python Tools Features
1. FastAPI server on configurable port (default 8000)
2. Jinja2 template rendering with safe filters
3. Health check endpoint
4. CORS support for Node.js backend calls

### Implementation Steps

1. **Set Up FastAPI Application**
   - backend_python/src/main.py
   - Configure CORS
   - Add health endpoint
   - Add template rendering endpoint

2. **Implement Template Service**
   - backend_python/src/services/template_service.py
   - render_template(template_string, variables)
   - Safe Jinja2 environment (no file access)
   - Built-in filters: json_pretty, trim, upper, lower

3. **Add API Endpoints**
   - POST /api/templates/render
   - Body: { template, variables }
   - Returns: { rendered, errors? }

4. **Integrate with Node.js Backend**
   - Add Python tools client to Node.js
   - backend/src/services/pythonToolsService.js
   - Call Python backend for template rendering

5. **Add Tests**
   - Python unit tests (pytest)
   - Template rendering tests
   - Filter tests
   - Integration tests from Node.js

## Verification
- [ ] Python server starts correctly
- [ ] Template rendering works
- [ ] Safe filters available
- [ ] No unsafe operations allowed
- [ ] Node.js can call Python backend
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.5.0
```