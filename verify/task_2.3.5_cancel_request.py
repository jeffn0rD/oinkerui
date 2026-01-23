#!/usr/bin/env python3
"""
Verification script for Task 2.3.5: Cancel LLM Request

Tests:
1. Cancel service file exists and has required functions
2. Chat routes include cancel endpoint
3. LLM service uses cancelService
4. Frontend CancelButton component exists
5. API client has cancel method
6. UI store has streaming state
"""

import os
import sys
import re

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
    print("Task 2.3.5: Cancel LLM Request - Verification")
    print("=" * 60)
    print()
    
    results = []
    
    # Test 1: Cancel service exists
    print("1. Backend Cancel Service")
    cancel_service_path = "backend/src/services/cancelService.js"
    if file_exists(cancel_service_path):
        results.append(check_pass(f"Cancel service file exists: {cancel_service_path}"))
        
        # Check required functions
        required_funcs = [
            'registerRequest',
            'cancelRequest',
            'unregisterRequest',
            'getActiveRequest',
            'updatePartialResponse'
        ]
        for func in required_funcs:
            if file_contains(cancel_service_path, f"function {func}"):
                results.append(check_pass(f"Function '{func}' exists"))
            else:
                results.append(check_fail(f"Function '{func}' not found"))
    else:
        results.append(check_fail(f"Cancel service file not found: {cancel_service_path}"))
    
    print()
    
    # Test 2: Chat routes include cancel endpoint
    print("2. Chat Routes Cancel Endpoint")
    chat_routes_path = "backend/src/routes/chats.js"
    if file_exists(chat_routes_path):
        if file_contains(chat_routes_path, r"/cancel"):
            results.append(check_pass("Cancel endpoint route exists"))
        else:
            results.append(check_fail("Cancel endpoint route not found"))
        
        if file_contains(chat_routes_path, r"cancelService"):
            results.append(check_pass("cancelService imported in routes"))
        else:
            results.append(check_fail("cancelService not imported in routes"))
    else:
        results.append(check_fail(f"Chat routes file not found: {chat_routes_path}"))
    
    print()
    
    # Test 3: LLM service uses cancelService
    print("3. LLM Service Integration")
    llm_service_path = "backend/src/services/llmService.js"
    if file_exists(llm_service_path):
        if file_contains(llm_service_path, r"require\(['&quot;]\.\/cancelService"):
            results.append(check_pass("LLM service imports cancelService"))
        else:
            results.append(check_fail("LLM service does not import cancelService"))
        
        if file_contains(llm_service_path, r"cancelService\.registerRequest"):
            results.append(check_pass("LLM service uses registerRequest"))
        else:
            results.append(check_fail("LLM service does not use registerRequest"))
    else:
        results.append(check_fail(f"LLM service file not found: {llm_service_path}"))
    
    print()
    
    # Test 4: Frontend CancelButton component
    print("4. Frontend CancelButton Component")
    cancel_button_path = "frontend/src/lib/components/CancelButton.svelte"
    if file_exists(cancel_button_path):
        results.append(check_pass(f"CancelButton component exists: {cancel_button_path}"))
        
        if file_contains(cancel_button_path, r"export let isActive"):
            results.append(check_pass("CancelButton has isActive prop"))
        else:
            results.append(check_fail("CancelButton missing isActive prop"))
        
        if file_contains(cancel_button_path, r"dispatch\(['&quot;]cancel"):
            results.append(check_pass("CancelButton dispatches cancel event"))
        else:
            results.append(check_fail("CancelButton does not dispatch cancel event"))
        
        if file_contains(cancel_button_path, r"Escape"):
            results.append(check_pass("CancelButton has Escape key support"))
        else:
            results.append(check_warn("CancelButton may not have Escape key support"))
    else:
        results.append(check_fail(f"CancelButton component not found: {cancel_button_path}"))
    
    print()
    
    # Test 5: API client has cancel method
    print("5. API Client Cancel Method")
    api_client_path = "frontend/src/lib/utils/api.js"
    if file_exists(api_client_path):
        if file_contains(api_client_path, r"cancel:\s*\("):
            results.append(check_pass("API client has cancel method"))
        else:
            results.append(check_fail("API client missing cancel method"))
        
        if file_contains(api_client_path, r"getStatus:\s*\("):
            results.append(check_pass("API client has getStatus method"))
        else:
            results.append(check_warn("API client missing getStatus method"))
    else:
        results.append(check_fail(f"API client file not found: {api_client_path}"))
    
    print()
    
    # Test 6: UI store has streaming state
    print("6. UI Store Streaming State")
    ui_store_path = "frontend/src/lib/stores/uiStore.js"
    if file_exists(ui_store_path):
        if file_contains(ui_store_path, r"streaming"):
            results.append(check_pass("UI store has streaming state"))
        else:
            results.append(check_fail("UI store missing streaming state"))
        
        if file_contains(ui_store_path, r"startStreaming"):
            results.append(check_pass("UI store has startStreaming function"))
        else:
            results.append(check_fail("UI store missing startStreaming function"))
        
        if file_contains(ui_store_path, r"stopStreaming"):
            results.append(check_pass("UI store has stopStreaming function"))
        else:
            results.append(check_fail("UI store missing stopStreaming function"))
    else:
        results.append(check_fail(f"UI store file not found: {ui_store_path}"))
    
    print()
    
    # Test 7: ChatInterface integration
    print("7. ChatInterface Integration")
    chat_interface_path = "frontend/src/lib/components/ChatInterface.svelte"
    if file_exists(chat_interface_path):
        if file_contains(chat_interface_path, r"CancelButton"):
            results.append(check_pass("ChatInterface imports CancelButton"))
        else:
            results.append(check_fail("ChatInterface does not import CancelButton"))
        
        if file_contains(chat_interface_path, r"handleCancel"):
            results.append(check_pass("ChatInterface has handleCancel function"))
        else:
            results.append(check_fail("ChatInterface missing handleCancel function"))
    else:
        results.append(check_fail(f"ChatInterface file not found: {chat_interface_path}"))
    
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
        print(f"{RED}Some checks failed.{RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(main())