# Prompt 2.3.0: Implement Live Context Size Display

## Task Description
Implement real-time context size estimation and display, showing estimated tokens vs model maximum for the current model.

## Context Gathering
```bash
# Get context construction spec
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get UI spec for context display
python3 tools/doc_query.py --query "spec/ui.yaml" --mode file --pretty | grep -A 30 "context"

# Get update_context_display function spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/update_context_display.yaml" --mode file --pretty
```

## Requirements

### Context Size Features
1. Estimate token count for current context
2. Show current tokens vs model maximum
3. Update on:
   - Message flag changes
   - Model selection changes
   - New messages added
   - Message edits
4. Visual indicator (progress bar, color coding)

### Implementation Steps

1. **Add Token Estimation to Backend**
   - backend/src/services/tokenService.js
   - estimateTokens(messages, model) -> number
   - Use tiktoken or simple word-based estimation
   - Cache model token limits

2. **Add API Endpoint**
   - GET /api/projects/:projectId/chats/:chatId/context-size
   - Returns: { estimatedTokens, modelLimit, percentage }

3. **Create Context Display Component**
   - frontend/src/lib/components/ContextSizeDisplay.svelte
   - Progress bar showing usage
   - Color coding (green/yellow/red)
   - Tooltip with details

4. **Add Context Store**
   - Track context size in real-time
   - Subscribe to message changes
   - Debounce API calls

5. **Add Tests**
   - Token estimation accuracy
   - API endpoint tests
   - Component rendering tests
   - Update trigger tests

## Verification
- [ ] Token estimation reasonably accurate
- [ ] Display updates on message changes
- [ ] Display updates on model change
- [ ] Visual indicators work correctly
- [ ] Performance acceptable (debounced)
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.3.0
```