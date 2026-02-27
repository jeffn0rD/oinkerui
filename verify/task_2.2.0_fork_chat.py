#!/usr/bin/env python3
"""
Verification script for Task 2.2.0: Implement Chat Forking

Verifies:
1. forkChat function exists in chatService.js
2. Fork API endpoint exists in routes/chats.js
3. /chat-fork slash command handler exists in commandService.js
4. Fork tests exist and cover key scenarios
5. All required fork options are supported (fromMessageId, prune, name)
"""

import os
import sys
import re

def check_file_contains(filepath, patterns, description):
    """Check that a file contains all specified patterns."""
    if not os.path.exists(filepath):
        print(f"  FAIL: {filepath} does not exist")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    all_found = True
    for pattern in patterns:
        if isinstance(pattern, str):
            if pattern not in content:
                print(f"  FAIL: '{pattern}' not found in {filepath}")
                all_found = False
        else:
            if not re.search(pattern, content):
                print(f"  FAIL: pattern not found in {filepath}")
                all_found = False
    
    if all_found:
        print(f"  PASS: {description}")
    return all_found

def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(base)
    
    results = []
    
    print("=" * 60)
    print("Task 2.2.0 Verification: Chat Forking")
    print("=" * 60)
    
    # 1. Check forkChat function in chatService
    print("\n1. Checking chatService.js for forkChat function...")
    results.append(check_file_contains(
        'backend/src/services/chatService.js',
        ['async function forkChat(', 'fromMessageId', 'prune', 'forked_from_chat_id', 'forked_at_message_id'],
        'forkChat function with all required parameters'
    ))
    
    # 2. Check API endpoint
    print("\n2. Checking routes/chats.js for fork endpoint...")
    results.append(check_file_contains(
        'backend/src/routes/chats.js',
        ['/api/projects/:projectId/chats/:chatId/fork', 'chatService.forkChat'],
        'POST fork endpoint exists'
    ))
    
    # 3. Check slash command handler
    print("\n3. Checking commandService.js for /chat-fork handler...")
    results.append(check_file_contains(
        'backend/src/services/commandService.js',
        ['chat-fork', 'chatService.forkChat', 'chat_forked'],
        '/chat-fork slash command handler'
    ))
    
    # 4. Check fork tests exist
    print("\n4. Checking fork tests...")
    results.append(check_file_contains(
        'backend/tests/services/chatService.test.js',
        [
            'forkChat',
            'should fork entire chat with all messages',
            'should fork with custom name',
            'should fork from specific message point',
            'should fork with pruning - exclude discarded messages',
            'should fork with pruning - exclude context-excluded messages',
            'should set forked_from metadata correctly',
            'should not modify original chat',
            'should throw NotFoundError for invalid message ID',
            'should throw NotFoundError for invalid chat ID',
            'should throw ValidationError for invalid project ID'
        ],
        'All fork test scenarios present'
    ))
    
    # 5. Check fork spec exists
    print("\n5. Checking fork_chat spec...")
    results.append(check_file_contains(
        'spec/functions/backend_node/fork_chat.yaml',
        ['fork_chat', 'forkChat', 'fromMessageId', 'prune'],
        'fork_chat spec exists with required fields'
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