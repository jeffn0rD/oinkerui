# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.3.0
- **Task Name**: Implement Live Context Size Display
- **Task Goal**: Implement real-time context size estimation and display showing tokens vs model maximum.

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

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.3.0_summary.yaml
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
- Task summaries: `log/task_2.3.0_summary.yaml`
- Task notes: `log/task_2.3.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.3.0_*.py`
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
python3 tools/doc_query.py --query &quot;2.3.0&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.3.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete