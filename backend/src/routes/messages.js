/**
 * Message Routes
 * 
 * REST API endpoints for message operations
 * 
 * Routes:
 * - POST   /api/projects/:projectId/chats/:chatId/messages - Send a message
 * - GET    /api/projects/:projectId/chats/:chatId/messages - List messages
 * - GET    /api/projects/:projectId/chats/:chatId/messages/:messageId - Get a message
 */

const messageService = require('../services/messageService');

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
}

module.exports = messageRoutes;