# Task Repair Prompt

## Task Information
- **Task ID**: {task_id}
- **Task Name**: {task_name}
- **Status**: {status}

## Issues Found

The following issues were detected during task cleanup verification:

{issues_list}

## Required Actions

{required_actions}

## Verification Steps

After making the repairs:

1. Run the validation tool to verify fixes:
   ```bash
   python3 verify/validate_yaml.py --all --verbose
   ```

2. Run task-specific tests if applicable:
   ```bash
   {test_commands}
   ```

3. Verify all required files exist:
   {required_files}

4. Re-run the task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id {task_id}
   ```

## Context

{context}

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

{files_to_modify}

## Reference Documentation

Use the doc_query tool to gather additional context:
```bash
python3 tools/doc_query.py --query "{task_id}" --mode text --pretty
python3 tools/doc_query.py --query "prompt_guidance" --mode text --pretty
```