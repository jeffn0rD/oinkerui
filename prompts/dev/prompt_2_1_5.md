# Prompt 2.1.5: Implement LLM Response Streaming

## Task Description
Implement full LLM response streaming from OpenRouter to the frontend UI with Server-Sent Events (SSE).

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get stream_llm_response function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/stream_llm_response.yaml" --mode file --pretty

# Get streaming_message component spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/streaming_message.yaml" --mode file --pretty

# Get current LLM service implementation
cat backend/src/services/llmService.js

# Get API spec for streaming endpoint
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty | grep -A 30 "stream"
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview stream_llm_response function
python3 tools/code_generator.py --function backend_node.stream_llm_response --preview
```

## Spec References
- **Function Specs**:
  - spec/functions/backend_node/stream_llm_response.yaml
  - spec/functions/backend_node/call_llm.yaml
- **Component Specs**:
  - spec/functions/frontend_svelte/streaming_message.yaml
- **Cancel Spec**: spec/cancel_and_timeout.yaml

## Requirements

### Backend Streaming Implementation

1. **Update LLM Service**
   - Add streamLLMResponse function to llmService.js
   - Use OpenRouter streaming API (stream: true)
   - Parse SSE chunks from OpenRouter
   - Yield content deltas to caller

2. **Create Streaming Endpoint**
   - POST /api/projects/:id/chats/:chatId/messages/stream
   - Return SSE response (Content-Type: text/event-stream)
   - Stream chunks as they arrive:
     ```
     event: chunk
     data: {"content": "partial text", "done": false}
     
     event: done
     data: {"message": {...}, "usage": {...}}
     ```
   - Handle errors gracefully with error events

3. **Track Active Requests**
   - Store active request references for cancellation
   - Clean up on completion or error
   - Support abort controller pattern

### Frontend Streaming Implementation

4. **Create StreamingMessage Component**
   - Display content as it streams
   - Show typing indicator
   - Handle markdown rendering incrementally
   - Show token count updating

5. **Update API Client**
   - Add sendMessageStream method
   - Use EventSource or fetch with ReadableStream
   - Parse SSE events
   - Yield chunks to caller

6. **Update Chat View**
   - Show StreamingMessage during streaming
   - Convert to regular message on completion
   - Handle errors and cancellation

### Testing

7. **Add Tests**
   - Unit tests for SSE parsing
   - Integration tests for streaming endpoint
   - Frontend tests for streaming display

## Verification
- [ ] OpenRouter streaming API called correctly
- [ ] SSE chunks sent to frontend in real-time
- [ ] Content displays incrementally
- [ ] Final message saved correctly
- [ ] Token usage tracked
- [ ] Errors handled gracefully
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.1.5 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented LLM response streaming with SSE"
```