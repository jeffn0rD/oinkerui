# Testing Guide

## Overview

OinkerUI uses different testing frameworks for each component:
- **Frontend**: Vitest with Svelte Testing Library
- **Node.js Backend**: Jest with Supertest
- **Python Backend**: pytest with httpx

## Running Tests

### All Tests
```bash
npm run test
```

### Frontend Tests
```bash
cd frontend
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### Backend Tests
```bash
npm run test              # Run all backend tests
npm run test:watch        # Watch mode
```

### Python Tests
```bash
source venv/bin/activate
cd backend_python
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest -k test_name       # Run specific test
pytest --cov              # With coverage
pytest -m unit            # Run only unit tests
pytest -m integration     # Run only integration tests
```

## Test Structure

### Frontend Tests

Located in `frontend/tests/`

```
frontend/tests/
├── unit/              # Component unit tests
│   └── Header.test.js
├── integration/       # User flow tests
│   └── ChatFlow.test.js
└── helpers/           # Test utilities
```

**Example Unit Test:**
```javascript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Header from '../../src/lib/components/Header.svelte';

describe('Header Component', () => {
  it('renders project name', () => {
    render(Header, { props: { projectName: 'Test' } });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**Example Integration Test:**
```javascript
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ChatInterface from '../../src/lib/components/ChatInterface.svelte';

describe('Chat Flow', () => {
  it('sends message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Response' })
    });

    render(ChatInterface);
    const input = screen.getByPlaceholderText(/type/i);
    await fireEvent.input(input, { target: { value: 'Hello' } });
    // ... test continues
  });
});
```

### Backend Tests

Located in `backend/tests/`

```
backend/tests/
├── unit/              # Service unit tests
│   └── config.test.js
├── integration/       # API integration tests
│   └── health.test.js
└── fixtures/          # Test data
```

**Example Unit Test:**
```javascript
const config = require('../../src/config');

describe('Configuration', () => {
  it('loads configuration', () => {
    expect(config).toBeDefined();
    expect(config.server.port).toBe(3000);
  });
});
```

**Example Integration Test:**
```javascript
const request = require('supertest');
const app = require('../../src/index');

describe('Health API', () => {
  it('returns health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
  });
});
```

### Python Tests

Located in `backend_python/tests/`

```
backend_python/tests/
├── unit/              # Service unit tests
│   └── test_config.py
├── integration/       # API integration tests
│   └── test_health.py
└── conftest.py        # Pytest fixtures
```

**Example Unit Test:**
```python
import pytest
from backend_python.src.config import settings

@pytest.mark.unit
def test_settings_loaded():
    assert settings is not None
    assert settings.python_port == 8000
```

**Example Integration Test:**
```python
import pytest

@pytest.mark.integration
def test_health_check(test_client):
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

## Writing Tests

### Frontend Testing Best Practices

1. **Test user behavior, not implementation**
   ```javascript
   // Good
   expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
   
   // Avoid
   expect(wrapper.find('.send-button')).toExist();
   ```

2. **Use Testing Library queries**
   - `getByRole` - Preferred for accessibility
   - `getByLabelText` - For form inputs
   - `getByText` - For text content
   - `getByTestId` - Last resort

3. **Mock external dependencies**
   ```javascript
   global.fetch = vi.fn().mockResolvedValue({
     ok: true,
     json: async () => ({ data: 'test' })
   });
   ```

4. **Test async operations**
   ```javascript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

### Backend Testing Best Practices

1. **Use Supertest for API tests**
   ```javascript
   const response = await request(app)
     .post('/api/endpoint')
     .send({ data: 'test' })
     .expect(201);
   ```

2. **Mock external services**
   ```javascript
   jest.mock('../services/llmService');
   llmService.callLLM.mockResolvedValue({ response: 'test' });
   ```

3. **Test error cases**
   ```javascript
   await expect(service.method()).rejects.toThrow('Error message');
   ```

4. **Use test fixtures**
   ```javascript
   const testData = require('../fixtures/testData');
   ```

### Python Testing Best Practices

1. **Use pytest fixtures**
   ```python
   @pytest.fixture
   def test_client():
       from backend_python.src.main import app
       return TestClient(app)
   ```

2. **Use markers for test categories**
   ```python
   @pytest.mark.unit
   def test_unit():
       pass
   
   @pytest.mark.integration
   def test_integration():
       pass
   ```

3. **Test async functions**
   ```python
   @pytest.mark.asyncio
   async def test_async_function():
       result = await async_function()
       assert result == expected
   ```

4. **Use parametrize for multiple cases**
   ```python
   @pytest.mark.parametrize("input,expected", [
       ("test1", "result1"),
       ("test2", "result2"),
   ])
   def test_multiple_cases(input, expected):
       assert function(input) == expected
   ```

## Test Coverage

### Viewing Coverage

**Frontend:**
```bash
cd frontend
npm run test:coverage
# Open frontend/coverage/index.html
```

**Backend:**
```bash
npm run test -- --coverage
# Open coverage/index.html
```

**Python:**
```bash
cd backend_python
pytest --cov --cov-report=html
# Open htmlcov/index.html
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Cover all API endpoints
- **Critical Paths**: 100% coverage

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled daily runs

## Debugging Tests

### Frontend
```bash
# Run specific test file
npm run test -- Header.test.js

# Run tests matching pattern
npm run test -- --grep "Header"

# Debug in browser
npm run test -- --ui
```

### Backend
```bash
# Run specific test file
npm run test -- config.test.js

# Run tests matching pattern
npm run test -- --testNamePattern="Configuration"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest
```

### Python
```bash
# Run specific test file
pytest tests/unit/test_config.py

# Run specific test
pytest tests/unit/test_config.py::test_settings_loaded

# Debug with pdb
pytest --pdb

# Stop on first failure
pytest -x
```

## Test Data

### Fixtures

Store test data in fixture files:

**Backend:**
```javascript
// backend/tests/fixtures/projects.js
module.exports = {
  validProject: {
    name: 'Test Project',
    description: 'Test description'
  }
};
```

**Python:**
```python
# backend_python/tests/fixtures/projects.py
VALID_PROJECT = {
    "name": "Test Project",
    "description": "Test description"
}
```

### Mocking

**Frontend:**
```javascript
import { vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;
```

**Backend:**
```javascript
jest.mock('../services/llmService');
```

**Python:**
```python
from unittest.mock import Mock, patch

@patch('backend_python.src.services.llm_service.call_llm')
def test_with_mock(mock_call):
    mock_call.return_value = "response"
```

## Performance Testing

### Load Testing

Use tools like:
- Apache Bench (ab)
- wrk
- Artillery

Example:
```bash
ab -n 1000 -c 10 http://localhost:3000/api/health
```

### Profiling

**Node.js:**
```bash
node --prof backend/src/index.js
node --prof-process isolate-*.log > processed.txt
```

**Python:**
```bash
python -m cProfile -o output.prof backend_python/src/main.py
```

## Best Practices

1. **Write tests first** (TDD)
2. **Keep tests simple** and focused
3. **One assertion per test** when possible
4. **Use descriptive test names**
5. **Clean up after tests** (fixtures, mocks)
6. **Don't test implementation details**
7. **Test edge cases** and error conditions
8. **Keep tests fast** (< 1s per test)
9. **Avoid test interdependencies**
10. **Update tests with code changes**

## Common Issues

### Tests timing out
- Increase timeout in test configuration
- Check for unresolved promises
- Ensure async operations complete

### Flaky tests
- Avoid time-dependent tests
- Use proper async/await
- Mock external dependencies
- Avoid shared state

### Slow tests
- Mock expensive operations
- Use test databases
- Parallelize test execution
- Profile slow tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [pytest Documentation](https://docs.pytest.org/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

## Getting Help

- Check test output for error messages
- Review test documentation
- Ask in discussions
- Open an issue with test details