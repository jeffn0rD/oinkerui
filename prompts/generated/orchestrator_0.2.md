# Task Orchestrator Prompt

## Task Information
- **Task ID**: 0.2
- **Task Name**: Create Root Project Structure
- **Task Goal**: Create the root project folder structure for frontend, backend, tests, docs, and scripts.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details

# Prompt 0.2.1: Create Root Project Structure

## Task Description
Create the root project folder structure for the oinkerui application. This includes directories for frontend, backend, tests, documentation, and scripts.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get phase 0 details
python3 tools/doc_query.py --query "phase_0" --mode text --pretty

# Get domain information
python3 tools/doc_query.py --query "domain.yaml" --mode file --pretty

# Get configuration details
python3 tools/doc_query.py --query "config.yaml" --mode file --pretty
```

## Requirements
Based on the specifications, create the following directory structure:

```
oinkerui/
├── frontend/          # Svelte frontend application
│   ├── src/
│   ├── public/
│   └── tests/
├── backend/           # FastAPI backend services
│   ├── src/
│   ├── tests/
│   └── tools/
├── docs/              # Project documentation
│   ├── architecture/
│   ├── api/
│   └── user/
├── scripts/           # Build and utility scripts
├── tests/             # Integration tests
└── .github/           # GitHub workflows (if needed)
```

## Steps to Complete

1. **Create the directory structure** using mkdir commands
2. **Add .gitkeep files** to empty directories to ensure they're tracked by Git
3. **Create a README.md** in each major directory explaining its purpose
4. **Verify the structure** by listing all created directories

## Expected Outputs

- All directories created as specified
- .gitkeep files in empty directories
- README.md files in major directories (frontend/, backend/, docs/, scripts/)
- A verification output showing the complete directory tree

## Verification Steps

1. Run `tree -L 2` to verify directory structure
2. Check that all README.md files exist and contain appropriate descriptions
3. Ensure .gitkeep files are present in empty directories

## Notes

- Keep directory names lowercase and use underscores for multi-word names
- Ensure the structure aligns with the domain model and configuration specifications
- This structure should support both local development (Phase 1-3) and server deployment (Phase 4+)

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_0.2_summary.yaml
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
- Task summaries: `log/task_0.2_summary.yaml`
- Task notes: `log/task_0.2_notes.yaml` (if needed)
- Verification scripts: `verify/task_0.2_*.py`
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
python3 tools/doc_query.py --query &quot;0.2&quot; --mode task --pretty

# Get related specification files
python3 tools/doc_query.py --query &quot;prompts/dev/prompt_0_2_1.md&quot; --mode file --pretty

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

1. **Create agent prompts** in `prompts/agents/task_0.2/`
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
   python3 tools/task_cleanup.py --task-id 0.2
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete