# Prompt 2.6.5: Implement Frontend-Backend Integration

## Task Description
Complete the frontend-backend integration to create a fully functional application for testing. Wire up all API calls, implement real-time updates, and ensure smooth user experience.

## Context Gathering
```bash
# Get API endpoints
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty | head -200

# Get current stores
cat frontend/src/lib/stores/syncStore.js

# Get backend routes
ls -la backend/src/routes/
```

## Requirements

### API Integration
1. All CRUD operations connected
2. Error handling with user feedback
3. Loading states for all operations
4. Optimistic updates where appropriate

### Real-time Features
1. SSE for streaming responses
2. Polling for updates (fallback)
3. Connection status indicator
4. Auto-reconnect on disconnect

### User Experience
1. Loading spinners/skeletons
2. Error toasts/notifications
3. Success confirmations
4. Keyboard shortcuts

### Implementation Steps

1. **API Client Setup**
   - frontend/src/lib/api/client.js
   - Base URL configuration
   - Error interceptor
   - Auth headers (future)

2. **Project API Integration**
   - Create project → API call
   - List projects on load
   - Delete project with confirmation
   - Update project settings

3. **Chat API Integration**
   - Create chat → API call
   - List chats for project
   - Delete/archive chat
   - Update chat settings

4. **Message API Integration**
   - Send message → API call
   - Load message history
   - Streaming response handling
   - Cancel request support

5. **Real-time Updates**
   - SSE connection manager
   - Handle streaming tokens
   - Update UI in real-time
   - Reconnection logic

6. **Error Handling**
   - Toast notification system
   - Error boundary component
   - Retry mechanisms
   - Offline detection

7. **Loading States**
   - Skeleton loaders
   - Button loading states
   - Progress indicators
   - Disable during operations

8. **Keyboard Shortcuts**
   - Enter to send (Ctrl+Enter for newline)
   - Escape to cancel
   - Ctrl+N new chat
   - Ctrl+P new project

## Verification
- [ ] Projects load on app start
- [ ] Can create new project
- [ ] Can create new chat
- [ ] Can send messages
- [ ] Responses stream in real-time
- [ ] Errors show notifications
- [ ] Loading states visible
- [ ] Keyboard shortcuts work
- [ ] App works after refresh

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.6.5
```