#!/usr/bin/env python3
"""
Verification script for Task 2.4.0: Implement Requery Functionality

Verifies:
1. Requery function exists in messageService
2. Requery API endpoint exists
3. Slash command handler exists
4. Frontend API client has requery method
5. Sync store has requery action
6. Branching support is implemented
"""

import os
import sys

def check_file_contains(filepath, patterns, description):
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
    print("Task 2.4.0 Verification: Requery Functionality")
    print("=" * 60)

    print("\n1. Checking requery function in messageService...")
    results.append(check_file_contains(
        'backend/src/services/messageService.js',
        ['async function requery(', 'keepPrevious', 'is_discarded', 'parent_message_id',
         'original_response', 'new_response', 'branch_created'],
        'Requery function with branching support'
    ))

    print("\n2. Checking requery API endpoint...")
    results.append(check_file_contains(
        'backend/src/routes/messages.js',
        ['/api/projects/:projectId/chats/:chatId/requery', 'messageService.requery'],
        'POST requery endpoint exists'
    ))

    print("\n3. Checking slash command handler...")
    results.append(check_file_contains(
        'backend/src/services/commandService.js',
        ['requery', 'handleRequery', 'requery_triggered'],
        '/requery slash command handler'
    ))

    print("\n4. Checking frontend API client...")
    results.append(check_file_contains(
        'frontend/src/lib/utils/api.js',
        ['requery:', '/requery'],
        'API client has requery method'
    ))

    print("\n5. Checking sync store requery action...")
    results.append(check_file_contains(
        'frontend/src/lib/stores/syncStore.js',
        ['async requery(', 'messageApi.requery', 'branch_created'],
        'Sync store has requery action with branch support'
    ))

    print("\n6. Checking requery spec exists...")
    results.append(check_file_contains(
        'spec/functions/backend_node/requery.yaml',
        ['requery', 'keepPrevious', 'branch'],
        'Requery spec exists'
    ))

    print("\n7. Checking module exports...")
    results.append(check_file_contains(
        'backend/src/services/messageService.js',
        ['requery,'],
        'Requery exported from messageService'
    ))

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