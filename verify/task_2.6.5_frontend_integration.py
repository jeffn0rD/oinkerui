#!/usr/bin/env python3
"""
Verification script for Task 2.6.5: Frontend-Backend Integration

Verifies:
1. API client has all required endpoints
2. Sync store has all required actions
3. Stores are properly structured
4. Streaming support is implemented
5. Error handling is in place
"""

import os
import sys

def check_file_contains(filepath, patterns, description):
    """Check that a file contains all specified patterns."""
    if not os.path.exists(filepath):
        print(f"  FAIL: {filepath} does not exist")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    all_found = True
    for pattern in patterns:
        if pattern not in content:
            print(f"  FAIL: '{pattern}' not found in {filepath}")
            all_found = False
    
    if all_found:
        print(f"  PASS: {description}")
    return all_found

def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(base)
    
    results = []
    
    print("=" * 60)
    print("Task 2.6.5 Verification: Frontend-Backend Integration")
    print("=" * 60)
    
    # 1. API Client - Project endpoints
    print("\n1. Checking API client - Project endpoints...")
    results.append(check_file_contains(
        'frontend/src/lib/utils/api.js',
        ['projectApi', 'list:', 'get:', 'create:', 'update:', 'delete:'],
        'Project API endpoints complete'
    ))
    
    # 2. API Client - Chat endpoints (including fork, cancel, status)
    print("\n2. Checking API client - Chat endpoints...")
    results.append(check_file_contains(
        'frontend/src/lib/utils/api.js',
        ['chatApi', 'fork:', 'cancel:', 'getStatus:', 'getActiveRequest:'],
        'Chat API endpoints complete (including fork, cancel, status)'
    ))
    
    # 3. API Client - Message endpoints (including flags, streaming)
    print("\n3. Checking API client - Message endpoints...")
    results.append(check_file_contains(
        'frontend/src/lib/utils/api.js',
        ['messageApi', 'list:', 'get:', 'send:', 'updateFlags:', 'stream:'],
        'Message API endpoints complete (including flags, streaming)'
    ))
    
    # 4. API Client - Command endpoints
    print("\n4. Checking API client - Command endpoints...")
    results.append(check_file_contains(
        'frontend/src/lib/utils/api.js',
        ['commandApi'],
        'Command API endpoints present'
    ))
    
    # 5. API Client - Error classes
    print("\n5. Checking API client - Error classes...")
    results.append(check_file_contains(
        'frontend/src/lib/utils/api.js',
        ['class ApiError', 'class NetworkError', 'class ValidationError'],
        'Typed error classes present'
    ))
    
    # 6. Sync Store - Project sync
    print("\n6. Checking sync store - Project sync...")
    results.append(check_file_contains(
        'frontend/src/lib/stores/syncStore.js',
        ['projectSync', 'fetchAll', 'create', 'update', 'delete', 'select'],
        'Project sync actions complete'
    ))
    
    # 7. Sync Store - Chat sync (including fork)
    print("\n7. Checking sync store - Chat sync...")
    results.append(check_file_contains(
        'frontend/src/lib/stores/syncStore.js',
        ['chatSync', 'fork'],
        'Chat sync actions complete (including fork)'
    ))
    
    # 8. Sync Store - Message sync (including streaming, flags)
    print("\n8. Checking sync store - Message sync...")
    results.append(check_file_contains(
        'frontend/src/lib/stores/syncStore.js',
        ['messageSync', 'sendStream', 'cancelStream', 'updateFlags'],
        'Message sync actions complete (streaming, cancel, flags)'
    ))
    
    # 9. Sync Store - Command sync
    print("\n9. Checking sync store - Command sync...")
    results.append(check_file_contains(
        'frontend/src/lib/stores/syncStore.js',
        ['commandSync'],
        'Command sync actions present'
    ))
    
    # 10. Sync Store - Initialization and persistence
    print("\n10. Checking sync store - Initialization...")
    results.append(check_file_contains(
        'frontend/src/lib/stores/syncStore.js',
        ['initializeFromBackend', 'localStorage'],
        'Backend initialization and persistence'
    ))
    
    # 11. Store structure - all stores exist
    print("\n11. Checking store structure...")
    stores = [
        'frontend/src/lib/stores/projectStore.js',
        'frontend/src/lib/stores/chatStore.js',
        'frontend/src/lib/stores/uiStore.js',
        'frontend/src/lib/stores/syncStore.js',
        'frontend/src/lib/stores/contextStore.js',
        'frontend/src/lib/stores/settingsStore.js'
    ]
    all_exist = all(os.path.exists(s) for s in stores)
    if all_exist:
        print("  PASS: All store files exist")
    else:
        missing = [s for s in stores if not os.path.exists(s)]
        print(f"  FAIL: Missing stores: {missing}")
    results.append(all_exist)
    
    # 12. UI Store - Streaming state management
    print("\n12. Checking UI store - Streaming state...")
    results.append(check_file_contains(
        'frontend/src/lib/stores/uiStore.js',
        ['startStreaming', 'stopStreaming', 'streaming', 'notifications', 'addNotification'],
        'UI store has streaming state and notifications'
    ))
    
    # Summary
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    if passed == total:
        print(f"ALL CHECKS PASSED ({passed}/{total})")
    else:
        print(f"SOME CHECKS FAILED ({passed}/{total})")
    print("=" * 60)
    
    return 0 if passed == total else 1

if __name__ == '__main__':
    sys.exit(main())