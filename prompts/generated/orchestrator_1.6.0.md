# Task Orchestrator Prompt

## Task Information
- **Task ID**: 1.6.0
- **Task Name**: Implement Git Operations
- **Task Goal**: Implement Git integration for project versioning, including auto-commit functionality.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details
'focus':
  - "autoCommit function"
  - "getDiff function"
  - "Dirty file detection"
  - "Commit message generation"
  - "Git status tracking"
'functions':
  - git_integration/auto_commit.yaml
  - git_integration/get_diff.yaml
'verification':
  - "Unit tests for Git operations"
  - "Test auto-commit batching"
  - "Verify commit messages"
  - "Test diff generation"

## Task Additional Prompt 

# Prompt 1.6.0: Implement Git Operations

## Task Description
Implement Git integration for project versioning, including auto-commit functionality.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get git_integration module specification
python3 tools/doc_query.py --query "spec/modules/git_integration.yaml" --mode file --pretty

# Get auto_commit function specification
python3 tools/doc_query.py --query "spec/functions/git_integration/auto_commit.yaml" --mode file --pretty

# Get get_diff function specification
python3 tools/doc_query.py --query "spec/functions/git_integration/get_diff.yaml" --mode file --pretty

# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Generate git_integration module scaffolding
python3 tools/code_generator.py --module git_integration --preview

# Or generate to files:
python3 tools/code_generator.py --module git_integration --output backend/src
```

## Requirements

### Focus Areas
- autoCommit function
- getDiff function
- Dirty file detection
- Commit message generation
- Git status tracking

### Functions to Implement

#### autoCommit
- **Purpose**: Automatically commit changes in a project repository with intelligent
- **Signature**: `autoCommit(projectPath: string, options: AutoCommitOptions)`
- **Returns**: `AutoCommitResult` - Commit result
- **Preconditions**:
  - projectPath is valid Git repository
  - Repository has changes to commit (or force=true)
- **Postconditions**:
  - If committed: new commit exists with changes
  - If skipped: no changes to repository
  - Working directory is clean after commit
- **Spec**: `spec/functions/git_integration/auto_commit.yaml`

#### getDiff
- **Purpose**: Get the diff for a file, commit, or range of commits. Returns formatted
- **Signature**: `getDiff(projectPath: string, options: DiffOptions)`
- **Returns**: `DiffResult` - Diff result
- **Preconditions**:
  - projectPath is valid Git repository
  - If commit specified, commit exists
  - If file specified, file exists or existed
- **Postconditions**:
  - Returns diff string
  - File statistics are accurate
- **Spec**: `spec/functions/git_integration/get_diff.yaml`

### Module Dependencies

**git_integration** external dependencies:
- `simple-git` ^3.22.0
- `diff` ^5.2.0

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

- [ ] Unit tests for Git operations
- [ ] Test auto-commit batching
- [ ] Verify commit messages
- [ ] Test diff generation

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.6.0
```

---
*Generated: 2026-01-21T17:28:55.532627*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.6.0&quot; --mode task --pretty*

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_1.6.0_summary.yaml
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
- Task summaries: `log/task_1.6.0_summary.yaml`
- Task notes: `log/task_1.6.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_1.6.0_*.py`
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
python3 tools/doc_query.py --query &quot;1.6.0&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 1.6.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete