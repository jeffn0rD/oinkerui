# Prompt 2.3.5: Implement Cancel LLM Request

## Task Description
Implement the ability to cancel in-progress LLM requests, tool executions, and workflows with proper cleanup and UI feedback.

## Context Gathering
```bash
# Get current LLM service
cat backend/src/services/llmService.js

# Get message service for request tracking
cat backend/src/services/messageService.js
```

## Requirements

### Cancel Functionality
1. Cancel in-progress LLM API calls
2. Cancel tool executions (Python backend)
3. Cancel workflows (future-proofing)
4. Proper cleanup on cancellation

### Timeout Configuration
1. LLM request timeout (default: 60s, configurable)
2. Tool execution timeout (default: 30s, configurable)
3. Per-project timeout overrides
4. Visual countdown/progress indicator

### Backend Implementation
1. Track active requests with AbortController
2. Store request state (pending, streaming, completed, cancelled)
3. Cleanup partial responses on cancel
4. Log cancellation events

### API Endpoints
- POST /api/projects/:projectId/chats/:chatId/cancel
- Cancel current active request for chat
- Returns: { cancelled: boolean, requestId }

### Frontend Implementation
1. Cancel button during LLM calls
2. Cancel button during streaming
3. Visual feedback (spinner → cancelled state)
4. Keyboard shortcut (Escape key)

### Implementation Steps

1. **Add Request Tracking**
   - backend/src/services/requestTracker.js
   - Track active requests per chat
   - Store AbortController references

2. **Update LLM Service**
   - Accept AbortSignal parameter
   - Handle abort during streaming
   - Clean up on cancellation

3. **Create Cancel Endpoint**
   - POST /api/.../cancel
   - Find and abort active request
   - Return cancellation status

4. **Update Config**
   - Add timeout settings
   - LLM timeout, tool timeout
   - Per-project overrides

5. **Frontend Cancel UI**
   - Cancel button component
   - Integrate with message input
   - Show during active requests
   - Escape key handler

6. **Add Tests**
   - Cancel during request
   - Cancel during streaming
   - Timeout behavior
   - Cleanup verification

## Verification
- [ ] Cancel stops LLM request
- [ ] Partial response cleaned up
- [ ] Timeout triggers automatically
- [ ] Cancel button visible during requests
- [ ] Escape key cancels
- [ ] Cancellation logged
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.3.5
```