# Prompt 2.1.0: Implement Slash Command Parser

## Task Description
Implement the slash command parsing system in the Node.js backend. Commands are defined in spec/commands.yaml and should be parsed from user messages.

## Context Gathering
```bash
# Get command definitions
python3 tools/doc_query.py --query "spec/commands.yaml" --mode file --pretty

# Get parse_slash_command function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/parse_slash_command.yaml" --mode file --pretty

# Get execute_command function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/execute_command.yaml" --mode file --pretty
```

## Requirements

### Command Parser Features
1. Parse commands starting with `/` from message content
2. Support command aliases
3. Handle different parser types:
   - `none` - No arguments
   - `free_text` - Rest of line as text
   - `json_payload` - JSON object argument
   - `key_value` - Key=value pairs

### Commands to Implement (Phase 2)
- `/aside` - Mark message as aside
- `/aside-pure` - Pure aside (no history)
- `/pin` - Pin message in context
- `/save_entity {json}` - Create/update data entity
- `/chat-fork [--from <id>] [--prune]` - Fork chat
- `/commit "message"` - Git commit
- `/requery` - Requery last turn

### Implementation Steps

1. **Create Command Parser Service**
   - backend/src/services/commandService.js
   - parseCommand(messageContent) -> { command, args, remainingText }
   - Load command definitions from config or inline

2. **Create Command Handlers**
   - backend/src/handlers/commandHandlers.js
   - Handler for each command type
   - Meta handlers modify message flags
   - Builtin handlers perform actions

3. **Integrate with Message Flow**
   - Check for commands in sendMessage
   - Execute command before/after LLM call as appropriate
   - Return command results in response

4. **Add Tests**
   - Parser unit tests for each command syntax
   - Handler integration tests
   - End-to-end command execution tests

## Verification
- [ ] All Phase 2 commands parsed correctly
- [ ] Aliases work
- [ ] JSON payload parsing works
- [ ] Free text parsing works
- [ ] Commands execute correctly
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.1.0
```