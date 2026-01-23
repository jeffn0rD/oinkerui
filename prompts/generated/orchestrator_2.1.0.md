# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.1.0
- **Task Name**: Implement Slash Command Parser
- **Task Goal**: Implement the slash command parsing system in the Node.js backend for commands defined in spec/commands.yaml.

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

# Prompt 2.1.0: Implement Slash Command Parser

## Task Description
Implement the slash command parsing system in the Node.js backend for commands defined in spec/commands.yaml.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get slash command definitions
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty

# Get parse_slash_command function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/parse_slash_command.yaml" --mode file --pretty

# Get execute_slash_command function spec (execute_command.yaml)
python3 tools/doc_query.py --query "spec/functions/backend_node/execute_command.yaml" --mode file --pretty

# Get execute_slash_command function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/execute_slash_command.yaml" --mode file --pretty

# Get current message service (where commands are triggered)
cat backend/src/services/messageService.js
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview parse_slash_command function
python3 tools/code_generator.py --function backend_node.parse_slash_command --preview

# Preview execute_slash_command function
python3 tools/code_generator.py --function backend_node.execute_slash_command --preview
```

## Spec References
- **Command Definitions**: spec/commands.yaml - All slash commands with syntax and behavior
- **Function Specs**:
  - spec/functions/backend_node/parse_slash_command.yaml
  - spec/functions/backend_node/execute_slash_command.yaml
  - spec/functions/backend_node/execute_command.yaml

## Requirements

### Commands to Implement (Phase 2)
From spec/commands.yaml:
1. `/aside` - Mark message as aside (excluded from future context)
2. `/aside-pure` - Pure aside (context ignores all prior messages)
3. `/pin` - Pin/unpin message
4. `/discard` - Discard message from context
5. `/fork` - Fork chat (with --from and --prune options)
6. `/requery` - Regenerate last response
7. `/save` - Save entity
8. `/commit` - Git commit
9. `/template` - Apply template

### Implementation Steps

1. **Create Command Parser**
   - Create src/services/commandService.js
   - Implement parseSlashCommand function:
     - Detect if input starts with /
     - Extract command name
     - Parse arguments and flags
     - Validate against command registry
   - Return ParsedCommand object or null

2. **Create Command Registry**
   - Load command definitions from spec/commands.yaml
   - Store command metadata (name, args, flags, description)
   - Provide lookup and validation methods

3. **Create Command Executor**
   - Implement executeSlashCommand function
   - Dispatch to appropriate handler based on command
   - Handle command-specific logic
   - Return CommandResult

4. **Integrate with Message Flow**
   - Update sendMessage in messageService.js
   - Check for slash commands before LLM call
   - Execute command and return result
   - Some commands may still trigger LLM (e.g., /aside)

5. **Add Tests**
   - Unit tests for command parsing
   - Unit tests for each command handler
   - Integration tests for command execution

## Verification
- [ ] All Phase 2 commands parsed correctly
- [ ] Command arguments and flags extracted properly
- [ ] Invalid commands return appropriate errors
- [ ] Commands execute with correct side effects
- [ ] Command results returned to frontend
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.1.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented slash command parser and executor"
```

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.1.0_summary.yaml
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
- Task summaries: `log/task_2.1.0_summary.yaml`
- Task notes: `log/task_2.1.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.1.0_*.py`
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
python3 tools/doc_query.py --query &quot;2.1.0&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.1.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete