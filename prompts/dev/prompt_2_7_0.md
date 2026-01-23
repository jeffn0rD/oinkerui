# Prompt 2.7.0: Implement Message Flag UI Controls

## Task Description
Implement frontend UI controls for managing message context flags with visual indicators.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get message_flag_controls component spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/message_flag_controls.yaml" --mode file --pretty

# Get message_item component spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/message_item.yaml" --mode file --pretty

# Get update_message_flags function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/update_message_flags.yaml" --mode file --pretty

# Get Message entity with flags
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 60 "Message:"

# Get UI spec for flag indicators
python3 tools/doc_query.py --query "spec/ui.yaml" --mode file --pretty | grep -A 30 "flag"
```

## Spec References
- **Component Specs**:
  - spec/functions/frontend_svelte/message_flag_controls.yaml
  - spec/functions/frontend_svelte/message_item.yaml
- **Function Specs**:
  - spec/functions/backend_node/update_message_flags.yaml
- **Entity Specs**:
  - spec/domain.yaml#Message

## Requirements

### Flag Controls Component

1. **MessageFlagControls.svelte**
   - Toggle buttons for each flag:
     - include_in_context (eye icon)
     - is_pinned (pin icon)
     - is_aside (arrow-right icon)
     - is_discarded (trash icon)
   - Compact mode (icons only)
   - Full mode (icons + labels)
   - Disabled state

2. **Visual States**
   - Active: highlighted icon
   - Inactive: muted icon
   - Hover: tooltip with description
   - Disabled: grayed out

3. **Interactions**
   - Click to toggle
   - Keyboard accessible (Tab, Enter)
   - Immediate visual feedback
   - API call on change

### Message Item Integration

4. **Update MessageItem.svelte**
   - Show flag controls on hover
   - Position: top-right corner
   - Show flag indicators always visible:
     - Pinned: yellow pin icon
     - Aside: purple border
     - Pure aside: pink border
     - Discarded: strikethrough + dimmed

5. **Context Highlighting**
   - Messages in context: normal
   - Messages excluded: dimmed (opacity)
   - Visual distinction for why excluded

### API Integration

6. **Flag Update Flow**
   - User clicks flag toggle
   - Optimistic UI update
   - API call to update flag
   - Rollback on error
   - Toast notification on error

7. **Context Recalculation**
   - After flag change, recalculate context preview
   - Update context size display
   - Highlight affected messages

### Accessibility

8. **A11y Requirements**
   - ARIA labels for all buttons
   - Keyboard navigation
   - Screen reader announcements
   - Focus indicators

### Testing

9. **Add Tests**
   - Component tests for flag controls
   - Test all flag states
   - Test API integration
   - Test accessibility

## Verification
- [ ] All flag toggles work
- [ ] Visual indicators display correctly
- [ ] Hover controls appear/disappear
- [ ] API updates flags correctly
- [ ] Optimistic updates work
- [ ] Error handling works
- [ ] Context preview updates
- [ ] Keyboard accessible
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.7.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented message flag UI controls"
```