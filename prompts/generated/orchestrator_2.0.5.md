# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.0.5
- **Task Name**: Implement Message Context Flags
- **Task Goal**: Implement message context control flags (include_in_context, is_aside, pure_aside, is_pinned, is_discarded) in the backend and update the context construction algorithm.

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

# Prompt 2.0.5: Implement Message Context Flags

## Task Description
Implement message context control flags (include_in_context, is_aside, pure_aside, is_pinned, is_discarded) in the backend and update the context construction algorithm.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get domain model for Message entity
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 100 "Message:"

# Get context construction algorithm (CRITICAL - follow this exactly)
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get update_message_flags function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/update_message_flags.yaml" --mode file --pretty

# Get construct_context function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/construct_context.yaml" --mode file --pretty

# Get current message service implementation
cat backend/src/services/messageService.js

# Get current LLM service implementation
cat backend/src/services/llmService.js
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview update_message_flags function
python3 tools/code_generator.py --function backend_node.update_message_flags --preview

# Preview construct_context function
python3 tools/code_generator.py --function backend_node.construct_context --preview
```

## Spec References
- **Domain Model**: spec/domain.yaml#Message - Message entity with all flag fields
- **Context Algorithm**: spec/context.yaml - 7-step context construction algorithm
- **Function Specs**:
  - spec/functions/backend_node/update_message_flags.yaml
  - spec/functions/backend_node/construct_context.yaml
  - spec/functions/backend_node/save_message.yaml

## Requirements

### Message Flags to Implement
1. `include_in_context` (boolean, default: true) - Whether message is included in LLM context
2. `is_aside` (boolean, default: false) - Aside messages excluded from future context
3. `pure_aside` (boolean, default: false) - Context ignores all prior messages
4. `is_pinned` (boolean, default: false) - Pinned messages always included
5. `is_discarded` (boolean, default: false) - Discarded messages never included

### Implementation Steps

1. **Update Message Schema**
   - Verify all flag fields exist in message structure
   - Update saveMessage to handle new flags with defaults
   - Implement updateMessageFlags function per spec

2. **Update Context Construction**
   - Modify constructContext in llmService.js
   - Implement the 7-step algorithm from spec/context.yaml EXACTLY:
     1. Prepare system prelude
     2. Handle pure_aside (terminates early)
     3. Filter prior messages (exclude discarded, aside, include_in_context=false)
     4. Order prior messages chronologically
     5. Assemble initial context
     6. Estimate tokens
     7. Truncate if needed (preserve pinned)
   - Handle pure_aside special case (context = system + current only)
   - Implement truncation with pinned message priority

3. **Add API Endpoints**
   - PATCH /api/projects/:projectId/chats/:chatId/messages/:messageId/flags
   - Update existing message endpoints to include flags in response

4. **Add Tests**
   - Unit tests for flag operations
   - Integration tests for context construction with flags
   - Test truncation behavior with pinned messages
   - Test pure_aside ignores all history

## Verification
- [ ] All message flags stored correctly with proper defaults
- [ ] Context construction follows spec/context.yaml algorithm exactly
- [ ] Pure aside ignores all history (only system + current)
- [ ] Pinned messages survive truncation
- [ ] Discarded messages never included
- [ ] Aside messages excluded from future context
- [ ] All tests passing
- [ ] API endpoint returns updated message

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.0.5 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented message context flags and updated context construction algorithm"
```

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.0.5_summary.yaml
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
- Task summaries: `log/task_2.0.5_summary.yaml`
- Task notes: `log/task_2.0.5_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.0.5_*.py`
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
python3 tools/doc_query.py --query &quot;2.0.5&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.0.5
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete