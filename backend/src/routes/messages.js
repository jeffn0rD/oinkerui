/**
 * Message Routes
 * 
 * REST API endpoints for message operations
 * 
 * Routes:
 * - POST   /api/projects/:projectId/chats/:chatId/messages - Send a message
 * - GET    /api/projects/:projectId/chats/:chatId/messages - List messages
 * - GET    /api/projects/:projectId/chats/:chatId/messages/:messageId - Get a message
 * - PATCH  /api/projects/:projectId/chats/:chatId/messages/:messageId/flags - Update message flags
 * - GET    /api/commands - List available slash commands
 */

const messageService = require('../services/messageService');
const commandService = require('../services/commandService');

async function messageRoutes(fastify, options) {
  /**
   * Send a message
   * POST /api/projects/:projectId/chats/:chatId/messages
   */
  fastify.post('/api/projects/:projectId/chats/:chatId/messages', async (request, reply) => {
    try {
      const { projectId, chatId } = request.params;
      const messageRequest = request.body;

      const response = await messageService.sendMessage(projectId, chatId, messageRequest);

      reply.code(201).send({
        success: true,
        data: response
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        reply.code(400).send({
          success: false,
          error: error.message
        });
      } else if (error.name === 'NotFoundError') {
        reply.code(404).send({
          success: false,
          error: error.message
        });
      } else if (error.name === 'LLMError') {
        reply.code(502).send({
          success: false,
          error: error.message
        });
      } else {
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });

  /**
   * List messages in a chat
   * GET /api/projects/:projectId/chats/:chatId/messages
   */
  fastify.get('/api/projects/:projectId/chats/:chatId/messages', async (request, reply) => {
    try {
      const { projectId, chatId } = request.params;
      const { role, include_in_context } = request.query;

      const options = {};
      if (role) options.role = role;
      if (include_in_context !== undefined) {
        options.include_in_context = include_in_context === 'true';
      }

      const messages = await messageService.listMessages(projectId, chatId, options);

      reply.send({
        success: true,
        data: messages
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        reply.code(400).send({
          success: false,
          error: error.message
        });
      } else if (error.name === 'NotFoundError') {
        reply.code(404).send({
          success: false,
          error: error.message
        });
      } else {
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });

  /**
   * Get a specific message
   * GET /api/projects/:projectId/chats/:chatId/messages/:messageId
   */
  fastify.get('/api/projects/:projectId/chats/:chatId/messages/:messageId', async (request, reply) => {
    try {
      const { projectId, chatId, messageId } = request.params;

      const message = await messageService.getMessage(projectId, chatId, messageId);

      reply.send({
        success: true,
        data: message
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        reply.code(400).send({
          success: false,
          error: error.message
        });
      } else if (error.name === 'NotFoundError') {
        reply.code(404).send({
          success: false,
          error: error.message
        });
      } else {
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });

  /**
   * Update message context flags
   * PATCH /api/projects/:projectId/chats/:chatId/messages/:messageId/flags
   * 
   * Request body:
   * {
   *   include_in_context?: boolean,
   *   is_aside?: boolean,
   *   pure_aside?: boolean,
   *   is_pinned?: boolean,
   *   is_discarded?: boolean
   * }
   * 
   * Spec: spec/functions/backend_node/update_message_flags.yaml
   */
  fastify.patch('/api/projects/:projectId/chats/:chatId/messages/:messageId/flags', async (request, reply) => {
    try {
      const { projectId, chatId, messageId } = request.params;
      const flags = request.body;

      const updatedMessage = await messageService.updateMessageFlags(projectId, chatId, messageId, flags);

      reply.send({
        success: true,
        data: updatedMessage
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        reply.code(400).send({
          success: false,
          error: error.message
        });
      } else if (error.name === 'NotFoundError') {
        reply.code(404).send({
          success: false,
          error: error.message
        });
      } else if (error.name === 'FileSystemError') {
        reply.code(500).send({
          success: false,
          error: error.message
        });
      } else {
        console.error('Error updating message flags:', error);
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });

  /**
   * List available slash commands
   * GET /api/commands
   * 
   * Returns list of all registered slash commands with their definitions.
   * Used for autocomplete and help display in the frontend.
   */
  fastify.get('/api/commands', async (request, reply) => {
    try {
      const commands = await commandService.getAvailableCommands();

      reply.send({
        success: true,
        data: commands
      });
    } catch (error) {
      console.error('Error listing commands:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to list commands'
      });
    }
  });

  /**
   * Get a specific command definition
   * GET /api/commands/:commandName
   */
  fastify.get('/api/commands/:commandName', async (request, reply) => {
    try {
      const { commandName } = request.params;
      const command = await commandService.getCommandDefinition(commandName);

      if (!command) {
        reply.code(404).send({
          success: false,
          error: `Command not found: ${commandName}`
        });
        return;
      }

      reply.send({
        success: true,
        data: command
      });
    } catch (error) {
      console.error('Error getting command:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get command'
      });
    }
  });
/**
   * Requery - Regenerate the last LLM response
   * POST /api/projects/:projectId/chats/:chatId/requery
   * 
   * Finds the last assistant response, marks it as discarded (or keeps as branch),
   * and generates a new response using the same user prompt.
   * 
   * Request body:
   * {
   *   keepPrevious?: boolean,  // Keep previous response as branch
   *   modelId?: string,        // Model override
   *   temperature?: number     // Temperature override
   * }
   * 
   * Spec: spec/functions/backend_node/requery.yaml
   */
  fastify.post('/api/projects/:projectId/chats/:chatId/requery', async (request, reply) => {
    try {
      const { projectId, chatId } = request.params;
      const { keepPrevious, modelId, temperature } = request.body || {};

      const result = await messageService.requery(projectId, chatId, {
        keepPrevious,
        modelId,
        temperature
      });

      reply.send({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        reply.code(400).send({
          success: false,
          error: error.message
        });
      } else if (error.name === 'NotFoundError') {
        reply.code(404).send({
          success: false,
          error: error.message
        });
      } else if (error.name === 'LLMError') {
        reply.code(502).send({
          success: false,
          error: error.message
        });
      } else {
        console.error('Error during requery:', error);
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });
}

module.exports = messageRoutes;