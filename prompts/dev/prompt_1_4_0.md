# Prompt 1.4.0: Implement Logging and LLM Request Tracking

## Task Description
Implement comprehensive logging system for LLM requests, chat logs, and system events.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get logging_and_metrics module specification
python3 tools/doc_query.py --query "spec/modules/logging_and_metrics.yaml" --mode file --pretty

# Get log_llm_request function specification
python3 tools/doc_query.py --query "spec/functions/logging_and_metrics/log_llm_request.yaml" --mode file --pretty

# Get get_stats function specification
python3 tools/doc_query.py --query "spec/functions/logging_and_metrics/get_stats.yaml" --mode file --pretty

# Get domain entities
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get API specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Generate logging_and_metrics module scaffolding
python3 tools/code_generator.py --module logging_and_metrics --preview

# Or generate to files:
python3 tools/code_generator.py --module logging_and_metrics --output backend/src
```

## Requirements

### Focus Areas
- logLLMRequest function
- LLMRequestLogEntry creation
- Chat log persistence (JSONL)
- System log configuration
- Token usage tracking
- Performance metrics

### Functions to Implement

#### logLLMRequest
- **Purpose**: Log an LLM request with full context including messages, usage statistics,
- **Signature**: `logLLMRequest(entry: LLMRequestLogEntry)`
- **Returns**: `LogResult` - Result of logging operation
- **Preconditions**:
  - entry has required fields
  - project_id references valid project
  - Log directory exists or can be created
- **Postconditions**:
  - Entry is appended to log file
  - Entry has unique ID
  - Timestamp is set
- **Spec**: `spec/functions/logging_and_metrics/log_llm_request.yaml`

#### getStats
- **Purpose**: Retrieve usage statistics and metrics for a project, chat, or globally.
- **Signature**: `getStats(scope: StatsScope, options: StatsOptions)`
- **Returns**: `Stats` - Aggregated statistics
- **Preconditions**:
  - scope.type is valid
  - If project scope, projectId exists
  - If chat scope, chatId exists
- **Postconditions**:
  - Returns accurate aggregated statistics
  - All counts are non-negative
  - Averages are correctly calculated
- **Spec**: `spec/functions/logging_and_metrics/get_stats.yaml`

### Module Dependencies

**logging_and_metrics** external dependencies:
- `pino` ^8.19.0
- `pino-pretty` ^10.3.0
- `rotating-file-stream` ^3.2.0

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

- [ ] Unit tests for logging functions
- [ ] Verify log file creation
- [ ] Test metrics aggregation
- [ ] Verify token counting

## Completion Checklist

- [ ] All focus areas addressed
- [ ] All functions implemented
- [ ] Tests written and passing
- [ ] Code reviewed against spec
- [ ] Documentation updated if needed

## Task Cleanup

After completing the task:
```bash
python3 tools/task_cleanup.py --task-id 1.4.0
```

---
*Generated: 2026-01-21T17:28:55.476666*
*Spec Reference: python3 tools/doc_query.py --query &quot;1.4.0&quot; --mode task --pretty*