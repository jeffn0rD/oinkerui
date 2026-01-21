# OinkerUI API Documentation

## Overview

OinkerUI provides a REST API for managing projects, chats, and messages. The API is built with Fastify and follows RESTful conventions.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

Currently, no authentication is required (Phase 1). Authentication will be added in Phase 4.

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Endpoints

### Health Check

#### GET /health

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

### Projects

#### GET /api/projects

List all projects.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "proj-123",
      "name": "My Project",
      "description": "Project description",
      "status": "active",
      "created_at": "2024-01-20T12:00:00.000Z",
      "updated_at": "2024-01-20T12:00:00.000Z"
    }
  ]
}
```

#### POST /api/projects

Create a new project.

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Project description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "proj-123",
    "name": "My Project",
    "description": "Project description",
    "status": "active",
    "created_at": "2024-01-20T12:00:00.000Z"
  }
}
```

#### GET /api/projects/:projectId

Get project details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "proj-123",
    "name": "My Project",
    "description": "Project description",
    "status": "active",
    "created_at": "2024-01-20T12:00:00.000Z",
    "updated_at": "2024-01-20T12:00:00.000Z",
    "chats": []
  }
}
```

#### PUT /api/projects/:projectId

Update project.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### DELETE /api/projects/:projectId

Delete project.

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Chats

#### GET /api/projects/:projectId/chats

List all chats in a project.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chat-456",
      "project_id": "proj-123",
      "title": "Chat Title",
      "created_at": "2024-01-20T12:00:00.000Z",
      "updated_at": "2024-01-20T12:00:00.000Z",
      "message_count": 10
    }
  ]
}
```

#### POST /api/projects/:projectId/chats

Create a new chat.

**Request Body:**
```json
{
  "title": "New Chat"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chat-456",
    "project_id": "proj-123",
    "title": "New Chat",
    "created_at": "2024-01-20T12:00:00.000Z"
  }
}
```

#### GET /api/projects/:projectId/chats/:chatId

Get chat details with messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chat-456",
    "project_id": "proj-123",
    "title": "Chat Title",
    "created_at": "2024-01-20T12:00:00.000Z",
    "messages": []
  }
}
```

### Messages

#### GET /api/projects/:projectId/chats/:chatId/messages

List all messages in a chat.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-789",
      "chat_id": "chat-456",
      "role": "user",
      "content": "Hello",
      "created_at": "2024-01-20T12:00:00.000Z"
    },
    {
      "id": "msg-790",
      "chat_id": "chat-456",
      "role": "assistant",
      "content": "Hi there!",
      "created_at": "2024-01-20T12:00:01.000Z"
    }
  ]
}
```

#### POST /api/projects/:projectId/chats/:chatId/messages

Send a message and get LLM response.

**Request Body:**
```json
{
  "content": "Hello, how are you?",
  "model": "openrouter/openai/gpt-4o"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_message": {
      "id": "msg-789",
      "role": "user",
      "content": "Hello, how are you?",
      "created_at": "2024-01-20T12:00:00.000Z"
    },
    "assistant_message": {
      "id": "msg-790",
      "role": "assistant",
      "content": "I'm doing well, thank you!",
      "created_at": "2024-01-20T12:00:01.000Z"
    }
  }
}
```

### Python Tools API

The Python backend provides additional tools endpoints.

#### POST /tools/render-template

Render a Jinja2 template.

**Request Body:**
```json
{
  "template": "Hello {{ name }}!",
  "variables": {
    "name": "World"
  }
}
```

**Response:**
```json
{
  "success": true,
  "rendered": "Hello World!"
}
```

#### POST /tools/execute

Execute Python code in a sandbox.

**Request Body:**
```json
{
  "code": "print('Hello World')",
  "project_id": "proj-123"
}
```

**Response:**
```json
{
  "success": true,
  "stdout": "Hello World\n",
  "stderr": "",
  "exit_code": 0
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request data |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Server error |
| `UNAUTHORIZED` | Authentication required (Phase 4+) |
| `FORBIDDEN` | Access denied (Phase 4+) |
| `RATE_LIMIT` | Too many requests (future) |

## Rate Limiting

Currently no rate limiting. Will be added in future phases.

## Pagination

For list endpoints, pagination will be added in future phases:

```
GET /api/projects?page=1&limit=20
```

## Filtering and Sorting

Will be added in future phases:

```
GET /api/projects?status=active&sort=created_at:desc
```

## WebSocket API

Real-time updates via WebSocket will be added in Phase 2.

## SDK and Client Libraries

Official client libraries will be provided in future phases.

## Changelog

### Phase 1 (Current)
- Basic CRUD operations for projects, chats, messages
- LLM integration via OpenRouter
- Python tools integration

### Phase 2 (Planned)
- WebSocket support
- File operations API
- Data entity API

### Phase 3 (Planned)
- Advanced search
- Batch operations
- Export/import

### Phase 4 (Planned)
- Authentication
- Authorization
- User management

## Support

For API support, please open an issue on GitHub.