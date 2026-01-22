# Prompt 2.4.5: Implement Core Frontend Application

## Task Description
Implement the core frontend application with functional UI for testing Phase 2 features. This creates a usable browser-based interface with dark theme and modern "power user" styling.

## Context Gathering
```bash
# Get UI spec
python3 tools/doc_query.py --query "spec/ui.yaml" --mode file --pretty

# Get current frontend structure
ls -la frontend/src/lib/components/
ls -la frontend/src/lib/stores/

# Get App.svelte
cat frontend/src/App.svelte
```

## Requirements

### Design Principles
- Dark theme (primary)
- Modern, clean "coder style"
- Power user focused
- Responsive layout
- Keyboard-friendly

### Layout Structure
```
+------------------------------------------+
|  Header (logo placeholder, settings)      |
+----------+-------------------+-----------+
|          |                   |           |
| Sidebar  |   Main Chat       | Context   |
| (Projects|   Interface       | Panel     |
|  & Chats)|                   | (optional)|
|          |                   |           |
+----------+-------------------+-----------+
|  Status Bar (connection, context size)   |
+------------------------------------------+
```

### Core Components to Implement

1. **App Shell**
   - Three-column layout
   - Collapsible sidebar
   - Collapsible context panel
   - Responsive breakpoints

2. **Header**
   - Logo placeholder (with replacement instructions)
   - Project name display
   - Settings button
   - Theme toggle (dark/light)

3. **Sidebar**
   - Project list with create button
   - Chat list per project
   - Active indicators
   - Drag-to-reorder (future)

4. **Chat Interface**
   - Message list with virtual scrolling
   - Message input with markdown preview
   - Send button and keyboard shortcut
   - Streaming indicator

5. **Message Display**
   - User/Assistant differentiation
   - Markdown rendering
   - Code syntax highlighting
   - Copy code button
   - Timestamp display

6. **Status Bar**
   - Connection status
   - Context size indicator
   - Active request indicator

### Styling
- Tailwind CSS dark theme
- CSS variables for theming
- Consistent spacing scale
- Monospace font for code
- Sans-serif for UI text

### Implementation Steps

1. **Set Up Theme System**
   - CSS variables for colors
   - Dark/light theme classes
   - Tailwind config updates

2. **Create App Shell**
   - Update App.svelte with layout
   - Add responsive breakpoints
   - Implement panel toggles

3. **Implement Header**
   - Logo placeholder with instructions
   - Settings dropdown
   - Theme toggle

4. **Enhance Sidebar**
   - Project CRUD UI
   - Chat list with actions
   - Active state styling

5. **Build Chat Interface**
   - Message list component
   - Input with preview
   - Send functionality

6. **Style Messages**
   - Role-based styling
   - Markdown rendering
   - Code highlighting

7. **Add Status Bar**
   - Connection indicator
   - Context size display

8. **Connect to Backend**
   - API integration
   - Real-time updates
   - Error handling

## Logo Placeholder Instructions
```html
<!-- Replace src with your logo image -->
<!-- Recommended: 32x32 or 40x40 PNG with transparent background -->
<!-- File location: frontend/public/logo.png -->
<img src="/logo.png" alt="OinkerUI" class="h-8 w-8" />
```

## Verification
- [ ] App loads in browser
- [ ] Dark theme applied
- [ ] Layout responsive
- [ ] Projects can be created/selected
- [ ] Chats can be created/selected
- [ ] Messages can be sent
- [ ] Markdown renders correctly
- [ ] Code highlighting works
- [ ] All components styled consistently

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.4.5
```