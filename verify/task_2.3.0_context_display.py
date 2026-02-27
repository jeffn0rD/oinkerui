#!/usr/bin/env python3
"""
Verification script for Task 2.3.0: Live Context Size Display

Verifies:
1. Context preview endpoint exists
2. ContextSizeDisplay component exists
3. Context store has token stats
4. API client has contextPreview method
5. Component is integrated into ChatInterface
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
    print("Task 2.3.0 Verification: Live Context Size Display")
    print("=" * 60)

    print("\n1. Checking context preview endpoint...")
    results.append(check_file_contains(
        'backend/src/routes/chats.js',
        ['context-preview', 'total_tokens', 'max_tokens', 'usage_percent', 'breakdown'],
        'Context preview endpoint exists with token data'
    ))

    print("\n2. Checking ContextSizeDisplay component...")
    results.append(check_file_contains(
        'frontend/src/lib/components/ContextSizeDisplay.svelte',
        ['tokenStats', 'usagePercent', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'compact'],
        'ContextSizeDisplay component with color coding'
    ))

    print("\n3. Checking context store...")
    results.append(check_file_contains(
        'frontend/src/lib/stores/contextStore.js',
        ['tokenStats', 'contextMessages', 'pinnedMessages', 'usagePercent', 'isNearLimit', 'estimateTokens'],
        'Context store with token stats and derived stores'
    ))

    print("\n4. Checking API client contextPreview method...")
    results.append(check_file_contains(
        'frontend/src/lib/utils/api.js',
        ['contextPreview:', 'context-preview'],
        'API client has contextPreview method'
    ))

    print("\n5. Checking ChatInterface integration...")
    results.append(check_file_contains(
        'frontend/src/lib/components/ChatInterface.svelte',
        ['ContextSizeDisplay', 'compact={true}'],
        'ContextSizeDisplay integrated into ChatInterface'
    ))

    print("\n6. Checking component export...")
    results.append(check_file_contains(
        'frontend/src/lib/components/index.js',
        ['ContextSizeDisplay'],
        'ContextSizeDisplay exported from index'
    ))

    print("\n7. Checking countTokens function exists...")
    results.append(check_file_contains(
        'backend/src/services/llmService.js',
        ['function countTokens', 'countTokens'],
        'countTokens function available in llmService'
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