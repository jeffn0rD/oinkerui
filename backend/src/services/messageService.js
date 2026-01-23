/**
 * Message Service
 * 
 * Responsibilities:
 * - Save messages to JSONL storage
 * - Retrieve messages from storage
 * - List messages in a chat
 * - Process user messages and LLM responses
 * 
 * Spec Reference: spec/modules/backend_node.yaml
 * Function Specs: 
 * - spec/functions/backend_node/save_message.yaml
 * - spec/functions/backend_node/send_message.yaml
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');
const chatService = require('./chatService');

// Import shared error classes
const {
  ValidationError,
  NotFoundError,
  FileSystemError,
  LLMError
} = require('../errors');

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID v4
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Save a message to chat's JSONL storage
 * 
 * Algorithm (7 steps from spec):
 * 1. Validate chatId is valid UUID
 * 2. Load chat from storage, get storage_path
 * 3. Validate message.chat_id == chatId
 * 4. Set created_at if not present
 * 5. Serialize message to JSON
 * 6. Append JSON line to file (or rewrite for update)
 * 7. Return message
 * 
 * @param {string} projectId - UUID of the project
 * @param {string} chatId - UUID of the chat
 * @param {Object} message - Message object to save
 * @param {Object} [options={}] - Save options
 * @param {string} [options.mode='append'] - 'append' or 'update'
 * @returns {Promise<Object>} Saved message
 * @throws {ValidationError} If chatId or message is invalid
 * @throws {NotFoundError} If chat does not exist
 * @throws {FileSystemError} If cannot write to storage file
 * 
 * Spec: spec/functions/backend_node/save_message.yaml
 * 
 * FOL Specification:
 * forall chatId in UUID, msg in Message:
 *   ValidChat(chatId) and
 *   ValidMessage(msg) and
 *   msg.chat_id = chatId implies
 *     let saved = saveMessage(chatId, msg) in
 *     Persisted(saved) and
 *     saved.id = msg.id and
 *     exists line in FileLines(chat.storage_path):
 *       JSON.parse(line).id = saved.id
 */
async function saveMessage(projectId, chatId, message, options = {}) {
  // Step 1: Validate chatId is valid UUID
  // Precondition: chatId is valid UUID
  if (!isValidUUID(chatId)) {
    throw new ValidationError('Invalid chat ID format');
  }

  // Step 2: Load chat from storage, get storage_path
  // Precondition: Chat exists and has storage_path
  const chat = await chatService.getChat(projectId, chatId);
  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (!chat.storage_path) {
    throw new FileSystemError('Chat has no storage path');
  }

  // Step 3: Validate message.chat_id matches
  // Precondition: message.chat_id matches chatId
  if (message.chat_id && message.chat_id !== chatId) {
    throw new ValidationError('Message chat_id mismatch');
  }

  // Ensure message has required fields
  if (!message.id) {
    throw new ValidationError('Message must have an id');
  }
  if (!message.role) {
    throw new ValidationError('Message must have a role');
  }
  if (message.content === undefined) {
    throw new ValidationError('Message must have content');
  }

  // Step 4: Set created_at if not present
  message.chat_id = chatId;
  message.project_id = projectId;
  if (!message.created_at) {
    message.created_at = new Date().toISOString();
  }

  // Get full storage path
  const projectService = require('./projectService');
  const project = await projectService.getProject(projectId);
  const storagePath = path.join(project.paths.root, chat.storage_path);

  // Step 5: Serialize message to JSON
  const jsonLine = JSON.stringify(message);

  // Step 6: Append JSON line to file (or rewrite for update)
  const mode = options.mode || 'append';

  try {
    if (mode === 'append') {
      // Append mode: O(1) operation
      await fs.appendFile(storagePath, jsonLine + '\n', 'utf8');
    } else if (mode === 'update') {
      // Update mode: O(n) operation - read all, update, rewrite
      const messages = await listMessages(projectId, chatId);
      const messageIndex = messages.findIndex(m => m.id === message.id);
      
      if (messageIndex === -1) {
        throw new NotFoundError('Message not found for update');
      }

      messages[messageIndex] = message;

      // Rewrite file with updated messages
      const content = messages.map(m => JSON.stringify(m)).join('\n') + '\n';
      await fs.writeFile(storagePath, content, 'utf8');
    } else {
      throw new ValidationError(`Invalid mode: ${mode}`);
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new FileSystemError(`Failed to save message: ${error.message}`);
  }

  // Step 7: Return message
  // Postcondition: Message is persisted to JSONL file
  // Postcondition: If append: message is at end of file
  // Postcondition: If update: message replaces existing entry
  return message;
}

/**
 * Get a single message by ID
 * 
 * @param {string} projectId - UUID of the project
 * @param {string} chatId - UUID of the chat
 * @param {string} messageId - UUID of the message
 * @returns {Promise<Object>} Message object
 * @throws {ValidationError} If IDs are invalid
 * @throws {NotFoundError} If message does not exist
 */
async function getMessage(projectId, chatId, messageId) {
  // Validate IDs
  if (!isValidUUID(chatId)) {
    throw new ValidationError('Invalid chat ID format');
  }
  if (!isValidUUID(messageId)) {
    throw new ValidationError('Invalid message ID format');
  }

  // Get all messages and find the one we want
  const messages = await listMessages(projectId, chatId);
  const message = messages.find(m => m.id === messageId);

  if (!message) {
    throw new NotFoundError('Message not found');
  }

  return message;
}

/**
 * List all messages in a chat
 * 
 * @param {string} projectId - UUID of the project
 * @param {string} chatId - UUID of the chat
 * @param {Object} [options={}] - Filtering options
 * @param {string} [options.role] - Filter by role
 * @param {boolean} [options.include_in_context] - Filter by include_in_context flag
 * @returns {Promise<Array>} Array of message objects
 * @throws {ValidationError} If chatId is invalid
 * @throws {NotFoundError} If chat does not exist
 */
async function listMessages(projectId, chatId, options = {}) {
  // Validate chatId
  if (!isValidUUID(chatId)) {
    throw new ValidationError('Invalid chat ID format');
  }

  // Get chat
  const chat = await chatService.getChat(projectId, chatId);
  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  // Get storage path
  const projectService = require('./projectService');
  const project = await projectService.getProject(projectId);
  const storagePath = path.join(project.paths.root, chat.storage_path);

  // Read messages from JSONL file
  const messages = [];

  try {
    const fileContent = await fs.readFile(storagePath, 'utf8');
    const lines = fileContent.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const message = JSON.parse(line);
        messages.push(message);
      } catch (error) {
        console.error('Failed to parse message line:', error);
        // Skip invalid lines
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - return empty array
      return [];
    }
    throw new FileSystemError(`Failed to read messages: ${error.message}`);
  }

  // Apply filters
  let filteredMessages = messages;

  if (options.role) {
    filteredMessages = filteredMessages.filter(m => m.role === options.role);
  }

  if (options.include_in_context !== undefined) {
    filteredMessages = filteredMessages.filter(m => m.include_in_context === options.include_in_context);
  }

  return filteredMessages;
}

/**
 * Send a message in a chat with slash command support
 * 
 * This implementation:
 * 1. Checks for slash commands and executes them
 * 2. Saves the user message with appropriate flags
 * 3. (Future) Calls LLM for response
 * 
 * @param {string} projectId - UUID of the project
 * @param {string} chatId - UUID of the chat
 * @param {Object} request - Message request
 * @param {string} request.raw_text - Message content
 * @param {string} [request.model_id] - Model ID for LLM
 * @param {boolean} [request.is_aside=false] - Whether message is an aside
 * @param {boolean} [request.pure_aside=false] - Whether message is a pure aside
 * @param {boolean} [request.is_pinned=false] - Whether message is pinned
 * @returns {Promise<Object>} Response with user message and optional command result
 * @throws {ValidationError} If request is invalid
 * @throws {NotFoundError} If project or chat not found
 * 
 * Spec: spec/functions/backend_node/send_message.yaml
 */
async function sendMessage(projectId, chatId, request) {
  const commandService = require('./commandService');

  // Validate request
  if (!request.raw_text || typeof request.raw_text !== 'string' || request.raw_text.trim() === '') {
    throw new ValidationError('raw_text is required and must be non-empty');
  }

  // Validate IDs
  if (!isValidUUID(projectId)) {
    throw new ValidationError('Invalid project ID format');
  }
  if (!isValidUUID(chatId)) {
    throw new ValidationError('Invalid chat ID format');
  }

  // Verify project and chat exist
  const projectService = require('./projectService');
  const project = await projectService.getProject(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  if (project.status !== 'active') {
    throw new ValidationError('Project is not active');
  }

  const chat = await chatService.getChat(projectId, chatId);
  if (!chat) {
    throw new NotFoundError('Chat not found');
  }
  if (chat.status !== 'active') {
    throw new ValidationError('Chat is not active');
  }

  // Check for slash command
  let commandResult = null;
  let messageFlags = {
    include_in_context: request.include_in_context !== false,
    is_aside: request.is_aside || false,
    pure_aside: request.pure_aside || false,
    is_pinned: request.is_pinned || false,
    is_discarded: false
  };
  let messageContent = request.raw_text;
  let continueWithLLM = true;

  if (commandService.isSlashCommand(request.raw_text)) {
    try {
      // Parse the slash command
      const parsedCommand = await commandService.parseSlashCommand(request.raw_text);
      
      // Execute the command
      commandResult = await commandService.executeSlashCommand(parsedCommand, {
        projectId,
        chatId,
        message: null // Will be set after message is created
      });

      // Apply any flags from command result
      if (commandResult.data?.flags) {
        messageFlags = { ...messageFlags, ...commandResult.data.flags };
      }

      // Check if we should continue with LLM call
      if (commandResult.continueWithLLM === false) {
        continueWithLLM = false;
      }

      // For commands that don't continue with LLM, extract content after command
      if (!continueWithLLM) {
        // Return early for pure command execution (no message saved)
        return {
          user_message: null,
          assistant_message: null,
          request_log: null,
          command_result: commandResult
        };
      }

      // For commands like /aside, extract the actual message content
      // The content is everything after the command
      if (parsedCommand.raw_args) {
        messageContent = parsedCommand.raw_args;
      } else {
        // If no content after command, use the original text
        // (the command itself becomes the message)
        messageContent = request.raw_text;
      }

    } catch (error) {
      // If command parsing fails, treat as regular message or return error
      if (error.name === 'UnknownCommandError') {
        // Return error for unknown commands
        return {
          user_message: null,
          assistant_message: null,
          request_log: null,
          command_result: {
            success: false,
            command: null,
            error: error.message,
            output: `Unknown command. ${error.suggestions?.length > 0 ? `Did you mean: ${error.suggestions.join(', ')}?` : ''}`
          }
        };
      }
      // For other errors, treat as regular message
      console.warn('Command parsing error, treating as regular message:', error.message);
    }
  }

  // Create user message with all context flags
  const userMessage = {
    id: uuidv4(),
    chat_id: chatId,
    project_id: projectId,
    role: 'user',
    content: messageContent,
    status: 'complete',
    created_at: new Date().toISOString(),
    // Context flags
    include_in_context: messageFlags.include_in_context,
    is_aside: messageFlags.is_aside,
    pure_aside: messageFlags.pure_aside,
    is_pinned: messageFlags.is_pinned,
    is_discarded: messageFlags.is_discarded
  };

  // Save user message
  await saveMessage(projectId, chatId, userMessage);

  // Update chat timestamp
  await chatService.updateChat(projectId, chatId, {
    updated_at: new Date().toISOString()
  });

  // Return response (LLM call will be added in streaming task)
  return {
    user_message: userMessage,
    assistant_message: null,
    request_log: null,
    command_result: commandResult
  };
}

/**
 * Update message context flags
 * 
 * Updates one or more context flags on a message. Enforces invariants:
 * - is_discarded=true implies include_in_context=false
 * - pure_aside=true implies is_aside=true
 * 
 * @param {string} projectId - UUID of the project
 * @param {string} chatId - UUID of the chat
 * @param {string} messageId - UUID of the message to update
 * @param {Object} flags - Flags to update
 * @param {boolean} [flags.include_in_context] - Whether message is included in LLM context
 * @param {boolean} [flags.is_aside] - Message is an aside (excluded from future context)
 * @param {boolean} [flags.pure_aside] - Message ignores all prior history
 * @param {boolean} [flags.is_pinned] - Message is pinned (always included, survives truncation)
 * @param {boolean} [flags.is_discarded] - Message is discarded (never included)
 * @returns {Promise<Object>} Updated message object
 * @throws {ValidationError} If IDs or flag values are invalid
 * @throws {NotFoundError} If project, chat, or message not found
 * @throws {FileSystemError} If failed to update message file
 * 
 * Spec: spec/functions/backend_node/update_message_flags.yaml
 * 
 * Algorithm:
 * 1. Validate inputs - Check all IDs are valid UUIDs, at least one flag provided
 * 2. Load message - Read message from JSONL storage
 * 3. Apply flag updates - Update each provided flag
 * 4. Enforce invariants - If is_discarded, set include_in_context=false; if pure_aside, set is_aside=true
 * 5. Update timestamp - Set updated_at to current time
 * 6. Save message - Write updated message back to JSONL (update mode)
 * 7. Return updated message - Return message with all current flags
 */
async function updateMessageFlags(projectId, chatId, messageId, flags) {
  // Step 1: Validate inputs
  if (!isValidUUID(projectId)) {
    throw new ValidationError('Invalid project ID format');
  }
  if (!isValidUUID(chatId)) {
    throw new ValidationError('Invalid chat ID format');
  }
  if (!isValidUUID(messageId)) {
    throw new ValidationError('Invalid message ID format');
  }
  
  // Validate at least one flag is provided
  const validFlags = ['include_in_context', 'is_aside', 'pure_aside', 'is_pinned', 'is_discarded'];
  const providedFlags = Object.keys(flags).filter(key => validFlags.includes(key));
  
  if (providedFlags.length === 0) {
    throw new ValidationError('At least one valid flag must be provided');
  }
  
  // Validate flag values are booleans
  for (const flag of providedFlags) {
    if (typeof flags[flag] !== 'boolean') {
      throw new ValidationError(`Flag ${flag} must be a boolean`);
    }
  }
  
  // Step 2: Load message
  const message = await getMessage(projectId, chatId, messageId);
  
  // Step 3: Apply flag updates
  for (const flag of providedFlags) {
    message[flag] = flags[flag];
  }
  
  // Step 4: Enforce invariants
  // is_discarded=true implies include_in_context=false
  if (message.is_discarded === true) {
    message.include_in_context = false;
  }
  
  // pure_aside=true implies is_aside=true
  if (message.pure_aside === true) {
    message.is_aside = true;
  }
  
  // Step 5: Update timestamp
  message.updated_at = new Date().toISOString();
  
  // Step 6: Save message (update mode)
  await saveMessage(projectId, chatId, message, { mode: 'update' });
  
  // Step 7: Return updated message
  return message;
}

module.exports = {
  saveMessage,
  getMessage,
  listMessages,
  sendMessage,
  updateMessageFlags,
  // Export error classes for testing
  ValidationError,
  NotFoundError,
  FileSystemError,
  LLMError
};