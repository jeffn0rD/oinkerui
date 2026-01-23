# Prompt 2.5.0: Implement Python Tools Backend

## Task Description
Set up the Python FastAPI tools backend for Jinja2 template rendering and code execution.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get Python tools module spec
python3 tools/doc_query.py --query "spec/modules/backend_python_tools.yaml" --mode file --pretty

# Get render_template function spec
python3 tools/doc_query.py --query "spec/functions/backend_python_tools/render_template.yaml" --mode file --pretty

# Get execute_code function spec
python3 tools/doc_query.py --query "spec/functions/backend_python_tools/execute_code.yaml" --mode file --pretty

# Get create_sandbox function spec
python3 tools/doc_query.py --query "spec/functions/backend_python_tools/create_sandbox.yaml" --mode file --pretty

# Check current Python backend structure
ls -la backend/python/ 2>/dev/null || echo "Directory not found"
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview render_template function
python3 tools/code_generator.py --function backend_python_tools.render_template --preview

# Preview execute_code function
python3 tools/code_generator.py --function backend_python_tools.execute_code --preview
```

## Spec References
- **Module Spec**: spec/modules/backend_python_tools.yaml
- **Function Specs**:
  - spec/functions/backend_python_tools/render_template.yaml
  - spec/functions/backend_python_tools/execute_code.yaml
  - spec/functions/backend_python_tools/create_sandbox.yaml

## Requirements

### FastAPI Application Setup

1. **Project Structure**
   ```
   backend/python/
     app/
       __init__.py
       main.py           # FastAPI app
       routers/
         templates.py    # Template rendering endpoints
         execution.py    # Code execution endpoints
       services/
         template_service.py
         execution_service.py
         sandbox_service.py
       models/
         requests.py     # Pydantic models
         responses.py
     requirements.txt
     Dockerfile
   ```

2. **FastAPI Application**
   - Create main.py with FastAPI app
   - Configure CORS for Node.js backend
   - Health check endpoint
   - Error handling middleware

### Template Rendering

3. **Jinja2 Template Service**
   - POST /api/templates/render
   - Request: { template: string, variables: object }
   - Safe Jinja2 environment (sandboxed)
   - Allowed filters: json, trim, upper, lower, title, default
   - Disallowed: file access, imports, exec

4. **Template Validation**
   - POST /api/templates/validate
   - Check syntax without rendering
   - Return variable list

### Code Execution (Phase 3 prep)

5. **Sandbox Service**
   - Create isolated execution environment
   - Per-project working directory
   - Resource limits (timeout, memory)
   - Capture stdout/stderr

6. **Execute Endpoint**
   - POST /api/execute
   - Request: { code: string, language: string, projectId: string }
   - Supported: python, shell
   - Return: { stdout, stderr, exit_code, duration_ms }

### Integration

7. **Node.js Integration**
   - Update Node.js backend to call Python tools
   - Add PYTHON_TOOLS_URL to config
   - Create pythonToolsClient service

### Testing

8. **Add Tests**
   - pytest for Python backend
   - Test template rendering
   - Test sandboxed execution
   - Integration tests

## Verification
- [ ] FastAPI app starts and responds
- [ ] Template rendering works with variables
- [ ] Jinja2 sandbox prevents unsafe operations
- [ ] Code execution works in sandbox
- [ ] Node.js can call Python tools
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.5.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented Python tools backend with Jinja2 and execution"
```