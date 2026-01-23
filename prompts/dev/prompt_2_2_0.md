# Prompt 2.2.0: Implement Chat Forking

## Task Description
Implement chat forking functionality with optional message point and pruning support.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get fork_chat function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/fork_chat.yaml" --mode file --pretty

# Get Chat entity definition
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 50 "Chat:"

# Get context spec for forking behavior
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get current chat service implementation
cat backend/src/services/chatService.js

# Get slash command spec for /fork
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty | grep -A 20 "fork"
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview fork_chat function
python3 tools/code_generator.py --function backend_node.fork_chat --preview
```

## Spec References
- **Function Specs**:
  - spec/functions/backend_node/fork_chat.yaml
  - spec/functions/backend_node/create_chat.yaml
- **Entity Specs**:
  - spec/domain.yaml#Chat
  - spec/domain.yaml#Message
- **Command Spec**: spec/commands.yaml (fork command)

## Requirements

### Fork Functionality

1. **Basic Fork**
   - Create new chat as copy of existing chat
   - Copy all messages up to fork point
   - New chat has unique ID and name (e.g., "Original Name (fork)")
   - Set forked_from field to original chat ID

2. **Fork from Message Point**
   - Support --from <message_id> option
   - Copy messages up to and including specified message
   - Validate message exists in chat

3. **Pruning Option**
   - Support --prune flag
   - When pruning, exclude messages where:
     - is_discarded = true
     - include_in_context = false
   - Preserve message order and relationships

4. **Implementation Steps**

   a. **Update Chat Service**
      - Add forkChat function to chatService.js
      - Accept projectId, chatId, and options
      - Create new chat with copied messages
      - Handle pruning logic

   b. **Add API Endpoint**
      - POST /api/projects/:id/chats/:chatId/fork
      - Request body: { fromMessageId?, prune? }
      - Return new chat object

   c. **Integrate with Slash Command**
      - Handle /fork command in command executor
      - Parse --from and --prune flags
      - Call forkChat service

5. **Add Tests**
   - Unit tests for fork logic
   - Test fork from specific message
   - Test pruning behavior
   - Integration tests for API endpoint

## Verification
- [ ] Basic fork creates complete copy
- [ ] Fork from message point works correctly
- [ ] Pruning excludes discarded/excluded messages
- [ ] New chat has correct metadata (forked_from, name)
- [ ] /fork command works with all options
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.2.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented chat forking with pruning support"
```