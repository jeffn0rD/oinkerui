/**
 * Chat Service
 * 
 * Responsibilities:
 * - Create, read, and manage chats within projects
 * - Handle chat storage and persistence
 * - Manage chat-project relationships
 * - Handle system preludes and templates
 * 
 * Spec Reference: spec/modules/backend_node.yaml
 * Function Specs: spec/functions/backend_node/create_chat.yaml
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { format } = require('date-fns');
const projectService = require('./projectService');

// Import shared error classes
const {
  ValidationError,
  NotFoundError,
  FileSystemError
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
 * Create a new chat within a project
 * 
 * Algorithm (10 steps from spec):
 * 1. Validate projectId format
 * 2. Load and verify project exists and is active
 * 3. Generate unique chat ID
 * 4. Generate chat name if not provided
 * 5. Resolve system prelude (inline or template)
 * 6. Create chat storage file
 * 7. Write system prelude as first message if present
 * 8. Update project's chat index
 * 9. Log chat creation event
 * 10. Return chat object
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {Object} options - Optional chat configuration
 * @param {string} [options.name] - Chat name (max 200 chars)
 * @param {Object} [options.system_prelude] - System prelude configuration
 * @param {string} [options.system_prelude.content] - Inline prelude content
 * @param {string} [options.system_prelude.template_id] - Template reference
 * @param {Object} [options.system_prelude.variables] - Template variables
 * @returns {Promise<Object>} Created chat object
 * @throws {ValidationError} If projectId is invalid or project is not active
 * @throws {NotFoundError} If project or template does not exist
 * @throws {FileSystemError} If cannot create storage file
 * 
 * Spec: spec/functions/backend_node/create_chat.yaml
 * 
 * FOL Specification:
 * forall projectId in UUID, opts in Options:
 *   ValidUUID(projectId) and 
 *   exists p in Projects: (p.id = projectId and p.status = 'active') implies
 *     exists chatId in UUID, c in Chat:
 *       c.id = chatId and
 *       c.project_id = projectId and
 *       c.status = 'active' and
 *       c.created_at = now() and
 *       FileExists(p.paths.chats_dir + "/" + chatId + ".jsonl") and
 *       c in p.chats
 */
async function createChat(projectId, options = {}) {
  // Step 1: Validate projectId format
  // Precondition: projectId is a valid UUID
  if (!isValidUUID(projectId)) {
    throw new ValidationError('Invalid project ID format');
  }

  // Step 2: Load and verify project exists and is active
  // Precondition: Project with projectId exists
  // Precondition: Project status is 'active'
  const project = await projectService.getProject(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  if (project.status !== 'active') {
    throw new ValidationError('Cannot create chat in non-active project');
  }

  // Precondition: Project directory is writable
  const chatsDir = path.join(project.paths.root, 'chats');
  try {
    await fs.access(chatsDir, fs.constants.W_OK);
  } catch (error) {
    throw new FileSystemError('Project chats directory is not writable');
  }

  // Step 3: Generate unique chat ID
  const chatId = uuidv4();

  // Step 4: Generate chat name if not provided
  const chatName = options.name || `Chat ${format(new Date(), 'MMM d, HH:mm')}`;
  
  // Validate chat name length
  if (chatName.length > 200) {
    throw new ValidationError('Chat name must be 200 characters or less');
  }

  // Step 5: Resolve system prelude (inline or template)
  let systemPrelude = null;
  if (options.system_prelude) {
    if (options.system_prelude.template_id) {
      // Template-based prelude
      // Note: Template resolution would go here
      // For now, we'll support inline only
      throw new NotFoundError('Template support not yet implemented');
    } else if (options.system_prelude.content) {
      // Inline prelude
      systemPrelude = {
        source_type: 'inline',
        content: options.system_prelude.content
      };
    }
  }

  // Step 6: Create chat storage file
  const storagePath = path.join(chatsDir, `${chatId}.jsonl`);
  try {
    await fs.writeFile(storagePath, '', 'utf8');
  } catch (error) {
    throw new FileSystemError(`Failed to create chat storage file: ${error.message}`);
  }

  // Step 7: Write system prelude as first message if present
  if (systemPrelude && systemPrelude.content) {
    const systemMessage = {
      id: uuidv4(),
      chat_id: chatId,
      project_id: projectId,
      role: 'system',
      content: systemPrelude.content,
      status: 'complete',
      created_at: new Date().toISOString(),
      include_in_context: true
    };
    
    try {
      await fs.appendFile(storagePath, JSON.stringify(systemMessage) + '\n', 'utf8');
    } catch (error) {
      // Cleanup: remove storage file if we can't write system message
      await fs.unlink(storagePath).catch(() => {});
      throw new FileSystemError(`Failed to write system message: ${error.message}`);
    }
  }

  // Step 8: Create chat object and update project's chat index
  const now = new Date().toISOString();
  const chat = {
    id: chatId,
    project_id: projectId,
    name: chatName,
    status: 'active',
    created_at: now,
    updated_at: now,
    system_prelude: systemPrelude,
    storage_path: `chats/${chatId}.jsonl`
  };

  // Update project's chat list
  try {
    await projectService.addChatToProject(projectId, chat);
  } catch (error) {
    // Cleanup: remove storage file if we can't update project
    await fs.unlink(storagePath).catch(() => {});
    throw error;
  }

  // Step 9: Log chat creation event
  console.log('Chat created:', {
    event: 'chat_created',
    chatId,
    projectId,
    chatName,
    timestamp: now
  });

  // Step 10: Return chat object
  // Postcondition: Chat storage file exists at project/chats/{chat_id}.jsonl
  // Postcondition: Chat is registered in project's chat index
  // Postcondition: Chat status is 'active'
  // Postcondition: System prelude message is written if provided
  // Postcondition: Returns valid Chat object with unique ID
  return chat;
}

/**
 * Get a chat by ID
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {string} chatId - UUID of the chat
 * @returns {Promise<Object>} Chat object
 * @throws {ValidationError} If IDs are invalid
 * @throws {NotFoundError} If chat does not exist
 */
async function getChat(projectId, chatId) {
  // Validate IDs
  if (!isValidUUID(projectId)) {
    throw new ValidationError('Invalid project ID format');
  }
  if (!isValidUUID(chatId)) {
    throw new ValidationError('Invalid chat ID format');
  }

  // Get project
  const project = await projectService.getProject(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Find chat in project's chat list
  const chat = project.chats?.find(c => c.id === chatId);
  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  return chat;
}

/**
 * List all chats in a project
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {Object} options - Filtering options
 * @param {string} [options.status] - Filter by status (active, closed, archived)
 * @returns {Promise<Array>} Array of chat objects
 * @throws {ValidationError} If projectId is invalid
 * @throws {NotFoundError} If project does not exist
 */
async function listChats(projectId, options = {}) {
  // Validate projectId
  if (!isValidUUID(projectId)) {
    throw new ValidationError('Invalid project ID format');
  }

  // Get project
  const project = await projectService.getProject(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Get chats
  let chats = project.chats || [];

  // Filter by status if provided
  if (options.status) {
    chats = chats.filter(chat => chat.status === options.status);
  }

  return chats;
}

/**
 * Update a chat's metadata
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {string} chatId - UUID of the chat
 * @param {Object} updates - Fields to update
 * @param {string} [updates.name] - New chat name
 * @param {string} [updates.status] - New status
 * @returns {Promise<Object>} Updated chat object
 * @throws {ValidationError} If IDs are invalid or updates are invalid
 * @throws {NotFoundError} If chat does not exist
 */
async function updateChat(projectId, chatId, updates) {
  // Validate IDs
  if (!isValidUUID(projectId)) {
    throw new ValidationError('Invalid project ID format');
  }
  if (!isValidUUID(chatId)) {
    throw new ValidationError('Invalid chat ID format');
  }

  // Get project
  const project = await projectService.getProject(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Find chat
  const chatIndex = project.chats?.findIndex(c => c.id === chatId);
  if (chatIndex === -1 || chatIndex === undefined) {
    throw new NotFoundError('Chat not found');
  }

  const chat = project.chats[chatIndex];

  // Validate and apply updates
  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.length > 200) {
      throw new ValidationError('Chat name must be a string with max 200 characters');
    }
    chat.name = updates.name;
  }

  if (updates.status !== undefined) {
    const validStatuses = ['active', 'closed', 'archived'];
    if (!validStatuses.includes(updates.status)) {
      throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
    }
    chat.status = updates.status;
  }

  // Update timestamp
  chat.updated_at = new Date().toISOString();

  // Save project
  await projectService.updateProject(projectId, { chats: project.chats });

  console.log('Chat updated:', {
    event: 'chat_updated',
    chatId,
    projectId,
    updates,
    timestamp: chat.updated_at
  });

  return chat;
}

/**
 * Delete a chat
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {string} chatId - UUID of the chat
 * @param {Object} options - Deletion options
 * @param {boolean} [options.hard=false] - If true, permanently delete; if false, archive
 * @returns {Promise<void>}
 * @throws {ValidationError} If IDs are invalid
 * @throws {NotFoundError} If chat does not exist
 */
async function deleteChat(projectId, chatId, options = {}) {
  // Validate IDs
  if (!isValidUUID(projectId)) {
    throw new ValidationError('Invalid project ID format');
  }
  if (!isValidUUID(chatId)) {
    throw new ValidationError('Invalid chat ID format');
  }

  // Get project
  const project = await projectService.getProject(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Find chat
  const chatIndex = project.chats?.findIndex(c => c.id === chatId);
  if (chatIndex === -1 || chatIndex === undefined) {
    throw new NotFoundError('Chat not found');
  }

  if (options.hard) {
    // Hard delete: remove from project and delete storage file
    const chat = project.chats[chatIndex];
    const storagePath = path.join(project.paths.root, chat.storage_path);
    
    // Remove from project
    project.chats.splice(chatIndex, 1);
    await projectService.updateProject(projectId, { chats: project.chats });

    // Delete storage file
    try {
      await fs.unlink(storagePath);
    } catch (error) {
      console.error('Failed to delete chat storage file:', error);
      // Continue anyway - chat is removed from index
    }

    console.log('Chat deleted (hard):', {
      event: 'chat_deleted_hard',
      chatId,
      projectId,
      timestamp: new Date().toISOString()
    });
  } else {
    // Soft delete: archive the chat
    await updateChat(projectId, chatId, { status: 'archived' });

    console.log('Chat deleted (soft):', {
      event: 'chat_deleted_soft',
      chatId,
      projectId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Fork a chat with optional message point and pruning
 * 
 * Creates a new chat as a copy of an existing chat, optionally:
 * - Forking from a specific message point
 * - Pruning messages that are discarded or excluded from context
 * 
 * @param {string} projectId - UUID of the project
 * @param {string} chatId - UUID of the chat to fork
 * @param {Object} options - Fork options
 * @param {string} [options.fromMessageId] - Fork from this message (inclusive)
 * @param {boolean} [options.prune=false] - Exclude discarded/excluded messages
 * @param {string} [options.name] - Name for forked chat
 * @returns {Promise<Object>} The newly created forked chat
 * @throws {ValidationError} If IDs are invalid
 * @throws {NotFoundError} If project, chat, or message not found
 * @throws {FileSystemError} If cannot create forked chat files
 * 
 * Spec: spec/functions/backend_node/fork_chat.yaml
 */
async function forkChat(projectId, chatId, options = {}) {
  // Step 1: Validate project and chat exist
  if (!isValidUUID(projectId)) {
    throw new ValidationError('Invalid project ID format');
  }
  if (!isValidUUID(chatId)) {
    throw new ValidationError('Invalid chat ID format');
  }

  const project = await projectService.getProject(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  if (project.status !== 'active') {
    throw new ValidationError('Cannot fork chat in non-active project');
  }

  const originalChat = await getChat(projectId, chatId);
  if (!originalChat) {
    throw new NotFoundError('Chat not found');
  }

  // Step 2 & 3: Load messages from original chat
  const messageService = require('./messageService');
  const allMessages = await messageService.listMessages(projectId, chatId);

  // Step 2: Determine fork point
  let forkPointIndex = allMessages.length - 1;
  let forkedAtMessageId = null;

  if (options.fromMessageId) {
    const messageIndex = allMessages.findIndex(m => m.id === options.fromMessageId);
    if (messageIndex === -1) {
      throw new NotFoundError(`Message not found: ${options.fromMessageId}`);
    }
    forkPointIndex = messageIndex;
    forkedAtMessageId = options.fromMessageId;
  }

  // Get messages up to and including fork point
  let messagesToCopy = allMessages.slice(0, forkPointIndex + 1);

  // Step 4: Apply pruning if requested
  if (options.prune) {
    messagesToCopy = messagesToCopy.filter(m => {
      // Keep messages that are:
      // - Not discarded
      // - Included in context (or system messages which are always included)
      if (m.is_discarded === true) return false;
      if (m.include_in_context === false && m.role !== 'system') return false;
      return true;
    });
  }

  // Step 5: Create new chat with forked_from metadata
  const forkName = options.name || `Fork of ${originalChat.name}`;
  
  // Copy system prelude from original if present
  const newChatOptions = {
    name: forkName
  };
  
  if (originalChat.system_prelude) {
    newChatOptions.system_prelude = originalChat.system_prelude;
  }

  const forkedChat = await createChat(projectId, newChatOptions);

  // Add fork metadata
  forkedChat.forked_from_chat_id = chatId;
  forkedChat.forked_at_message_id = forkedAtMessageId;

  // Step 6: Copy messages with new IDs
  // Skip system messages if we already created one via system_prelude
  const hasSystemPrelude = originalChat.system_prelude && originalChat.system_prelude.content;
  
  for (const originalMessage of messagesToCopy) {
    // Skip system message if we already have one from prelude
    if (hasSystemPrelude && originalMessage.role === 'system' && 
        originalMessage.content === originalChat.system_prelude.content) {
      continue;
    }

    const newMessage = {
      ...originalMessage,
      id: uuidv4(), // New unique ID
      chat_id: forkedChat.id,
      project_id: projectId,
      created_at: new Date().toISOString()
    };

    // Remove fork-specific flags that shouldn't carry over
    delete newMessage.is_discarded;
    newMessage.include_in_context = true;

    await messageService.saveMessage(projectId, forkedChat.id, newMessage);
  }

  // Step 7: Update project with fork metadata
  await projectService.updateChatInProject(projectId, forkedChat.id, {
    forked_from_chat_id: chatId,
    forked_at_message_id: forkedAtMessageId
  });

  // Count messages in forked chat
  const forkedMessages = await messageService.listMessages(projectId, forkedChat.id);

  // Step 8: Return forked chat with message count
  console.log('Chat forked:', {
    event: 'chat_forked',
    originalChatId: chatId,
    forkedChatId: forkedChat.id,
    projectId,
    messageCount: forkedMessages.length,
    pruned: options.prune || false,
    fromMessageId: forkedAtMessageId,
    timestamp: new Date().toISOString()
  });

  return {
    ...forkedChat,
    forked_from_chat_id: chatId,
    forked_at_message_id: forkedAtMessageId,
    message_count: forkedMessages.length
  };
}

module.exports = {
  createChat,
  getChat,
  listChats,
  updateChat,
  deleteChat,
  forkChat,
  // Export error classes for testing
  ValidationError,
  NotFoundError,
  FileSystemError
};