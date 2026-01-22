# Prompt 2.7.0: Implement Message Flag UI Controls

## Task Description
Implement the frontend UI controls for managing message context flags (aside, pure aside, pinned, discard).

## Context Gathering
```bash
# Get UI spec for message controls
python3 tools/doc_query.py --query "spec/ui.yaml" --mode file --pretty | grep -A 50 "message"

# Get message component
cat frontend/src/lib/components/Message.svelte

# Get message flags API
cat backend/src/routes/messages.js
```

## Requirements

### UI Controls
1. Toggle buttons for each flag on messages
2. Visual indicators for flagged messages
3. Keyboard shortcuts for common actions
4. Bulk flag operations (select multiple)

### Flag Visual Indicators
- Aside: Dimmed/italic text, side indicator
- Pure Aside: Special icon, different background
- Pinned: Pin icon, highlighted border
- Discarded: Strikethrough, collapsed by default

### Implementation Steps

1. **Update Message Component**
   - Add flag toggle buttons
   - Add visual indicators for each flag
   - Handle flag state changes
   - Call API to update flags

2. **Create Flag Controls Component**
   - MessageFlagControls.svelte
   - Dropdown or button group
   - Tooltips explaining each flag

3. **Add Keyboard Shortcuts**
   - Ctrl+A: Toggle aside
   - Ctrl+Shift+A: Toggle pure aside
   - Ctrl+P: Toggle pinned
   - Ctrl+D: Toggle discarded

4. **Update Message Store**
   - Track flag states
   - Optimistic updates
   - Sync with backend

5. **Add Bulk Operations**
   - Select multiple messages
   - Apply flag to selection
   - Clear all flags option

6. **Add Tests**
   - Flag toggle tests
   - Visual indicator tests
   - Keyboard shortcut tests
   - Bulk operation tests

## Verification
- [ ] All flags toggleable via UI
- [ ] Visual indicators clear
- [ ] Keyboard shortcuts work
- [ ] Bulk operations work
- [ ] Changes persist to backend
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.7.0
```