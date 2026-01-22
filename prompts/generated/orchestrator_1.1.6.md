# Task Orchestrator Prompt

## Task Information
- **Task ID**: 1.1.6
- **Task Name**: Test Issues
- **Task Goal**: Fix problems in the test module(s) and failed tests, see details

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details
** First Issue: workspace path/config in projectServer not the same as in test **
These lines in projectService.test.js:
  const config = require('../../src/config');
  config.workspaceRoot = testWorkspaceRoot;
Im not sure how this is supposed to change the config settings in the projectService.js (line 15):
  const config = require('../config'); 
It is setting config in the module scope, and as a const
When running tests locally it created a lot of folders under oinkerui\backend\workspaces 
the .env file has:
  WORKSPACE_ROOT=./workspaces
These lines in projectService.test.js dont work because of this issue (lines 46,47):
  const projectPath = path.join(testWorkspaceRoot, 'projects', project.slug);
  const stats = await fs.stat(projectPath);
Another issue is this (projectService.test.js:24):
  afterEach(async () => {
    // Cleanup test workspace
    try {
      await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
The projects are not getting deleted, which throws off other tests.

** Second Issue: report from npm test output
npm test had this in its output:
    Cannot log after tests are done. Did you forget to wait for something async in your test?
    Attempted to log "Server listening on http://localhost:3000".
    
      22 |   try {
      23 |     await fastify.listen({ port: 3000, host: '0.0.0.0' });
    > 24 |     console.log('Server listening on http://localhost:3000');
 
I suspect this is related to switching to jest?

** Third Issue: npm test output
This is also from the nmp test output:
  Health Check API › GET /health › returns health status
  TypeError: app.address is not a function
  
    12 |     it('returns health status', async () => {
    13 |       const response = await request(app)
  > 14 |         .get('/health')
       |          ^
    15 |         .expect(200);
    16 |
    17 |       expect(response.body).toHaveProperty('status');
  
    at Test.serverAddress (../node_modules/supertest/lib/test.js:46:22)
    at new Test (../node_modules/supertest/lib/test.js:34:14)
    at Object.obj.<computed> [as get] (../node_modules/supertest/index.js:43:18)
    at Object.get (tests/integration/health.test.js:14:10)
    
** Fourth Issue: test execution hangs
The npm test hung on one run; had this as the last lines of output:
  Jest did not exit one second after the test run has completed.
  'This usually means that there are asynchronous operations that weren't stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue.


## Task Additional Prompt 



## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_1.1.6_summary.yaml
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
- Task summaries: `log/task_1.1.6_summary.yaml`
- Task notes: `log/task_1.1.6_notes.yaml` (if needed)
- Verification scripts: `verify/task_1.1.6_*.py`
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
python3 tools/doc_query.py --query &quot;1.1.6&quot; --mode task --pretty

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
   python3 tools/task_cleanup.py --task-id 1.1.6
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete