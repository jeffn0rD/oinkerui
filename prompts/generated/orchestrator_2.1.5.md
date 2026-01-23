# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.1.5
- **Task Name**: Implement LLM Response Streaming
- **Task Goal**: Implement full LLM response streaming from OpenRouter to the frontend UI with SSE.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details
"No details specified"

## Task Additional Prompt 

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

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.1.5_summary.yaml
- **Review Previous Work**: Check log/task_{previous_task_id}_notes.yaml for context
- **Justification**: Provide clear justification for each step in the summary
- **Error Handling**: If errors occur, document in ./open_questions.yaml
- **Verification**: Create verification scripts in ./verify/ when possible
- **Manual Updates**: Keep system documentation (./man/*.yaml) up to date
- **Spec Consistency**: Verify spec file references when modifying specs
- **Clean Repository**: Remove temporary files when task is complete
- **Scope Control**: Stay within task scope; ask questions if unclear
- **Commit and Push**: ALWAYS commit and push after completing a task

### File Organization
- Task summaries: `log/task_2.1.5_summary.yaml`
- Task notes: `log/task_2.1.5_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.1.5_*.py`
- System manuals: `man/system_manual.yaml`, `man/user_manual.yaml`

### Completion Criteria
Before marking a task complete:
1. All task steps completed
2. All deliverables created
3. Tests passing (if applicable)
4. Documentation updated
5. Task moved from master_todo.yaml to log/tasks_completed.yaml
6. Task summary created in log/
7. Repository committed and pushed

## Context Gathering

Use the doc_query tool to gather relevant context:

```bash
# Get complete task information
python3 tools/doc_query.py --query &quot;2.1.5&quot; --mode task --pretty

# Example: Find tasks by name pattern
python3 tools/doc_query.py --query &quot;current[*].task.{name~pattern}&quot; --mode path --pretty

# Example: Find tasks with specific status
python3 tools/doc_query.py --query &quot;current[*].task.{status=active}&quot; --mode path --pretty

# Example: Complex predicate query
python3 tools/doc_query.py --query &quot;current[*].task.{name~Frontend AND priority>3}&quot; --mode path --pretty

# Search for specific keywords
python3 tools/doc_query.py --query &quot;keyword*&quot; --mode text --pretty

```

### Additional Query Examples

```bash
# Legacy path query (still supported)
python3 tools/doc_query.py --query "current[*].task.id=0.2" --mode path --pretty

# Search for specific content
python3 tools/doc_query.py --query "search term" --mode text --pretty

# Find related files by topic
python3 tools/doc_query.py --query "spec/spec.yaml" --mode related --pretty
```

## Next Steps After Completion

1. Run task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id 2.1.5
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete