# Backend

This directory contains the FastAPI backend services for oinkerui.

## Structure

- `src/` - Python application source code
  - API routes, models, services, and utilities
- `tests/` - Backend unit and integration tests
- `tools/` - Backend utility scripts and tools

## Technology Stack

- **Framework**: FastAPI
- **Database**: SQLite (Phase 1-3), PostgreSQL (Phase 4+)
- **ORM**: SQLAlchemy
- **Testing**: pytest
- **API Documentation**: Auto-generated via FastAPI (Swagger/OpenAPI)

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn src.main:app --reload

# Run tests
pytest

# Run with specific configuration
python -m src.main --config config.yaml
```

## API Structure

The backend provides RESTful APIs for:
- Project management
- Chat operations
- Message handling
- Data entity management
- LLM request logging
- User management (Phase 4+)

## Phase Implementation

- **Phase 1**: Core APIs for local single-user operation
- **Phase 2**: Enhanced message management and context handling
- **Phase 3**: Advanced features (forking, templates, data entities)
- **Phase 4+**: Multi-user support, authentication, and server deployment