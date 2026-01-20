# Configuration Guide

## Environment Variables

OinkerUI uses environment variables for configuration. Copy `.env.example` to `.env` and update the values.

### Required Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key (required for LLM functionality)

### Server Configuration

- `NODE_PORT`: Port for Node.js backend (default: 3000)
- `PYTHON_PORT`: Port for Python tools backend (default: 8000)
- `FRONTEND_PORT`: Port for frontend dev server (default: 5173)
- `HOST`: Server host address (default: 0.0.0.0)
- `NODE_ENV`: Environment mode (development/production/test)

### API Configuration

- `OPENROUTER_BASE_URL`: OpenRouter API base URL (default: https://openrouter.ai/api/v1)
- `API_TIMEOUT`: API request timeout in milliseconds (default: 60000)

### Workspace Configuration

- `WORKSPACE_ROOT`: Directory where project workspaces are stored (default: ./workspaces)
- `DATA_DIR`: Directory for application data (default: ./data)
- `TEMPLATES_DIR`: Directory for Jinja2 templates (default: ./backend_python/templates)
- `SANDBOXES_DIR`: Directory for code execution sandboxes (default: ./backend_python/sandboxes)

### Git Configuration

- `GIT_USER_NAME`: Default Git user name for commits (default: OinkerUI)
- `GIT_USER_EMAIL`: Default Git user email for commits (default: oinkerui@example.com)
- `AUTO_COMMIT_ENABLED`: Enable/disable automatic commits (default: true)

### Security

- `SECRET_KEY`: Secret key for session management (Phase 4+)
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins

### Development

- `DEBUG`: Enable debug mode (default: true)
- `LOG_LEVEL`: Logging level - debug/info/warn/error (default: info)
- `LOG_FORMAT`: Log format - json/text (default: json)

## Configuration Loading

### Node.js

Configuration is loaded from `backend/src/config.js` which reads from `.env` using the `dotenv` package.

Usage:
```javascript
const config = require('./config');
console.log(config.server.port); // 3000
console.log(config.api.openrouter.apiKey); // your-api-key
```

### Python

Configuration is loaded from `backend_python/src/config.py` using Pydantic Settings.

Usage:
```python
from backend_python.src.config import settings
print(settings.python_port)  # 8000
print(settings.openrouter_api_key)  # your-api-key
```

## Environment-Specific Configuration

Use `NODE_ENV` to switch between environments:

- **development**: Local development with debug enabled
  - Debug logging enabled
  - Hot reload enabled
  - Detailed error messages
  
- **production**: Production deployment with optimizations
  - Debug logging disabled
  - Optimized builds
  - Error messages sanitized
  
- **test**: Testing environment with mocked services
  - Test database
  - Mocked external APIs
  - Fast execution

## First-Time Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your `OPENROUTER_API_KEY`:
   ```bash
   nano .env  # or use your preferred editor
   ```

3. Run the setup script to create workspace directories:
   ```bash
   bash scripts/setup_env.sh
   ```

4. Verify configuration:
   ```bash
   # Node.js
   node -e "console.log(require('./backend/src/config'))"
   
   # Python
   python -c "from backend_python.src.config import settings; print(settings.dict())"
   ```

## Configuration Validation

Both Node.js and Python configurations include validation:

- **Node.js**: Warns if required configuration is missing (except in test environment)
- **Python**: Uses Pydantic validation to ensure correct types and values

Missing required configuration will show warnings on application startup.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. Use **strong, unique `SECRET_KEY`** in production
3. Update **`CORS_ORIGINS`** for production deployment to only include trusted domains
4. Rotate **`OPENROUTER_API_KEY`** regularly
5. Use **environment-specific** `.env` files (`.env.production`, `.env.staging`)
6. Restrict **file system access** to workspace directories only
7. Enable **HTTPS** in production

## Troubleshooting

### Configuration not loading

- Ensure `.env` file exists in the project root
- Check file permissions (should be readable)
- Verify environment variable names match exactly (case-sensitive in Python)

### API key not working

- Verify `OPENROUTER_API_KEY` is set correctly
- Check for extra spaces or quotes in the value
- Ensure the key is valid and has sufficient credits

### Port conflicts

- Change `NODE_PORT`, `PYTHON_PORT`, or `FRONTEND_PORT` if defaults are in use
- Check for other services using the same ports: `lsof -i :3000`

### Workspace directory errors

- Ensure workspace directories exist and are writable
- Run `bash scripts/setup_env.sh` to create directories
- Check file permissions

## Advanced Configuration

### Custom Configuration Files

You can create environment-specific configuration files:

- `.env.development` - Development overrides
- `.env.production` - Production settings
- `.env.test` - Test environment settings

Load specific environment:
```bash
NODE_ENV=production node backend/src/index.js
```

### Configuration Precedence

Configuration is loaded in this order (later overrides earlier):

1. Default values in config files
2. `.env` file
3. Environment-specific `.env.{NODE_ENV}` file
4. System environment variables

### Docker Configuration

When running in Docker, pass environment variables:

```bash
docker run -e OPENROUTER_API_KEY=your-key \
           -e NODE_PORT=3000 \
           -p 3000:3000 \
           oinkerui
```

Or use an env file:
```bash
docker run --env-file .env -p 3000:3000 oinkerui
```

## References

- [dotenv documentation](https://github.com/motdotla/dotenv)
- [Pydantic Settings documentation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [OpenRouter API documentation](https://openrouter.ai/docs)