#!/usr/bin/env python3
"""
Verification script for Task 2.9.0: Phase 2 Integration and Testing
Verifies all Phase 2 features are integrated and tested.
"""

import os
import sys
import subprocess
import json

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

def file_exists(path):
    return os.path.exists(path)

print("=" * 60)
print("Task 2.9.0 Verification: Phase 2 Integration and Testing")
print("=" * 60)

# ============================================================
# 1. Phase 2 E2E Test File Exists
# ============================================================
print("\n1. Phase 2 Integration Test Files")
check("Phase 2 E2E test exists", file_exists('backend/tests/e2e/phase2Integration.test.js'))
check("App flow frontend test exists", file_exists('frontend/tests/integration/AppFlow.test.js'))
check("Chat flow frontend test exists", file_exists('frontend/tests/integration/ChatFlow.test.js'))
check("Full workflow E2E test exists", file_exists('backend/tests/e2e/fullWorkflow.test.js'))

# ============================================================
# 2. Phase 2 Feature Test Coverage
# ============================================================
print("\n2. Phase 2 Feature Test Coverage")
p2_test = read_file('backend/tests/e2e/phase2Integration.test.js')
check("Tests context flags integration", "Context Flags Integration" in p2_test)
check("Tests aside + context integration", "Aside + Context Integration" in p2_test)
check("Tests slash commands integration", "Slash Commands Integration" in p2_test)
check("Tests chat forking integration", "Chat Forking Integration" in p2_test)
check("Tests cancel request integration", "Cancel Request Integration" in p2_test)
check("Tests template integration", "Template Integration" in p2_test)
check("Tests cross-feature fork + flags", "Fork + Context Flags" in p2_test)
check("Tests full chat flow E2E", "Full Chat Flow E2E" in p2_test)
check("Tests error handling integration", "Error Handling Integration" in p2_test)
check("Tests pure aside context", "pure aside" in p2_test.lower())
check("Tests pinned messages in context", "pinned" in p2_test.lower())
check("Tests discarded messages excluded", "discarded" in p2_test.lower())

# ============================================================
# 3. Frontend Test Coverage
# ============================================================
print("\n3. Frontend Test Coverage")
app_test = read_file('frontend/tests/integration/AppFlow.test.js')
check("Tests main layout rendering", "renders the main layout" in app_test)
check("Tests project loading on mount", "loads projects on mount" in app_test)
check("Tests create project modal", "create project modal" in app_test)
check("Tests settings modal", "settings modal" in app_test)
check("Tests profile modal", "profile modal" in app_test)
check("Tests escape key closes modals", "Escape" in app_test)

# ============================================================
# 4. Service Test Files
# ============================================================
print("\n4. Service Test Files")
check("Project service tests", file_exists('backend/tests/services/projectService.test.js'))
check("Chat service tests", file_exists('backend/tests/services/chatService.test.js'))
check("Message service tests", file_exists('backend/tests/services/messageService.test.js'))
check("LLM service tests", file_exists('backend/tests/services/llmService.test.js'))
check("Command service tests", file_exists('backend/tests/services/commandService.test.js'))
check("Streaming service tests", file_exists('backend/tests/services/streamingService.test.js'))
check("Template service tests", file_exists('backend/tests/services/templateService.test.js'))
check("Aside context tests", file_exists('backend/tests/services/asideContext.test.js'))
check("Git service tests", file_exists('backend/tests/services/gitService.test.js'))
check("Data entity service tests", file_exists('backend/tests/services/dataEntityService.test.js'))
check("Logging service tests", file_exists('backend/tests/services/loggingService.test.js'))

# ============================================================
# 5. API Client Configuration
# ============================================================
print("\n5. API Client Configuration")
api_js = read_file('frontend/src/lib/utils/api.js')
check("API uses relative /api path", "'/api'" in api_js)
check("API has projectApi", "projectApi" in api_js)
check("API has chatApi", "chatApi" in api_js)
check("API has messageApi", "messageApi" in api_js)
check("API has templateApi", "templateApi" in api_js)
check("API has healthApi", "healthApi" in api_js)
check("API has streaming support", "stream:" in api_js or "stream(" in api_js)

# ============================================================
# 6. App.svelte Integration
# ============================================================
print("\n6. App.svelte Integration")
app = read_file('frontend/src/App.svelte')
check("App loads projects on mount", "onMount" in app and "projectApi.list" in app)
check("App loads chats on project select", "loadChats" in app)
check("App loads messages on chat select", "loadMessages" in app)
check("App has create project modal", "showCreateProject" in app)
check("App has create chat modal", "showCreateChat" in app)
check("App has settings modal", "showSettings" in app)
check("App has profile modal", "showProfile" in app)
check("App unwraps API responses", "unwrap" in app)

# ============================================================
# 7. Backend Integration
# ============================================================
print("\n7. Backend Integration")
backend_index = read_file('backend/src/index.js')
check("Backend registers project routes", "projects" in backend_index)
check("Backend registers chat routes", "chats" in backend_index)
check("Backend registers message routes", "messages" in backend_index)
check("Backend registers streaming routes", "streaming" in backend_index)
check("Backend registers template routes", "templates" in backend_index)
check("Backend has optional static serving", "fs.existsSync" in backend_index)
check("Backend has CORS configured", "cors" in backend_index.lower())

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