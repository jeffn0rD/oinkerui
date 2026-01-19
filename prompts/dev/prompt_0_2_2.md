# Prompt 0.2.2: Initialize Node.js Project

## Task Description
Initialize the Node.js project with package.json, configure dependencies for Fastify and Svelte, and set up the development environment.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get API specifications
python3 tools/doc_query.py --query "apis.yaml" --mode file --pretty

# Get UI specifications
python3 tools/doc_query.py --query "ui.yaml" --mode file --pretty

# Get configuration details
python3 tools/doc_query.py --query "config" --mode text --pretty
```

## Requirements

### Core Dependencies
- **Fastify**: Web framework for backend API
- **Svelte**: Frontend framework
- **Vite**: Build tool for Svelte
- **TypeScript**: Type safety (optional but recommended)

### Development Dependencies
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Nodemon**: Development server auto-reload

## Steps to Complete

1. **Initialize package.json** in the root directory
   ```bash
   npm init -y
   ```

2. **Install core dependencies**
   ```bash
   npm install fastify @fastify/cors @fastify/static
   ```

3. **Install Svelte and Vite** (for frontend)
   ```bash
   npm install -D vite @sveltejs/vite-plugin-svelte svelte
   ```

4. **Install development tools**
   ```bash
   npm install -D eslint prettier jest nodemon
   ```

5. **Configure package.json scripts**
   - Add `dev`: Start development server
   - Add `build`: Build for production
   - Add `test`: Run tests
   - Add `lint`: Run linter
   - Add `format`: Format code

6. **Create configuration files**
   - `.eslintrc.json`: ESLint configuration
   - `.prettierrc`: Prettier configuration
   - `vite.config.js`: Vite configuration for Svelte

## Expected Outputs

- `package.json` with all dependencies and scripts configured
- `package-lock.json` generated
- Configuration files for ESLint, Prettier, and Vite
- `node_modules/` directory (should be in .gitignore)

## Verification Steps

1. Run `npm list --depth=0` to verify all dependencies are installed
2. Run `npm run lint` to verify ESLint is configured
3. Check that all configuration files are valid JSON/JS

## Notes

- Use semantic versioning for dependencies
- Pin major versions to avoid breaking changes
- Ensure all scripts are cross-platform compatible
- Add appropriate entries to .gitignore for node_modules, build artifacts