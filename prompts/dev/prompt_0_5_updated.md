# Prompt 0.5: Initialize Svelte Frontend

## Task Description
Set up the Svelte frontend application with Vite, configure Tailwind CSS according to the frontend_svelte module specification, and create the basic application structure.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get frontend Svelte module specification (PRIMARY REFERENCE)
python3 tools/doc_query.py --query "spec/modules/frontend_svelte.yaml" --mode file --pretty

# Get UI specifications
python3 tools/doc_query.py --query "spec/ui.yaml" --mode file --pretty

# Get context specifications
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get domain entities for UI components
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty
```

## Requirements

### Frontend Stack (from spec/modules/frontend_svelte.yaml)
The following dependencies are specified in the frontend_svelte module specification:

- **svelte** ^4.0.0 - Component framework
- **vite** ^5.0.0 - Build tool and dev server
- **tailwindcss** ^3.4.0 - Utility-first CSS framework
- **marked** ^12.0.0 - Markdown parsing
- **highlight.js** ^11.9.0 - Syntax highlighting for code blocks
- **dompurify** ^3.0.0 - HTML sanitization for markdown output

### Additional Development Dependencies
- **@sveltejs/vite-plugin-svelte** - Svelte plugin for Vite
- **autoprefixer** - PostCSS plugin for Tailwind
- **postcss** - CSS transformation tool

## Steps to Complete

1. **Create frontend directory and initialize Vite + Svelte**
   ```bash
   mkdir -p frontend
   cd frontend
   npm create vite@latest . -- --template svelte
   ```

2. **Install core dependencies** (exact versions from module spec)
   ```bash
   npm install svelte@^4.0.0 marked@^12.0.0 highlight.js@^11.9.0 dompurify@^3.0.0
   ```

3. **Install Tailwind CSS and dependencies**
   ```bash
   npm install -D tailwindcss@^3.4.0 postcss autoprefixer
   npx tailwindcss init -p
   ```

4. **Configure Tailwind CSS**
   
   **tailwind.config.js**:
   ```javascript
   /** @type {import('tailwindcss').Config} */
   export default {
     content: [
       "./index.html",
       "./src/**/*.{svelte,js,ts}"
     ],
     theme: {
       extend: {
         colors: {
           // Theme colors from spec/ui.yaml
           primary: '#3b82f6',
           secondary: '#8b5cf6',
           accent: '#10b981',
           background: '#ffffff',
           surface: '#f9fafb',
           text: '#1f2937',
           border: '#e5e7eb',
           error: '#ef4444',
           warning: '#f59e0b',
           success: '#10b981',
         }
       },
     },
     plugins: [],
   }
   ```
   
   **src/app.css**:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* Custom base styles */
   @layer base {
     body {
       @apply bg-background text-text;
     }
   }

   /* Custom component styles */
   @layer components {
     .btn-primary {
       @apply bg-primary text-white px-4 py-2 rounded hover:bg-blue-600 transition;
     }
   }
   ```

5. **Configure Vite**
   
   **vite.config.js**:
   ```javascript
   import { defineConfig } from 'vite'
   import { svelte } from '@sveltejs/vite-plugin-svelte'

   export default defineConfig({
     plugins: [svelte()],
     server: {
       port: 5173,
       proxy: {
         '/api': {
           target: 'http://localhost:3000',
           changeOrigin: true
         }
       }
     },
     build: {
       outDir: 'dist',
       sourcemap: true
     }
   })
   ```

6. **Create application structure** (as per module spec)
   ```bash
   mkdir -p src/lib/{components,stores,utils}
   mkdir -p src/routes
   ```
   
   Directory structure:
   ```
   frontend/
   ├── src/
   │   ├── lib/
   │   │   ├── components/    # Reusable UI components
   │   │   │   ├── Header.svelte
   │   │   │   ├── Sidebar.svelte
   │   │   │   ├── ChatInterface.svelte
   │   │   │   ├── MessageList.svelte
   │   │   │   ├── MessageInput.svelte
   │   │   │   └── WorkspacePanel.svelte
   │   │   ├── stores/        # Svelte stores for state
   │   │   │   ├── projectStore.js
   │   │   │   ├── chatStore.js
   │   │   │   └── uiStore.js
   │   │   └── utils/         # Utility functions
   │   │       ├── api.js
   │   │       ├── markdown.js
   │   │       └── formatting.js
   │   ├── routes/            # Page components (if using routing)
   │   ├── App.svelte         # Root component
   │   ├── main.js            # Entry point
   │   └── app.css            # Global styles with Tailwind
   ├── public/                # Static assets
   ├── index.html             # HTML template
   ├── vite.config.js         # Vite configuration
   ├── tailwind.config.js     # Tailwind configuration
   ├── postcss.config.js      # PostCSS configuration
   └── package.json
   ```

7. **Create placeholder components**
   
   **src/lib/components/Header.svelte**:
   ```svelte
   <script>
     export let projectName = 'OinkerUI';
   </script>

   <header class="bg-surface border-b border-border px-6 py-4">
     <h1 class="text-2xl font-bold text-primary">{projectName}</h1>
   </header>
   ```
   
   **src/lib/components/Sidebar.svelte**:
   ```svelte
   <script>
     export let projects = [];
   </script>

   <aside class="w-64 bg-surface border-r border-border p-4">
     <h2 class="text-lg font-semibold mb-4">Projects</h2>
     <div class="space-y-2">
       {#each projects as project}
         <div class="p-2 hover:bg-gray-100 rounded cursor-pointer">
           {project.name}
         </div>
       {/each}
     </div>
   </aside>
   ```
   
   **src/lib/components/ChatInterface.svelte**:
   ```svelte
   <script>
     import MessageList from './MessageList.svelte';
     import MessageInput from './MessageInput.svelte';
   </script>

   <div class="flex flex-col h-full">
     <MessageList />
     <MessageInput />
   </div>
   ```

8. **Create basic stores**
   
   **src/lib/stores/projectStore.js**:
   ```javascript
   import { writable } from 'svelte/store';

   export const projects = writable([]);
   export const currentProject = writable(null);
   ```
   
   **src/lib/stores/chatStore.js**:
   ```javascript
   import { writable } from 'svelte/store';

   export const chats = writable([]);
   export const currentChat = writable(null);
   export const messages = writable([]);
   ```

9. **Update main App.svelte**
   ```svelte
   <script>
     import Header from './lib/components/Header.svelte';
     import Sidebar from './lib/components/Sidebar.svelte';
     import ChatInterface from './lib/components/ChatInterface.svelte';
   </script>

   <div class="h-screen flex flex-col">
     <Header />
     <div class="flex-1 flex overflow-hidden">
       <Sidebar projects={[]} />
       <main class="flex-1 overflow-auto">
         <ChatInterface />
       </main>
     </div>
   </div>
   ```

10. **Update package.json scripts**
    ```json
    {
      "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "lint": "eslint src --ext .js,.svelte",
        "format": "prettier --write src"
      }
    }
    ```

## Expected Outputs

- Fully configured Svelte + Vite project in frontend/
- Tailwind CSS integrated with custom theme colors from spec
- Basic component structure created (Header, Sidebar, ChatInterface, etc.)
- Svelte stores for state management
- Vite dev server configured with API proxy
- Build process configured
- All dependencies matching module spec versions

## Verification Steps

1. Run `npm run dev` in frontend/ directory
2. Verify dev server starts on http://localhost:5173
3. Open browser and check that:
   - Tailwind styles are applied
   - Custom theme colors work
   - Components render correctly
4. Run `npm run build` to verify build process works
5. Check that dist/ directory is created with optimized assets
6. Verify API proxy works by testing a request to /api/health

## Notes

- All dependency versions MUST match those specified in spec/modules/frontend_svelte.yaml
- Vite proxy configuration points to Node.js backend on port 3000
- Use Svelte's reactive declarations ($:) for computed values
- Follow Svelte best practices for component composition
- Ensure Tailwind purge is configured for production builds (automatic with content config)
- Add to .gitignore: node_modules/, dist/, .vite/
- Theme colors should match spec/ui.yaml design tokens
- Markdown rendering will use marked + highlight.js + dompurify for security

## References

- Primary: `spec/modules/frontend_svelte.yaml` - Complete module specification
- `spec/ui.yaml` - UI design specifications, theme, components
- `spec/domain.yaml` - Entity definitions for UI data models
- `spec/context.yaml` - Context display requirements