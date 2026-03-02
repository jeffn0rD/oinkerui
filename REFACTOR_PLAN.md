# Frontend Refactor Plan: Eliminate Svelte 4/5 Incompatibility

## Root Cause
- `main.js` uses `mount()` (Svelte 5 API)
- All components use `createEventDispatcher` + `on:event` (Svelte 4 pattern)
- Multi-level event bubbling (ProjectList → Sidebar → App) is unreliable in Svelte 5
- `$:` reactive blocks with store mutations can cause infinite loops

## Strategy: Callback Props + Direct Store Access
Instead of event dispatching chains, use:
1. **Callback props** for parent-child communication (works in both Svelte 4 and 5)
2. **Direct store access** where components can act independently
3. **Move orchestration logic into a central controller** instead of App.svelte

## Architecture Change
- App.svelte: Thin shell, passes callback functions as props
- Components: Accept `onXxx` callback props instead of dispatching events
- Stores: Remain the same (writable stores work fine in both versions)
- No more createEventDispatcher anywhere
- No more on:customEvent anywhere (native DOM events like on:click are fine)

## Component Changes
1. ProjectList: `on:select` → `onSelect` prop, `on:create` → `onCreate` prop
2. ChatList: same pattern
3. Sidebar: Accept callbacks, pass them through
4. ChatInterface: `on:send` → `onSend` prop, etc.
5. MessageList: Already uses `onFlagChange` prop pattern (correct!)
6. MessageInput: `on:send` → `onSend` prop
7. Header: `on:settings` → `onSettings` prop
8. All others: same pattern