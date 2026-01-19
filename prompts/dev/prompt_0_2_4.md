# Prompt 0.2.4: Initialize Svelte Frontend

## Task Description
Set up the Svelte frontend application with Vite, configure Tailwind CSS, and create the basic application structure.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get UI specifications
python3 tools/doc_query.py --query "ui.yaml" --mode file --pretty

# Get context specifications
python3 tools/doc_query.py --query "context.yaml" --mode file --pretty

# Get domain entities for UI components
python3 tools/doc_query.py --query "domain.yaml" --mode file --pretty
```

## Requirements

### Frontend Stack
- **Svelte**: Component framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Svelte Router**: Client-side routing (if needed)

### Additional Dependencies
- **Axios** or **Fetch API**: HTTP client for API calls
- **Svelte Stores**: State management
- **Date-fns** or **Day.js**: Date manipulation

## Steps to Complete

1. **Initialize Svelte project in frontend/ directory**
   ```bash
   cd frontend
   npm create vite@latest . -- --template svelte
   ```

2. **Install Tailwind CSS**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. **Configure Tailwind CSS**
   - Update `tailwind.config.js` with content paths
   - Add Tailwind directives to main CSS file

4. **Install additional dependencies**
   ```bash
   npm install axios
   # or use native fetch
   ```

5. **Create basic application structure**
   ```
   frontend/
   ├── src/
   │   ├── lib/
   │   │   ├── components/    # Reusable UI components
   │   │   ├── stores/        # Svelte stores for state
   │   │   └── utils/         # Utility functions
   │   ├── routes/            # Page components
   │   ├── App.svelte         # Root component
   │   ├── main.js            # Entry point
   │   └── app.css            # Global styles with Tailwind
   ├── public/                # Static assets
   ├── index.html             # HTML template
   ├── vite.config.js         # Vite configuration
   └── package.json
   ```

6. **Configure Vite**
   - Set up proxy for API calls to backend
   - Configure build output directory
   - Set up environment variables

7. **Create placeholder components**
   - `Header.svelte`: Application header
   - `Sidebar.svelte`: Navigation sidebar
   - `ChatInterface.svelte`: Main chat interface placeholder
   - `WorkspacePanel.svelte`: Workspace panel placeholder

## Expected Outputs

- Fully configured Svelte + Vite project in frontend/
- Tailwind CSS integrated and working
- Basic component structure created
- Vite dev server can start successfully
- Build process works correctly

## Verification Steps

1. Run `npm run dev` in frontend/ directory
2. Verify dev server starts on expected port
3. Open browser and check that Tailwind styles are applied
4. Run `npm run build` to verify build process works
5. Check that all placeholder components render correctly

## Notes

- Configure Vite proxy to point to Fastify backend (typically http://localhost:3000)
- Use Svelte's reactive declarations for state management
- Follow Svelte best practices for component composition
- Ensure Tailwind purge is configured for production builds
- Add frontend/node_modules and frontend/dist to .gitignore