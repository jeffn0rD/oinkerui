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