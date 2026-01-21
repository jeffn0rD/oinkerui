# Task Orchestrator Prompt

## Task Information
- **Task ID**: 1.1.0
- **Task Name**: Implement Chat CRUD Operations
- **Task Goal**: Implement backend functions for creating, reading, and managing chats within projects.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details

# Prompt 1.1.0: Implement Chat CRUD Operations

## Task Description
Implement backend functions for creating, reading, and managing chats within projects.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get backend_node module specification
python3 tools/doc_query.py --query "spec/modules/backend_node.yaml" --mode file --pretty

# Get create_chat function specification
python3 tools/doc_query.py --query "spec/functions/backend_node/create_chat.yaml" --mode file --pretty

# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Generate backend_node module scaffolding
python3 tools/code_generator.py --module backend_node --preview

# Or generate to files:
python3 tools/code_generator.py --module backend_node --output backend/src
```

## Requirements

### Focus Areas
- createChat function
- getChat function
- listChats function
- Chat data persistence
- Chat-project relationship

### Functions to Implement

#### createChat
- **Purpose**: Create a new chat within a project. Initializes the chat storage file,
- **Signature**: `createChat(projectId: string, options: CreateChatOptions)`
- **Returns**: `Chat` - Created chat object with ID and metadata
- **Preconditions**:
  - projectId is a valid UUID
  - Project with projectId exists
  - Project status is 'active'
- **Postconditions**:
  - Chat storage file exists at project/chats/{chat_id}.jsonl
  - Chat is registered in project's chat index
  - Chat status is 'active'
- **Spec**: `spec/functions/backend_node/create_chat.yaml`

### Module Dependencies

**backend_node** external dependencies:
- `fastify` ^4.26.0
- `@fastify/cors` ^9.0.0
- `@fastify/static` ^7.0.0
- `simple-git` ^3.22.0
- `axios` ^1.6.0
- `uuid` ^9.0.0
- `date-fns` ^3.3.0
- `tiktoken` ^1.0.0
- `slugify` ^1.6.0

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

- [ ] Unit tests for chat operations
- [ ] Verify chat belongs to project
- [ ] Test chat listing and retrieval

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.1.0
```

---
*Generated: 2026-01-21T17:28:55.317636*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.1.0&quot; --mode task --pretty*

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_1.1.0_summary.yaml
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
- Task summaries: `log/task_1.1.0_summary.yaml`
- Task notes: `log/task_1.1.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_1.1.0_*.py`
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
python3 tools/doc_query.py --query &quot;1.1.0&quot; --mode task --pretty

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

## Task Execution Steps

{execution_steps}

## Expected Outputs

{expected_outputs}

## Verification

{verification_steps}

## Agent Delegation (If Needed)

If this task requires specialized agents:

1. **Create agent prompts** in `prompts/agents/task_1.1.0/`
2. **Agent scope**: Each agent should have:
   - Clear, narrow objective
   - Specific input/output requirements
   - Verification criteria
   - Limited prompt guidance (only relevant to their scope)

3. **Agent coordination**:
   - Execute agents in sequence
   - Pass outputs between agents
   - Verify each agent's work before proceeding
   - Aggregate results

## Files Referenced

{files_referenced}

## Next Steps After Completion

1. Run task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id 1.1.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete