# Prompt 1.2.0: Implement Message Operations

## Task Description
Implement backend functions for creating, storing, and retrieving messages.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get backend_node module specification
python3 tools/doc_query.py --query "spec/modules/backend_node.yaml" --mode file --pretty

# Get send_message function specification
python3 tools/doc_query.py --query "spec/functions/backend_node/send_message.yaml" --mode file --pretty

# Get save_message function specification
python3 tools/doc_query.py --query "spec/functions/backend_node/save_message.yaml" --mode file --pretty

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
- sendMessage function
- saveMessage function
- getMessage function
- listMessages function
- Message persistence (JSONL)
- Message-chat relationship

### Functions to Implement

#### sendMessage
- **Purpose**: Process a user message in a chat, optionally calling the LLM for a response.
- **Signature**: `sendMessage(projectId: string, chatId: string, request: SendMessageRequest)`
- **Returns**: `SendMessageResponse` - Response containing user message, assistant message, and request log
- **Preconditions**:
  - projectId is valid UUID referencing active project
  - chatId is valid UUID referencing active chat in project
  - raw_text is non-empty string
- **Postconditions**:
  - User message is persisted to chat storage
  - If LLM called, assistant message is persisted
  - LLM request is logged
- **Spec**: `spec/functions/backend_node/send_message.yaml`

#### saveMessage
- **Purpose**: Persist a message to the chat's JSONL storage file. Handles both new
- **Signature**: `saveMessage(chatId: string, message: Message, options: SaveOptions)`
- **Returns**: `Message` - Saved message with any server-generated fields
- **Preconditions**:
  - chatId is valid UUID
  - Chat exists and has storage_path
  - message has required fields (id, role, content)
- **Postconditions**:
  - Message is persisted to JSONL file
  - If append: message is at end of file
  - If update: message replaces existing entry
- **Spec**: `spec/functions/backend_node/save_message.yaml`

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

- [ ] Unit tests for message operations
- [ ] Verify JSONL format
- [ ] Test message ordering

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.2.0
```

---
*Generated: 2026-01-21T17:28:55.372717*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.2.0&quot; --mode task --pretty*