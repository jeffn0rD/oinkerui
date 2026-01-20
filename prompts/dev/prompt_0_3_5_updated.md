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