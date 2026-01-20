# Prompt 0.6: Create Development Environment Configuration

## Task Description
Set up development environment configuration files including .env.example, configuration loading utilities, and environment-specific settings according to spec/config.yaml.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get configuration specifications (PRIMARY REFERENCE)
python3 tools/doc_query.py --query "spec/config.yaml" --mode file --pretty

# Get API specifications for endpoint configuration
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty

# Get module specifications for configuration needs
python3 tools/doc_query.py --query "spec/modules/backend_node.yaml" --mode file --pretty
python3 tools/doc_query.py --query "spec/modules/backend_python_tools.yaml" --mode file --pretty
```

## Requirements

### Configuration Files Needed
- `.env.example`: Template for environment variables
- `.env`: Local environment variables (gitignored)
- `backend/src/config.js`: Node.js configuration loader
- `backend_python/src/config.py`: Python configuration loader

### Environment Variables to Configure (from spec/config.yaml)

#### Server Settings
- `NODE_ENV`: Environment (development/production/test)
- `NODE_PORT`: Node.js backend port (default: 3000)
- `PYTHON_PORT`: Python tools port (default: 8000)
- `FRONTEND_PORT`: Frontend dev server port (default: 5173)
- `HOST`: Server host (default: 0.0.0.0)

#### API Settings
- `OPENROUTER_API_KEY`: OpenRouter API key for LLM calls
- `OPENROUTER_BASE_URL`: OpenRouter API base URL
- `API_TIMEOUT`: API request timeout in milliseconds

#### Workspace Configuration
- `WORKSPACE_ROOT`: Root directory for project workspaces
- `DATA_DIR`: Directory for data storage
- `TEMPLATES_DIR`: Directory for Jinja2 templates
- `SANDBOXES_DIR`: Directory for code execution sandboxes

#### Git Configuration
- `GIT_USER_NAME`: Default Git user name
- `GIT_USER_EMAIL`: Default Git user email
- `AUTO_COMMIT_ENABLED`: Enable/disable auto-commit feature

#### Security
- `SECRET_KEY`: Secret key for session management (Phase 4+)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)

#### Development
- `DEBUG`: Enable debug mode
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `LOG_FORMAT`: Log format (json/text)

## Steps to Complete

1. **Create .env.example** in root directory
   ```env
   # ===========================================
   # OinkerUI Environment Configuration
   # ===========================================
   
   # Server Configuration
   NODE_ENV=development
   NODE_PORT=3000
   PYTHON_PORT=8000
   FRONTEND_PORT=5173
   HOST=0.0.0.0
   
   # OpenRouter API Configuration
   OPENROUTER_API_KEY=your-api-key-here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   API_TIMEOUT=60000
   
   # Workspace Configuration
   WORKSPACE_ROOT=./workspaces
   DATA_DIR=./data
   TEMPLATES_DIR=./backend_python/templates
   SANDBOXES_DIR=./backend_python/sandboxes
   
   # Git Configuration
   GIT_USER_NAME=OinkerUI
   GIT_USER_EMAIL=oinkerui@example.com
   AUTO_COMMIT_ENABLED=true
   
   # Security (Phase 4+)
   SECRET_KEY=change-this-in-production
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   
   # Development
   DEBUG=true
   LOG_LEVEL=info
   LOG_FORMAT=json
   ```

2. **Install configuration dependencies**
   ```bash
   # Node.js
   npm install dotenv
   
   # Python (already in requirements.txt, but verify)
   # python-dotenv is included
   ```

3. **Create backend/src/config.js** for Node.js
   ```javascript
   require('dotenv').config();
   
   const config = {
     env: process.env.NODE_ENV || 'development',
     server: {
       port: parseInt(process.env.NODE_PORT || '3000', 10),
       host: process.env.HOST || '0.0.0.0',
     },
     api: {
       openrouter: {
         apiKey: process.env.OPENROUTER_API_KEY,
         baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
         timeout: parseInt(process.env.API_TIMEOUT || '60000', 10),
       },
     },
     workspace: {
       root: process.env.WORKSPACE_ROOT || './workspaces',
       dataDir: process.env.DATA_DIR || './data',
     },
     git: {
       userName: process.env.GIT_USER_NAME || 'OinkerUI',
       userEmail: process.env.GIT_USER_EMAIL || 'oinkerui@example.com',
       autoCommitEnabled: process.env.AUTO_COMMIT_ENABLED === 'true',
     },
     security: {
       secretKey: process.env.SECRET_KEY,
       corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
     },
     logging: {
       level: process.env.LOG_LEVEL || 'info',
       format: process.env.LOG_FORMAT || 'json',
       debug: process.env.DEBUG === 'true',
     },
     python: {
       port: parseInt(process.env.PYTHON_PORT || '8000', 10),
       baseUrl: `http://localhost:${process.env.PYTHON_PORT || '8000'}`,
     },
   };
   
   // Validate required configuration
   function validateConfig() {
     const required = ['api.openrouter.apiKey'];
     const missing = [];
     
     required.forEach(path => {
       const value = path.split('.').reduce((obj, key) => obj?.[key], config);
       if (!value) {
         missing.push(path);
       }
     });
     
     if (missing.length > 0 && config.env !== 'test') {
       console.warn(`Warning: Missing required configuration: ${missing.join(', ')}`);
     }
   }
   
   validateConfig();
   
   module.exports = config;
   ```

4. **Create backend_python/src/config.py** for Python
   ```python
   from pydantic_settings import BaseSettings
   from typing import List
   import os
   
   class Settings(BaseSettings):
       """Application settings loaded from environment variables."""
       
       # Server Configuration
       node_env: str = "development"
       python_port: int = 8000
       host: str = "0.0.0.0"
       
       # OpenRouter API Configuration
       openrouter_api_key: str = ""
       openrouter_base_url: str = "https://openrouter.ai/api/v1"
       api_timeout: int = 60000
       
       # Workspace Configuration
       workspace_root: str = "./workspaces"
       data_dir: str = "./data"
       templates_dir: str = "./backend_python/templates"
       sandboxes_dir: str = "./backend_python/sandboxes"
       
       # Git Configuration
       git_user_name: str = "OinkerUI"
       git_user_email: str = "oinkerui@example.com"
       auto_commit_enabled: bool = True
       
       # Security
       secret_key: str = "change-this-in-production"
       cors_origins: str = "http://localhost:5173,http://localhost:3000"
       
       # Development
       debug: bool = True
       log_level: str = "info"
       log_format: str = "json"
       
       # Node.js Backend
       node_port: int = 3000
       node_base_url: str = "http://localhost:3000"
       
       class Config:
           env_file = ".env"
           case_sensitive = False
       
       @property
       def cors_origins_list(self) -> List[str]:
           """Parse CORS origins into a list."""
           return [origin.strip() for origin in self.cors_origins.split(',')]
       
       def validate_required(self):
           """Validate required configuration."""
           if not self.openrouter_api_key and self.node_env != "test":
               print("Warning: OPENROUTER_API_KEY is not set")
   
   # Create global settings instance
   settings = Settings()
   settings.validate_required()
   ```

5. **Update .gitignore**
   ```
   # Environment variables
   .env
   .env.local
   .env.*.local
   
   # Workspace directories
   workspaces/
   data/
   sandboxes/
   ```

6. **Create configuration documentation**
   
   **docs/CONFIGURATION.md**:
   ```markdown
   # Configuration Guide
   
   ## Environment Variables
   
   OinkerUI uses environment variables for configuration. Copy `.env.example` to `.env` and update the values.
   
   ### Required Variables
   
   - `OPENROUTER_API_KEY`: Your OpenRouter API key (required for LLM functionality)
   
   ### Server Configuration
   
   - `NODE_PORT`: Port for Node.js backend (default: 3000)
   - `PYTHON_PORT`: Port for Python tools backend (default: 8000)
   - `FRONTEND_PORT`: Port for frontend dev server (default: 5173)
   
   ### Workspace Configuration
   
   - `WORKSPACE_ROOT`: Directory where project workspaces are stored
   - `DATA_DIR`: Directory for application data
   - `TEMPLATES_DIR`: Directory for Jinja2 templates
   - `SANDBOXES_DIR`: Directory for code execution sandboxes
   
   ### Development
   
   - `DEBUG`: Enable debug mode (true/false)
   - `LOG_LEVEL`: Logging level (debug/info/warn/error)
   
   ## Configuration Loading
   
   ### Node.js
   Configuration is loaded from `backend/src/config.js` which reads from `.env`.
   
   ### Python
   Configuration is loaded from `backend_python/src/config.py` using Pydantic settings.
   
   ## Environment-Specific Configuration
   
   Use `NODE_ENV` to switch between environments:
   - `development`: Local development with debug enabled
   - `production`: Production deployment with optimizations
   - `test`: Testing environment with mocked services
   ```

7. **Create setup script for first-time configuration**
   
   **scripts/setup_env.sh**:
   ```bash
   #!/bin/bash
   
   if [ ! -f .env ]; then
       echo "Creating .env from .env.example..."
       cp .env.example .env
       echo "✓ .env file created"
       echo ""
       echo "⚠️  IMPORTANT: Edit .env and set your OPENROUTER_API_KEY"
       echo ""
   else
       echo ".env file already exists"
   fi
   
   # Create workspace directories
   mkdir -p workspaces data backend_python/templates backend_python/sandboxes
   echo "✓ Workspace directories created"
   ```

## Expected Outputs

- `.env.example` with all required variables documented
- `backend/src/config.js` for Node.js configuration loading with validation
- `backend_python/src/config.py` for Python configuration loading with Pydantic
- Updated .gitignore to exclude .env files and workspace directories
- `docs/CONFIGURATION.md` documentation
- `scripts/setup_env.sh` setup script
- Workspace directories created

## Verification Steps

1. Run setup script: `bash scripts/setup_env.sh`
2. Copy .env.example to .env: `cp .env.example .env`
3. Test Node.js config loading:
   ```javascript
   const config = require('./backend/src/config');
   console.log(config);
   ```
4. Test Python config loading:
   ```python
   from backend_python.src.config import settings
   print(settings.dict())
   ```
5. Verify that missing OPENROUTER_API_KEY shows warning
6. Check that .env is properly gitignored: `git status`
7. Verify workspace directories are created

## Notes

- **NEVER commit .env files to version control**
- The OPENROUTER_API_KEY is required for LLM functionality
- Use strong, unique SECRET_KEY in production
- CORS_ORIGINS should be updated for production deployment
- Configuration validation happens on application startup
- Workspace directories are created automatically if they don't exist
- Log format 'json' is recommended for production, 'text' for development

## References

- Primary: `spec/config.yaml` - Configuration specifications
- `spec/modules/backend_node.yaml` - Node.js configuration needs
- `spec/modules/backend_python_tools.yaml` - Python configuration needs
- `spec/apis.yaml` - API endpoint configuration