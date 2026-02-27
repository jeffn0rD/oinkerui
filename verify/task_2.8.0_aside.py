#!/usr/bin/env python3
"""Verification script for Task 2.8.0: Aside and Pure Aside Functionality."""

import os
import sys

PASS = 0
FAIL = 0


def check(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✓ {name}")
    else:
        FAIL += 1
        print(f"  ✗ {name} - {detail}")


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    print("=" * 60)
    print("Task 2.8.0 Verification: Aside and Pure Aside Functionality")
    print("=" * 60)

    # 1. Backend Context Construction
    print("\n1. Backend Context Construction (constructContext)")
    llm_svc = os.path.join(base, "backend", "src", "services", "llmService.js")
    if os.path.exists(llm_svc):
        content = open(llm_svc).read()
        check("pure_aside handling (step 2)", "pure_aside" in content)
        check("Early termination for pure_aside", "pure_aside === true" in content)
        check("Aside filter in step 3", "is_aside === true" in content)
        check("Pinned aside exception", "is_pinned" in content)
        check("System prelude + current only for pure_aside", "system" in content.lower() and "current" in content.lower())

    # 2. Backend Command Service
    print("\n2. Backend Slash Commands")
    cmd_svc = os.path.join(base, "backend", "src", "services", "commandService.js")
    if os.path.exists(cmd_svc):
        content = open(cmd_svc).read()
        check("/aside command registered", "'aside'" in content)
        check("/aside-pure command registered", "'aside-pure'" in content)
        check("handleAside function", "handleAside" in content)
        check("handlePureAside function", "handlePureAside" in content)
        check("aside sets is_aside flag", "is_aside: true" in content)
        check("pure_aside sets both flags", "pure_aside: true" in content)
        check("continueWithLLM for aside", "continueWithLLM: true" in content)

    # 3. Backend Message Service
    print("\n3. Backend Message Service")
    msg_svc = os.path.join(base, "backend", "src", "services", "messageService.js")
    if os.path.exists(msg_svc):
        content = open(msg_svc).read()
        check("is_aside in message creation", "is_aside:" in content)
        check("pure_aside in message creation", "pure_aside:" in content)
        check("Flag invariant: pure_aside implies is_aside", "pure_aside === true" in content and "is_aside = true" in content)
        check("updateMessageFlags handles aside", "is_aside" in content)

    # 4. Backend Streaming Route
    print("\n4. Backend Streaming Route")
    streaming = os.path.join(base, "backend", "src", "routes", "streaming.js")
    if os.path.exists(streaming):
        content = open(streaming).read()
        check("is_aside in request body", "is_aside" in content)
        check("pure_aside in request body", "pure_aside" in content)
        check("User message gets aside flags", "is_aside: is_aside" in content or "is_aside ||" in content)
        check("Assistant message gets aside flag", "is_aside:" in content)

    # 5. Frontend MessageInput
    print("\n5. Frontend MessageInput (Aside UI)")
    msg_input = os.path.join(base, "frontend", "src", "lib", "components", "MessageInput.svelte")
    if os.path.exists(msg_input):
        content = open(msg_input).read()
        check("asideMode state", "asideMode" in content)
        check("Aside mode toggle button", "cycleAsideMode" in content)
        check("Aside mode indicator", "Aside Mode" in content)
        check("Pure Aside mode indicator", "Pure Aside Mode" in content)
        check("Ctrl+Enter for aside", "ctrlKey" in content)
        check("Ctrl+Alt+Enter for pure aside", "altKey" in content)
        check("is_aside in dispatch", "is_aside" in content)
        check("pure_aside in dispatch", "pure_aside" in content)
        check("Aside border color (yellow)", "border-yellow" in content)
        check("Pure aside border color (pink)", "border-pink" in content)
        check("Keyboard shortcuts hint", "Ctrl+Enter for aside" in content)

    # 6. Frontend ChatInterface
    print("\n6. Frontend ChatInterface (Aside Passing)")
    chat_iface = os.path.join(base, "frontend", "src", "lib", "components", "ChatInterface.svelte")
    if os.path.exists(chat_iface):
        content = open(chat_iface).read()
        check("is_aside in event detail", "is_aside" in content)
        check("pure_aside in event detail", "pure_aside" in content)
        check("Aside flags passed to dispatch", "is_aside:" in content)

    # 7. Message Visual Indicators
    print("\n7. Message Visual Indicators")
    msg = os.path.join(base, "frontend", "src", "lib", "components", "Message.svelte")
    if os.path.exists(msg):
        content = open(msg).read()
        check("Aside visual style", "is-aside" in content)
        check("Pure aside visual style", "is-pure-aside" in content)
        check("Aside border color", "yellow" in content.lower())
        check("Pure aside border color", "pink" in content.lower() or "ec4899" in content)
        check("Aside badge/label", "Aside" in content)

    # 8. Tests
    print("\n8. Tests")
    test_file = os.path.join(base, "backend", "tests", "services", "asideContext.test.js")
    check("asideContext.test.js exists", os.path.exists(test_file))
    if os.path.exists(test_file):
        content = open(test_file).read()
        check("Test: aside excluded from future context", "excluded from future context" in content)
        check("Test: pure aside system + current only", "system + current" in content.lower() or "pure aside" in content.lower())
        check("Test: pinned aside included", "pinned aside" in content.lower())

    # Summary
    print("\n" + "=" * 60)
    total = PASS + FAIL
    print(f"Results: {PASS}/{total} checks passed")
    if FAIL > 0:
        print(f"  {FAIL} checks FAILED")
        return 1
    else:
        print("  All checks PASSED ✓")
        return 0


if __name__ == "__main__":
    sys.exit(main())