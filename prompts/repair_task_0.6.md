# Task Repair Prompt

## Task Information
- **Task ID**: 0.6
- **Task Name**: Task 0.6
- **Status**: needs_repair

## Issues Found

The following issues were detected during task cleanup verification:

1. **ERROR**: Task 0.6 still in master_todo.yaml
   - File: `master_todo.yaml`
   - Action: Remove task 0.6 from master_todo.yaml

2. **ERROR**: Task 0.6 not in tasks_completed.yaml
   - File: `log/tasks_completed.yaml`
   - Action: Add task 0.6 to tasks_completed.yaml

3. **ERROR**: while parsing a block mapping
  in "<unicode string>", line 75, column 7:
        - dotenv: "17.2.3" (environment va ... 
          ^
expected <block end>, but found '<scalar>'
  in "<unicode string>", line 75, column 24:
        - dotenv: "17.2.3" (environment variable loading)
                           ^
   - File: `log/task_0.6_summary.yaml`

4. **ERROR**: while parsing a block mapping
  in "<unicode string>", line 474, column 3:
    - task:
      ^
expected <block end>, but found '-'
  in "<unicode string>", line 534, column 3:
      - task:
      ^
   - File: `log/tasks_completed.yaml`

5. **ERROR**: while parsing a block mapping
  in "<unicode string>", line 1, column 1:
    comment: 'Could you please add t ... 
    ^
expected <block end>, but found ','
  in "<unicode string>", line 1, column 82:
     ...  this change works as expected?',
                                         ^
   - File: `node_modules/avvio/.github/tests_checker.yml`


## Required Actions

- Remove task 0.6 from master_todo.yaml
- Add task 0.6 to tasks_completed.yaml

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
   - log/task_0.6_summary.yaml
- Entry in log/tasks_completed.yaml

4. Re-run the task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id 0.6
   ```

## Context

Task 0.6 cleanup found 5 issue(s) that need to be resolved.

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

- log/task_0.6_summary.yaml
- log/tasks_completed.yaml
- master_todo.yaml
- node_modules/avvio/.github/tests_checker.yml

## Reference Documentation

Use the doc_query tool to gather additional context:
```bash
python3 tools/doc_query.py --query "0.6" --mode text --pretty
python3 tools/doc_query.py --query "prompt_guidance" --mode text --pretty
```