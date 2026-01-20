# oinkerui Development Tools

This document describes the automation tools available for task execution and project management.

## Overview

The oinkerui project includes three main automation tools:

1. **YAML Validator** (`verify/validate_yaml.py`) - Validates YAML files and provides LLM-friendly error messages
2. **Task Cleanup** (`tools/task_cleanup.py`) - Automates task finalization and verification
3. **Task Executor** (`tools/task_executor.py`) - Orchestrates task execution with automated prompt generation

## 1. YAML Validator

### Purpose
Validates YAML files in the project, checking for syntax errors, schema compliance, and reference consistency.

### Usage

```bash
# Validate all YAML files
python3 verify/validate_yaml.py --all

# Validate specific file
python3 verify/validate_yaml.py --file master_todo.yaml

# Verbose output with context
python3 verify/validate_yaml.py --all --verbose

# JSON output
python3 verify/validate_yaml.py --all --json
```

### Features

- **Syntax Validation**: Detects YAML parsing errors
- **Schema Validation**: Checks required fields and types
- **LLM-Friendly Errors**: Provides detailed error messages with:
  - Error type and location (line/column)
  - Problematic line and context
  - Repair hints for fixing issues
- **Multiple File Support**: Validates all YAML files in project

### Error Types

- `syntax_error`: YAML syntax issues (missing colons, quotes, etc.)
- `indentation_error`: Incorrect indentation
- `structure_error`: Invalid list/dict nesting
- `missing_field`: Required field not present
- `type_error`: Field has wrong type

### Example Output

```
Error 1:
  Type: syntax_error
  File: master_todo.yaml
  Line: 24, Column: 7
  Message: expected <block end>, but found '?'
  Repair Hint: Check for incorrect list/dict nesting or missing dashes for list items.
```

## 2. Task Cleanup Tool

### Purpose
Automates task finalization according to prompt_guidance in master_todo.yaml.

### Usage

```bash
# Run cleanup for a task
python3 tools/task_cleanup.py --task-id 0.1

# Dry run (check without committing)
python3 tools/task_cleanup.py --task-id 0.1 --dry-run

# Custom max iterations
python3 tools/task_cleanup.py --task-id 0.1 --max-iterations 5
```

### What It Does

1. **Verifies Task Movement**
   - Checks task removed from master_todo.yaml
   - Checks task added to log/tasks_completed.yaml

2. **Verifies Log Files**
   - Checks for task summary: `log/task_{id}_summary.yaml`
   - Checks for task notes: `log/task_{id}_notes.yaml` (optional)

3. **Runs Validations**
   - Executes YAML validator on all files
   - Reports any validation errors

4. **Runs Tests**
   - Looks for task-specific test files
   - Executes tests and reports results

5. **Generates Repair Prompts**
   - If errors found, generates repair prompt
   - Uses template from `prompts/templates/dev/repair_prompt.md`
   - Saves to `prompts/repair_task_{id}.md`

6. **Commits and Pushes**
   - If all checks pass, commits changes
   - Pushes to remote repository

### Iteration Loop

The tool will iterate up to `max-iterations` times (default: 3):
- Run all checks
- If issues found, generate repair prompt
- Wait for manual fixes (automatic repair not yet implemented)
- Re-run checks

### Example Output

```
======================================================================
Task Cleanup: 0.1
======================================================================

Iteration 1/3
----------------------------------------------------------------------

1. Checking task movement...
   ✓ Task 0.1 not in master_todo.yaml
   ✓ Task 0.1 in tasks_completed.yaml

2. Checking log files...
   ✓ Task summary exists: task_0.1_summary.yaml

3. Running YAML validation...
   ✓ All YAML files valid

4. Running tests...
   ℹ No task-specific tests found for 0.1

======================================================================
Results
======================================================================

✅ No issues found!

5. Committing and pushing repository...
   ✓ Repository committed and pushed successfully!
```

## 3. Task Executor Tool

### Purpose
Orchestrates task execution by generating comprehensive prompts with context and guidance.

### Usage

```bash
# Execute specific task
python3 tools/task_executor.py --task-id 0.2

# Execute next task in queue
python3 tools/task_executor.py --next

# Generate prompt only (don't execute)
python3 tools/task_executor.py --task-id 0.2 --generate-only
python3 tools/task_executor.py --next --generate-only
```

### What It Does

1. **Loads Task Data**
   - Reads task from master_todo.yaml
   - Extracts task details, goals, steps
   - Handles YAML parsing errors gracefully

2. **Generates Orchestrator Prompt**
   - Uses template from `prompts/templates/dev/orchestrator_prompt.md`
   - Includes full prompt_guidance from master_todo.yaml
   - Adds task-specific context and requirements
   - Saves to `prompts/task_{id}_orchestrator.md`

3. **Provides Execution Instructions**
   - Shows path to generated prompt
   - Lists steps for manual execution
   - Includes cleanup command

### Orchestrator Prompt Contents

Generated prompts include:

- **Prompt Guidance**: Full guidance from master_todo.yaml
- **Task Information**: ID, name, goal
- **Task Details**: Files, focus areas, notes, steps
- **Context Gathering**: Commands to use doc_query tool
- **Execution Steps**: Detailed step-by-step instructions
- **Expected Outputs**: What should be delivered
- **Verification Steps**: How to verify completion
- **Agent Delegation**: Guidelines for creating sub-agents if needed

### Example Output

```
======================================================================
Task Executor: Next Task
======================================================================

Next task: 0.2

======================================================================
Task Executor: 0.2
======================================================================

✓ Orchestrator prompt generated: prompts/task_0.2_orchestrator.md

======================================================================
EXECUTION INSTRUCTIONS
======================================================================

The orchestrator prompt has been generated at:
  prompts/task_0.2_orchestrator.md

To execute this task:
1. Review the orchestrator prompt
2. Follow the execution steps outlined in the prompt
3. Use the doc_query tool to gather context as needed
4. Complete all task requirements
5. Run task cleanup:
   python3 tools/task_cleanup.py --task-id 0.2
```

## 4. Document Query Tool (v3 - with Predicates)

### Purpose
Retrieves contextual information from project specifications, logs, and todos with powerful predicate-based filtering.

### New Features (v3)

**Predicate-Based Filtering**:
- Filter data using complex expressions with comparison and logical operators
- Returns ancestor nodes (entire objects) when predicates match
- Supports nested field access

### Query Modes

**Task Mode** (Recommended for task queries):
```bash
python3 tools/doc_query.py --query "0.2" --mode task --pretty
```
Returns complete task information including related files and prompts.

**Path Mode with Predicates** (NEW):
```bash
# Find task by name pattern (returns entire task object)
python3 tools/doc_query.py --query "current[*].task.{name~Frontend}" --mode path --pretty

# Complex predicate with AND
python3 tools/doc_query.py --query "current[*].task.{name~Frontend AND status=active}" --mode path --pretty

# Numeric comparison
python3 tools/doc_query.py --query "current[*].task.{priority>3}" --mode path --pretty

# Legacy syntax (still supported)
python3 tools/doc_query.py --query "current[*].task.id=0.2" --mode path --pretty
```

**Predicate Operators**:
- Comparison: `=`, `!=`, `~` (regex), `!~`, `>`, `<`, `>=`, `<=`
- Logical: `AND`, `OR`, `NOT`

### Traditional Modes

```bash
# Text search (now with enhanced numeric matching)
python3 tools/doc_query.py --query "0.2" --mode text --pretty

# Key search
python3 tools/doc_query.py --query "title" --mode key --pretty

# File content
python3 tools/doc_query.py --query "spec.yaml" --mode file --pretty

# Related files
python3 tools/doc_query.py --query "domain" --mode related --pretty
```

### Documentation

See [docs/DOC_QUERY_GUIDE.md](DOC_QUERY_GUIDE.md) for comprehensive guide with examples and best practices.

## Workflow: Complete Task Lifecycle

### 1. Start Task Execution

```bash
# Generate orchestrator prompt for next task
python3 tools/task_executor.py --next --generate-only
```

### 2. Execute Task

- Review generated orchestrator prompt
- Follow execution steps
- Use doc_query tool for context
- Complete all requirements
- Create task summary in log/
- Move task to tasks_completed.yaml

### 3. Run Task Cleanup

```bash
# Verify task completion
python3 tools/task_cleanup.py --task-id X.Y --dry-run

# If issues found, fix them and re-run

# Final cleanup with commit/push
python3 tools/task_cleanup.py --task-id X.Y
```

### 4. Verify Repository

```bash
# Validate all YAML files
python3 verify/validate_yaml.py --all

# Check git status
git status
git log --oneline -3
```

## Prompt Templates

### Repair Prompt Template

Location: `prompts/templates/dev/repair_prompt.md`

Used by task cleanup tool to generate repair instructions when issues are found.

Variables:
- `{task_id}`: Task identifier
- `{task_name}`: Task name
- `{status}`: Current status
- `{issues_list}`: Formatted list of issues
- `{required_actions}`: Actions needed
- `{test_commands}`: Test commands to run
- `{required_files}`: Required files list
- `{context}`: Additional context
- `{files_to_modify}`: Files that need changes

### Orchestrator Prompt Template

Location: `prompts/templates/dev/orchestrator_prompt.md`

Used by task executor to generate comprehensive task execution prompts.

Variables:
- `{task_id}`: Task identifier
- `{task_name}`: Task name
- `{task_goal}`: Task goal
- `{task_details}`: Detailed task information
- `{previous_task_id}`: Previous task for context
- `{related_specs}`: Related specification files
- `{topic}`: Topic for context gathering
- `{execution_steps}`: Step-by-step instructions
- `{expected_outputs}`: Expected deliverables
- `{verification_steps}`: Verification instructions
- `{files_referenced}`: Referenced files list

## Best Practices

### For Task Execution

1. Always generate orchestrator prompt first
2. Review prompt thoroughly before starting
3. Use doc_query tool to gather context
4. Document decisions in task summary
5. Run cleanup tool before considering task complete

### For Task Cleanup

1. Run with --dry-run first to check status
2. Fix any issues found
3. Re-run until all checks pass
4. Let tool handle commit and push

### For YAML Validation

1. Run after any YAML file changes
2. Use --verbose for detailed error context
3. Fix errors immediately to prevent accumulation
4. Validate before committing

## Troubleshooting

### YAML Validation Fails

- Check error message and repair hint
- Use --verbose to see problematic lines
- Common issues: indentation, missing colons, unclosed quotes
- Refer to YAML syntax documentation

### Task Cleanup Fails

- Review generated repair prompt
- Fix issues one at a time
- Re-run cleanup after each fix
- Check that all required files exist

### Task Executor Can't Find Task

- Verify task exists in master_todo.yaml
- Check task ID format (e.g., "0.2" not "02")
- Ensure task is in "current" section

## Future Enhancements

- Automatic repair execution (currently generates prompts only)
- Agent spawning for automated task execution
- Integration with CI/CD pipelines
- Real-time validation during editing
- Task dependency tracking
- Progress visualization