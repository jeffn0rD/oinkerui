# Prompt 0.2.6: Create Build and Development Scripts

## Task Description
Create build scripts, development scripts, and utility scripts for running the application in different modes.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get workflow specifications
python3 tools/doc_query.py --query "workflows.yaml" --mode file --pretty

# Get commands specifications
python3 tools/doc_query.py --query "commands.yaml" --mode file --pretty

# Get configuration details
python3 tools/doc_query.py --query "config" --mode text --pretty
```

## Requirements

### Scripts to Create

#### Development Scripts
- `dev.sh` / `dev.bat`: Start all services in development mode
- `dev-frontend.sh`: Start only frontend dev server
- `dev-backend.sh`: Start only backend dev server

#### Build Scripts
- `build.sh` / `build.bat`: Build all components for production
- `build-frontend.sh`: Build frontend only
- `build-backend.sh`: Prepare backend for production

#### Utility Scripts
- `setup.sh` / `setup.bat`: Initial project setup
- `test.sh` / `test.bat`: Run all tests
- `lint.sh` / `lint.bat`: Run all linters
- `clean.sh` / `clean.bat`: Clean build artifacts

## Steps to Complete

1. **Create scripts/ directory** if not exists

2. **Create development scripts**
   
   `scripts/dev.sh`:
   ```bash
   #!/bin/bash
   # Start backend and frontend concurrently
   # Use trap to handle Ctrl+C gracefully
   ```
   
   `scripts/dev-frontend.sh`:
   ```bash
   #!/bin/bash
   cd frontend && npm run dev
   ```
   
   `scripts/dev-backend.sh`:
   ```bash
   #!/bin/bash
   # Activate venv if exists
   # Start Fastify server with nodemon
   ```

3. **Create build scripts**
   
   `scripts/build.sh`:
   ```bash
   #!/bin/bash
   # Build frontend
   # Prepare backend
   # Copy necessary files
   ```

4. **Create utility scripts**
   
   `scripts/setup.sh`:
   ```bash
   #!/bin/bash
   # Install Node.js dependencies
   # Set up Python virtual environment
   # Install Python dependencies
   # Copy .env.example to .env
   # Create necessary directories
   ```
   
   `scripts/test.sh`:
   ```bash
   #!/bin/bash
   # Run frontend tests
   # Run backend tests
   # Run integration tests
   ```

5. **Create Windows batch file equivalents**
   - `dev.bat`, `build.bat`, `setup.bat`, etc.
   - Ensure cross-platform compatibility

6. **Update package.json scripts**
   ```json
   {
     "scripts": {
       "dev": "bash scripts/dev.sh",
       "dev:frontend": "bash scripts/dev-frontend.sh",
       "dev:backend": "bash scripts/dev-backend.sh",
       "build": "bash scripts/build.sh",
       "setup": "bash scripts/setup.sh",
       "test": "bash scripts/test.sh",
       "lint": "bash scripts/lint.sh",
       "clean": "bash scripts/clean.sh"
     }
   }
   ```

7. **Make scripts executable**
   ```bash
   chmod +x scripts/*.sh
   ```

8. **Create scripts/README.md** documenting all scripts

## Expected Outputs

- All development, build, and utility scripts created
- Both Unix (.sh) and Windows (.bat) versions
- Scripts are executable and properly documented
- package.json updated with script shortcuts
- README.md in scripts/ directory

## Verification Steps

1. Run `bash scripts/setup.sh` to verify setup process
2. Run `npm run dev` to verify development servers start
3. Run `npm run build` to verify build process works
4. Run `npm run test` to verify test execution
5. Test scripts on both Unix and Windows if possible

## Notes

- Use `set -e` in bash scripts to exit on error
- Add proper error handling and user feedback
- Use colors in terminal output for better UX (optional)
- Ensure scripts work from any directory (use `cd "$(dirname "$0")"`)
- Document any prerequisites or dependencies
- Consider using `concurrently` npm package for running multiple processes