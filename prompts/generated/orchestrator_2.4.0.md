# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.4.0
- **Task Name**: Implement Requery Functionality
- **Task Goal**: Implement the requery feature to regenerate LLM responses with response branching support.

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

# Prompt 2.4.0: Implement Requery Functionality

## Task Description
Implement the requery feature to regenerate LLM responses with response branching support.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get requery function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/requery.yaml" --mode file --pretty

# Get Message entity (parent_message_id for branching)
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 80 "Message:"

# Get context construction (requery excludes previous response)
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get slash command spec for /requery
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty | grep -A 15 "requery"

# Get current message service
cat backend/src/services/messageService.js
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview requery function
python3 tools/code_generator.py --function backend_node.requery --preview
```

## Spec References
- **Function Specs**:
  - spec/functions/backend_node/requery.yaml
  - spec/functions/backend_node/call_llm.yaml
  - spec/functions/backend_node/construct_context.yaml
- **Entity Specs**:
  - spec/domain.yaml#Message (parent_message_id field)
- **Command Spec**: spec/commands.yaml (requery command)

## Requirements

### Requery Logic

1. **Basic Requery**
   - Find last user message and assistant response
   - Mark previous response as discarded (is_discarded=true)
   - Construct context WITHOUT the previous response
   - Make new LLM call with same prompt
   - Save new response

2. **Response Branching**
   - Support keeping previous response as branch
   - Set parent_message_id on new response
   - Allow user to choose which response to keep
   - Track response alternatives

3. **Implementation Steps**

   a. **Create Requery Service Function**
      - Add requery function to messageService.js or new requeryService.js
      - Accept projectId, chatId, options
      - Options: { keepPrevious: boolean, modelId?, temperature? }

   b. **Add API Endpoint**
      - POST /api/projects/:id/chats/:chatId/requery
      - Request: { keepPrevious?, modelId?, temperature? }
      - Return: { original_response, new_response, branch_created }

   c. **Integrate with Slash Command**
      - Handle /requery command
      - Parse options (--keep, --model, --temp)
      - Call requery service

   d. **Update Context Construction**
      - Ensure discarded responses excluded
      - Handle branching in context

### Frontend Support

4. **Requery UI**
   - Add requery button to assistant messages
   - Show branching indicator if multiple responses
   - Allow switching between response branches

### Testing

5. **Add Tests**
   - Unit tests for requery logic
   - Test branching behavior
   - Test context excludes previous response
   - Integration tests for endpoint

## Verification
- [ ] Requery generates new response
- [ ] Previous response marked as discarded
- [ ] Context excludes discarded response
- [ ] Branching preserves both responses
- [ ] /requery command works
- [ ] UI shows requery option
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.4.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented requery functionality with response branching"
```

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.4.0_summary.yaml
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
- Task summaries: `log/task_2.4.0_summary.yaml`
- Task notes: `log/task_2.4.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.4.0_*.py`
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
python3 tools/doc_query.py --query &quot;2.4.0&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 2.4.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete