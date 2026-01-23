/**
 * Chat Routes
 * 
 * REST API endpoints for chat operations
 * 
 * Routes:
 * - POST   /api/projects/:projectId/chats - Create a new chat
 * - GET    /api/projects/:projectId/chats - List all chats in a project
 * - GET    /api/projects/:projectId/chats/:chatId - Get a specific chat
 * - PUT    /api/projects/:projectId/chats/:chatId - Update a chat
 * - DELETE /api/projects/:projectId/chats/:chatId - Delete a chat
 * - POST   /api/projects/:projectId/chats/:chatId/cancel - Cancel active request
 * - GET    /api/projects/:projectId/chats/:chatId/status - Get active request status
 */

const chatService = require('../services/chatService');
const cancelService = require('../services/cancelService');

async function chatRoutes(fastify, options) {
  /**
   * Create a new chat
   * POST /api/projects/:projectId/chats
   */
  fastify.post('/api/projects/:projectId/chats', async (request, reply) => {
    try {
      const { projectId } = request.params;
      const options = request.body;

      const chat = await chatService.createChat(projectId, options);

      reply.code(201).send({
        success: true,
        data: chat
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
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });

  /**
   * List all chats in a project
   * GET /api/projects/:projectId/chats
   */
  fastify.get('/api/projects/:projectId/chats', async (request, reply) => {
    try {
      const { projectId } = request.params;
      const { status } = request.query;

      const chats = await chatService.listChats(projectId, { status });

      reply.send({
        success: true,
        data: chats
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
   * Get a specific chat
   * GET /api/projects/:projectId/chats/:chatId
   */
  fastify.get('/api/projects/:projectId/chats/:chatId', async (request, reply) => {
    try {
      const { projectId, chatId } = request.params;

      const chat = await chatService.getChat(projectId, chatId);

      reply.send({
        success: true,
        data: chat
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
   * Update a chat
   * PUT /api/projects/:projectId/chats/:chatId
   */
  fastify.put('/api/projects/:projectId/chats/:chatId', async (request, reply) => {
    try {
      const { projectId, chatId } = request.params;
      const updates = request.body;

      const chat = await chatService.updateChat(projectId, chatId, updates);

      reply.send({
        success: true,
        data: chat
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
   * Delete a chat
   * DELETE /api/projects/:projectId/chats/:chatId
   */
  fastify.delete('/api/projects/:projectId/chats/:chatId', async (request, reply) => {
    try {
      const { projectId, chatId } = request.params;
      const { hard } = request.query;

      await chatService.deleteChat(projectId, chatId, { hard: hard === 'true' });

      reply.code(204).send();
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
   * Fork a chat
   * POST /api/projects/:projectId/chats/:chatId/fork
   * 
   * Creates a new chat as a copy of an existing chat.
   * 
   * Request body:
   * {
   *   fromMessageId?: string,  // Fork from this message (inclusive)
   *   prune?: boolean,         // Exclude discarded/excluded messages
   *   name?: string            // Name for the forked chat
   * }
   * 
   * Spec: spec/functions/backend_node/fork_chat.yaml
   */
  fastify.post('/api/projects/:projectId/chats/:chatId/fork', async (request, reply) => {
    try {
      const { projectId, chatId } = request.params;
      const { fromMessageId, prune, name } = request.body || {};

      const forkedChat = await chatService.forkChat(projectId, chatId, {
        fromMessageId,
        prune,
        name
      });

      reply.code(201).send({
        success: true,
        data: forkedChat
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
        console.error('Error forking chat:', error);
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });

  /**
   * Cancel active request for a chat
   * POST /api/projects/:projectId/chats/:chatId/cancel
   * 
   * Cancels any in-progress LLM request for the specified chat.
   * Returns cancellation result including any partial response received.
   * 
   * Spec: spec/functions/backend_node/cancel_request.yaml
   */
  fastify.post('/api/projects/:projectId/chats/:chatId/cancel', async (request, reply) => {
    try {
      const { projectId, chatId } = request.params;

      // Verify chat exists
      await chatService.getChat(projectId, chatId);

      // Cancel the active request
      const result = cancelService.cancelRequest(chatId);

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
      } else {
        console.error('Error cancelling request:', error);
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });

  /**
   * Get active request status for a chat
   * GET /api/projects/:projectId/chats/:chatId/status
   * 
   * Returns information about any active request for the chat.
   */
  fastify.get('/api/projects/:projectId/chats/:chatId/status', async (request, reply) => {
    try {
      const { projectId, chatId } = request.params;

      // Verify chat exists
      await chatService.getChat(projectId, chatId);

      // Get active request info
      const activeRequest = cancelService.getActiveRequest(chatId);

      reply.send({
        success: true,
        data: {
          hasActiveRequest: !!activeRequest,
          request: activeRequest
        }
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
        console.error('Error getting request status:', error);
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  });
}

module.exports = chatRoutes;