# Development Guide

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js 18+ and npm
- Python 3.9+
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jeffn0rD/oinkerui.git
   cd oinkerui
   ```

2. **Run the setup script**
   ```bash
   npm run setup
   ```
   
   This will:
   - Install Node.js dependencies
   - Install frontend dependencies
   - Create Python virtual environment
   - Install Python dependencies
   - Create `.env` from `.env.example`
   - Create workspace directories

3. **Configure environment**
   ```bash
   # Edit .env and add your OpenRouter API key
   nano .env
   ```
   
   Required variables:
   - `OPENROUTER_API_KEY` - Your OpenRouter API key

4. **Start development servers**
   ```bash
   npm run dev
   ```
   
   This starts:
   - Frontend on http://localhost:5173
   - Node.js backend on http://localhost:3000
   - Python backend on http://localhost:8000

## Development Workflow

### Running Services

**Start all services:**
```bash
npm run dev
```

**Start services individually:**
```bash
npm run dev:frontend  # Frontend only
npm run dev:backend   # Node.js backend only
npm run dev:python    # Python backend only
```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit files in `frontend/`, `backend/`, or `backend_python/`
   - Hot reload is enabled for all services

3. **Test your changes**
   ```bash
   npm run test           # Run all tests
   npm run test:watch     # Watch mode
   ```

4. **Lint and format**
   ```bash
   npm run lint           # Check for issues
   npm run format         # Format code
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

### Code Style

#### JavaScript/Svelte
- Use ESLint configuration
- Format with Prettier
- Use 2 spaces for indentation
- Use single quotes for strings
- Add JSDoc comments for functions

#### Python
- Follow PEP 8
- Use Black for formatting
- Use 4 spaces for indentation
- Maximum line length: 100
- Add type hints and docstrings

### Testing

#### Frontend Tests (Vitest)
```bash
cd frontend
npm run test              # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

#### Backend Tests (Jest)
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
```

#### Python Tests (pytest)
```bash
source venv/bin/activate
cd backend_python
pytest                    # Run tests
pytest -v                 # Verbose
pytest --cov              # Coverage
```

### Debugging

#### Frontend
- Use browser DevTools
- Vue DevTools for Svelte
- Console logging
- Breakpoints in browser

#### Node.js Backend
- Use `console.log()` for quick debugging
- Use VS Code debugger
- Add breakpoints in code
- Check logs in terminal

#### Python Backend
- Use `print()` for quick debugging
- Use VS Code debugger
- Add breakpoints in code
- Check logs in terminal

### Project Structure

```
oinkerui/
├── frontend/              # Svelte frontend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/  # UI components
│   │   │   ├── stores/      # State management
│   │   │   └── utils/       # Utilities
│   │   ├── App.svelte       # Root component
│   │   └── main.js          # Entry point
│   ├── tests/               # Frontend tests
│   └── vite.config.js       # Vite config
│
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── data/            # Data access
│   │   ├── config.js        # Configuration
│   │   └── index.js         # Entry point
│   └── tests/               # Backend tests
│
├── backend_python/        # Python backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   ├── config.py        # Configuration
│   │   └── main.py          # Entry point
│   ├── tests/               # Python tests
│   ├── templates/           # Jinja2 templates
│   └── sandboxes/           # Execution sandboxes
│
├── spec/                  # Specifications
├── docs/                  # Documentation
├── scripts/               # Build scripts
└── tools/                 # Development tools
```

### Common Tasks

#### Add a new API endpoint

1. **Define route in backend/src/routes/**
   ```javascript
   // backend/src/routes/myRoute.js
   async function routes(fastify, options) {
     fastify.get('/my-endpoint', async (request, reply) => {
       return { message: 'Hello' };
     });
   }
   module.exports = routes;
   ```

2. **Register route in backend/src/index.js**
   ```javascript
   fastify.register(require('./routes/myRoute'), { prefix: '/api' });
   ```

3. **Add tests**
   ```javascript
   // backend/tests/integration/myRoute.test.js
   test('GET /api/my-endpoint', async () => {
     const response = await request(app).get('/api/my-endpoint');
     expect(response.status).toBe(200);
   });
   ```

#### Add a new Svelte component

1. **Create component file**
   ```svelte
   <!-- frontend/src/lib/components/MyComponent.svelte -->
   <script>
     export let prop = 'default';
   </script>
   
   <div>{prop}</div>
   ```

2. **Use in parent component**
   ```svelte
   <script>
     import MyComponent from './lib/components/MyComponent.svelte';
   </script>
   
   <MyComponent prop="value" />
   ```

3. **Add tests**
   ```javascript
   // frontend/tests/unit/MyComponent.test.js
   import { render } from '@testing-library/svelte';
   import MyComponent from '../../src/lib/components/MyComponent.svelte';
   
   test('renders prop', () => {
     const { getByText } = render(MyComponent, { prop: 'test' });
     expect(getByText('test')).toBeInTheDocument();
   });
   ```

#### Add a Python tool

1. **Create service**
   ```python
   # backend_python/src/services/my_service.py
   def my_function(param: str) -> str:
       """Do something useful."""
       return f"Result: {param}"
   ```

2. **Create route**
   ```python
   # backend_python/src/routes/my_route.py
   from fastapi import APIRouter
   from ..services.my_service import my_function
   
   router = APIRouter()
   
   @router.post("/my-tool")
   async def my_tool(param: str):
       result = my_function(param)
       return {"result": result}
   ```

3. **Register route in main.py**
   ```python
   from .routes.my_route import router as my_router
   app.include_router(my_router, prefix="/tools")
   ```

### Troubleshooting

#### Port already in use
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

#### Dependencies not installing
```bash
# Clear npm cache
npm cache clean --force
# Remove node_modules
rm -rf node_modules package-lock.json
# Reinstall
npm install
```

#### Python virtual environment issues
```bash
# Remove and recreate
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Tests failing
```bash
# Clear test cache
npm run clean
# Reinstall dependencies
npm install
# Run tests again
npm test
```

### Performance Tips

- Use React DevTools Profiler for frontend performance
- Use `console.time()` for timing operations
- Monitor network requests in DevTools
- Use lazy loading for large components
- Optimize images and assets

### Best Practices

1. **Write tests first** (TDD when possible)
2. **Keep functions small** and focused
3. **Use meaningful names** for variables and functions
4. **Comment complex logic** but prefer self-documenting code
5. **Handle errors gracefully** with proper error messages
6. **Log important events** for debugging
7. **Keep dependencies updated** regularly
8. **Review your own code** before submitting PR

### Resources

- [Svelte Documentation](https://svelte.dev/docs)
- [Fastify Documentation](https://www.fastify.io/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Getting Help

- Check existing documentation
- Search GitHub issues
- Ask in discussions
- Open a new issue with details

## Next Steps

- Read [Architecture Documentation](ARCHITECTURE.md)
- Review [API Documentation](API.md)
- Check [Testing Guide](TESTING.md)
- See [Contributing Guidelines](../CONTRIBUTING.md)