# Task Orchestrator Prompt

## Task Information
- **Task ID**: 1.7.0
- **Task Name**: Implement Core UI Components
- **Task Goal**: Implement Svelte components for project list, chat interface, and message display.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details
'focus':
  - "ProjectList component"
  - "ChatList component"
  - "MessageList component"
  - "MessageInput component"
  - "Component styling with Tailwind"
  - "Dark theme implementation"
'functions':
  - frontend_svelte/render_message.yaml
  - frontend_svelte/handle_send_message.yaml
'verification':
  - "Component unit tests"
  - "Visual regression tests"
  - "Test dark theme"
  - "Test responsive layout"

## Task Additional Prompt 

# Prompt 1.7.0: Implement Core UI Components

## Task Description
Implement Svelte components for project list, chat interface, and message display.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get frontend_svelte module specification
python3 tools/doc_query.py --query "spec/modules/frontend_svelte.yaml" --mode file --pretty

# Get render_message function specification
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/render_message.yaml" --mode file --pretty

# Get handle_send_message function specification
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/handle_send_message.yaml" --mode file --pretty

# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Generate frontend_svelte module scaffolding
python3 tools/code_generator.py --module frontend_svelte --preview

# Or generate to files:
python3 tools/code_generator.py --module frontend_svelte --output frontend/src/lib
```

## Requirements

### Focus Areas
- ProjectList component
- ChatList component
- MessageList component
- MessageInput component
- Component styling with Tailwind
- Dark theme implementation

### Functions to Implement

#### renderMessage
- **Purpose**: Render a chat message with proper formatting, markdown parsing, syntax
- **Signature**: `renderMessage(message: Message, options: RenderOptions)`
- **Returns**: `SvelteComponent` - Rendered message component
- **Preconditions**:
  - message is valid Message object
  - message.role is valid role
  - message.content is string
- **Postconditions**:
  - Returns renderable Svelte component
  - Markdown is parsed and sanitized
  - Code blocks have syntax highlighting
- **Spec**: `spec/functions/frontend_svelte/render_message.yaml`

#### handleSendMessage
- **Purpose**: Handle the user action of sending a message. Validates input, updates UI
- **Signature**: `handleSendMessage(content: string, options: SendOptions)`
- **Returns**: `Promise<SendResult>` - Result of send operation
- **Preconditions**:
  - Active project is selected
  - Active chat is selected
  - content is non-empty string
- **Postconditions**:
  - User message appears in chat
  - If not slash command: assistant message appears
  - Prompt input is cleared
- **Spec**: `spec/functions/frontend_svelte/handle_send_message.yaml`

### Module Dependencies

**frontend_svelte** external dependencies:
- `svelte` ^4.0.0
- `vite` ^5.0.0
- `tailwindcss` ^3.4.0
- `marked` ^12.0.0
- `highlight.js` ^11.9.0
- `dompurify` ^3.0.0

## Implementation Steps

1. **Generate Code Scaffolding**
   - Run the code generator to create function signatures
   - Review generated code structure and comments

2. **Implement Functions**
   - Follow the algorithm steps in each function spec
   - Implement precondition validation first
   - Handle all error cases from the spec
   - Ensure postconditions are satisfied

3. **Add Tests**
   - Create unit tests for each function
   - Test error cases and edge conditions
   - Verify contract compliance

4. **Integration**
   - Wire up API routes if applicable
   - Test end-to-end flow

## Verification

- [ ] Component unit tests
- [ ] Visual regression tests
- [ ] Test dark theme
- [ ] Test responsive layout

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.7.0
```

---
*Generated: 2026-01-21T17:28:55.580295*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.7.0&quot; --mode task --pretty*

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_1.7.0_summary.yaml
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
- Task summaries: `log/task_1.7.0_summary.yaml`
- Task notes: `log/task_1.7.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_1.7.0_*.py`
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
python3 tools/doc_query.py --query &quot;1.7.0&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 1.7.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete