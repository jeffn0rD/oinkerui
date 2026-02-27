# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.7.0
- **Task Name**: Implement Message Flag UI Controls
- **Task Goal**: Implement frontend UI controls for managing message context flags with visual indicators.

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

# Prompt 2.7.0: Implement Message Flag UI Controls

## Task Description
Implement frontend UI controls for managing message context flags with visual indicators.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get message_flag_controls component spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/message_flag_controls.yaml" --mode file --pretty

# Get message_item component spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/message_item.yaml" --mode file --pretty

# Get update_message_flags function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/update_message_flags.yaml" --mode file --pretty

# Get Message entity with flags
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 60 "Message:"

# Get UI spec for flag indicators
python3 tools/doc_query.py --query "spec/ui.yaml" --mode file --pretty | grep -A 30 "flag"
```

## Spec References
- **Component Specs**:
  - spec/functions/frontend_svelte/message_flag_controls.yaml
  - spec/functions/frontend_svelte/message_item.yaml
- **Function Specs**:
  - spec/functions/backend_node/update_message_flags.yaml
- **Entity Specs**:
  - spec/domain.yaml#Message

## Requirements

### Flag Controls Component

1. **MessageFlagControls.svelte**
   - Toggle buttons for each flag:
     - include_in_context (eye icon)
     - is_pinned (pin icon)
     - is_aside (arrow-right icon)
     - is_discarded (trash icon)
   - Compact mode (icons only)
   - Full mode (icons + labels)
   - Disabled state

2. **Visual States**
   - Active: highlighted icon
   - Inactive: muted icon
   - Hover: tooltip with description
   - Disabled: grayed out

3. **Interactions**
   - Click to toggle
   - Keyboard accessible (Tab, Enter)
   - Immediate visual feedback
   - API call on change

### Message Item Integration

4. **Update MessageItem.svelte**
   - Show flag controls on hover
   - Position: top-right corner
   - Show flag indicators always visible:
     - Pinned: yellow pin icon
     - Aside: purple border
     - Pure aside: pink border
     - Discarded: strikethrough + dimmed

5. **Context Highlighting**
   - Messages in context: normal
   - Messages excluded: dimmed (opacity)
   - Visual distinction for why excluded

### API Integration

6. **Flag Update Flow**
   - User clicks flag toggle
   - Optimistic UI update
   - API call to update flag
   - Rollback on error
   - Toast notification on error

7. **Context Recalculation**
   - After flag change, recalculate context preview
   - Update context size display
   - Highlight affected messages

### Accessibility

8. **A11y Requirements**
   - ARIA labels for all buttons
   - Keyboard navigation
   - Screen reader announcements
   - Focus indicators

### Testing

9. **Add Tests**
   - Component tests for flag controls
   - Test all flag states
   - Test API integration
   - Test accessibility

## Verification
- [ ] All flag toggles work
- [ ] Visual indicators display correctly
- [ ] Hover controls appear/disappear
- [ ] API updates flags correctly
- [ ] Optimistic updates work
- [ ] Error handling works
- [ ] Context preview updates
- [ ] Keyboard accessible
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.7.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented message flag UI controls"
```

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.7.0_summary.yaml
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
- Task summaries: `log/task_2.7.0_summary.yaml`
- Task notes: `log/task_2.7.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.7.0_*.py`
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
python3 tools/doc_query.py --query &quot;2.7.0&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.7.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete