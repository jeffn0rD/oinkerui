# Prompt 2.3.0: Implement Live Context Size Display

## Task Description
Implement real-time context size estimation and display showing tokens vs model maximum.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get estimate_tokens function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/estimate_tokens.yaml" --mode file --pretty

# Get context_size_display component spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/context_size_display.yaml" --mode file --pretty

# Get get_context_preview function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/get_context_preview.yaml" --mode file --pretty

# Get context construction algorithm
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get current LLM service (has countTokens)
cat backend/src/services/llmService.js
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview estimate_tokens function
python3 tools/code_generator.py --function backend_node.estimate_tokens --preview

# Preview get_context_preview function
python3 tools/code_generator.py --function backend_node.get_context_preview --preview
```

## Spec References
- **Function Specs**:
  - spec/functions/backend_node/estimate_tokens.yaml
  - spec/functions/backend_node/get_context_preview.yaml
  - spec/functions/backend_node/construct_context.yaml
- **Component Specs**:
  - spec/functions/frontend_svelte/context_size_display.yaml
  - spec/functions/frontend_svelte/update_context_display.yaml
- **Config**: spec/config.yaml (model context limits)

## Requirements

### Backend Token Estimation

1. **Improve Token Counting**
   - Current: simple chars/4 estimation
   - Better: use tiktoken library for accurate counts
   - Support different tokenizers per model family
   - Cache tokenizer instances

2. **Create Context Preview Endpoint**
   - POST /api/projects/:id/chats/:chatId/context-preview
   - Request: { draftMessage?, modelId? }
   - Response:
     ```json
     {
       "messages": [...],
       "total_tokens": 1234,
       "max_tokens": 32000,
       "model": "openai/gpt-4",
       "truncation_applied": false,
       "excluded_count": 2,
       "breakdown": [
         { "id": "msg1", "tokens": 100, "included": true }
       ]
     }
     ```

3. **Model Context Limits**
   - Load model limits from config
   - Default limits for common models
   - Allow project-level override

### Frontend Display

4. **Create ContextSizeDisplay Component**
   - Show progress bar: current / max tokens
   - Color coding: green (<70%), yellow (70-90%), red (>90%)
   - Show model name
   - Optional: expandable breakdown

5. **Real-time Updates**
   - Update on message flag changes
   - Update on model selection change
   - Update as user types (debounced)
   - Update after message sent

6. **Integration**
   - Add to prompt input area
   - Show in chat header
   - Update context display function

### Testing

7. **Add Tests**
   - Unit tests for token estimation
   - Test context preview endpoint
   - Frontend component tests

## Verification
- [ ] Token estimation reasonably accurate
- [ ] Context preview returns correct data
- [ ] Display updates in real-time
- [ ] Color coding reflects usage level
- [ ] Model limits respected
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.3.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented live context size display with token estimation"
```