# Prompt 2.8.0: Implement Aside and Pure Aside Functionality

## Task Description
Implement the complete aside and pure aside message functionality, including context handling and UI feedback.

## Context Gathering
```bash
# Get aside behavior from context spec
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get aside command definitions
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty | grep -A 15 "aside"

# Get current context construction
cat backend/src/services/llmService.js | grep -A 50 "constructContext"
```

## Requirements

### Aside Behavior
1. Normal aside (is_aside=true):
   - Excluded from future context
   - Current turn context includes history
   - Visual indicator in UI

2. Pure aside (pure_aside=true):
   - Context for that turn = system prelude + current prompt only
   - No prior messages included
   - Clear visual distinction

### Implementation Steps

1. **Update Context Construction**
   - Handle is_aside flag in filtering
   - Handle pure_aside special case (step 2 in spec)
   - Ensure aside messages excluded from future context

2. **Implement /aside Command**
   - Set is_aside=true on current message
   - Process normally with history
   - Mark response as aside too

3. **Implement /aside-pure Command**
   - Set pure_aside=true on current message
   - Construct context with only system + prompt
   - Mark response appropriately

4. **Update UI**
   - Aside indicator on messages
   - Pure aside indicator (different style)
   - Quick toggle buttons
   - Confirmation for pure aside

5. **Add Logging**
   - Log aside usage in LLM request logs
   - Track context size difference

6. **Add Tests**
   - Aside excludes from future context
   - Pure aside ignores history
   - Commands work correctly
   - UI indicators display correctly

## Verification
- [ ] Aside messages excluded from future context
- [ ] Pure aside only includes system + prompt
- [ ] Commands set flags correctly
- [ ] UI clearly indicates aside status
- [ ] Responses inherit aside status
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.8.0
```