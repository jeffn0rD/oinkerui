# Prompt 2.3.5: Implement Cancel LLM Request

## Task Description
Implement ability to cancel in-progress LLM requests with timeout configuration and UI feedback.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get cancel_request function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/cancel_request.yaml" --mode file --pretty

# Get cancel_button component spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/cancel_button.yaml" --mode file --pretty

# Get cancel and timeout spec
python3 tools/doc_query.py --query "spec/cancel_and_timeout.yaml" --mode file --pretty

# Get current LLM service
cat backend/src/services/llmService.js
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview cancel_request function
python3 tools/code_generator.py --function backend_node.cancel_request --preview
```

## Spec References
- **Function Specs**:
  - spec/functions/backend_node/cancel_request.yaml
  - spec/functions/backend_node/stream_llm_response.yaml
- **Component Specs**:
  - spec/functions/frontend_svelte/cancel_button.yaml
- **Cancel Spec**: spec/cancel_and_timeout.yaml

## Requirements

### Backend Cancel Implementation

1. **Request Tracking**
   - Track active LLM requests per chat
   - Store AbortController reference
   - Map: chatId -> { requestId, controller, startTime }

2. **Cancel Endpoint**
   - POST /api/projects/:id/chats/:chatId/cancel
   - Find active request for chat
   - Call controller.abort()
   - Return cancellation result

3. **Update LLM Service**
   - Accept AbortSignal in callLLM and streamLLMResponse
   - Pass signal to axios/fetch
   - Handle AbortError gracefully
   - Clean up on abort

4. **Timeout Configuration**
   - Default timeout from config (e.g., 120s)
   - Per-request timeout option
   - Auto-cancel on timeout
   - Log timeout events

### Frontend Cancel Implementation

5. **Create CancelButton Component**
   - Show only during active request
   - Disabled state while cancelling
   - Visual feedback on click

6. **Update Chat View**
   - Track streaming state
   - Show cancel button during streaming
   - Handle cancel response
   - Show cancellation message

7. **API Client Update**
   - Add cancelRequest method
   - Handle abort in streaming

### Testing

8. **Add Tests**
   - Unit tests for cancel logic
   - Test timeout behavior
   - Integration tests for cancel endpoint
   - Frontend component tests

## Verification
- [ ] Active requests tracked correctly
- [ ] Cancel endpoint aborts request
- [ ] Partial content preserved on cancel
- [ ] Timeout auto-cancels request
- [ ] UI shows cancel button during streaming
- [ ] Cancellation feedback shown to user
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.3.5 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented cancel LLM request with timeout support"
```