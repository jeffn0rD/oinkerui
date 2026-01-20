# Task Orchestrator Prompt

## Task Information
- **Task ID**: 0.3.5
- **Task Name**: Initialize Node.js Project
- **Task Goal**: Initialize Node.js project with package.json and configure dependencies.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details

# Prompt 0.3.5: Initialize Node.js Project

## Task Description
Initialize the Node.js project with package.json, configure dependencies for Fastify backend according to the backend_node module specification, and set up the development environment.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get backend Node.js module specification (PRIMARY REFERENCE)
python3 tools/doc_query.py --query "spec/modules/backend_node.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty

# Get configuration details
python3 tools/doc_query.py --query "spec/config.yaml" --mode file --pretty

# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty
```

## Requirements

### Core Dependencies (from spec/modules/backend_node.yaml)
The following dependencies are specified in the backend_node module specification:

- **fastify** ^4.26.0 - Web framework
- **@fastify/cors** ^9.0.0 - CORS handling
- **@fastify/static** ^7.0.0 - Static file serving
- **simple-git** ^3.22.0 - Git operations
- **axios** ^1.6.0 - HTTP client for OpenRouter
- **uuid** ^9.0.0 - UUID generation
- **date-fns** ^3.3.0 - Date manipulation
- **tiktoken** ^1.0.0 - Token counting for context
- **slugify** ^1.6.0 - URL-safe slug generation

### Development Dependencies
- **nodemon** - Development server auto-reload
- **eslint** - Code linting
- **prettier** - Code formatting
- **jest** - Testing framework
- **supertest** - HTTP testing

## Steps to Complete

1. **Initialize package.json** in the root directory
   ```bash
   npm init -y
   ```

2. **Update package.json metadata**
   - Set name to "oinkerui"
   - Set version to "1.0.0"
   - Set description from spec
   - Add author and license

3. **Install core dependencies** (exact versions from module spec)
   ```bash
   npm install fastify@^4.26.0 @fastify/cors@^9.0.0 @fastify/static@^7.0.0 \
     simple-git@^3.22.0 axios@^1.6.0 uuid@^9.0.0 date-fns@^3.3.0 \
     tiktoken@^1.0.0 slugify@^1.6.0
   ```

4. **Install development tools**
   ```bash
   npm install -D nodemon eslint prettier jest supertest
   ```

5. **Configure package.json scripts**
   Add the following scripts:
   ```json
   {
     "scripts": {
       "dev": "nodemon backend/src/index.js",
       "start": "node backend/src/index.js",
       "test": "jest",
       "test:watch": "jest --watch",
       "lint": "eslint backend/src",
       "lint:fix": "eslint backend/src --fix",
       "format": "prettier --write backend/src"
     }
   }
   ```

6. **Create configuration files**
   
   **.eslintrc.json**:
   ```json
   {
     "env": {
       "node": true,
       "es2021": true,
       "jest": true
     },
     "extends": "eslint:recommended",
     "parserOptions": {
       "ecmaVersion": 2021
     },
     "rules": {
       "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
       "no-console": "off"
     }
   }
   ```
   
   **.prettierrc**:
   ```json
   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 100,
     "tabWidth": 2
   }
   ```
   
   **jest.config.js**:
   ```javascript
   module.exports = {
     testEnvironment: 'node',
     coverageDirectory: 'coverage',
     collectCoverageFrom: ['backend/src/**/*.js'],
     testMatch: ['**/tests/**/*.test.js']
   };
   ```
   
   **nodemon.json**:
   ```json
   {
     "watch": ["backend/src"],
     "ext": "js,json",
     "ignore": ["backend/src/**/*.test.js"],
     "exec": "node backend/src/index.js"
   }
   ```

7. **Create backend directory structure** (as per module spec)
   ```bash
   mkdir -p backend/src/{routes,services,data,utils}
   mkdir -p backend/tests/{unit,integration}
   ```

8. **Create placeholder index.js**
   ```javascript
   // backend/src/index.js
   const fastify = require('fastify')({ logger: true });
   
   // Register plugins
   fastify.register(require('@fastify/cors'));
   fastify.register(require('@fastify/static'), {
     root: require('path').join(__dirname, '../../frontend/dist'),
     prefix: '/'
   });
   
   // Health check endpoint
   fastify.get('/api/health', async (request, reply) => {
     return { status: 'ok', timestamp: new Date().toISOString() };
   });
   
   // Start server
   const start = async () => {
     try {
       await fastify.listen({ port: 3000, host: '0.0.0.0' });
       console.log('Server listening on http://localhost:3000');
     } catch (err) {
       fastify.log.error(err);
       process.exit(1);
     }
   };
   
   start();
   ```

## Expected Outputs

- `package.json` with all dependencies and scripts configured (versions matching module spec)
- `package-lock.json` generated
- Configuration files: `.eslintrc.json`, `.prettierrc`, `jest.config.js`, `nodemon.json`
- Backend directory structure created
- Placeholder `backend/src/index.js` with basic Fastify setup
- `node_modules/` directory (should be in .gitignore)

## Verification Steps

1. Run `npm list --depth=0` to verify all dependencies are installed with correct versions
2. Run `npm run dev` to verify the server starts successfully
3. Test health check endpoint: `curl http://localhost:3000/api/health`
4. Run `npm run lint` to verify ESLint is configured
5. Run `npm run format` to verify Prettier is configured
6. Check that all configuration files are valid JSON/JS

## Notes

- All dependency versions MUST match those specified in spec/modules/backend_node.yaml
- Use semantic versioning with caret (^) for minor version flexibility
- Ensure all scripts are cross-platform compatible
- Add appropriate entries to .gitignore: node_modules/, coverage/, .env
- The backend will serve the frontend static files in production mode
- Port 3000 is the default for the Node.js backend as per spec

## References

- Primary: `spec/modules/backend_node.yaml` - Complete module specification
- `spec/apis.yaml` - API endpoint specifications
- `spec/domain.yaml` - Entity definitions
- `spec/config.yaml` - Configuration requirements

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_0.3.5_summary.yaml
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
- Task summaries: `log/task_0.3.5_summary.yaml`
- Task notes: `log/task_0.3.5_notes.yaml` (if needed)
- Verification scripts: `verify/task_0.3.5_*.py`
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
python3 tools/doc_query.py --query &quot;0.3.5&quot; --mode task --pretty

# Get related specification files
python3 tools/doc_query.py --query &quot;prompts/dev/prompt_0_3_5_updated.md&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/modules/backend_node.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/apis.yaml&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;spec/config.yaml&quot; --mode file --pretty

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

1. **Create agent prompts** in `prompts/agents/task_0.3.5/`
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
   python3 tools/task_cleanup.py --task-id 0.3.5
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete