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