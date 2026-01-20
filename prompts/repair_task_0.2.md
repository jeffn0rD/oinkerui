# Task Repair Prompt

## Task Information
- **Task ID**: 0.2
- **Task Name**: Task 0.2
- **Status**: needs_repair

## Issues Found

The following issues were detected during task cleanup verification:

1. **ERROR**: Task 0.2 still in master_todo.yaml
   - File: `master_todo.yaml`
   - Action: Remove task 0.2 from master_todo.yaml

2. **ERROR**: Task 0.2 not in tasks_completed.yaml
   - File: `log/tasks_completed.yaml`
   - Action: Add task 0.2 to tasks_completed.yaml

3. **ERROR**: Task summary file missing: task_0.2_summary.yaml
   - File: `log\task_0.2_summary.yaml`
   - Action: Create log/task_0.2_summary.yaml with task completion details

4. **ERROR**: YAML validation failed


## Required Actions

- Remove task 0.2 from master_todo.yaml
- Add task 0.2 to tasks_completed.yaml
- Create log/task_0.2_summary.yaml with task completion details

## Verification Steps

After making the repairs:

1. Run the validation tool to verify fixes:
   ```bash
   python3 verify/validate_yaml.py --all --verbose
   ```

2. Run task-specific tests if applicable:
   ```bash
   python3 verify/validate_yaml.py --all
   ```

3. Verify all required files exist:
   - log/task_0.2_summary.yaml
- Entry in log/tasks_completed.yaml

4. Re-run the task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id 0.2
   ```

## Context

Task 0.2 cleanup found 4 issue(s) that need to be resolved.

## Prompt Guidance (Repair Scope)

When repairing issues:
- Focus ONLY on fixing the identified errors
- Do not make unrelated changes
- Preserve existing functionality
- Follow YAML syntax rules strictly
- Ensure all required fields are present
- Maintain consistent indentation (2 spaces)
- Test changes before committing

## Expected Outcome

After repairs:
- All YAML files validate successfully
- Task properly moved to tasks_completed.yaml
- All required log files exist
- All tests pass
- Repository is ready for commit

## Files to Modify

- log/tasks_completed.yaml
- log\task_0.2_summary.yaml
- master_todo.yaml

## Reference Documentation

Use the doc_query tool to gather additional context:
```bash
python3 tools/doc_query.py --query "0.2" --mode text --pretty
python3 tools/doc_query.py --query "prompt_guidance" --mode text --pretty
```