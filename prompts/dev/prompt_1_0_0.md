# Prompt 1.0.0: Implement Project CRUD Operations

## Task Description
Implement backend functions for creating, reading, updating, and deleting projects.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get git_integration module specification
python3 tools/doc_query.py --query "spec/modules/git_integration.yaml" --mode file --pretty

# Get backend_node module specification
python3 tools/doc_query.py --query "spec/modules/backend_node.yaml" --mode file --pretty

# Get create_project function specification
python3 tools/doc_query.py --query "spec/functions/backend_node/create_project.yaml" --mode file --pretty

# Get init_repository function specification
python3 tools/doc_query.py --query "spec/functions/git_integration/init_repository.yaml" --mode file --pretty

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

# Generate backend_node module scaffolding
python3 tools/code_generator.py --module backend_node --preview

# Or generate to files:
python3 tools/code_generator.py --module git_integration --output backend/src
python3 tools/code_generator.py --module backend_node --output backend/src
```

## Requirements

### Focus Areas
- createProject function
- getProject function
- listProjects function
- deleteProject function
- Project data persistence
- Git repository initialization per project

### Functions to Implement

#### createProject
- **Purpose**: Create a new project with the given name and configuration.
- **Signature**: `createProject(projectName: string, options: CreateProjectOptions)`
- **Returns**: `Project` - Created project object with ID and metadata
- **Preconditions**:
  - projectName is a non-empty string
  - projectName matches the allowed pattern
  - No active/archived project with same slug exists
- **Postconditions**:
  - Project directory exists at workspace_root/projects/{slug}/
  - Git repository is initialized in project directory
  - Project metadata file (project.json) exists
- **Spec**: `spec/functions/backend_node/create_project.yaml`

#### initRepository
- **Purpose**: Initialize a new Git repository in a project directory. Creates the
- **Signature**: `initRepository(projectPath: string, options: InitOptions)`
- **Returns**: `InitResult` - Initialization result
- **Preconditions**:
  - projectPath exists and is directory
  - projectPath is not already a Git repository
  - Git is installed and available
- **Postconditions**:
  - .git directory exists in projectPath
  - Default branch is set
  - .gitignore file exists
- **Spec**: `spec/functions/git_integration/init_repository.yaml`

### Module Dependencies

**git_integration** external dependencies:
- `simple-git` ^3.22.0
- `diff` ^5.2.0

**backend_node** external dependencies:
- `fastify` ^4.26.0
- `@fastify/cors` ^9.0.0
- `@fastify/static` ^7.0.0
- `simple-git` ^3.22.0
- `axios` ^1.6.0
- `uuid` ^9.0.0
- `date-fns` ^3.3.0
- `tiktoken` ^1.0.0
- `slugify` ^1.6.0

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

- [ ] Unit tests for each CRUD operation
- [ ] Integration test for project lifecycle
- [ ] Verify Git repo created for each project

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.0.0
```

---
*Generated: 2026-01-21T17:28:55.273773*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.0.0&quot; --mode task --pretty*