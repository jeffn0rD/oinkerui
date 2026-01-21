# Prompt 1.3.0: Implement OpenRouter LLM Integration

## Task Description
Implement LLM request handling with OpenRouter API, including context construction and response processing.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get backend_node module specification
python3 tools/doc_query.py --query "spec/modules/backend_node.yaml" --mode file --pretty

# Get call_llm function specification
python3 tools/doc_query.py --query "spec/functions/backend_node/call_llm.yaml" --mode file --pretty

# Get construct_context function specification
python3 tools/doc_query.py --query "spec/functions/backend_node/construct_context.yaml" --mode file --pretty

# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Generate backend_node module scaffolding
python3 tools/code_generator.py --module backend_node --preview

# Or generate to files:
python3 tools/code_generator.py --module backend_node --output backend/src
```

## Requirements

### Focus Areas
- callLLM function
- constructContext function
- OpenRouter API integration
- Model selection from config
- Response streaming support
- Error handling and retries

### Functions to Implement

#### callLLM
- **Purpose**: Make an API call to OpenRouter to get an LLM response. Handles authentication,
- **Signature**: `callLLM(request: LLMRequest)`
- **Returns**: `LLMResponse` - LLM response with content and metadata
- **Preconditions**:
  - OPENROUTER_API_KEY environment variable is set
  - request.model is valid OpenRouter model ID
  - request.messages is non-empty array
- **Postconditions**:
  - Returns LLMResponse with non-empty content
  - Usage statistics are populated
  - Request ID is available for tracking
- **Spec**: `spec/functions/backend_node/call_llm.yaml`

#### constructContext
- **Purpose**: Build the message context array for an LLM request following the context
- **Signature**: `constructContext(chat: Chat, currentMessage: Message, modelId: string)`
- **Returns**: `ContextMessage[]` - Array of messages formatted for LLM API
- **Preconditions**:
  - chat is valid Chat object
  - chat.storage_path exists and is readable
  - currentMessage is valid Message object
- **Postconditions**:
  - Returned array contains system prelude if present
  - Returned array contains currentMessage
  - All pinned messages are included
- **Spec**: `spec/functions/backend_node/construct_context.yaml`

### Module Dependencies

**backend_node** external dependencies:
- `fastify` ^4.26.0
- `@fastify/cors` ^9.0.0
- `@fastify/static` ^7.0.0
- `simple-git` ^3.22.0
- `axios` ^1.6.0
- `uuid` ^9.0.0
- `date-fns` ^3.3.0
- `tiktoken` ^1.0.0
- `slugify` ^1.6.0

## Implementation Steps

1. **Generate Code Scaffolding**
   - Run the code generator to create function signatures
   - Review generated code structure and comments

2. **Implement Functions**
   - Follow the algorithm steps in each function spec
   - Implement precondition validation first
   - Handle all error cases from the spec
   - Ensure postconditions are satisfied

3. **Add Tests**
   - Create unit tests for each function
   - Test error cases and edge conditions
   - Verify contract compliance

4. **Integration**
   - Wire up API routes if applicable
   - Test end-to-end flow

## Verification

- [ ] Unit tests with mocked API
- [ ] Integration test with real API
- [ ] Test context construction
- [ ] Verify streaming works

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.3.0
```

---
*Generated: 2026-01-21T17:28:55.428673*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.3.0&quot; --mode task --pretty*