# Prompt 0.8: Create Testing Infrastructure

## Task Description
Set up comprehensive testing infrastructure for frontend (Jest/Vitest), Node.js backend (Jest), and Python backend (pytest), including test directories, configuration files, and example tests based on function specifications.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get function specifications for test scenarios (PRIMARY REFERENCE)
python3 tools/doc_query.py --query "spec/functions" --mode text --pretty

# Get domain specifications for entity tests
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications for API tests
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty

# Get workflow specifications for integration tests
python3 tools/doc_query.py --query "spec/workflows.yaml" --mode file --pretty

# Get module specifications for testing requirements
python3 tools/doc_query.py --query "spec/modules/backend_node.yaml" --mode file --pretty
python3 tools/doc_query.py --query "spec/modules/frontend_svelte.yaml" --mode file --pretty
```

## Requirements

### Frontend Testing (Vitest + Svelte Testing Library)
- Unit tests for components
- Integration tests for user flows
- Test utilities and helpers
- Vitest is preferred over Jest for Vite projects

### Node.js Backend Testing (Jest + Supertest)
- Unit tests for services
- Integration tests for API endpoints
- Test fixtures and mocks

### Python Backend Testing (pytest + httpx)
- Unit tests for services
- Integration tests for API endpoints
- Test fixtures and async support

## Steps to Complete

### 1. Frontend Testing Setup

**Install frontend testing dependencies:**
```bash
cd frontend
npm install -D vitest @testing-library/svelte @testing-library/jest-dom jsdom
```

**Create frontend/vitest.config.js:**
```javascript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
});
```

**Create frontend test structure:**
```bash
mkdir -p frontend/tests/{unit,integration,helpers}
```

**Create frontend/tests/setup.js:**
```javascript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
```

**Create example frontend tests:**

**frontend/tests/unit/Header.test.js:**
```javascript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Header from '../../src/lib/components/Header.svelte';

describe('Header Component', () => {
  it('renders project name', () => {
    render(Header, { props: { projectName: 'Test Project' } });
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('uses default project name when not provided', () => {
    render(Header);
    expect(screen.getByText('OinkerUI')).toBeInTheDocument();
  });
});
```

**frontend/tests/integration/ChatFlow.test.js:**
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatInterface from '../../src/lib/components/ChatInterface.svelte';

describe('Chat Flow Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('sends message and displays response', async () => {
    // Mock API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        id: 'msg-1', 
        content: 'Hello!', 
        role: 'assistant' 
      })
    });

    render(ChatInterface);
    
    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await fireEvent.input(input, { target: { value: 'Hello' } });
    await fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });
  });
});
```

**Update frontend/package.json:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 2. Node.js Backend Testing Setup

**Install backend testing dependencies:**
```bash
npm install -D jest supertest
```

**Create backend/jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

**Create backend test structure:**
```bash
mkdir -p backend/tests/{unit,integration,fixtures}
```

**Create backend/tests/setup.js:**
```javascript
// Global test setup
process.env.NODE_ENV = 'test';
process.env.OPENROUTER_API_KEY = 'test-key';
```

**Create example backend tests based on function specs:**

**backend/tests/unit/services/projectService.test.js:**
```javascript
const projectService = require('../../../src/services/projectService');
const projectStore = require('../../../src/data/projectStore');

jest.mock('../../../src/data/projectStore');

describe('ProjectService', () => {
  describe('createProject', () => {
    it('creates project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test description'
      };

      projectStore.create.mockResolvedValue({
        id: 'proj-123',
        ...projectData,
        status: 'active',
        created_at: new Date().toISOString()
      });

      const result = await projectService.createProject(projectData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test Project');
      expect(result.status).toBe('active');
    });

    it('throws error for invalid project name', async () => {
      await expect(
        projectService.createProject({ name: '' })
      ).rejects.toThrow('Project name is required');
    });
  });
});
```

**backend/tests/integration/routes/projects.test.js:**
```javascript
const request = require('supertest');
const app = require('../../../src/app');

describe('Projects API', () => {
  describe('POST /api/projects', () => {
    it('creates a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'Test Project',
          description: 'Test description'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Project');
    });

    it('returns 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/projects', () => {
    it('returns list of projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
```

**backend/tests/fixtures/projects.js:**
```javascript
module.exports = {
  validProject: {
    name: 'Test Project',
    description: 'Test description',
    workspace_path: '/tmp/test-workspace'
  },
  
  projectWithChats: {
    id: 'proj-123',
    name: 'Project with Chats',
    chats: [
      { id: 'chat-1', name: 'Chat 1' },
      { id: 'chat-2', name: 'Chat 2' }
    ]
  }
};
```

### 3. Python Backend Testing Setup

**Verify pytest dependencies in requirements-dev.txt:**
```
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.26.0
```

**Create backend_python/pytest.ini:**
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
addopts = -v --tb=short --cov=src --cov-report=html --cov-report=term
```

**Create Python test structure:**
```bash
mkdir -p backend_python/tests/{unit,integration,fixtures}
```

**Create backend_python/tests/conftest.py:**
```python
import pytest
from fastapi.testclient import TestClient
from src.main import app

@pytest.fixture
def client():
    """Test client for API testing."""
    return TestClient(app)

@pytest.fixture
def sample_template():
    """Sample Jinja2 template for testing."""
    return "Hello {{ name }}!"

@pytest.fixture
def sample_context():
    """Sample context data for template rendering."""
    return {"name": "World"}
```

**Create example Python tests based on function specs:**

**backend_python/tests/unit/test_template_service.py:**
```python
import pytest
from src.services.template_service import render_template

def test_render_template_success(sample_template, sample_context):
    """Test successful template rendering."""
    result = render_template(sample_template, sample_context)
    assert result == "Hello World!"

def test_render_template_missing_variable(sample_template):
    """Test template rendering with missing variable."""
    with pytest.raises(Exception):
        render_template(sample_template, {})

def test_render_template_invalid_syntax():
    """Test template rendering with invalid syntax."""
    with pytest.raises(Exception):
        render_template("{{ invalid", {})
```

**backend_python/tests/integration/test_api.py:**
```python
import pytest
from fastapi.testclient import TestClient

def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_render_template_endpoint(client):
    """Test template rendering endpoint."""
    response = client.post(
        "/render",
        json={
            "template": "Hello {{ name }}!",
            "context": {"name": "World"}
        }
    )
    assert response.status_code == 200
    assert response.json()["result"] == "Hello World!"

def test_render_template_invalid_data(client):
    """Test template rendering with invalid data."""
    response = client.post(
        "/render",
        json={"template": "{{ invalid"}
    )
    assert response.status_code == 400
```

### 4. Update Root Package.json

```json
{
  "scripts": {
    "test": "npm run test:backend && npm run test:python && npm run test:frontend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "jest --config backend/jest.config.js",
    "test:python": "cd backend_python && pytest",
    "test:watch": "jest --watch",
    "test:coverage": "npm run test:frontend -- --coverage && npm run test:backend -- --coverage && npm run test:python"
  }
}
```

### 5. Create Testing Documentation

**docs/TESTING.md:**
```markdown
# Testing Guide

## Overview

OinkerUI uses multiple testing frameworks:
- **Frontend**: Vitest + Svelte Testing Library
- **Node.js Backend**: Jest + Supertest
- **Python Backend**: pytest + httpx

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:frontend
npm run test:backend
npm run test:python

# Watch mode (frontend)
cd frontend && npm run test:watch

# Coverage reports
npm run test:coverage
```

## Test Organization

### Frontend Tests
- `frontend/tests/unit/` - Component unit tests
- `frontend/tests/integration/` - User flow tests
- `frontend/tests/helpers/` - Test utilities

### Backend Tests
- `backend/tests/unit/` - Service unit tests
- `backend/tests/integration/` - API endpoint tests
- `backend/tests/fixtures/` - Test data

### Python Tests
- `backend_python/tests/unit/` - Service unit tests
- `backend_python/tests/integration/` - API endpoint tests
- `backend_python/tests/fixtures/` - Test data

## Writing Tests

### Frontend Component Test
```javascript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MyComponent from '../MyComponent.svelte';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(MyComponent, { props: { text: 'Hello' } });
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Backend API Test
```javascript
const request = require('supertest');
const app = require('../src/app');

describe('API Endpoint', () => {
  it('returns expected data', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

### Python Test
```python
def test_function():
    result = my_function(input_data)
    assert result == expected_output
```

## Test Coverage

Aim for:
- 70%+ line coverage
- 70%+ branch coverage
- 100% coverage on critical paths

## Best Practices

1. Write tests alongside code
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)
4. Mock external dependencies
5. Test error cases
6. Keep tests fast and isolated
```

## Expected Outputs

- Vitest configured for Svelte frontend testing
- Jest configured for Node.js backend testing
- pytest configured for Python backend testing
- Test directory structures created for all components
- Example tests demonstrating testing patterns
- Test scripts in package.json
- Comprehensive testing documentation

## Verification Steps

1. Run `npm run test:frontend` - verify frontend tests pass
2. Run `npm run test:backend` - verify backend tests pass
3. Run `npm run test:python` - verify Python tests pass
4. Run `npm test` - verify all tests run successfully
5. Check coverage reports are generated
6. Verify example tests demonstrate key patterns

## Notes

- Vitest is preferred over Jest for Vite projects (better integration)
- Use `@testing-library/svelte` for component testing best practices
- Mock external dependencies (OpenRouter API, file system) in unit tests
- Use real dependencies in integration tests where appropriate
- Function specs in spec/functions/ provide test scenarios
- Aim for high test coverage on critical paths (context construction, LLM calls, Git operations)
- Test both success and error cases
- Use fixtures for reusable test data

## References

- Primary: `spec/functions/` - Function specifications with test scenarios
- `spec/modules/backend_node.yaml` - Testing requirements for Node.js
- `spec/modules/frontend_svelte.yaml` - Testing requirements for frontend
- `spec/modules/backend_python_tools.yaml` - Testing requirements for Python
- `spec/domain.yaml` - Entity definitions for test data
- `spec/apis.yaml` - API specifications for integration tests