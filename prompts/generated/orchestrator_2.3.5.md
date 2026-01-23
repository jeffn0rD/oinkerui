# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.3.5
- **Task Name**: Implement Cancel LLM Request
- **Task Goal**: Implement ability to cancel in-progress LLM requests with timeout configuration and UI feedback.

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

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.3.5_summary.yaml
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
- Task summaries: `log/task_2.3.5_summary.yaml`
- Task notes: `log/task_2.3.5_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.3.5_*.py`
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
python3 tools/doc_query.py --query &quot;2.3.5&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.3.5
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete