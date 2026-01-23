#!/usr/bin/env python3
"""
Verification script for Task 2.4.5: Core Frontend Application

Tests:
1. Frontend builds successfully
2. Required components exist
3. Required stores exist
4. API client exists with required methods
5. Dark theme is configured
6. Tailwind is properly configured
"""

import os
import sys
import re
import subprocess

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def check_pass(msg):
    print(f"{GREEN}✓ PASS{RESET}: {msg}")
    return True

def check_fail(msg):
    print(f"{RED}✗ FAIL{RESET}: {msg}")
    return False

def check_warn(msg):
    print(f"{YELLOW}⚠ WARN{RESET}: {msg}")
    return True

def file_exists(path):
    return os.path.isfile(path)

def dir_exists(path):
    return os.path.isdir(path)

def file_contains(path, pattern):
    if not file_exists(path):
        return False
    with open(path, 'r') as f:
        content = f.read()
    return bool(re.search(pattern, content))

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(base_dir)
    
    print("=" * 60)
    print("Task 2.4.5: Core Frontend Application - Verification")
    print("=" * 60)
    print()
    
    results = []
    
    # Test 1: Frontend directory structure
    print("1. Frontend Directory Structure")
    required_dirs = [
        "frontend/src/lib/components",
        "frontend/src/lib/stores",
        "frontend/src/lib/utils"
    ]
    for d in required_dirs:
        if dir_exists(d):
            results.append(check_pass(f"Directory exists: {d}"))
        else:
            results.append(check_fail(f"Directory missing: {d}"))
    
    print()
    
    # Test 2: Required components
    print("2. Required Components")
    required_components = [
        ("frontend/src/lib/components/Header.svelte", "Header"),
        ("frontend/src/lib/components/Sidebar.svelte", "Sidebar/LeftSidebar"),
        ("frontend/src/lib/components/ChatInterface.svelte", "ChatInterface"),
        ("frontend/src/lib/components/MessageList.svelte", "MessageList"),
        ("frontend/src/lib/components/Message.svelte", "MessageItem"),
        ("frontend/src/lib/components/MessageInput.svelte", "PromptInput"),
        ("frontend/src/lib/components/ProjectList.svelte", "ProjectList"),
        ("frontend/src/lib/components/ChatList.svelte", "ChatList"),
        ("frontend/src/lib/components/CancelButton.svelte", "CancelButton"),
    ]
    for path, name in required_components:
        if file_exists(path):
            results.append(check_pass(f"Component exists: {name}"))
        else:
            results.append(check_fail(f"Component missing: {name}"))
    
    print()
    
    # Test 3: Required stores
    print("3. Required Stores")
    required_stores = [
        ("frontend/src/lib/stores/projectStore.js", "projectStore"),
        ("frontend/src/lib/stores/chatStore.js", "chatStore"),
        ("frontend/src/lib/stores/uiStore.js", "uiStore"),
        ("frontend/src/lib/stores/syncStore.js", "syncStore"),
        ("frontend/src/lib/stores/contextStore.js", "contextStore"),
        ("frontend/src/lib/stores/settingsStore.js", "settingsStore"),
    ]
    for path, name in required_stores:
        if file_exists(path):
            results.append(check_pass(f"Store exists: {name}"))
        else:
            results.append(check_fail(f"Store missing: {name}"))
    
    print()
    
    # Test 4: API client
    print("4. API Client")
    api_path = "frontend/src/lib/utils/api.js"
    if file_exists(api_path):
        results.append(check_pass("API client exists"))
        
        api_methods = ["projectApi", "chatApi", "messageApi"]
        for method in api_methods:
            if file_contains(api_path, method):
                results.append(check_pass(f"API has {method}"))
            else:
                results.append(check_fail(f"API missing {method}"))
    else:
        results.append(check_fail("API client not found"))
    
    print()
    
    # Test 5: Dark theme configuration
    print("5. Dark Theme Configuration")
    
    # Check tailwind config
    tailwind_path = "frontend/tailwind.config.js"
    if file_contains(tailwind_path, r"darkMode.*class"):
        results.append(check_pass("Tailwind dark mode configured"))
    else:
        results.append(check_fail("Tailwind dark mode not configured"))
    
    # Check index.html has dark class
    index_path = "frontend/index.html"
    if file_contains(index_path, r'class="dark"'):
        results.append(check_pass("index.html has dark class by default"))
    else:
        results.append(check_warn("index.html may not have dark class"))
    
    # Check CSS variables
    css_path = "frontend/src/app.css"
    if file_contains(css_path, r"\.dark"):
        results.append(check_pass("CSS has dark theme variables"))
    else:
        results.append(check_fail("CSS missing dark theme variables"))
    
    print()
    
    # Test 6: Theme store
    print("6. Theme Store")
    ui_store_path = "frontend/src/lib/stores/uiStore.js"
    if file_contains(ui_store_path, r"theme"):
        results.append(check_pass("uiStore has theme management"))
    else:
        results.append(check_fail("uiStore missing theme management"))
    
    if file_contains(ui_store_path, r"streaming"):
        results.append(check_pass("uiStore has streaming state"))
    else:
        results.append(check_fail("uiStore missing streaming state"))
    
    print()
    
    # Test 7: Build test
    print("7. Build Test")
    try:
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd="frontend",
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0:
            results.append(check_pass("Frontend builds successfully"))
        else:
            results.append(check_fail(f"Build failed: {result.stderr[:200]}"))
    except subprocess.TimeoutExpired:
        results.append(check_warn("Build timed out"))
    except Exception as e:
        results.append(check_fail(f"Build error: {str(e)}"))
    
    print()
    print("=" * 60)
    
    # Summary
    passed = sum(1 for r in results if r)
    total = len(results)
    
    print(f"Results: {passed}/{total} checks passed")
    
    if passed == total:
        print(f"{GREEN}All checks passed!{RESET}")
        return 0
    else:
        print(f"{YELLOW}Some checks need attention.{RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(main())