# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.4.5
- **Task Name**: Implement Core Frontend Application
- **Task Goal**: Implement the core frontend application with functional UI, dark theme, and modern power-user styling.

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

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.4.5_summary.yaml
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
- Task summaries: `log/task_2.4.5_summary.yaml`
- Task notes: `log/task_2.4.5_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.4.5_*.py`
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
python3 tools/doc_query.py --query &quot;2.4.5&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.4.5
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete