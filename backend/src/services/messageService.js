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
 * Send a message in a chat (simplified version without LLM integration)
 * 
 * This is a simplified implementation that saves the user message.
 * Full LLM integration will be added in a future task.
 * 
 * @param {string} projectId - UUID of the project
 * @param {string} chatId - UUID of the chat
 * @param {Object} request - Message request
 * @param {string} request.raw_text - Message content
 * @param {string} [request.model_id] - Model ID for LLM
 * @param {boolean} [request.is_aside=false] - Whether message is an aside
 * @returns {Promise<Object>} Response with user message
 * @throws {ValidationError} If request is invalid
 * @throws {NotFoundError} If project or chat not found
 */
async function sendMessage(projectId, chatId, request) {
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

  // Create user message
  const userMessage = {
    id: uuidv4(),
    chat_id: chatId,
    project_id: projectId,
    role: 'user',
    content: request.raw_text,
    status: 'complete',
    created_at: new Date().toISOString(),
    include_in_context: true,
    is_aside: request.is_aside || false
  };

  // Save user message
  await saveMessage(projectId, chatId, userMessage);

  // Update chat timestamp
  await chatService.updateChat(projectId, chatId, {
    updated_at: new Date().toISOString()
  });

  // Return response (without LLM call for now)
  return {
    user_message: userMessage,
    assistant_message: null,
    request_log: null,
    command_result: null
  };
}

module.exports = {
  saveMessage,
  getMessage,
  listMessages,
  sendMessage,
  // Export error classes for testing
  ValidationError,
  NotFoundError,
  FileSystemError,
  LLMError
};