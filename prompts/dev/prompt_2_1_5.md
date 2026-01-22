# Prompt 2.1.5: Implement LLM Response Streaming

## Task Description
Implement full LLM response streaming from OpenRouter to the frontend UI, showing tokens as they arrive in real-time.

## Context Gathering
```bash
# Get LLM service implementation
cat backend/src/services/llmService.js

# Get OpenRouter API docs reference
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty | grep -A 30 "openrouter"

# Get UI spec for streaming
python3 tools/doc_query.py --query "spec/ui.yaml" --mode file --pretty | grep -A 20 "streaming"
```

## Requirements

### Backend Streaming
1. Modify callLLM to support streaming mode
2. Use Server-Sent Events (SSE) for real-time delivery
3. Handle stream interruption gracefully
4. Buffer partial tokens if needed

### API Endpoint
- GET /api/projects/:projectId/chats/:chatId/stream
- SSE endpoint for streaming responses
- Events: `token`, `done`, `error`

### Frontend Integration
1. EventSource connection to SSE endpoint
2. Real-time token display in message component
3. Typing indicator during streaming
4. Handle connection errors

### Implementation Steps

1. **Update LLM Service**
   - Add `stream: true` option to callLLM
   - Parse SSE response from OpenRouter
   - Yield tokens as they arrive

2. **Create SSE Route**
   - backend/src/routes/stream.js
   - Handle SSE connection lifecycle
   - Forward tokens from LLM to client

3. **Update Message Service**
   - Support streaming message creation
   - Append tokens to message content
   - Finalize message when stream completes

4. **Frontend Streaming Component**
   - StreamingMessage.svelte
   - Connect to SSE endpoint
   - Display tokens in real-time
   - Show cursor/typing indicator

5. **Add Tests**
   - Mock streaming responses
   - Test SSE connection handling
   - Test error recovery

## Verification
- [ ] Tokens appear in real-time
- [ ] Stream can be interrupted
- [ ] Errors handled gracefully
- [ ] Final message saved correctly
- [ ] UI shows streaming indicator
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.1.5
```