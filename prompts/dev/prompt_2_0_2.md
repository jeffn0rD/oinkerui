# Prompt 2.0.2: Module and Function Spec Review

## Task Description
Review and update specification files in ./spec/modules and ./spec/functions to ensure they are consistent, complete, and ready for Phase 2 development.

## Context Gathering
```bash
# List all module specs
ls -la spec/modules/

# List all function specs
find spec/functions -name "*.yaml" | head -30

# Get Phase 2 spec requirements
python3 tools/doc_query.py --query "spec/spec.yaml" --mode file --pretty | grep -A 100 "phase_2"

# Get current Phase 2 tasks
python3 tools/task_manager.py list --status current
```

## Requirements

### 1. Module Specification Review
For each module in spec/modules/:
- Verify all Phase 2 functions are listed
- Check dependencies are accurate
- Ensure error handling strategies are defined
- Verify LLM implementation guidance is present

### 2. Function Specification Review
For each function in spec/functions/:
- Verify signature matches implementation (if exists)
- Check algorithm steps are complete
- Ensure preconditions/postconditions are defined
- Verify error cases are documented

### 3. Phase 2 Feature Coverage
Ensure specs exist for:
- Message context flags (include_in_context, is_aside, pure_aside, is_pinned, is_discarded)
- Slash command parsing and execution
- Chat forking with pruning
- Live context size estimation
- Requery functionality
- LLM response streaming
- Cancel/timeout handling
- Template rendering (Jinja2)

### 4. Frontend UI Specifications
Generate specifications for frontend components:
- Message flag controls
- Context size display
- Cancel button
- Streaming message display
- Template selector

### 5. Task Prompt Updates
Review tasks 2.0.5 - 2.9.0 and update prompts to:
- Reference relevant spec files
- Include doc_query commands for context
- Reference code_generator.py for scaffolding
- Ensure consistency with existing codebase

## Implementation Steps

1. **Audit Module Specs**
   - Review each module in spec/modules/
   - Add missing Phase 2 functions
   - Update dependencies

2. **Audit Function Specs**
   - Review each function in spec/functions/
   - Add missing specs for Phase 2 features
   - Verify algorithms match implementation

3. **Create Missing Specs**
   - Frontend UI component specs
   - Cancel/timeout function specs
   - Streaming function specs

4. **Update Task Prompts**
   - Add spec references to each task
   - Add doc_query commands
   - Add code_generator commands

5. **Validate Consistency**
   - Run spec validation tools
   - Check cross-references
   - Verify with existing code

## Verification
- [ ] All module specs reviewed and updated
- [ ] All function specs reviewed and updated
- [ ] Missing Phase 2 specs created
- [ ] Frontend UI specs generated
- [ ] Task prompts updated with spec references
- [ ] Spec validation passes

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.0.2
```