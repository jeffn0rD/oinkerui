# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.0.2
- **Task Name**: Module and Function Spec Review
- **Task Goal**: Specification files in ./spec/modules and ./spec/functions are consistent and ready for phase 2 development.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details
Review specifications for modules and functions.  They need to be ready and complete for phase 2 development.
Function signatures and algorithms should exist for planned development.  Everything must be consistent with existing codebase
and phase 2 targets.  Frontend UI doesn't have coverage here.  That will need to be generated.
Review the remaining phase 2 tasks (2.0.5 - 2.9.0) and thier associated prompts, make sure any new information is incorporated
so they will be used as ground source truth for further development.  Add references to any tool and appropriate doc_query's to
bring new spec information into the tasks.


## Task Additional Prompt 

# Prompt 2.0.2: Module and Function Spec Review

## Task Description
Review and update specification files in ./spec/modules and ./spec/functions to ensure they are consistent, complete, and ready for Phase 2 development.

## Context Gathering
```bash
# List all module specs
ls -la spec/modules/

# List all function specs
find spec/functions -name "*.yaml" | head -30

# Get Phase 2 spec requirements
python3 tools/doc_query.py --query "spec/spec.yaml" --mode file --pretty | grep -A 100 "phase_2"

# Get current Phase 2 tasks
python3 tools/task_manager.py list --status current
```

## Requirements

### 1. Module Specification Review
For each module in spec/modules/:
- Verify all Phase 2 functions are listed
- Check dependencies are accurate
- Ensure error handling strategies are defined
- Verify LLM implementation guidance is present

### 2. Function Specification Review
For each function in spec/functions/:
- Verify signature matches implementation (if exists)
- Check algorithm steps are complete
- Ensure preconditions/postconditions are defined
- Verify error cases are documented

### 3. Phase 2 Feature Coverage
Ensure specs exist for:
- Message context flags (include_in_context, is_aside, pure_aside, is_pinned, is_discarded)
- Slash command parsing and execution
- Chat forking with pruning
- Live context size estimation
- Requery functionality
- LLM response streaming
- Cancel/timeout handling
- Template rendering (Jinja2)

### 4. Frontend UI Specifications
Generate specifications for frontend components:
- Message flag controls
- Context size display
- Cancel button
- Streaming message display
- Template selector

### 5. Task Prompt Updates
Review tasks 2.0.5 - 2.9.0 and update prompts to:
- Reference relevant spec files
- Include doc_query commands for context
- Reference code_generator.py for scaffolding
- Ensure consistency with existing codebase

## Implementation Steps

1. **Audit Module Specs**
   - Review each module in spec/modules/
   - Add missing Phase 2 functions
   - Update dependencies

2. **Audit Function Specs**
   - Review each function in spec/functions/
   - Add missing specs for Phase 2 features
   - Verify algorithms match implementation

3. **Create Missing Specs**
   - Frontend UI component specs
   - Cancel/timeout function specs
   - Streaming function specs

4. **Update Task Prompts**
   - Add spec references to each task
   - Add doc_query commands
   - Add code_generator commands

5. **Validate Consistency**
   - Run spec validation tools
   - Check cross-references
   - Verify with existing code

## Verification
- [ ] All module specs reviewed and updated
- [ ] All function specs reviewed and updated
- [ ] Missing Phase 2 specs created
- [ ] Frontend UI specs generated
- [ ] Task prompts updated with spec references
- [ ] Spec validation passes

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.0.2
```

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.0.2_summary.yaml
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
- Task summaries: `log/task_2.0.2_summary.yaml`
- Task notes: `log/task_2.0.2_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.0.2_*.py`
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
python3 tools/doc_query.py --query &quot;2.0.2&quot; --mode task --pretty

# Get related specification files
python3 tools/doc_query.py --query &quot;spec/**&quot; --mode file --pretty

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
   python3 tools/task_cleanup.py --task-id 2.0.2
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete