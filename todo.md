# Fix: Browser Hang + Port Configuration

## Issue 1: Browser hangs on page load
- [ ] Examine frontend entry point and App.svelte for infinite loops
- [ ] Check Vite config and dev server setup
- [ ] Check if the issue is SSR vs client-side rendering
- [ ] Test by starting the servers and loading in browser
- [ ] Fix the root cause

## Issue 2: Port configuration from .env not respected
- [ ] Examine .env and .env.example for port variables
- [ ] Check how backend reads port config
- [ ] Check how Python backend reads port config
- [ ] Check how frontend Vite proxy reads port config
- [ ] Check dev scripts for hardcoded ports
- [ ] Fix all port references to use .env values

## Verification
- [ ] Start all servers with custom ports and verify they work
- [ ] Verify browser loads without hanging
- [ ] Run tests to ensure nothing is broken
- [ ] Commit and push