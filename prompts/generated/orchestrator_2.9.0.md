# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.9.0
- **Task Name**: Phase 2 Integration and Testing
- **Task Goal**: Integrate all Phase 2 components and implement comprehensive end-to-end tests.

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

# Prompt 2.9.0: Phase 2 Integration and Testing

## Task Description
Integrate all Phase 2 components and implement comprehensive end-to-end tests.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get Phase 2 spec requirements
python3 tools/doc_query.py --query "spec/spec.yaml" --mode file --pretty | grep -A 100 "phase_2"

# Get all Phase 2 function specs
ls spec/functions/backend_node/
ls spec/functions/frontend_svelte/

# Get test configuration
cat backend/jest.config.js
cat frontend/vite.config.js

# Check current test coverage
npm test -- --coverage 2>/dev/null || echo "Run from backend directory"
```

## Spec References
- **Phase 2 Spec**: spec/spec.yaml#phase_2
- **All Module Specs**: spec/modules/*.yaml
- **All Function Specs**: spec/functions/**/*.yaml
- **Context Spec**: spec/context.yaml
- **Commands Spec**: spec/commands.yaml

## Requirements

### Integration Verification

1. **Feature Checklist**
   Verify all Phase 2 features work together:
   - [ ] Message context flags (include, aside, pure_aside, pinned, discarded)
   - [ ] Context construction algorithm (7 steps)
   - [ ] Slash command parsing and execution
   - [ ] LLM response streaming
   - [ ] Chat forking with pruning
   - [ ] Live context size display
   - [ ] Cancel LLM request
   - [ ] Requery functionality
   - [ ] Prompt templates with Jinja2
   - [ ] Message flag UI controls
   - [ ] Aside and pure aside

2. **Cross-Feature Testing**
   - Aside + streaming
   - Fork + context flags
   - Requery + streaming
   - Templates + slash commands
   - Cancel during streaming

### End-to-End Tests

3. **E2E Test Scenarios**

   a. **Basic Chat Flow**
   ```
   1. Create project
   2. Create chat
   3. Send message
   4. Receive streaming response
   5. Verify message saved
   ```

   b. **Context Management Flow**
   ```
   1. Send multiple messages
   2. Pin a message
   3. Mark message as aside
   4. Verify context preview
   5. Send new message
   6. Verify pinned included, aside excluded
   ```

   c. **Fork and Requery Flow**
   ```
   1. Create chat with messages
   2. Fork chat from specific message
   3. Verify forked chat has correct messages
   4. Requery last response
   5. Verify new response, old discarded
   ```

   d. **Template Flow**
   ```
   1. Create template
   2. List templates
   3. Resolve template with variables
   4. Send resolved template as message
   ```

   e. **Cancel Flow**
   ```
   1. Send message (streaming)
   2. Cancel during stream
   3. Verify partial content saved
   4. Verify clean state
   ```

### Test Infrastructure

4. **Backend Tests**
   - Unit tests for all services
   - Integration tests for API endpoints
   - E2E tests for full flows
   - Target: 85% coverage

5. **Frontend Tests**
   - Component tests
   - Store tests
   - Integration tests
   - E2E tests with Playwright/Cypress

6. **Test Utilities**
   - Test fixtures for projects, chats, messages
   - Mock OpenRouter responses
   - Test helpers for common operations

### Documentation

7. **Update Documentation**
   - API documentation
   - Component documentation
   - User guide for Phase 2 features
   - Developer setup guide

### Performance

8. **Performance Checks**
   - Context construction < 100ms
   - Token estimation < 50ms
   - UI responsive during streaming
   - No memory leaks

## Verification
- [ ] All Phase 2 features working
- [ ] E2E tests passing
- [ ] Backend test coverage >= 85%
- [ ] Frontend tests passing
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Performance acceptable

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.9.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Completed Phase 2 integration and testing"
```

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.9.0_summary.yaml
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
- Task summaries: `log/task_2.9.0_summary.yaml`
- Task notes: `log/task_2.9.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.9.0_*.py`
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
python3 tools/doc_query.py --query &quot;2.9.0&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.9.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete