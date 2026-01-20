# Task Orchestrator Prompt

## Task Information
- **Task ID**: 0.2.5.3
- **Task Name**: Function Specification Framework
- **Task Goal**: Create detailed function specifications for 20+ critical functions with contracts, FOL algorithms, and complexity analysis.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details

# Prompt 0.2.5.3: Function Specification Framework

## Task Description
Create detailed function specifications for critical functions in each module. Use the function_spec_schema.yaml to create comprehensive specs including contracts, algorithms in FOL, complexity analysis, and LLM guidance.

## Context Gathering
```bash
python3 tools/doc_query.py --query "spec/modules/" --mode text --pretty
python3 tools/doc_query.py --query "spec/schemas/function_spec_schema.yaml" --mode file --pretty
```

## Requirements

Create function specifications for at least 20 critical functions across all modules:

### Backend Node Functions (8 functions)
1. **spec/functions/backend_node/create_project.yaml**
2. **spec/functions/backend_node/create_chat.yaml**
3. **spec/functions/backend_node/send_message.yaml**
4. **spec/functions/backend_node/construct_context.yaml**
5. **spec/functions/backend_node/call_llm.yaml**
6. **spec/functions/backend_node/parse_slash_command.yaml**
7. **spec/functions/backend_node/execute_command.yaml**
8. **spec/functions/backend_node/save_message.yaml**

### Frontend Svelte Functions (4 functions)
1. **spec/functions/frontend_svelte/render_message.yaml**
2. **spec/functions/frontend_svelte/handle_send_message.yaml**
3. **spec/functions/frontend_svelte/update_context_display.yaml**
4. **spec/functions/frontend_svelte/handle_slash_command.yaml**

### Python Tools Functions (3 functions)
1. **spec/functions/backend_python_tools/render_template.yaml**
2. **spec/functions/backend_python_tools/execute_code.yaml**
3. **spec/functions/backend_python_tools/create_sandbox.yaml**

### Git Integration Functions (3 functions)
1. **spec/functions/git_integration/init_repository.yaml**
2. **spec/functions/git_integration/auto_commit.yaml**
3. **spec/functions/git_integration/get_diff.yaml**

### Logging Functions (2 functions)
1. **spec/functions/logging_and_metrics/log_llm_request.yaml**
2. **spec/functions/logging_and_metrics/get_stats.yaml**

## Function Specification Template

Each function spec must include:

1. **Signature** - Complete parameter and return type definitions
2. **Contract** - Preconditions, postconditions, invariants, side effects
3. **Algorithm** - High-level steps, FOL specification, pseudocode
4. **Complexity** - Time and space complexity with analysis
5. **Data Access** - What entities are read/written
6. **Error Handling** - All error cases and recovery strategies
7. **Testing** - Unit test scenarios and edge cases
8. **LLM Guidance** - Implementation hints, examples, common mistakes

## Example: create_project.yaml

See spec/schemas/function_spec_schema.yaml for complete example.

Key requirements:
- FOL specification must be formal and complete
- Complexity analysis must be accurate
- All error cases must be documented
- LLM guidance must be actionable
- Test scenarios must cover edge cases

## Expected Outputs

20 function specification files in **spec/functions/{module_name}/{function_name}.yaml**

## Verification Steps

1. Validate all function specs against schema:
   ```bash
   python3 verify/validate_function_specs.py
   ```

2. Check that all FOL specifications are syntactically valid

3. Verify complexity analysis is reasonable

4. Ensure all referenced entities exist in domain.yaml

5. Check that all error cases have recovery strategies

## Notes

- Focus on Phase 1-2 critical path functions
- FOL should be implementable as assertions
- Pseudocode should be language-agnostic
- LLM guidance should include code examples
- Each spec should be 150-300 lines

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_0.2.5.3_summary.yaml
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
- Task summaries: `log/task_0.2.5.3_summary.yaml`
- Task notes: `log/task_0.2.5.3_notes.yaml` (if needed)
- Verification scripts: `verify/task_0.2.5.3_*.py`
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
python3 tools/doc_query.py --query &quot;0.2.5.3&quot; --mode task --pretty

# Get related specification files
python3 tools/doc_query.py --query &quot;spec/functions/backend_node/*.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/functions/frontend_svelte/*.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/functions/backend_python_tools/*.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/functions/git_integration/*.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/functions/logging_and_metrics/*.yaml&quot; --mode file --pretty

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

1. **Create agent prompts** in `prompts/agents/task_0.2.5.3/`
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
   python3 tools/task_cleanup.py --task-id 0.2.5.3
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete