# Prompt 2.9.0: Phase 2 Integration and Testing

## Task Description
Integrate all Phase 2 components and implement comprehensive end-to-end tests for the advanced chat context management features.

## Context Gathering
```bash
# Get Phase 2 spec
python3 tools/doc_query.py --query "spec/spec.yaml" --mode file --pretty | grep -A 100 "phase_2"

# Get all Phase 2 tasks completed
python3 tools/doc_query.py --query "log/tasks_completed.yaml" --mode file --pretty | grep -A 10 "2\."

# Get current E2E tests
cat backend/tests/e2e/fullWorkflow.test.js
```

## Requirements

### Integration Points
1. Message flags with context construction
2. Slash commands with message flow
3. Chat forking with message copying
4. Templates with Python backend
5. Requery with response branching
6. Context size display with flag changes

### E2E Test Scenarios
1. Complete aside workflow
2. Pure aside context isolation
3. Chat fork with pruning
4. Template rendering and sending
5. Requery and response selection
6. Context size updates
7. Slash command execution

### Implementation Steps

1. **Create Phase 2 E2E Test Suite**
   - backend/tests/e2e/phase2Workflow.test.js
   - Test all Phase 2 features end-to-end
   - Mock LLM calls appropriately

2. **Integration Testing**
   - Test flag changes affect context
   - Test commands modify state correctly
   - Test fork preserves data integrity
   - Test template variables resolve

3. **Performance Testing**
   - Context construction performance
   - Token estimation speed
   - Fork operation speed
   - Template rendering speed

4. **Error Handling Verification**
   - Invalid flag combinations
   - Fork from non-existent message
   - Template syntax errors
   - Python backend unavailable

5. **Documentation Updates**
   - Update API documentation
   - Update user manual
   - Add Phase 2 feature guide

6. **Final Verification**
   - All Phase 2 features working
   - All tests passing
   - Documentation complete
   - Ready for Phase 3

## Verification
- [ ] All Phase 2 features integrated
- [ ] E2E tests cover all scenarios
- [ ] Performance acceptable
- [ ] Error handling robust
- [ ] Documentation updated
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.9.0
```