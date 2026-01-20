# Task Orchestrator Prompt

## Task Information
- **Task ID**: 0.4
- **Task Name**: Initialize Python Project
- **Task Goal**: Initialize Python project with requirements.txt and configure FastAPI dependencies.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details

# Prompt 0.4: Initialize Python Project

## Task Description
Initialize the Python project with requirements.txt, configure FastAPI dependencies according to the backend_python_tools module specification, and set up the Python development environment.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get backend Python tools module specification (PRIMARY REFERENCE)
python3 tools/doc_query.py --query "spec/modules/backend_python_tools.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty

# Get commands specifications
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty

# Get workflow specifications
python3 tools/doc_query.py --query "spec/workflows.yaml" --mode file --pretty
```

## Requirements

### Core Dependencies (from spec/modules/backend_python_tools.yaml)
The following dependencies are specified in the backend_python_tools module specification:

- **fastapi** ^0.109.0 - Web framework
- **uvicorn** ^0.27.0 - ASGI server
- **jinja2** ^3.1.0 - Template rendering
- **pydantic** ^2.6.0 - Data validation
- **tiktoken** ^0.6.0 - Token counting
- **python-multipart** ^0.0.9 - File upload handling

### Development Dependencies
- **pytest** ^7.4.0 - Testing framework
- **pytest-asyncio** ^0.21.0 - Async test support
- **black** ^23.11.0 - Code formatter
- **flake8** ^6.1.0 - Code linter
- **mypy** ^1.7.0 - Static type checker
- **httpx** ^0.26.0 - HTTP client for testing

## Steps to Complete

1. **Create requirements.txt** in the root directory
   ```
   fastapi>=0.109.0
   uvicorn[standard]>=0.27.0
   jinja2>=3.1.0
   pydantic>=2.6.0
   tiktoken>=0.6.0
   python-multipart>=0.0.9
   ```

2. **Create requirements-dev.txt** for development dependencies
   ```
   pytest>=7.4.0
   pytest-asyncio>=0.21.0
   black>=23.11.0
   flake8>=6.1.0
   mypy>=1.7.0
   httpx>=0.26.0
   ```

3. **Create pyproject.toml** for package and tool configuration
   ```toml
   [project]
   name = "oinkerui-python-tools"
   version = "1.0.0"
   description = "Python tools backend for OinkerUI - Jinja2 rendering and code execution"
   requires-python = ">=3.9"
   dependencies = [
       "fastapi>=0.109.0",
       "uvicorn[standard]>=0.27.0",
       "jinja2>=3.1.0",
       "pydantic>=2.6.0",
       "tiktoken>=0.6.0",
       "python-multipart>=0.0.9"
   ]

   [project.optional-dependencies]
   dev = [
       "pytest>=7.4.0",
       "pytest-asyncio>=0.21.0",
       "black>=23.11.0",
       "flake8>=6.1.0",
       "mypy>=1.7.0",
       "httpx>=0.26.0"
   ]

   [tool.black]
   line-length = 100
   target-version = ['py39']
   include = '\.pyi?$'

   [tool.mypy]
   python_version = "3.9"
   warn_return_any = true
   warn_unused_configs = true
   disallow_untyped_defs = true

   [tool.pytest.ini_options]
   asyncio_mode = "auto"
   testpaths = ["backend_python/tests"]
   ```

4. **Create .flake8** configuration
   ```ini
   [flake8]
   max-line-length = 100
   extend-ignore = E203, W503
   exclude = 
       .git,
       __pycache__,
       venv,
       .venv,
       build,
       dist
   ```

5. **Create backend_python directory structure** (as per module spec)
   ```bash
   mkdir -p backend_python/src/{routes,services,utils}
   mkdir -p backend_python/tests/{unit,integration}
   mkdir -p backend_python/templates
   mkdir -p backend_python/sandboxes
   ```

6. **Create placeholder main.py**
   ```python
   # backend_python/src/main.py
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   import uvicorn

   app = FastAPI(
       title="OinkerUI Python Tools",
       description="Jinja2 template rendering and code execution services",
       version="1.0.0"
   )

   # Configure CORS
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173", "http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

   @app.get("/health")
   async def health_check():
       return {"status": "ok", "service": "python-tools"}

   if __name__ == "__main__":
       uvicorn.run(app, host="0.0.0.0", port=8000)
   ```

7. **Create virtual environment setup script**
   
   **scripts/setup_python.sh** (Linux/Mac):
   ```bash
   #!/bin/bash
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   echo "Python environment setup complete!"
   ```
   
   **scripts/setup_python.bat** (Windows):
   ```batch
   @echo off
   python -m venv venv
   call venv\Scripts\activate
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   echo Python environment setup complete!
   ```

## Expected Outputs

- `requirements.txt` with core dependencies (versions matching module spec)
- `requirements-dev.txt` with development dependencies
- `pyproject.toml` for package configuration and tool settings
- `.flake8` configuration file
- Backend Python directory structure created
- Placeholder `backend_python/src/main.py` with basic FastAPI setup
- Setup scripts for virtual environment creation
- `venv/` directory (should be in .gitignore)

## Verification Steps

1. Create virtual environment: `python3 -m venv venv`
2. Activate: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
3. Install dependencies: `pip install -r requirements.txt -r requirements-dev.txt`
4. Run `pip list` to verify all packages are installed with correct versions
5. Run `python backend_python/src/main.py` to verify the server starts
6. Test health check: `curl http://localhost:8000/health`
7. Run `black --check backend_python/src` to verify Black is configured
8. Run `flake8 backend_python/src` to verify Flake8 is configured
9. Run `mypy backend_python/src` to verify MyPy is configured
10. Run `pytest backend_python/tests` to verify Pytest is configured

## Notes

- All dependency versions MUST match those specified in spec/modules/backend_python_tools.yaml
- Use Python 3.9+ as minimum version
- Ensure Black and Flake8 line length settings match (100)
- Add to .gitignore: venv/, .venv/, __pycache__/, *.pyc, .pytest_cache/, .mypy_cache/
- The Python backend runs on port 8000 by default
- Sandboxes directory will contain isolated execution environments
- Templates directory will contain Jinja2 templates

## Security Considerations

- Code execution will be sandboxed (implementation in later phases)
- Template rendering should sanitize inputs
- File operations should be restricted to designated directories
- Resource limits should be enforced for code execution

## References

- Primary: `spec/modules/backend_python_tools.yaml` - Complete module specification
- `spec/apis.yaml` - API endpoint specifications for Python tools
- `spec/commands.yaml` - Command execution specifications
- `spec/workflows.yaml` - Workflow integration details

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_0.4_summary.yaml
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
- Task summaries: `log/task_0.4_summary.yaml`
- Task notes: `log/task_0.4_notes.yaml` (if needed)
- Verification scripts: `verify/task_0.4_*.py`
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
python3 tools/doc_query.py --query &quot;0.4&quot; --mode task --pretty

# Get related specification files
python3 tools/doc_query.py --query &quot;prompts/dev/prompt_0_4_updated.md&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/modules/backend_python_tools.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/apis.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/commands.yaml&quot; --mode file --pretty

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

## Task Execution Steps

{execution_steps}

## Expected Outputs

{expected_outputs}

## Verification

{verification_steps}

## Agent Delegation (If Needed)

If this task requires specialized agents:

1. **Create agent prompts** in `prompts/agents/task_0.4/`
2. **Agent scope**: Each agent should have:
   - Clear, narrow objective
   - Specific input/output requirements
   - Verification criteria
   - Limited prompt guidance (only relevant to their scope)

3. **Agent coordination**:
   - Execute agents in sequence
   - Pass outputs between agents
   - Verify each agent's work before proceeding
   - Aggregate results

## Files Referenced

{files_referenced}

## Next Steps After Completion

1. Run task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id 0.4
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete