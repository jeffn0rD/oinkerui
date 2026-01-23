/**
 * Command Service
 * 
 * Responsibilities:
 * - Parse slash commands from user input
 * - Execute slash commands
 * - Manage command registry
 * 
 * Spec Reference: spec/modules/backend_node.yaml
 * Function Specs: 
 * - spec/functions/backend_node/parse_slash_command.yaml
 * - spec/functions/backend_node/execute_slash_command.yaml
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

// Import shared error classes
const {
  ValidationError,
  NotFoundError,
  FileSystemError
} = require('../errors');

// Custom error for unknown commands
class UnknownCommandError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'UnknownCommandError';
    this.suggestions = details.suggestions || [];
  }
}

/**
 * Command Registry - loaded from spec/commands.yaml
 * Maps command name -> command definition
 */
const COMMAND_REGISTRY = new Map();

// Alias map: alias -> canonical command name
const ALIAS_MAP = new Map();

/**
 * Initialize command registry from spec/commands.yaml
 */
async function initializeCommandRegistry() {
  if (COMMAND_REGISTRY.size > 0) {
    return; // Already initialized
  }

  try {
    // Load commands from spec file
    const specPath = path.join(__dirname, '../../../../spec/commands.yaml');
    const content = await fs.readFile(specPath, 'utf8');
    const spec = yaml.load(content);

    if (spec.commands && Array.isArray(spec.commands)) {
      for (const cmd of spec.commands) {
        // Register main command name
        COMMAND_REGISTRY.set(cmd.name.toLowerCase(), {
          name: cmd.name,
          aliases: cmd.aliases || [],
          description: cmd.description,
          syntax: cmd.syntax,
          parser: cmd.parser || 'none',
          scope: cmd.scope || 'project',
          handler_type: cmd.handler_type,
          handler_ref: cmd.handler_ref,
          preview_supported: cmd.preview_supported || false
        });

        // Register aliases
        if (cmd.aliases) {
          for (const alias of cmd.aliases) {
            ALIAS_MAP.set(alias.toLowerCase(), cmd.name.toLowerCase());
          }
        }
      }
    }

    console.log(`Command registry initialized with ${COMMAND_REGISTRY.size} commands`);
  } catch (error) {
    console.error('Failed to load command registry:', error.message);
    // Initialize with built-in commands as fallback
    initializeBuiltinCommands();
  }
}

/**
 * Initialize built-in commands (fallback if spec file not found)
 */
function initializeBuiltinCommands() {
  const builtinCommands = [
    { name: 'aside', parser: 'none', handler_type: 'meta', description: 'Mark message as aside' },
    { name: 'aside-pure', parser: 'none', handler_type: 'meta', description: 'Pure aside (no history)' },
    { name: 'pin', parser: 'none', handler_type: 'meta', description: 'Pin message' },
    { name: 'discard', parser: 'none', handler_type: 'meta', description: 'Discard message' },
    { name: 'chat-fork', parser: 'free_text', handler_type: 'node_builtin', description: 'Fork chat' },
    { name: 'requery', parser: 'none', handler_type: 'meta', description: 'Requery last response' },
    { name: 'commit', parser: 'free_text', handler_type: 'node_builtin', description: 'Git commit' },
    { name: 'push', parser: 'none', handler_type: 'node_builtin', description: 'Git push' },
    { name: 'save_entity', parser: 'json_payload', handler_type: 'node_builtin', description: 'Save entity' },
    { name: 'execute', parser: 'json_payload', handler_type: 'python_tool', description: 'Execute code', aliases: ['run'] },
    { name: 'template', parser: 'free_text', handler_type: 'node_builtin', description: 'Apply template' }
  ];

  for (const cmd of builtinCommands) {
    COMMAND_REGISTRY.set(cmd.name.toLowerCase(), cmd);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        ALIAS_MAP.set(alias.toLowerCase(), cmd.name.toLowerCase());
      }
    }
  }
}

/**
 * Tokenize input string, handling quoted strings
 * 
 * @param {string} input - Input string to tokenize
 * @returns {string[]} Array of tokens
 */
function tokenize(input) {
  const tokens = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = null;

  for (const char of input) {
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = null;
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Find similar commands for suggestions
 * 
 * @param {string} input - Unknown command name
 * @returns {string[]} Array of similar command names
 */
function findSimilarCommands(input) {
  const suggestions = [];
  const inputLower = input.toLowerCase();

  for (const [name] of COMMAND_REGISTRY) {
    // Simple similarity: starts with same letter or contains input
    if (name.startsWith(inputLower[0]) || name.includes(inputLower)) {
      suggestions.push(name);
    }
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
}

/**
 * Check if input is a slash command
 * 
 * @param {string} input - User input
 * @returns {boolean} True if input starts with / (no leading whitespace allowed)
 */
function isSlashCommand(input) {
  return typeof input === 'string' && input.startsWith('/');
}

/**
 * Parse a slash command from user input
 * 
 * Algorithm:
 * 1. Validate input starts with '/'
 * 2. Remove leading '/' and trim
 * 3. Split into command and rest
 * 4. Normalize command name to lowercase
 * 5. Validate command is registered
 * 6. Parse arguments and options from rest
 * 7. Return ParsedCommand object
 * 
 * @param {string} input - Raw user input starting with '/'
 * @returns {Object} ParsedCommand with command, args, options, raw_args
 * @throws {ValidationError} If input doesn't start with '/'
 * @throws {UnknownCommandError} If command not registered
 * 
 * Spec: spec/functions/backend_node/parse_slash_command.yaml
 */
async function parseSlashCommand(input) {
  // Ensure registry is initialized
  await initializeCommandRegistry();

  // Step 1: Validate input starts with '/'
  if (!input || typeof input !== 'string') {
    throw new ValidationError('Input must be a non-empty string');
  }

  if (!input.startsWith('/')) {
    throw new ValidationError('Input must start with /');
  }

  // Step 2: Remove '/' prefix, trim whitespace
  const content = input.slice(1).trim();
  if (!content) {
    throw new ValidationError('Empty command');
  }

  // Step 3: Split on first whitespace to get command and rest
  const spaceIndex = content.indexOf(' ');
  let command, rest;

  if (spaceIndex === -1) {
    command = content;
    rest = '';
  } else {
    command = content.slice(0, spaceIndex);
    rest = content.slice(spaceIndex + 1).trim();
  }

  // Step 4: Convert command to lowercase
  command = command.toLowerCase();

  // Check for alias
  if (ALIAS_MAP.has(command)) {
    command = ALIAS_MAP.get(command);
  }

  // Step 5: Check command exists in REGISTERED_COMMANDS
  if (!COMMAND_REGISTRY.has(command)) {
    const suggestions = findSimilarCommands(command);
    throw new UnknownCommandError(
      `Unknown command: ${command}`,
      { suggestions }
    );
  }

  // Get command definition
  const commandDef = COMMAND_REGISTRY.get(command);

  // Step 6: Parse rest into args and options
  const args = [];
  const options = {};

  if (rest) {
    const tokens = tokenize(rest);

    for (const token of tokens) {
      if (token.startsWith('--')) {
        const eqIndex = token.indexOf('=');
        if (eqIndex !== -1) {
          const key = token.slice(2, eqIndex);
          const value = token.slice(eqIndex + 1);
          options[key] = value;
        } else {
          options[token.slice(2)] = true;
        }
      } else {
        args.push(token);
      }
    }
  }

  // Step 7: Return ParsedCommand
  return {
    command,
    args,
    options,
    raw_args: rest,
    definition: commandDef
  };
}

/**
 * Execute a parsed slash command
 * 
 * @param {Object} parsedCommand - Parsed command from parseSlashCommand
 * @param {Object} context - Execution context
 * @param {string} context.projectId - Project ID
 * @param {string} context.chatId - Chat ID
 * @param {Object} [context.message] - Current message (if any)
 * @returns {Promise<Object>} CommandResult
 * 
 * Spec: spec/functions/backend_node/execute_slash_command.yaml
 */
async function executeSlashCommand(parsedCommand, context) {
  const { command, args, options, raw_args, definition } = parsedCommand;
  const { projectId, chatId, message } = context;

  console.log('Executing slash command:', {
    event: 'slash_command_execute',
    command,
    args,
    options,
    projectId,
    chatId
  });

  try {
    // Dispatch to appropriate handler based on command
    switch (command) {
      case 'aside':
        return handleAside(context);

      case 'aside-pure':
        return handlePureAside(context);

      case 'pin':
        return handlePin(context, args, options);

      case 'discard':
        return handleDiscard(context, args, options);

      case 'chat-fork':
        return handleChatFork(context, args, options);

      case 'requery':
        return handleRequery(context);

      case 'commit':
        return handleCommit(context, raw_args);

      case 'push':
        return handlePush(context);

      case 'save_entity':
        return handleSaveEntity(context, raw_args);

      case 'execute':
        return handleExecute(context, raw_args);

      case 'template':
        return handleTemplate(context, args, options);

      default:
        return {
          success: false,
          command,
          error: `No handler implemented for command: ${command}`,
          output: `Command /${command} is recognized but not yet implemented.`
        };
    }
  } catch (error) {
    console.error('Command execution error:', error);
    return {
      success: false,
      command,
      error: error.message,
      output: `Error executing /${command}: ${error.message}`
    };
  }
}

// =============================================================================
// Command Handlers
// =============================================================================

/**
 * Handle /aside command - mark message as aside
 */
function handleAside(context) {
  return {
    success: true,
    command: 'aside',
    output: 'Message will be sent as aside (excluded from future context).',
    data: {
      flags: { is_aside: true }
    },
    sideEffects: ['set_message_flag:is_aside=true'],
    continueWithLLM: true // Still send to LLM
  };
}

/**
 * Handle /aside-pure command - pure aside (no history)
 */
function handlePureAside(context) {
  return {
    success: true,
    command: 'aside-pure',
    output: 'Message will be sent as pure aside (context ignores all prior messages).',
    data: {
      flags: { pure_aside: true, is_aside: true }
    },
    sideEffects: ['set_message_flag:pure_aside=true', 'set_message_flag:is_aside=true'],
    continueWithLLM: true
  };
}

/**
 * Handle /pin command - pin/unpin message
 */
async function handlePin(context, args, options) {
  const messageService = require('./messageService');
  const { projectId, chatId } = context;

  // If message ID provided, pin that message
  // Otherwise, this will pin the current message after it's sent
  if (args.length > 0) {
    const messageId = args[0];
    try {
      const updated = await messageService.updateMessageFlags(
        projectId, chatId, messageId,
        { is_pinned: true }
      );
      return {
        success: true,
        command: 'pin',
        output: `Message ${messageId} pinned.`,
        data: { message: updated },
        sideEffects: ['message_pinned']
      };
    } catch (error) {
      return {
        success: false,
        command: 'pin',
        error: error.message,
        output: `Failed to pin message: ${error.message}`
      };
    }
  }

  // Pin current message (will be applied after message is saved)
  return {
    success: true,
    command: 'pin',
    output: 'Message will be pinned.',
    data: {
      flags: { is_pinned: true }
    },
    sideEffects: ['set_message_flag:is_pinned=true'],
    continueWithLLM: true
  };
}

/**
 * Handle /discard command - discard message from context
 */
async function handleDiscard(context, args, options) {
  const messageService = require('./messageService');
  const { projectId, chatId } = context;

  if (args.length === 0) {
    return {
      success: false,
      command: 'discard',
      error: 'Message ID required',
      output: 'Usage: /discard <message_id>'
    };
  }

  const messageId = args[0];
  try {
    const updated = await messageService.updateMessageFlags(
      projectId, chatId, messageId,
      { is_discarded: true }
    );
    return {
      success: true,
      command: 'discard',
      output: `Message ${messageId} discarded from context.`,
      data: { message: updated },
      sideEffects: ['message_discarded']
    };
  } catch (error) {
    return {
      success: false,
      command: 'discard',
      error: error.message,
      output: `Failed to discard message: ${error.message}`
    };
  }
}

/**
 * Handle /chat-fork command - fork chat
 */
async function handleChatFork(context, args, options) {
  const chatService = require('./chatService');
  const { projectId, chatId } = context;

  const forkOptions = {
    fromMessageId: options.from || null,
    prune: options.prune === true || options.prune === 'true'
  };

  // If --no-prune is set, explicitly disable pruning
  if (options['no-prune']) {
    forkOptions.prune = false;
  }

  try {
    const forkedChat = await chatService.forkChat(projectId, chatId, forkOptions);
    return {
      success: true,
      command: 'chat-fork',
      output: `Chat forked successfully. New chat: ${forkedChat.name}`,
      data: { chat: forkedChat },
      sideEffects: ['chat_forked']
    };
  } catch (error) {
    return {
      success: false,
      command: 'chat-fork',
      error: error.message,
      output: `Failed to fork chat: ${error.message}`
    };
  }
}

/**
 * Handle /requery command - regenerate last response
 */
function handleRequery(context) {
  // This will be handled by the message flow
  return {
    success: true,
    command: 'requery',
    output: 'Requerying last response...',
    data: {
      action: 'requery'
    },
    sideEffects: ['requery_triggered'],
    triggerRequery: true
  };
}

/**
 * Handle /commit command - git commit
 */
async function handleCommit(context, raw_args) {
  const gitService = require('./gitService');
  const { projectId } = context;

  // Extract commit message from raw_args
  let message = raw_args.trim();
  
  // Remove surrounding quotes if present
  if ((message.startsWith('"') && message.endsWith('"')) ||
      (message.startsWith("'") && message.endsWith("'"))) {
    message = message.slice(1, -1);
  }

  if (!message) {
    return {
      success: false,
      command: 'commit',
      error: 'Commit message required',
      output: 'Usage: /commit "Your commit message"'
    };
  }

  try {
    const result = await gitService.commit(projectId, message);
    return {
      success: true,
      command: 'commit',
      output: `Committed: ${result.commit || message}`,
      data: { commit: result },
      sideEffects: ['git_commit']
    };
  } catch (error) {
    return {
      success: false,
      command: 'commit',
      error: error.message,
      output: `Failed to commit: ${error.message}`
    };
  }
}

/**
 * Handle /push command - git push
 */
async function handlePush(context) {
  const gitService = require('./gitService');
  const { projectId } = context;

  try {
    const result = await gitService.push(projectId);
    return {
      success: true,
      command: 'push',
      output: 'Pushed to remote.',
      data: { push: result },
      sideEffects: ['git_push']
    };
  } catch (error) {
    return {
      success: false,
      command: 'push',
      error: error.message,
      output: `Failed to push: ${error.message}`
    };
  }
}

/**
 * Handle /save_entity command - save data entity
 */
async function handleSaveEntity(context, raw_args) {
  const dataEntityService = require('./dataEntityService');
  const { projectId } = context;

  try {
    const payload = JSON.parse(raw_args);
    const entity = await dataEntityService.createEntity(projectId, payload);
    return {
      success: true,
      command: 'save_entity',
      output: `Entity saved: ${entity.id}`,
      data: { entity },
      sideEffects: ['entity_created']
    };
  } catch (error) {
    return {
      success: false,
      command: 'save_entity',
      error: error.message,
      output: `Failed to save entity: ${error.message}`
    };
  }
}

/**
 * Handle /execute command - execute code (delegates to Python tools)
 */
async function handleExecute(context, raw_args) {
  // This would delegate to Python tools backend
  // For now, return a placeholder
  return {
    success: false,
    command: 'execute',
    error: 'Python tools backend not yet integrated',
    output: 'Code execution requires Python tools backend (Phase 3).'
  };
}

/**
 * Handle /template command - apply template
 */
async function handleTemplate(context, args, options) {
  // This would load and apply a template
  // For now, return a placeholder
  if (args.length === 0) {
    return {
      success: false,
      command: 'template',
      error: 'Template name required',
      output: 'Usage: /template <template_name> [--var=value]'
    };
  }

  return {
    success: false,
    command: 'template',
    error: 'Template system not yet implemented',
    output: 'Template system will be implemented in task 2.6.0.'
  };
}

/**
 * Get list of available commands
 * 
 * @returns {Array} Array of command definitions
 */
async function getAvailableCommands() {
  await initializeCommandRegistry();
  return Array.from(COMMAND_REGISTRY.values());
}

/**
 * Get command definition by name
 * 
 * @param {string} name - Command name
 * @returns {Object|null} Command definition or null
 */
async function getCommandDefinition(name) {
  await initializeCommandRegistry();
  const normalizedName = name.toLowerCase();
  
  // Check alias first
  if (ALIAS_MAP.has(normalizedName)) {
    return COMMAND_REGISTRY.get(ALIAS_MAP.get(normalizedName));
  }
  
  return COMMAND_REGISTRY.get(normalizedName) || null;
}

module.exports = {
  isSlashCommand,
  parseSlashCommand,
  executeSlashCommand,
  getAvailableCommands,
  getCommandDefinition,
  initializeCommandRegistry,
  // Export error classes
  UnknownCommandError,
  ValidationError
};