# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.8.0
- **Task Name**: Implement Aside and Pure Aside Functionality
- **Task Goal**: Implement complete aside and pure aside message functionality with context handling and UI feedback.

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

# Prompt 2.8.0: Implement Aside and Pure Aside Functionality

## Task Description
Implement complete aside and pure aside message functionality with context handling and UI feedback.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get context construction algorithm (aside handling)
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get Message entity (aside flags)
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 60 "Message:"

# Get slash commands for aside
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty | grep -A 20 "aside"

# Get handle_send_message spec (aside options)
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/handle_send_message.yaml" --mode file --pretty

# Get current context construction
cat backend/src/services/llmService.js | grep -A 50 "constructContext"
```

## Spec References
- **Context Spec**: spec/context.yaml (steps 2-3 for aside handling)
- **Command Spec**: spec/commands.yaml (/aside, /aside-pure)
- **Function Specs**:
  - spec/functions/backend_node/construct_context.yaml
  - spec/functions/frontend_svelte/handle_send_message.yaml
- **Entity Specs**:
  - spec/domain.yaml#Message (is_aside, pure_aside)

## Requirements

### Aside Behavior (is_aside=true)

1. **Context Behavior**
   - Aside message IS included in context for THAT turn
   - Aside message is EXCLUDED from future context
   - History before aside IS included in that turn's context

2. **Use Cases**
   - One-off questions that shouldn't pollute history
   - Temporary clarifications
   - Side conversations

### Pure Aside Behavior (pure_aside=true)

3. **Context Behavior**
   - Context for pure aside = system prelude + current message ONLY
   - ALL prior messages ignored
   - Response also marked as aside

4. **Use Cases**
   - Fresh start without history
   - Testing prompts in isolation
   - Avoiding context pollution

### Implementation

5. **Backend Updates**
   - Update constructContext to handle pure_aside (step 2 in spec)
   - Update constructContext to filter aside messages (step 3 in spec)
   - Ensure aside responses are also marked as aside

6. **Slash Commands**
   - /aside - Send message as aside
   - /aside-pure - Send message as pure aside
   - Parse and set flags before LLM call

7. **Frontend Updates**
   - Add aside options to send message
   - Keyboard shortcut: Ctrl+Shift+Enter for aside
   - Visual indicator in prompt input
   - Show aside status in message

8. **UI Indicators**
   - Aside messages: purple left border
   - Pure aside messages: pink left border
   - Tooltip explaining aside status
   - "Aside" badge on message

### Testing

9. **Add Tests**
   - Test aside excluded from future context
   - Test pure aside ignores all history
   - Test aside response also marked aside
   - Test slash commands
   - Integration tests

## Verification
- [ ] Aside messages included in current turn context
- [ ] Aside messages excluded from future context
- [ ] Pure aside context = system + current only
- [ ] /aside command works
- [ ] /aside-pure command works
- [ ] UI shows aside indicators
- [ ] Keyboard shortcuts work
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.8.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented aside and pure aside functionality"
```

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.8.0_summary.yaml
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
- Task summaries: `log/task_2.8.0_summary.yaml`
- Task notes: `log/task_2.8.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.8.0_*.py`
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
python3 tools/doc_query.py --query &quot;2.8.0&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.8.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete