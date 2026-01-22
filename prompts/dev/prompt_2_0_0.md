# Prompt 2.0.0: Implement Message Context Flags

## Task Description
Implement message context control flags (include_in_context, is_aside, pure_aside, is_pinned, is_discarded) in the backend and update the context construction algorithm.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get domain model for Message entity
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 100 "Message:"

# Get context construction algorithm
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get current message service implementation
cat backend/src/services/messageService.js
```

## Requirements

### Message Flags to Implement
1. `include_in_context` (boolean, default: true) - Whether message is included in LLM context
2. `is_aside` (boolean, default: false) - Aside messages excluded from future context
3. `pure_aside` (boolean, default: false) - Context ignores all prior messages
4. `is_pinned` (boolean, default: false) - Pinned messages always included
5. `is_discarded` (boolean, default: false) - Discarded messages never included

### Implementation Steps

1. **Update Message Schema**
   - Add new fields to message structure in messageService.js
   - Update saveMessage to handle new flags
   - Add updateMessageFlags function

2. **Update Context Construction**
   - Modify constructContext in llmService.js
   - Implement the 7-step algorithm from spec/context.yaml
   - Handle pure_aside special case
   - Implement truncation with pinned message priority

3. **Add API Endpoints**
   - PUT /api/projects/:projectId/chats/:chatId/messages/:messageId/flags
   - Update existing message endpoints to include flags

4. **Add Tests**
   - Unit tests for flag operations
   - Integration tests for context construction with flags
   - Test truncation behavior with pinned messages

## Verification
- [ ] All message flags stored correctly
- [ ] Context construction follows spec algorithm
- [ ] Pure aside ignores history
- [ ] Pinned messages survive truncation
- [ ] Discarded messages never included
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.0.0
```