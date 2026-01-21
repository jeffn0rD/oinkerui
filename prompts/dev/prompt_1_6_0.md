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