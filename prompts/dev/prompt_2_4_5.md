# Prompt 2.4.5: Implement Core Frontend Application

## Task Description
Implement the core frontend application with functional UI, dark theme, and modern power-user styling.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get frontend module spec
python3 tools/doc_query.py --query "spec/modules/frontend_svelte.yaml" --mode file --pretty

# Get UI spec
python3 tools/doc_query.py --query "spec/ui.yaml" --mode file --pretty

# Get frontend implementation spec
python3 tools/doc_query.py --query "spec/frontend_implementation.yaml" --mode file --pretty

# Get component specs
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/app_layout.yaml" --mode file --pretty
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/left_sidebar.yaml" --mode file --pretty
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/message_list.yaml" --mode file --pretty
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/message_item.yaml" --mode file --pretty
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/prompt_input.yaml" --mode file --pretty

# Get API client spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/api_client.yaml" --mode file --pretty

# Check current frontend structure
ls -la frontend/src/
```

## Spec References
- **Module Spec**: spec/modules/frontend_svelte.yaml
- **UI Spec**: spec/ui.yaml
- **Frontend Spec**: spec/frontend_implementation.yaml
- **Component Specs**:
  - spec/functions/frontend_svelte/app_layout.yaml
  - spec/functions/frontend_svelte/left_sidebar.yaml
  - spec/functions/frontend_svelte/message_list.yaml
  - spec/functions/frontend_svelte/message_item.yaml
  - spec/functions/frontend_svelte/prompt_input.yaml
  - spec/functions/frontend_svelte/api_client.yaml

## Requirements

### Application Structure

1. **Project Setup**
   - Svelte + Vite configuration
   - Tailwind CSS with dark theme
   - Directory structure:
     ```
     frontend/src/
       lib/
         components/    # UI components
         api/          # API client
         stores/       # Svelte stores
         utils/        # Utilities
       routes/         # Page routes
       app.html
       app.css
     ```

2. **Core Components**

   a. **AppLayout.svelte**
      - Three-column layout (left sidebar, main, right sidebar)
      - Resizable panels
      - Responsive behavior

   b. **LeftSidebar.svelte**
      - Project list with selection
      - Chat list for selected project
      - New project/chat buttons
      - Search/filter

   c. **MessageList.svelte**
      - Scrollable message container
      - Auto-scroll to bottom
      - Context highlighting
      - Streaming message support

   d. **MessageItem.svelte**
      - Role-based styling (user/assistant/system)
      - Markdown rendering
      - Code syntax highlighting
      - Flag indicators (pinned, aside, etc.)
      - Hover controls

   e. **PromptInput.svelte**
      - Multi-line textarea
      - Slash command autocomplete
      - Send button
      - Context size indicator
      - Keyboard shortcuts

3. **API Client**
   - Create frontend/src/lib/api/client.js
   - Implement all API methods from spec
   - Error handling
   - Request/response typing

4. **State Management**
   - Svelte stores for:
     - projects (list, selected)
     - chats (list, selected)
     - messages (current chat)
     - ui (sidebar state, loading)

5. **Styling**
   - Dark theme (gray-900 background)
   - Tailwind utility classes
   - Consistent spacing and typography
   - Hover and focus states

### Testing

6. **Add Tests**
   - Component tests with Testing Library
   - Store tests
   - API client tests (mocked)

## Verification
- [ ] App loads and displays correctly
- [ ] Projects list and selection works
- [ ] Chats list and selection works
- [ ] Messages display with proper formatting
- [ ] Markdown and code highlighting works
- [ ] Send message works (non-streaming)
- [ ] Dark theme applied consistently
- [ ] Responsive layout works
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.4.5 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented core frontend application with dark theme"
```