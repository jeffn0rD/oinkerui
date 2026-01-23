# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.2.0
- **Task Name**: Implement Chat Forking
- **Task Goal**: Implement chat forking functionality with optional message point and pruning support.

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

# Prompt 2.2.0: Implement Chat Forking

## Task Description
Implement chat forking functionality with optional message point and pruning support.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get fork_chat function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/fork_chat.yaml" --mode file --pretty

# Get Chat entity definition
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 50 "Chat:"

# Get context spec for forking behavior
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get current chat service implementation
cat backend/src/services/chatService.js

# Get slash command spec for /fork
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty | grep -A 20 "fork"
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview fork_chat function
python3 tools/code_generator.py --function backend_node.fork_chat --preview
```

## Spec References
- **Function Specs**:
  - spec/functions/backend_node/fork_chat.yaml
  - spec/functions/backend_node/create_chat.yaml
- **Entity Specs**:
  - spec/domain.yaml#Chat
  - spec/domain.yaml#Message
- **Command Spec**: spec/commands.yaml (fork command)

## Requirements

### Fork Functionality

1. **Basic Fork**
   - Create new chat as copy of existing chat
   - Copy all messages up to fork point
   - New chat has unique ID and name (e.g., "Original Name (fork)")
   - Set forked_from field to original chat ID

2. **Fork from Message Point**
   - Support --from <message_id> option
   - Copy messages up to and including specified message
   - Validate message exists in chat

3. **Pruning Option**
   - Support --prune flag
   - When pruning, exclude messages where:
     - is_discarded = true
     - include_in_context = false
   - Preserve message order and relationships

4. **Implementation Steps**

   a. **Update Chat Service**
      - Add forkChat function to chatService.js
      - Accept projectId, chatId, and options
      - Create new chat with copied messages
      - Handle pruning logic

   b. **Add API Endpoint**
      - POST /api/projects/:id/chats/:chatId/fork
      - Request body: { fromMessageId?, prune? }
      - Return new chat object

   c. **Integrate with Slash Command**
      - Handle /fork command in command executor
      - Parse --from and --prune flags
      - Call forkChat service

5. **Add Tests**
   - Unit tests for fork logic
   - Test fork from specific message
   - Test pruning behavior
   - Integration tests for API endpoint

## Verification
- [ ] Basic fork creates complete copy
- [ ] Fork from message point works correctly
- [ ] Pruning excludes discarded/excluded messages
- [ ] New chat has correct metadata (forked_from, name)
- [ ] /fork command works with all options
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.2.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented chat forking with pruning support"
```

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.2.0_summary.yaml
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
- Task summaries: `log/task_2.2.0_summary.yaml`
- Task notes: `log/task_2.2.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.2.0_*.py`
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
python3 tools/doc_query.py --query &quot;2.2.0&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.2.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete