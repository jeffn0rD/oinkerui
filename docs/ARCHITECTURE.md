# OinkerUI Architecture

## System Overview

OinkerUI is a three-tier application consisting of:
1. **Frontend**: Svelte-based UI
2. **Node.js Backend**: Primary API server
3. **Python Backend**: Tools and execution services

## High-Level Architecture

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Svelte Frontend │ (Port 5173)
│   - UI Layer    │
│   - State Mgmt  │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐      ┌──────────────┐
│ Node.js Backend │◄────►│ OpenRouter   │
│   - API Server  │      │  LLM API     │
│   - Business    │      └──────────────┘
│     Logic       │
│   - Git Ops     │      ┌──────────────┐
└────────┬────────┘      │ File System  │
         │               │  - Projects  │
         │               │  - Chats     │
         ▼               └──────────────┘
┌─────────────────┐
│ Python Backend  │
│   - Templates   │
│   - Execution   │
└─────────────────┘
```

## Component Architecture

### Frontend (Svelte)

**Location**: `frontend/`

**Responsibilities**:
- User interface rendering
- User interaction handling
- State management (Svelte stores)
- API communication
- Markdown rendering with syntax highlighting

**Key Components**:
- `Header.svelte` - Application header
- `Sidebar.svelte` - Project/chat navigation
- `ChatInterface.svelte` - Main chat interface
- `MessageList.svelte` - Message display
- `MessageInput.svelte` - User input
- `WorkspacePanel.svelte` - File browser

**State Management**:
- `projectStore.js` - Project state
- `chatStore.js` - Chat and message state
- `uiStore.js` - UI state (sidebar, modals)

### Node.js Backend (Fastify)

**Location**: `backend/`

**Responsibilities**:
- REST API endpoints
- Business logic
- LLM integration (OpenRouter)
- Context construction
- Git operations
- File-based data persistence
- Coordination with Python backend

**Directory Structure**:
```
backend/
├── src/
│   ├── index.js           # Entry point
│   ├── config.js          # Configuration
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic
│   └── data/              # Data access
```

**Key Services**:
- **ProjectService**: Project CRUD operations
- **ChatService**: Chat and message management
- **ContextService**: Context construction algorithm
- **LLMService**: OpenRouter API integration
- **GitService**: Git operations wrapper

### Python Backend (FastAPI)

**Location**: `backend_python/`

**Responsibilities**:
- Jinja2 template rendering
- Code execution (sandboxed)
- Token counting
- File operations

**Directory Structure**:
```
backend_python/
├── src/
│   ├── main.py            # Entry point
│   ├── config.py          # Configuration
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utilities
├── templates/             # Jinja2 templates
└── sandboxes/             # Execution environments
```

## Data Flow

### Message Sending Flow

1. User types message in `MessageInput.svelte`
2. Frontend sends POST to `/api/messages`
3. Node.js backend:
   - Saves message to file system
   - Constructs context from project files
   - Calls OpenRouter API with context
   - Streams response back to frontend
4. Frontend displays response in `MessageList.svelte`

### Template Rendering Flow

1. User requests template rendering
2. Node.js backend calls Python backend `/tools/render-template`
3. Python backend:
   - Loads Jinja2 template
   - Renders with provided variables
   - Returns rendered content
4. Node.js backend saves to project
5. Frontend displays result

## Data Storage

### File-Based Storage

Projects and chats are stored as files:

```
workspaces/
└── {project-id}/
    ├── project.json       # Project metadata
    ├── chats/
    │   └── {chat-id}/
    │       ├── chat.json  # Chat metadata
    │       └── messages/
    │           └── {msg-id}.json
    └── files/             # Project files
```

### Configuration Storage

- Environment variables in `.env`
- Application config in `backend/src/config.js`
- Python config in `backend_python/src/config.py`

## Security Considerations

### Code Execution
- Python code runs in sandboxed environments
- Path validation prevents directory traversal
- Resource limits enforced
- Network access restricted

### API Security
- CORS configured for allowed origins
- API key validation for OpenRouter
- Input validation on all endpoints
- Rate limiting (future)

### Data Security
- Projects isolated by directory
- No direct file system access from frontend
- Git operations validated
- Sensitive data in environment variables

## Scalability Considerations

### Current Architecture
- Single-instance deployment
- File-based storage
- Synchronous processing

### Future Enhancements
- Database for metadata
- Message queue for async processing
- Horizontal scaling with load balancer
- Caching layer (Redis)
- WebSocket for real-time updates

## Technology Choices

### Why Svelte?
- Lightweight and fast
- Reactive by default
- Simple state management
- Great developer experience

### Why Fastify?
- Fast and efficient
- Plugin ecosystem
- Schema validation
- Good TypeScript support

### Why FastAPI?
- Modern Python framework
- Automatic API documentation
- Async support
- Type validation with Pydantic

### Why File-Based Storage?
- Simple for Phase 1
- No database setup required
- Easy to backup and version
- Git-friendly

## Development Principles

1. **Separation of Concerns**: Clear boundaries between layers
2. **Modularity**: Reusable components and services
3. **Testability**: Unit and integration tests for all components
4. **Documentation**: Code comments and external docs
5. **Configuration**: Environment-based configuration
6. **Error Handling**: Graceful error handling and logging

## Deployment Architecture

### Development
- All services run locally
- Hot reload enabled
- Debug logging
- Mock external services

### Production
- Services containerized (future)
- Reverse proxy (nginx)
- HTTPS enabled
- Production logging
- Monitoring and alerts

## Performance Considerations

### Frontend
- Code splitting
- Lazy loading
- Optimized builds
- Asset compression

### Backend
- Connection pooling
- Response caching
- Async operations
- Efficient algorithms

### Python Backend
- Process pooling
- Template caching
- Sandbox reuse
- Resource limits

## Monitoring and Logging

### Logging
- Structured JSON logs
- Log levels (debug, info, warn, error)
- Request/response logging
- Error tracking

### Metrics (Future)
- Request latency
- Error rates
- Resource usage
- User activity

## References

- [Specification Documents](../spec/)
- [API Documentation](API.md)
- [Development Guide](DEVELOPMENT.md)
- [Configuration Guide](CONFIGURATION.md)