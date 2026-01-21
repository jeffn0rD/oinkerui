# Prompt 1.8.0: Implement Frontend State Management

## Task Description
Implement Svelte stores for managing application state (projects, chats, messages, UI).

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get frontend_svelte module specification
python3 tools/doc_query.py --query "spec/modules/frontend_svelte.yaml" --mode file --pretty

# Get update_context_display function specification
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/update_context_display.yaml" --mode file --pretty

# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Generate frontend_svelte module scaffolding
python3 tools/code_generator.py --module frontend_svelte --preview

# Or generate to files:
python3 tools/code_generator.py --module frontend_svelte --output frontend/src/lib
```

## Requirements

### Focus Areas
- projectStore implementation
- chatStore implementation
- messageStore implementation
- uiStore implementation
- State synchronization with backend
- Local state persistence

### Functions to Implement

#### updateContextDisplay
- **Purpose**: Update the context information display showing which messages are included
- **Signature**: `updateContextDisplay(messages: Message[], settings: ProjectSettings)`
- **Returns**: `ContextDisplayData` - Data for context display component
- **Preconditions**:
  - messages is array (may be empty)
  - settings has max_context_tokens
- **Postconditions**:
  - Returns accurate context statistics
  - Token count reflects included messages only
  - Status reflects context health
- **Spec**: `spec/functions/frontend_svelte/update_context_display.yaml`

### Module Dependencies

**frontend_svelte** external dependencies:
- `svelte` ^4.0.0
- `vite` ^5.0.0
- `tailwindcss` ^3.4.0
- `marked` ^12.0.0
- `highlight.js` ^11.9.0
- `dompurify` ^3.0.0

## Implementation Steps

1. **Generate Code Scaffolding**
   - Run the code generator to create function signatures
   - Review generated code structure and comments

2. **Implement Functions**
   - Follow the algorithm steps in each function spec
   - Implement precondition validation first
   - Handle all error cases from the spec
   - Ensure postconditions are satisfied

3. **Add Tests**
   - Create unit tests for each function
   - Test error cases and edge conditions
   - Verify contract compliance

4. **Integration**
   - Wire up API routes if applicable
   - Test end-to-end flow

## Verification

- [ ] Store unit tests
- [ ] Test state updates
- [ ] Test store subscriptions
- [ ] Verify persistence

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.8.0
```

---
*Generated: 2026-01-21T17:28:55.617263*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.8.0&quot; --mode task --pretty*