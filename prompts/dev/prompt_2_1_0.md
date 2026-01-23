# Prompt 2.1.0: Implement Slash Command Parser

## Task Description
Implement the slash command parsing system in the Node.js backend for commands defined in spec/commands.yaml.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get slash command definitions
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty

# Get parse_slash_command function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/parse_slash_command.yaml" --mode file --pretty

# Get execute_slash_command function spec (execute_command.yaml)
python3 tools/doc_query.py --query "spec/functions/backend_node/execute_command.yaml" --mode file --pretty

# Get execute_slash_command function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/execute_slash_command.yaml" --mode file --pretty

# Get current message service (where commands are triggered)
cat backend/src/services/messageService.js
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview parse_slash_command function
python3 tools/code_generator.py --function backend_node.parse_slash_command --preview

# Preview execute_slash_command function
python3 tools/code_generator.py --function backend_node.execute_slash_command --preview
```

## Spec References
- **Command Definitions**: spec/commands.yaml - All slash commands with syntax and behavior
- **Function Specs**:
  - spec/functions/backend_node/parse_slash_command.yaml
  - spec/functions/backend_node/execute_slash_command.yaml
  - spec/functions/backend_node/execute_command.yaml

## Requirements

### Commands to Implement (Phase 2)
From spec/commands.yaml:
1. `/aside` - Mark message as aside (excluded from future context)
2. `/aside-pure` - Pure aside (context ignores all prior messages)
3. `/pin` - Pin/unpin message
4. `/discard` - Discard message from context
5. `/fork` - Fork chat (with --from and --prune options)
6. `/requery` - Regenerate last response
7. `/save` - Save entity
8. `/commit` - Git commit
9. `/template` - Apply template

### Implementation Steps

1. **Create Command Parser**
   - Create src/services/commandService.js
   - Implement parseSlashCommand function:
     - Detect if input starts with /
     - Extract command name
     - Parse arguments and flags
     - Validate against command registry
   - Return ParsedCommand object or null

2. **Create Command Registry**
   - Load command definitions from spec/commands.yaml
   - Store command metadata (name, args, flags, description)
   - Provide lookup and validation methods

3. **Create Command Executor**
   - Implement executeSlashCommand function
   - Dispatch to appropriate handler based on command
   - Handle command-specific logic
   - Return CommandResult

4. **Integrate with Message Flow**
   - Update sendMessage in messageService.js
   - Check for slash commands before LLM call
   - Execute command and return result
   - Some commands may still trigger LLM (e.g., /aside)

5. **Add Tests**
   - Unit tests for command parsing
   - Unit tests for each command handler
   - Integration tests for command execution

## Verification
- [ ] All Phase 2 commands parsed correctly
- [ ] Command arguments and flags extracted properly
- [ ] Invalid commands return appropriate errors
- [ ] Commands execute with correct side effects
- [ ] Command results returned to frontend
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.1.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented slash command parser and executor"
```