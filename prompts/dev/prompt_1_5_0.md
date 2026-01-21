# Prompt 1.5.0: Implement Data Entity Management

## Task Description
Implement backend functions for creating and managing data entities (files and objects).

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Or generate to files:
```

## Requirements

### Focus Areas
- createDataEntity function
- getDataEntity function
- listDataEntities function
- File storage and retrieval
- JSON/YAML object storage
- Entity-project relationship

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

- [ ] Unit tests for entity operations
- [ ] Test file upload/download
- [ ] Test object serialization
- [ ] Verify path constraints

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.5.0
```

---
*Generated: 2026-01-21T17:28:55.486381*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.5.0&quot; --mode task --pretty*