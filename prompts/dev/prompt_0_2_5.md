# Prompt 0.2.5: Create Development Environment Configuration

## Task Description
Set up development environment configuration files including .env.example, configuration loading utilities, and environment-specific settings.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get configuration specifications
python3 tools/doc_query.py --query "config.yaml" --mode file --pretty

# Get API specifications for endpoint configuration
python3 tools/doc_query.py --query "apis.yaml" --mode file --pretty

# Get phase information
python3 tools/doc_query.py --query "phase" --mode related --pretty
```

## Requirements

### Configuration Files Needed
- `.env.example`: Template for environment variables
- `.env`: Local environment variables (gitignored)
- `config.js`: Node.js configuration loader
- `config.py`: Python configuration loader

### Environment Variables to Configure
- **Server Settings**: PORT, HOST, NODE_ENV
- **API Settings**: API_BASE_URL, API_TIMEOUT
- **Database/Storage**: WORKSPACE_ROOT, DATA_DIR
- **Security**: SECRET_KEY, CORS_ORIGINS
- **Development**: DEBUG, LOG_LEVEL

## Steps to Complete

1. **Create .env.example** in root directory
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000
   HOST=localhost
   
   # API Configuration
   API_BASE_URL=http://localhost:3000/api
   API_TIMEOUT=30000
   
   # Workspace Configuration
   WORKSPACE_ROOT=./workspaces
   DATA_DIR=./data
   
   # Security
   SECRET_KEY=your-secret-key-here
   CORS_ORIGINS=http://localhost:5173
   
   # Development
   DEBUG=true
   LOG_LEVEL=info
   ```

2. **Create config.js** for Node.js/Fastify
   ```javascript
   // Load and validate environment variables
   // Export configuration object
   // Handle defaults for missing values
   ```

3. **Create config.py** for Python/FastAPI
   ```python
   # Load environment variables using python-dotenv
   # Define configuration classes using Pydantic
   # Export configuration instance
   ```

4. **Create environment-specific configs**
   - `config/development.yaml`: Development settings
   - `config/production.yaml`: Production settings
   - `config/test.yaml`: Test settings

5. **Install required packages**
   - Node.js: `dotenv`
   - Python: `python-dotenv`

6. **Update .gitignore**
   ```
   .env
   .env.local
   .env.*.local
   ```

7. **Create configuration documentation**
   - Document all environment variables
   - Explain configuration loading process
   - Provide examples for different environments

## Expected Outputs

- `.env.example` with all required variables documented
- `config.js` for Node.js configuration loading
- `config.py` for Python configuration loading
- Environment-specific YAML configuration files
- Updated .gitignore to exclude .env files
- Documentation on configuration management

## Verification Steps

1. Copy .env.example to .env and verify it loads correctly
2. Test config.js by importing and logging configuration
3. Test config.py by importing and printing configuration
4. Verify that missing required variables throw appropriate errors
5. Check that .env is properly gitignored

## Notes

- Never commit .env files to version control
- Use strong defaults for development
- Validate all configuration values on load
- Document all environment variables clearly
- Consider using different ports for frontend (5173) and backend (3000)
- Ensure configuration works for both local and server deployment scenarios