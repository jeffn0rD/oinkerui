# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.6.5
- **Task Name**: Implement Frontend-Backend Integration
- **Task Goal**: Complete frontend-backend integration with API calls, real-time updates, and smooth UX.

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

# Prompt 2.6.5: Implement Frontend-Backend Integration

## Task Description
Complete frontend-backend integration with API calls, real-time updates, and smooth UX.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get API spec
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty

# Get API client spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/api_client.yaml" --mode file --pretty

# Get frontend module spec
python3 tools/doc_query.py --query "spec/modules/frontend_svelte.yaml" --mode file --pretty

# Check current frontend API client
cat frontend/src/lib/api/client.js 2>/dev/null || echo "File not found"

# Check backend routes
ls backend/src/routes/
```

## Spec References
- **API Spec**: spec/apis.yaml
- **Function Specs**:
  - spec/functions/frontend_svelte/api_client.yaml
  - spec/functions/frontend_svelte/handle_send_message.yaml
- **Module Specs**:
  - spec/modules/frontend_svelte.yaml
  - spec/modules/backend_node.yaml

## Requirements

### API Client Completion

1. **Complete API Client Methods**
   - All project CRUD operations
   - All chat CRUD operations
   - Message operations (list, send, update flags)
   - Streaming message support
   - Context preview
   - Cancel request
   - Template operations

2. **Error Handling**
   - Typed error classes (ApiError, NetworkError, ValidationError)
   - Consistent error format
   - User-friendly error messages
   - Retry logic for transient errors

3. **Request/Response Handling**
   - Request interceptors (auth headers if needed)
   - Response interceptors (error transformation)
   - Loading state management
   - Request cancellation support

### State Management Integration

4. **Svelte Stores**
   - projectsStore: { list, selected, loading, error }
   - chatsStore: { list, selected, loading, error }
   - messagesStore: { list, streaming, loading, error }
   - uiStore: { sidebarOpen, theme, etc. }

5. **Store Actions**
   - loadProjects(), selectProject(id)
   - loadChats(projectId), selectChat(id)
   - loadMessages(chatId), sendMessage(content)
   - updateMessageFlags(messageId, flags)

### Real-time Features

6. **Streaming Integration**
   - Connect streaming endpoint to UI
   - Update messagesStore during stream
   - Handle stream completion
   - Handle stream errors/cancellation

7. **Optimistic Updates**
   - Show user message immediately
   - Show loading state for response
   - Rollback on error

### UX Polish

8. **Loading States**
   - Skeleton loaders for lists
   - Spinner for actions
   - Disabled states during loading

9. **Error Display**
   - Toast notifications for errors
   - Inline error messages
   - Retry buttons

10. **Keyboard Navigation**
    - Tab navigation
    - Enter to send
    - Escape to cancel
    - Arrow keys for lists

### Testing

11. **Add Tests**
    - API client tests (mocked)
    - Store tests
    - Integration tests
    - E2E tests (basic flow)

## Verification
- [ ] All API endpoints connected
- [ ] Projects load and display
- [ ] Chats load and display
- [ ] Messages load and display
- [ ] Send message works (non-streaming)
- [ ] Streaming works end-to-end
- [ ] Message flags update correctly
- [ ] Error handling works
- [ ] Loading states display
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.6.5 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Completed frontend-backend integration"
```

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.6.5_summary.yaml
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
- Task summaries: `log/task_2.6.5_summary.yaml`
- Task notes: `log/task_2.6.5_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.6.5_*.py`
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
python3 tools/doc_query.py --query &quot;2.6.5&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.6.5
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete