# Task 2.5.0: Implement Python Tools Backend

## Phase 1: Project Structure Setup
- [x] Gather context from specs
- [ ] Create Python backend directory structure
- [ ] Create requirements.txt with dependencies
- [ ] Create Pydantic request/response models

## Phase 2: Core Services
- [ ] Create template_service.py (Jinja2 sandboxed rendering)
- [ ] Create sandbox_service.py (sandbox management)
- [ ] Create execution_service.py (code/shell execution)

## Phase 3: FastAPI Routers
- [ ] Create templates router (render, validate, filters)
- [ ] Create execution router (execute code/shell)
- [ ] Update main.py to register routers and middleware

## Phase 4: Node.js Integration
- [ ] Create pythonToolsClient service in Node.js backend
- [ ] Add PYTHON_TOOLS_URL to Node.js config (already done)

## Phase 5: Testing
- [ ] Create pytest tests for template service
- [ ] Create pytest tests for execution service
- [ ] Create pytest tests for API endpoints
- [ ] Run all tests and verify passing

## Phase 6: Verification & Cleanup
- [ ] Create verification script
- [ ] Run verification
- [ ] Create task summary
- [ ] Run task cleanup
- [ ] Commit and push