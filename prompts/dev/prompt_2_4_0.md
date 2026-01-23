# Prompt 2.4.0: Implement Requery Functionality

## Task Description
Implement the requery feature to regenerate LLM responses with response branching support.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get requery function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/requery.yaml" --mode file --pretty

# Get Message entity (parent_message_id for branching)
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 80 "Message:"

# Get context construction (requery excludes previous response)
python3 tools/doc_query.py --query "spec/context.yaml" --mode file --pretty

# Get slash command spec for /requery
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty | grep -A 15 "requery"

# Get current message service
cat backend/src/services/messageService.js
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview requery function
python3 tools/code_generator.py --function backend_node.requery --preview
```

## Spec References
- **Function Specs**:
  - spec/functions/backend_node/requery.yaml
  - spec/functions/backend_node/call_llm.yaml
  - spec/functions/backend_node/construct_context.yaml
- **Entity Specs**:
  - spec/domain.yaml#Message (parent_message_id field)
- **Command Spec**: spec/commands.yaml (requery command)

## Requirements

### Requery Logic

1. **Basic Requery**
   - Find last user message and assistant response
   - Mark previous response as discarded (is_discarded=true)
   - Construct context WITHOUT the previous response
   - Make new LLM call with same prompt
   - Save new response

2. **Response Branching**
   - Support keeping previous response as branch
   - Set parent_message_id on new response
   - Allow user to choose which response to keep
   - Track response alternatives

3. **Implementation Steps**

   a. **Create Requery Service Function**
      - Add requery function to messageService.js or new requeryService.js
      - Accept projectId, chatId, options
      - Options: { keepPrevious: boolean, modelId?, temperature? }

   b. **Add API Endpoint**
      - POST /api/projects/:id/chats/:chatId/requery
      - Request: { keepPrevious?, modelId?, temperature? }
      - Return: { original_response, new_response, branch_created }

   c. **Integrate with Slash Command**
      - Handle /requery command
      - Parse options (--keep, --model, --temp)
      - Call requery service

   d. **Update Context Construction**
      - Ensure discarded responses excluded
      - Handle branching in context

### Frontend Support

4. **Requery UI**
   - Add requery button to assistant messages
   - Show branching indicator if multiple responses
   - Allow switching between response branches

### Testing

5. **Add Tests**
   - Unit tests for requery logic
   - Test branching behavior
   - Test context excludes previous response
   - Integration tests for endpoint

## Verification
- [ ] Requery generates new response
- [ ] Previous response marked as discarded
- [ ] Context excludes discarded response
- [ ] Branching preserves both responses
- [ ] /requery command works
- [ ] UI shows requery option
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.4.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented requery functionality with response branching"
```