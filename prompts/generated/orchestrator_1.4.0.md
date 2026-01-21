# Task Orchestrator Prompt

## Task Information
- **Task ID**: 1.4.0
- **Task Name**: Implement Logging and LLM Request Tracking
- **Task Goal**: Implement comprehensive logging system for LLM requests, chat logs, and system events.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details

# Prompt 1.4.0: Implement Logging and LLM Request Tracking

## Task Description
Implement comprehensive logging system for LLM requests, chat logs, and system events.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get logging_and_metrics module specification
python3 tools/doc_query.py --query "spec/modules/logging_and_metrics.yaml" --mode file --pretty

# Get log_llm_request function specification
python3 tools/doc_query.py --query "spec/functions/logging_and_metrics/log_llm_request.yaml" --mode file --pretty

# Get get_stats function specification
python3 tools/doc_query.py --query "spec/functions/logging_and_metrics/get_stats.yaml" --mode file --pretty

# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Generate logging_and_metrics module scaffolding
python3 tools/code_generator.py --module logging_and_metrics --preview

# Or generate to files:
python3 tools/code_generator.py --module logging_and_metrics --output backend/src
```

## Requirements

### Focus Areas
- logLLMRequest function
- LLMRequestLogEntry creation
- Chat log persistence (JSONL)
- System log configuration
- Token usage tracking
- Performance metrics

### Functions to Implement

#### logLLMRequest
- **Purpose**: Log an LLM request with full context including messages, usage statistics,
- **Signature**: `logLLMRequest(entry: LLMRequestLogEntry)`
- **Returns**: `LogResult` - Result of logging operation
- **Preconditions**:
  - entry has required fields
  - project_id references valid project
  - Log directory exists or can be created
- **Postconditions**:
  - Entry is appended to log file
  - Entry has unique ID
  - Timestamp is set
- **Spec**: `spec/functions/logging_and_metrics/log_llm_request.yaml`

#### getStats
- **Purpose**: Retrieve usage statistics and metrics for a project, chat, or globally.
- **Signature**: `getStats(scope: StatsScope, options: StatsOptions)`
- **Returns**: `Stats` - Aggregated statistics
- **Preconditions**:
  - scope.type is valid
  - If project scope, projectId exists
  - If chat scope, chatId exists
- **Postconditions**:
  - Returns accurate aggregated statistics
  - All counts are non-negative
  - Averages are correctly calculated
- **Spec**: `spec/functions/logging_and_metrics/get_stats.yaml`

### Module Dependencies

**logging_and_metrics** external dependencies:
- `pino` ^8.19.0
- `pino-pretty` ^10.3.0
- `rotating-file-stream` ^3.2.0

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

- [ ] Unit tests for logging functions
- [ ] Verify log file creation
- [ ] Test metrics aggregation
- [ ] Verify token counting

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.4.0
```

---
*Generated: 2026-01-21T17:28:55.476666*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.4.0&quot; --mode task --pretty*

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_1.4.0_summary.yaml
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
- Task summaries: `log/task_1.4.0_summary.yaml`
- Task notes: `log/task_1.4.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_1.4.0_*.py`
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
python3 tools/doc_query.py --query &quot;1.4.0&quot; --mode task --pretty

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

1. **Create agent prompts** in `prompts/agents/task_1.4.0/`
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
   python3 tools/task_cleanup.py --task-id 1.4.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete