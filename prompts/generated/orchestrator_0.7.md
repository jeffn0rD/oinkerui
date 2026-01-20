# Task Orchestrator Prompt

## Task Information
- **Task ID**: 0.7
- **Task Name**: Create Build and Development Scripts
- **Task Goal**: Create build scripts, development scripts, and utility scripts.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details

# Prompt 0.7: Create Build and Development Scripts

## Task Description
Create build scripts, development scripts, and utility scripts for running the application in different modes according to spec/workflows.yaml.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get workflow specifications (PRIMARY REFERENCE)
python3 tools/doc_query.py --query "spec/workflows.yaml" --mode file --pretty

# Get module specifications for startup requirements
python3 tools/doc_query.py --query "spec/modules/backend_node.yaml" --mode file --pretty
python3 tools/doc_query.py --query "spec/modules/backend_python_tools.yaml" --mode file --pretty
python3 tools/doc_query.py --query "spec/modules/frontend_svelte.yaml" --mode file --pretty

# Get configuration details
python3 tools/doc_query.py --query "spec/config.yaml" --mode file --pretty
```

## Requirements

### Scripts to Create

#### Development Scripts
- `dev.sh` / `dev.bat`: Start all services in development mode (Node.js + Python + Frontend)
- `dev-frontend.sh`: Start only frontend dev server (port 5173)
- `dev-backend.sh`: Start only Node.js backend (port 3000)
- `dev-python.sh`: Start only Python tools backend (port 8000)

#### Build Scripts
- `build.sh` / `build.bat`: Build all components for production
- `build-frontend.sh`: Build frontend only (Vite build)

#### Utility Scripts
- `setup.sh` / `setup.bat`: Initial project setup (install deps, create dirs, copy .env)
- `test.sh` / `test.bat`: Run all tests (frontend + backend)
- `lint.sh` / `lint.bat`: Run all linters
- `format.sh` / `format.bat`: Format all code
- `clean.sh` / `clean.bat`: Clean build artifacts and caches

## Steps to Complete

1. **Verify scripts/ directory exists** (created in task 0.2)

2. **Create main development script**
   
   **scripts/dev.sh**:
   ```bash
   #!/bin/bash
   set -e
   
   # Colors for output
   GREEN='\033[0;32m'
   BLUE='\033[0;34m'
   RED='\033[0;31m'
   NC='\033[0m' # No Color
   
   echo -e "${BLUE}Starting OinkerUI Development Environment...${NC}"
   
   # Check if .env exists
   if [ ! -f .env ]; then
       echo -e "${RED}Error: .env file not found. Run 'npm run setup' first.${NC}"
       exit 1
   fi
   
   # Function to cleanup on exit
   cleanup() {
       echo -e "\n${RED}Shutting down services...${NC}"
       kill 0
   }
   trap cleanup EXIT
   
   # Start Python backend
   echo -e "${GREEN}Starting Python tools backend (port 8000)...${NC}"
   cd backend_python && source ../venv/bin/activate 2>/dev/null || true
   python src/main.py &
   PYTHON_PID=$!
   cd ..
   
   # Start Node.js backend
   echo -e "${GREEN}Starting Node.js backend (port 3000)...${NC}"
   npm run dev:backend &
   NODE_PID=$!
   
   # Start frontend
   echo -e "${GREEN}Starting frontend dev server (port 5173)...${NC}"
   cd frontend && npm run dev &
   FRONTEND_PID=$!
   cd ..
   
   echo -e "${BLUE}All services started!${NC}"
   echo -e "Frontend: ${GREEN}http://localhost:5173${NC}"
   echo -e "Node.js API: ${GREEN}http://localhost:3000${NC}"
   echo -e "Python Tools: ${GREEN}http://localhost:8000${NC}"
   echo -e "\nPress Ctrl+C to stop all services"
   
   # Wait for all background processes
   wait
   ```
   
   **scripts/dev.bat**:
   ```batch
   @echo off
   echo Starting OinkerUI Development Environment...
   
   if not exist .env (
       echo Error: .env file not found. Run 'npm run setup' first.
       exit /b 1
   )
   
   start "Python Backend" cmd /k "cd backend_python && venv\Scripts\activate && python src/main.py"
   start "Node.js Backend" cmd /k "npm run dev:backend"
   start "Frontend" cmd /k "cd frontend && npm run dev"
   
   echo All services started!
   echo Frontend: http://localhost:5173
   echo Node.js API: http://localhost:3000
   echo Python Tools: http://localhost:8000
   ```

3. **Create individual service scripts**
   
   **scripts/dev-frontend.sh**:
   ```bash
   #!/bin/bash
   set -e
   cd frontend && npm run dev
   ```
   
   **scripts/dev-backend.sh**:
   ```bash
   #!/bin/bash
   set -e
   nodemon backend/src/index.js
   ```
   
   **scripts/dev-python.sh**:
   ```bash
   #!/bin/bash
   set -e
   source venv/bin/activate 2>/dev/null || true
   cd backend_python && python src/main.py
   ```

4. **Create build scripts**
   
   **scripts/build.sh**:
   ```bash
   #!/bin/bash
   set -e
   
   echo "Building OinkerUI for production..."
   
   # Build frontend
   echo "Building frontend..."
   cd frontend && npm run build
   cd ..
   
   # Verify backend files
   echo "Verifying backend files..."
   if [ ! -f backend/src/index.js ]; then
       echo "Error: Backend files not found"
       exit 1
   fi
   
   echo "Build complete!"
   echo "Frontend build: frontend/dist/"
   echo "Backend: backend/src/"
   echo "Python tools: backend_python/src/"
   ```
   
   **scripts/build.bat**:
   ```batch
   @echo off
   echo Building OinkerUI for production...
   
   echo Building frontend...
   cd frontend
   call npm run build
   cd ..
   
   echo Build complete!
   ```

5. **Create setup script**
   
   **scripts/setup.sh**:
   ```bash
   #!/bin/bash
   set -e
   
   echo "Setting up OinkerUI development environment..."
   
   # Install Node.js dependencies
   echo "Installing Node.js dependencies..."
   npm install
   
   # Install frontend dependencies
   echo "Installing frontend dependencies..."
   cd frontend && npm install
   cd ..
   
   # Set up Python virtual environment
   echo "Setting up Python virtual environment..."
   python3 -m venv venv
   source venv/bin/activate
   
   # Install Python dependencies
   echo "Installing Python dependencies..."
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   
   # Create .env from example
   if [ ! -f .env ]; then
       echo "Creating .env file..."
       cp .env.example .env
       echo "⚠️  IMPORTANT: Edit .env and set your OPENROUTER_API_KEY"
   fi
   
   # Create workspace directories
   echo "Creating workspace directories..."
   mkdir -p workspaces data backend_python/templates backend_python/sandboxes
   
   echo "✓ Setup complete!"
   echo ""
   echo "Next steps:"
   echo "1. Edit .env and set your OPENROUTER_API_KEY"
   echo "2. Run 'npm run dev' to start development servers"
   ```
   
   **scripts/setup.bat**:
   ```batch
   @echo off
   echo Setting up OinkerUI development environment...
   
   echo Installing Node.js dependencies...
   call npm install
   
   echo Installing frontend dependencies...
   cd frontend
   call npm install
   cd ..
   
   echo Setting up Python virtual environment...
   python -m venv venv
   call venv\Scripts\activate
   
   echo Installing Python dependencies...
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   
   if not exist .env (
       echo Creating .env file...
       copy .env.example .env
       echo IMPORTANT: Edit .env and set your OPENROUTER_API_KEY
   )
   
   echo Creating workspace directories...
   mkdir workspaces data backend_python\templates backend_python\sandboxes 2>nul
   
   echo Setup complete!
   ```

6. **Create test script**
   
   **scripts/test.sh**:
   ```bash
   #!/bin/bash
   set -e
   
   echo "Running all tests..."
   
   # Run backend tests
   echo "Running Node.js backend tests..."
   npm run test
   
   # Run Python tests
   echo "Running Python tests..."
   source venv/bin/activate
   cd backend_python && pytest
   cd ..
   
   # Run frontend tests
   echo "Running frontend tests..."
   cd frontend && npm run test
   cd ..
   
   echo "All tests passed!"
   ```

7. **Create lint and format scripts**
   
   **scripts/lint.sh**:
   ```bash
   #!/bin/bash
   set -e
   
   echo "Running linters..."
   
   # Lint Node.js backend
   echo "Linting Node.js backend..."
   npm run lint
   
   # Lint Python
   echo "Linting Python..."
   source venv/bin/activate
   flake8 backend_python/src
   mypy backend_python/src
   
   # Lint frontend
   echo "Linting frontend..."
   cd frontend && npm run lint
   cd ..
   
   echo "All linting passed!"
   ```
   
   **scripts/format.sh**:
   ```bash
   #!/bin/bash
   set -e
   
   echo "Formatting code..."
   
   # Format Node.js
   npm run format
   
   # Format Python
   source venv/bin/activate
   black backend_python/src
   
   # Format frontend
   cd frontend && npm run format
   cd ..
   
   echo "Code formatting complete!"
   ```

8. **Create clean script**
   
   **scripts/clean.sh**:
   ```bash
   #!/bin/bash
   
   echo "Cleaning build artifacts..."
   
   # Clean Node.js
   rm -rf node_modules
   rm -rf backend/node_modules
   rm -f package-lock.json
   
   # Clean frontend
   rm -rf frontend/node_modules
   rm -rf frontend/dist
   rm -f frontend/package-lock.json
   
   # Clean Python
   rm -rf venv
   rm -rf backend_python/__pycache__
   rm -rf backend_python/**/__pycache__
   rm -rf backend_python/.pytest_cache
   rm -rf backend_python/.mypy_cache
   
   # Clean workspace directories (optional - commented out for safety)
   # rm -rf workspaces/*
   # rm -rf data/*
   
   echo "Clean complete!"
   ```

9. **Update root package.json scripts**
   ```json
   {
     "scripts": {
       "dev": "bash scripts/dev.sh",
       "dev:frontend": "bash scripts/dev-frontend.sh",
       "dev:backend": "bash scripts/dev-backend.sh",
       "dev:python": "bash scripts/dev-python.sh",
       "build": "bash scripts/build.sh",
       "setup": "bash scripts/setup.sh",
       "test": "bash scripts/test.sh",
       "lint": "bash scripts/lint.sh",
       "format": "bash scripts/format.sh",
       "clean": "bash scripts/clean.sh"
     }
   }
   ```

10. **Make scripts executable**
    ```bash
    chmod +x scripts/*.sh
    ```

11. **Create scripts/README.md**
    ```markdown
    # Development Scripts
    
    ## Quick Start
    
    ```bash
    npm run setup   # First time setup
    npm run dev     # Start all services
    ```
    
    ## Available Scripts
    
    ### Development
    - `npm run dev` - Start all services (frontend + Node.js + Python)
    - `npm run dev:frontend` - Start only frontend (port 5173)
    - `npm run dev:backend` - Start only Node.js backend (port 3000)
    - `npm run dev:python` - Start only Python tools (port 8000)
    
    ### Build
    - `npm run build` - Build for production
    
    ### Testing
    - `npm run test` - Run all tests
    - `npm run lint` - Run all linters
    - `npm run format` - Format all code
    
    ### Utilities
    - `npm run setup` - Initial project setup
    - `npm run clean` - Clean build artifacts
    
    ## Platform Support
    
    - Linux/Mac: Use .sh scripts
    - Windows: Use .bat scripts or WSL
    ```

## Expected Outputs

- All development, build, and utility scripts created
- Both Unix (.sh) and Windows (.bat) versions for main scripts
- Scripts are executable and properly documented
- Root package.json updated with script shortcuts
- scripts/README.md documentation created

## Verification Steps

1. Run `npm run setup` to verify setup process
2. Run `npm run dev` to verify all services start correctly
3. Verify services are accessible:
   - Frontend: http://localhost:5173
   - Node.js API: http://localhost:3000/api/health
   - Python Tools: http://localhost:8000/health
4. Run `npm run build` to verify build process works
5. Run `npm run lint` to verify linting works
6. Test Ctrl+C gracefully shuts down all services

## Notes

- Use `set -e` in bash scripts to exit on error
- Add proper error handling and user feedback
- Use colors in terminal output for better UX
- Scripts use relative paths and work from project root
- The dev script uses trap to cleanup processes on exit
- Windows batch files open separate terminal windows for each service
- All scripts assume they're run from the project root directory
- Python virtual environment is activated automatically in scripts

## References

- Primary: `spec/workflows.yaml` - Workflow specifications
- `spec/modules/backend_node.yaml` - Node.js startup requirements
- `spec/modules/backend_python_tools.yaml` - Python startup requirements
- `spec/modules/frontend_svelte.yaml` - Frontend build requirements
- `spec/config.yaml` - Configuration and port specifications

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_0.7_summary.yaml
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
- Task summaries: `log/task_0.7_summary.yaml`
- Task notes: `log/task_0.7_notes.yaml` (if needed)
- Verification scripts: `verify/task_0.7_*.py`
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
python3 tools/doc_query.py --query &quot;0.7&quot; --mode task --pretty

# Get related specification files
python3 tools/doc_query.py --query &quot;prompts/dev/prompt_0_7_updated.md&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/workflows.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/modules/backend_node.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/modules/backend_python_tools.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/modules/frontend_svelte.yaml&quot; --mode file --pretty

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

1. **Create agent prompts** in `prompts/agents/task_0.7/`
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
   python3 tools/task_cleanup.py --task-id 0.7
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete