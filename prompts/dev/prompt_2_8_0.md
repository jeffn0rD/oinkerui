# Prompt 2.8.0: Implement Aside and Pure Aside Functionality

## Task Description
Implement complete aside and pure aside message functionality with context handling and UI feedback.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get context construction algorithm (aside handling)
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get Message entity (aside flags)
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 60 "Message:"

# Get slash commands for aside
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty | grep -A 20 "aside"

# Get handle_send_message spec (aside options)
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/handle_send_message.yaml" --mode file --pretty

# Get current context construction
cat backend/src/services/llmService.js | grep -A 50 "constructContext"
```

## Spec References
- **Context Spec**: spec/context.yaml (steps 2-3 for aside handling)
- **Command Spec**: spec/commands.yaml (/aside, /aside-pure)
- **Function Specs**:
  - spec/functions/backend_node/construct_context.yaml
  - spec/functions/frontend_svelte/handle_send_message.yaml
- **Entity Specs**:
  - spec/domain.yaml#Message (is_aside, pure_aside)

## Requirements

### Aside Behavior (is_aside=true)

1. **Context Behavior**
   - Aside message IS included in context for THAT turn
   - Aside message is EXCLUDED from future context
   - History before aside IS included in that turn's context

2. **Use Cases**
   - One-off questions that shouldn't pollute history
   - Temporary clarifications
   - Side conversations

### Pure Aside Behavior (pure_aside=true)

3. **Context Behavior**
   - Context for pure aside = system prelude + current message ONLY
   - ALL prior messages ignored
   - Response also marked as aside

4. **Use Cases**
   - Fresh start without history
   - Testing prompts in isolation
   - Avoiding context pollution

### Implementation

5. **Backend Updates**
   - Update constructContext to handle pure_aside (step 2 in spec)
   - Update constructContext to filter aside messages (step 3 in spec)
   - Ensure aside responses are also marked as aside

6. **Slash Commands**
   - /aside - Send message as aside
   - /aside-pure - Send message as pure aside
   - Parse and set flags before LLM call

7. **Frontend Updates**
   - Add aside options to send message
   - Keyboard shortcut: Ctrl+Shift+Enter for aside
   - Visual indicator in prompt input
   - Show aside status in message

8. **UI Indicators**
   - Aside messages: purple left border
   - Pure aside messages: pink left border
   - Tooltip explaining aside status
   - "Aside" badge on message

### Testing

9. **Add Tests**
   - Test aside excluded from future context
   - Test pure aside ignores all history
   - Test aside response also marked aside
   - Test slash commands
   - Integration tests

## Verification
- [ ] Aside messages included in current turn context
- [ ] Aside messages excluded from future context
- [ ] Pure aside context = system + current only
- [ ] /aside command works
- [ ] /aside-pure command works
- [ ] UI shows aside indicators
- [ ] Keyboard shortcuts work
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.8.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented aside and pure aside functionality"
```