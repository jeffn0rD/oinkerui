# Prompt 2.4.0: Implement Requery Functionality

## Task Description
Implement the requery feature that allows users to regenerate the last LLM response, excluding the previous response from context.

## Context Gathering
```bash
# Get requery command definition
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty | grep -A 10 "requery"

# Get message flags for discarded
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 20 "is_discarded"

# Get current message service
cat backend/src/services/messageService.js
```

## Requirements

### Requery Behavior
1. Identify last prompt/response pair
2. Mark previous response as is_discarded=true
3. Resend the prompt to LLM
4. Store new response
5. Allow user to choose which response(s) to keep
6. Support multiple requeries (branching responses)

### Implementation Steps

1. **Add Requery Function to Message Service**
   - requeryLastTurn(projectId, chatId)
   - Find last user message and assistant response
   - Mark old response as discarded
   - Trigger new LLM call

2. **Implement /requery Command Handler**
   - Call requery service
   - Return new response

3. **Add API Endpoint**
   - POST /api/projects/:projectId/chats/:chatId/requery
   - Returns: new message

4. **Update Frontend**
   - Add requery button to last response
   - Show discarded responses (collapsed)
   - Allow restoring discarded responses

5. **Add Response Branching Support**
   - Track alternative responses
   - parent_message_id for response variants
   - UI to switch between variants

6. **Add Tests**
   - Basic requery flow
   - Multiple requeries
   - Response restoration
   - Context excludes discarded

## Verification
- [ ] Requery generates new response
- [ ] Old response marked discarded
- [ ] Discarded not in context
- [ ] Can restore discarded responses
- [ ] Multiple requeries work
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.4.0
```