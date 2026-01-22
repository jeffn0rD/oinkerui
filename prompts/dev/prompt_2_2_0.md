# Prompt 2.2.0: Implement Chat Forking

## Task Description
Implement chat forking functionality that allows users to create a new chat from an existing one, optionally from a specific message point, with optional pruning of excluded messages.

## Context Gathering
```bash
# Get chat fork workflow
python3 tools/doc_query.py --query "spec/workflows.yaml" --mode file --pretty | grep -A 50 "fork_chat"

# Get Chat entity definition
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 50 "Chat:"

# Get current chat service
cat backend/src/services/chatService.js
```

## Requirements

### Fork Behavior
1. Create new chat as copy of existing chat
2. Support forking from specific message (--from <message_id>)
3. Support pruning excluded messages (--prune flag)
4. Preserve message flags in forked chat
5. Set forked_from_chat_id and forked_at_message_id

### Implementation Steps

1. **Add Fork Function to Chat Service**
   - forkChat(projectId, chatId, options)
   - Options: { fromMessageId, prune }
   - Copy messages up to fork point
   - Apply pruning if requested

2. **Implement /chat-fork Command Handler**
   - Parse --from and --prune flags
   - Call forkChat service
   - Return new chat info

3. **Add API Endpoint**
   - POST /api/projects/:projectId/chats/:chatId/fork
   - Body: { fromMessageId?, prune? }

4. **Update Frontend**
   - Add fork button to chat UI
   - Fork dialog with options
   - Navigate to new chat after fork

5. **Add Tests**
   - Fork without options
   - Fork from specific message
   - Fork with pruning
   - Verify message preservation
   - Verify metadata set correctly

## Verification
- [ ] Fork creates new chat correctly
- [ ] Messages copied up to fork point
- [ ] Pruning removes excluded messages
- [ ] forked_from_chat_id set correctly
- [ ] forked_at_message_id set correctly
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.2.0
```