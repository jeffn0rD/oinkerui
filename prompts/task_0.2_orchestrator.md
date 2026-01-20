# Task 0.2: Create Root Project Structure

## Prompt Guidance

Always follow these guidelines and update project documentation:
**** When possible and practical use deterministic methods (python code) to accomplish tasks.  ****
* When processing tasks always creae a brief summary of steps and actions in log/task_<id>_summary.yaml .
* when processing a task review the last task notes (log/task_<id>_notes.yaml).  There may be information needed or remaining work that needs to be completed first.
* In the task_<id>_summary.yaml file always provide 'justification:' for each step/action.  It is important to track the decisions made and reasoning behind them.
* If there are errors, inconsistencies, or inadequate information to accomplish all goals of a task append questions to ./open_questions.yaml
* If the task is complete mark it complete by removing the task from the list in this document and appending it to ./log/tasks_completed.yaml
* Tasks should be verified before considered complete, when possible use a small python script (save to ./verify/task_<id>_<descriptor>.py). The script should be well commented as to what it does and why.
* Always make sure system documentation is up to date with work just done! manuals go in ./man/*.yaml
* NOTE: All spec files need to have consistent references to each other.  This needs to be verified whenever spec files are changed.
**** You can create temporary files to assist with task completion but they should be removed when task is complete.  Use the files outlined here for project tracking. ****
**** It is important to keep the repository clean of uneccessary files. ****
**** Follow the task instructions closely and carefully.  Constrain work and scope to the task.  Return with questions if needed and confirm any extra work if it is outside the scope. ****
**** ALWAYS COMMIT AND PUSH the repository after a task. ****

---

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

**Get Full Task Details:**
```bash
python3 tools/doc_query.py --query &quot;0.2&quot; --mode task --pretty
```

**Files:**
- prompts/dev/prompt_0_2_1.md

**Focus Areas:**
- Directory structure creation
- README files for each major directory

**Prompt File:** ./prompts/dev/prompt_0_2_1.md

Review the detailed prompt file for specific instructions.

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_0.2_summary.yaml
- **Review Previous Work**: Check log/task_0.1_notes.yaml for context
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
# Get complete task information (RECOMMENDED - use this first)
python3 tools/doc_query.py --query "0.2" --mode task --pretty

# Get related specifications
python3 tools/doc_query.py --query "spec" --mode file --pretty

# Find related files by topic
python3 tools/doc_query.py --query "create_root_project_structure" --mode related --pretty

# Search for specific content
python3 tools/doc_query.py --query "search term" --mode text --pretty

# Use structured path queries for precise lookups
python3 tools/doc_query.py --query "current[*].task.name~Node" --mode path --pretty
```

## Task Execution Steps

1. Review task goal and requirements
2. Gather context using doc_query tool
3. Execute task steps
4. Verify completion
5. Document work in task summary

## Expected Outputs

- Task 0.2 completed successfully
- All deliverables created
- Task summary in log/task_0.2_summary.yaml
- Task moved to log/tasks_completed.yaml

## Verification

1. Run YAML validation:
   ```bash
   python3 verify/validate_yaml.py --all
   ```

2. Run task cleanup:
   ```bash
   python3 tools/task_cleanup.py --task-id 0.2
   ```

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

- prompts/dev/prompt_0_2_1.md

## Next Steps After Completion

1. Run task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id 0.2
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete