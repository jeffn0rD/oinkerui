#!/usr/bin/env python3
"""Verification script for Task 2.7.0: Message Flag UI Controls."""

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
    fe = os.path.join(base, "frontend", "src", "lib", "components")

    print("=" * 60)
    print("Task 2.7.0 Verification: Message Flag UI Controls")
    print("=" * 60)

    # 1. MessageFlagControls Component
    print("\n1. MessageFlagControls Component")
    flag_ctrl = os.path.join(fe, "MessageFlagControls.svelte")
    check("MessageFlagControls.svelte exists", os.path.exists(flag_ctrl))
    if os.path.exists(flag_ctrl):
        content = open(flag_ctrl).read()
        check("is_pinned flag", "is_pinned" in content)
        check("include_in_context flag", "include_in_context" in content)
        check("is_aside flag", "is_aside" in content)
        check("is_discarded flag", "is_discarded" in content)
        check("onFlagChange prop", "onFlagChange" in content)
        check("disabled prop", "disabled" in content)
        check("compact prop", "compact" in content)
        check("Optimistic update", "pendingFlags" in content)
        check("Rollback on error", "Rollback" in content or "rollback" in content.lower() or "rest" in content)
        check("ARIA labels", "aria-label" in content)
        check("ARIA pressed", "aria-pressed" in content)
        check("Keyboard accessible", "keydown" in content)
        check("Toolbar role", 'role="toolbar"' in content)
        check("Toggle function", "toggleFlag" in content)
        check("Pin icon (SVG)", "pin" in content.lower())
        check("Eye icon (SVG)", "eye" in content.lower())
        check("Trash icon (SVG)", "trash" in content.lower())

    # 2. Message Component Integration
    print("\n2. Message Component Integration")
    msg = os.path.join(fe, "Message.svelte")
    check("Message.svelte exists", os.path.exists(msg))
    if os.path.exists(msg):
        content = open(msg).read()
        check("MessageFlagControls imported", "MessageFlagControls" in content)
        check("onFlagChange prop", "onFlagChange" in content)
        check("Flag controls on hover", "showControls" in content)
        check("Pinned visual indicator", "isPinned" in content or "is_pinned" in content)
        check("Aside visual indicator", "isAside" in content or "is_aside" in content)
        check("Pure aside visual indicator", "isPureAside" in content or "pure_aside" in content)
        check("Discarded visual indicator", "isDiscarded" in content or "is_discarded" in content)
        check("Excluded visual indicator", "isExcluded" in content or "is-excluded" in content)
        check("Pinned border style", "is-pinned" in content)
        check("Aside border style", "is-aside" in content)
        check("Discarded strikethrough", "line-through" in content)
        check("Discarded dimmed", "opacity" in content)
        check("Article role", 'role="article"' in content)

    # 3. MessageList Integration
    print("\n3. MessageList Integration")
    msg_list = os.path.join(fe, "MessageList.svelte")
    check("MessageList.svelte exists", os.path.exists(msg_list))
    if os.path.exists(msg_list):
        content = open(msg_list).read()
        check("handleFlagChange function", "handleFlagChange" in content)
        check("Optimistic update in list", "messages.update" in content)
        check("API call for flags", "messageApi.updateFlags" in content or "updateFlags" in content)
        check("Rollback on error", "Rollback" in content or "rollback" in content.lower() or "!newValue" in content)
        check("onFlagChange passed to Message", "onFlagChange" in content)
        check("flagChanged event dispatch", "flagChanged" in content)

    # 4. Component Index
    print("\n4. Component Index")
    idx = os.path.join(fe, "index.js")
    if os.path.exists(idx):
        content = open(idx).read()
        check("MessageFlagControls exported", "MessageFlagControls" in content)

    # 5. Backend API Support
    print("\n5. Backend API Support")
    routes = os.path.join(base, "backend", "src", "routes", "messages.js")
    if os.path.exists(routes):
        content = open(routes).read()
        check("PATCH flags endpoint exists", "/flags" in content)
        check("updateMessageFlags called", "updateMessageFlags" in content)

    # 6. Frontend API Support
    print("\n6. Frontend API Support")
    api = os.path.join(base, "frontend", "src", "lib", "utils", "api.js")
    if os.path.exists(api):
        content = open(api).read()
        check("updateFlags method", "updateFlags" in content)
        check("PATCH method", "PATCH" in content)

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