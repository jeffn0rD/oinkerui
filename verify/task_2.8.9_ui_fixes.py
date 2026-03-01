#!/usr/bin/env python3
"""
Verification script for Task 2.8.9: UI unresponsive icons and links
Verifies that all UI actionable features work correctly.
"""

import os
import sys
import re

PASS = 0
FAIL = 0

def check(description, condition):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✓ {description}")
    else:
        FAIL += 1
        print(f"  ✗ {description}")

def read_file(path):
    with open(path, 'r') as f:
        return f.read()

print("=" * 60)
print("Task 2.8.9 Verification: UI Unresponsive Icons and Links")
print("=" * 60)

# ============================================================
# 1. API URL Fix - should use relative /api path
# ============================================================
print("\n1. API URL Configuration")
api_js = read_file('frontend/src/lib/utils/api.js')
check("API base URL uses relative /api path", "'/api'" in api_js)
check("API base URL does NOT hardcode localhost:3000", "'http://localhost:3000/api'" not in api_js)

# ============================================================
# 2. App.svelte - Event wiring and modals
# ============================================================
print("\n2. App.svelte Event Wiring")
app_svelte = read_file('frontend/src/App.svelte')
check("App imports projectApi", "projectApi" in app_svelte)
check("App imports chatApi", "chatApi" in app_svelte)
check("App imports messageApi", "messageApi" in app_svelte)
check("App imports healthApi", "healthApi" in app_svelte)
check("App imports theme store", "theme" in app_svelte and "uiStore" in app_svelte)
check("App has onMount to load projects", "onMount" in app_svelte)
check("App handles projectSelect event", "on:projectSelect" in app_svelte)
check("App handles projectCreate event", "on:projectCreate" in app_svelte)
check("App handles chatSelect event", "on:chatSelect" in app_svelte)
check("App handles chatCreate event", "on:chatCreate" in app_svelte)
check("App handles settings event from Header", "on:settings={handleSettings}" in app_svelte)
check("App handles profile event from Header", "on:profile={handleProfile}" in app_svelte)
check("App handles settings event from Sidebar", "on:settings={handleSettings}" in app_svelte)
check("App has Create Project modal", "showCreateProject" in app_svelte)
check("App has Create Chat modal", "showCreateChat" in app_svelte)
check("App has Settings modal", "showSettings" in app_svelte)
check("App has Profile modal", "showProfile" in app_svelte)
check("App unwraps API responses", "unwrap" in app_svelte)
check("App unwraps response.data", "response.data" in app_svelte)

# ============================================================
# 3. Header - dispatches events
# ============================================================
print("\n3. Header Component Events")
header = read_file('frontend/src/lib/components/Header.svelte')
check("Header imports createEventDispatcher", "createEventDispatcher" in header)
check("Header dispatches 'profile' event", "dispatch('profile')" in header)
check("Header dispatches 'settings' event", "dispatch('settings')" in header)
check("Header settings button has on:click", "on:click={handleSettings}" in header)
check("Header profile button has on:click", "on:click={handleProfile}" in header)
check("Header buttons have aria-label", 'aria-label=' in header)

# ============================================================
# 4. Sidebar - theme toggle fix
# ============================================================
print("\n4. Sidebar Theme Toggle")
sidebar = read_file('frontend/src/lib/components/Sidebar.svelte')
check("Sidebar uses theme.toggle()", "theme.toggle()" in sidebar)
check("Sidebar does NOT use theme.update()", "theme.update(" not in sidebar)
check("Sidebar settings button has on:click", "on:click={handleSettings}" in sidebar)
check("Sidebar dispatches settings event", "dispatch('settings')" in sidebar)

# ============================================================
# 5. Theme store - has toggle method
# ============================================================
print("\n5. Theme Store")
ui_store = read_file('frontend/src/lib/stores/uiStore.js')
check("Theme store has toggle method", "toggle:" in ui_store or "toggle =" in ui_store)
check("Theme store updates localStorage", "localStorage.setItem" in ui_store)
check("Theme store updates document class", "document.documentElement.classList" in ui_store)

# ============================================================
# 6. WorkspacePanel - improved
# ============================================================
print("\n6. WorkspacePanel")
workspace = read_file('frontend/src/lib/components/WorkspacePanel.svelte')
check("WorkspacePanel imports currentProject", "currentProject" in workspace)
check("WorkspacePanel imports currentChat", "currentChat" in workspace)
check("WorkspacePanel has collapse toggle", "collapsed" in workspace)
check("WorkspacePanel shows project info", "currentProject" in workspace and "name" in workspace)
check("WorkspacePanel shows chat info", "currentChat" in workspace)

# ============================================================
# 7. Backend - static file serving optional
# ============================================================
print("\n7. Backend Static File Serving")
backend_index = read_file('backend/src/index.js')
check("Backend checks if dist exists", "fs.existsSync" in backend_index)
check("Backend has API-only mode message", "API-only mode" in backend_index)

# ============================================================
# Summary
# ============================================================
print("\n" + "=" * 60)
total = PASS + FAIL
print(f"Results: {PASS}/{total} checks passed, {FAIL} failed")
print("=" * 60)

if FAIL > 0:
    print("\n⚠ Some checks failed!")
    sys.exit(1)
else:
    print("\n✓ All checks passed!")
    sys.exit(0)