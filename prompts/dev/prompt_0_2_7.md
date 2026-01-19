# Prompt 0.2.7: Create Testing Infrastructure

## Task Description
Set up testing infrastructure for both frontend (Jest) and backend (pytest), including test directories, configuration files, and example tests.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get domain specifications for test scenarios
python3 tools/doc_query.py --query "domain.yaml" --mode file --pretty

# Get API specifications for API tests
python3 tools/doc_query.py --query "apis.yaml" --mode file --pretty

# Get workflow specifications for integration tests
python3 tools/doc_query.py --query "workflows.yaml" --mode file --pretty
```

## Requirements

### Frontend Testing (Jest + Svelte Testing Library)
- Unit tests for components
- Integration tests for user flows
- Test utilities and helpers

### Backend Testing (pytest)
- Unit tests for API endpoints
- Integration tests for workflows
- Test fixtures and utilities

### Integration Testing
- End-to-end tests
- API contract tests

## Steps to Complete

1. **Install frontend testing dependencies**
   ```bash
   cd frontend
   npm install -D @testing-library/svelte @testing-library/jest-dom jest jest-environment-jsdom
   ```

2. **Configure Jest for Svelte**
   
   Create `frontend/jest.config.js`:
   ```javascript
   export default {
     transform: {
       '^.+\\.svelte$': 'svelte-jester',
       '^.+\\.js$': 'babel-jest',
     },
     moduleFileExtensions: ['js', 'svelte'],
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
   };
   ```

3. **Create frontend test structure**
   ```
   frontend/tests/
   ├── unit/              # Component unit tests
   ├── integration/       # Integration tests
   ├── helpers/           # Test utilities
   └── setup.js           # Test setup file
   ```

4. **Create example frontend tests**
   - `frontend/tests/unit/Header.test.js`: Test Header component
   - `frontend/tests/integration/ChatFlow.test.js`: Test chat workflow

5. **Configure pytest for backend**
   
   Create `backend/pytest.ini`:
   ```ini
   [pytest]
   testpaths = tests
   python_files = test_*.py
   python_classes = Test*
   python_functions = test_*
   addopts = -v --tb=short
   ```

6. **Create backend test structure**
   ```
   backend/tests/
   ├── unit/              # Unit tests
   ├── integration/       # Integration tests
   ├── fixtures/          # Test fixtures
   └── conftest.py        # Pytest configuration
   ```

7. **Create example backend tests**
   - `backend/tests/unit/test_api.py`: Test API endpoints
   - `backend/tests/integration/test_workflow.py`: Test workflow execution
   - `backend/tests/conftest.py`: Shared fixtures

8. **Create integration test directory**
   ```
   tests/
   ├── e2e/               # End-to-end tests
   ├── api/               # API contract tests
   └── fixtures/          # Shared test data
   ```

9. **Update package.json test scripts**
   ```json
   {
     "scripts": {
       "test": "npm run test:frontend && npm run test:backend",
       "test:frontend": "cd frontend && jest",
       "test:backend": "cd backend && pytest",
       "test:watch": "cd frontend && jest --watch",
       "test:coverage": "cd frontend && jest --coverage"
     }
   }
   ```

10. **Create test documentation**
    - Document testing strategy
    - Provide examples of writing tests
    - Explain test organization

## Expected Outputs

- Jest configured for Svelte frontend testing
- pytest configured for Python backend testing
- Test directory structure created
- Example tests for both frontend and backend
- Test scripts in package.json
- Testing documentation

## Verification Steps

1. Run `npm run test:frontend` to verify frontend tests work
2. Run `npm run test:backend` to verify backend tests work
3. Run `npm test` to verify all tests run
4. Check test coverage reports are generated
5. Verify example tests pass

## Notes

- Use `@testing-library/svelte` for component testing best practices
- Use pytest fixtures for reusable test setup
- Mock external dependencies in unit tests
- Use real dependencies in integration tests
- Aim for high test coverage on critical paths
- Document testing conventions and patterns
- Consider adding test coverage thresholds