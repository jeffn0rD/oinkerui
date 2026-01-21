# Prompt 1.1.0: Implement Chat CRUD Operations

## Task Description
Implement backend functions for creating, reading, and managing chats within projects.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get backend_node module specification
python3 tools/doc_query.py --query "spec/modules/backend_node.yaml" --mode file --pretty

# Get create_chat function specification
python3 tools/doc_query.py --query "spec/functions/backend_node/create_chat.yaml" --mode file --pretty

# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Generate backend_node module scaffolding
python3 tools/code_generator.py --module backend_node --preview

# Or generate to files:
python3 tools/code_generator.py --module backend_node --output backend/src
```

## Requirements

### Focus Areas
- createChat function
- getChat function
- listChats function
- Chat data persistence
- Chat-project relationship

### Functions to Implement

#### createChat
- **Purpose**: Create a new chat within a project. Initializes the chat storage file,
- **Signature**: `createChat(projectId: string, options: CreateChatOptions)`
- **Returns**: `Chat` - Created chat object with ID and metadata
- **Preconditions**:
  - projectId is a valid UUID
  - Project with projectId exists
  - Project status is 'active'
- **Postconditions**:
  - Chat storage file exists at project/chats/{chat_id}.jsonl
  - Chat is registered in project's chat index
  - Chat status is 'active'
- **Spec**: `spec/functions/backend_node/create_chat.yaml`

### Module Dependencies

**backend_node** external dependencies:
- `fastify` ^4.26.0
- `@fastify/cors` ^9.0.0
- `@fastify/static` ^7.0.0
- `simple-git` ^3.22.0
- `axios` ^1.6.0
- `uuid` ^9.0.0
- `date-fns` ^3.3.0
- `tiktoken` ^1.0.0
- `slugify` ^1.6.0

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

- [ ] Unit tests for chat operations
- [ ] Verify chat belongs to project
- [ ] Test chat listing and retrieval

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.1.0
```

---
*Generated: 2026-01-21T17:28:55.317636*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.1.0&quot; --mode task --pretty*