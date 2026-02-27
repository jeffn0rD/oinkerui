# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.5.0
- **Task Name**: Implement Python Tools Backend
- **Task Goal**: Set up the Python FastAPI tools backend for Jinja2 template rendering and code execution.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details
"No details specified"

## Task Additional Prompt 

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

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.5.0_summary.yaml
- **Review Previous Work**: Check log/task_{previous_task_id}_notes.yaml for context
- **Justification**: Provide clear justification for each step in the summary
- **Error Handling**: If errors occur, document in ./open_questions.yaml
- **Verification**: Create verification scripts in ./verify/ when possible
- **Manual Updates**: Keep system documentation (./man/*.yaml) up to date
- **Spec Consistency**: Verify spec file references when modifying specs
- **Clean Repository**: Remove temporary files when task is complete
- **Scope Control**: Stay within task scope; ask questions if unclear
- **Commit and Push**: ALWAYS commit and push after completing a task

### File Organization
- Task summaries: `log/task_2.5.0_summary.yaml`
- Task notes: `log/task_2.5.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.5.0_*.py`
- System manuals: `man/system_manual.yaml`, `man/user_manual.yaml`

### Completion Criteria
Before marking a task complete:
1. All task steps completed
2. All deliverables created
3. Tests passing (if applicable)
4. Documentation updated
5. Task moved from master_todo.yaml to log/tasks_completed.yaml
6. Task summary created in log/
7. Repository committed and pushed

## Context Gathering

Use the doc_query tool to gather relevant context:

```bash
# Get complete task information
python3 tools/doc_query.py --query &quot;2.5.0&quot; --mode task --pretty

# Example: Find tasks by name pattern
python3 tools/doc_query.py --query &quot;current[*].task.{name~pattern}&quot; --mode path --pretty

# Example: Find tasks with specific status
python3 tools/doc_query.py --query &quot;current[*].task.{status=active}&quot; --mode path --pretty

# Example: Complex predicate query
python3 tools/doc_query.py --query &quot;current[*].task.{name~Frontend AND priority>3}&quot; --mode path --pretty

# Search for specific keywords
python3 tools/doc_query.py --query &quot;keyword*&quot; --mode text --pretty

```

### Additional Query Examples

```bash
# Legacy path query (still supported)
python3 tools/doc_query.py --query "current[*].task.id=0.2" --mode path --pretty

# Search for specific content
python3 tools/doc_query.py --query "search term" --mode text --pretty

# Find related files by topic
python3 tools/doc_query.py --query "spec/spec.yaml" --mode related --pretty
```

## Next Steps After Completion

1. Run task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id 2.5.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete