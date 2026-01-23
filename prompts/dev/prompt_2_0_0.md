# Prompt 2.0.5: Implement Message Context Flags

## Task Description
Implement message context control flags (include_in_context, is_aside, pure_aside, is_pinned, is_discarded) in the backend and update the context construction algorithm.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get domain model for Message entity
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 100 "Message:"

# Get context construction algorithm (CRITICAL - follow this exactly)
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get update_message_flags function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/update_message_flags.yaml" --mode file --pretty

# Get construct_context function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/construct_context.yaml" --mode file --pretty

# Get current message service implementation
cat backend/src/services/messageService.js

# Get current LLM service implementation
cat backend/src/services/llmService.js
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview update_message_flags function
python3 tools/code_generator.py --function backend_node.update_message_flags --preview

# Preview construct_context function
python3 tools/code_generator.py --function backend_node.construct_context --preview
```

## Spec References
- **Domain Model**: spec/domain.yaml#Message - Message entity with all flag fields
- **Context Algorithm**: spec/context.yaml - 7-step context construction algorithm
- **Function Specs**:
  - spec/functions/backend_node/update_message_flags.yaml
  - spec/functions/backend_node/construct_context.yaml
  - spec/functions/backend_node/save_message.yaml

## Requirements

### Message Flags to Implement
1. `include_in_context` (boolean, default: true) - Whether message is included in LLM context
2. `is_aside` (boolean, default: false) - Aside messages excluded from future context
3. `pure_aside` (boolean, default: false) - Context ignores all prior messages
4. `is_pinned` (boolean, default: false) - Pinned messages always included
5. `is_discarded` (boolean, default: false) - Discarded messages never included

### Implementation Steps

1. **Update Message Schema**
   - Verify all flag fields exist in message structure
   - Update saveMessage to handle new flags with defaults
   - Implement updateMessageFlags function per spec

2. **Update Context Construction**
   - Modify constructContext in llmService.js
   - Implement the 7-step algorithm from spec/context.yaml EXACTLY:
     1. Prepare system prelude
     2. Handle pure_aside (terminates early)
     3. Filter prior messages (exclude discarded, aside, include_in_context=false)
     4. Order prior messages chronologically
     5. Assemble initial context
     6. Estimate tokens
     7. Truncate if needed (preserve pinned)
   - Handle pure_aside special case (context = system + current only)
   - Implement truncation with pinned message priority

3. **Add API Endpoints**
   - PATCH /api/projects/:projectId/chats/:chatId/messages/:messageId/flags
   - Update existing message endpoints to include flags in response

4. **Add Tests**
   - Unit tests for flag operations
   - Integration tests for context construction with flags
   - Test truncation behavior with pinned messages
   - Test pure_aside ignores all history

## Verification
- [ ] All message flags stored correctly with proper defaults
- [ ] Context construction follows spec/context.yaml algorithm exactly
- [ ] Pure aside ignores all history (only system + current)
- [ ] Pinned messages survive truncation
- [ ] Discarded messages never included
- [ ] Aside messages excluded from future context
- [ ] All tests passing
- [ ] API endpoint returns updated message

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.0.5 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented message context flags and updated context construction algorithm"
```