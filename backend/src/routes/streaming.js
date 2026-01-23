/**
 * Streaming Routes
 * 
 * REST API endpoints for streaming LLM responses
 * 
 * Routes:
 * - POST /api/projects/:projectId/chats/:chatId/messages/stream - Stream a message response
 * - POST /api/projects/:projectId/chats/:chatId/cancel - Cancel active request
 */

const { v4: uuidv4 } = require('uuid');
const llmService = require('../services/llmService');
const messageService = require('../services/messageService');
const chatService = require('../services/chatService');
const projectService = require('../services/projectService');

async function streamingRoutes(fastify, options) {
  /**
   * Stream a message response
   * POST /api/projects/:projectId/chats/:chatId/messages/stream
   * 
   * Request body:
   * {
   *   raw_text: string,
   *   model_id?: string,
   *   is_aside?: boolean,
   *   pure_aside?: boolean
   * }
   * 
   * Response: Server-Sent Events stream
   * 
   * Events:
   * - chunk: { content: string, done: false }
   * - done: { message: {...}, usage: {...} }
   * - error: { error: string }
   */
  fastify.post('/api/projects/:projectId/chats/:chatId/messages/stream', async (request, reply) => {
    const { projectId, chatId } = request.params;
    const { raw_text, model_id, is_aside, pure_aside, is_pinned } = request.body;

    // Validate request
    if (!raw_text || typeof raw_text !== 'string' || raw_text.trim() === '') {
      reply.code(400).send({
        success: false,
        error: 'raw_text is required and must be non-empty'
      });
      return;
    }

    try {
      // Verify project and chat exist
      const project = await projectService.getProject(projectId);
      if (!project || project.status !== 'active') {
        reply.code(404).send({
          success: false,
          error: 'Project not found or not active'
        });
        return;
      }

      const chat = await chatService.getChat(projectId, chatId);
      if (!chat || chat.status !== 'active') {
        reply.code(404).send({
          success: false,
          error: 'Chat not found or not active'
        });
        return;
      }

      // Check for slash command - if it's a command-only, don't stream
      const commandService = require('../services/commandService');
      if (commandService.isSlashCommand(raw_text)) {
        try {
          const parsedCommand = await commandService.parseSlashCommand(raw_text);
          const commandResult = await commandService.executeSlashCommand(parsedCommand, {
            projectId,
            chatId
          });

          // If command doesn't continue with LLM, return command result
          if (commandResult.continueWithLLM === false || !parsedCommand.raw_args) {
            reply.send({
              success: true,
              data: {
                command_result: commandResult,
                user_message: null,
                assistant_message: null
              }
            });
            return;
          }
        } catch (error) {
          if (error.name === 'UnknownCommandError') {
            reply.code(400).send({
              success: false,
              error: error.message
            });
            return;
          }
        }
      }

      // Create user message
      const userMessage = {
        id: uuidv4(),
        chat_id: chatId,
        project_id: projectId,
        role: 'user',
        content: raw_text,
        status: 'complete',
        created_at: new Date().toISOString(),
        include_in_context: true,
        is_aside: is_aside || false,
        pure_aside: pure_aside || false,
        is_pinned: is_pinned || false,
        is_discarded: false
      };

      // Save user message
      await messageService.saveMessage(projectId, chatId, userMessage);

      // Set up SSE response
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering
      });

      // Send user message event
      reply.raw.write(`event: user_message\ndata: ${JSON.stringify(userMessage)}\n\n`);

      // Create assistant message placeholder
      const assistantMessage = {
        id: uuidv4(),
        chat_id: chatId,
        project_id: projectId,
        role: 'assistant',
        content: '',
        status: 'pending',
        created_at: new Date().toISOString(),
        include_in_context: true,
        is_aside: is_aside || false, // Match user message aside status
        pure_aside: false,
        is_pinned: false,
        is_discarded: false,
        llm_info: {
          model: model_id || project.default_model || 'openai/gpt-4o-mini',
          request_id: uuidv4()
        }
      };

      let accumulatedContent = '';

      try {
        // Stream LLM response
        const stream = llmService.sendLLMMessageStream(
          projectId,
          chatId,
          userMessage,
          { model: model_id },
          {
            onToken: (token) => {
              // Token callback (optional logging)
            },
            onComplete: (content) => {
              accumulatedContent = content;
            },
            onError: (error) => {
              console.error('Stream error:', error);
            }
          }
        );

        for await (const chunk of stream) {
          if (chunk.done) {
            // Final chunk - update and save assistant message
            assistantMessage.content = chunk.accumulated;
            assistantMessage.status = 'complete';
            assistantMessage.llm_info.usage = chunk.usage;
            assistantMessage.llm_info.latency_ms = chunk.latency_ms;
            assistantMessage.llm_info.finish_reason = chunk.finish_reason;

            // Save assistant message
            await messageService.saveMessage(projectId, chatId, assistantMessage);

            // Update chat timestamp
            await chatService.updateChat(projectId, chatId, {
              updated_at: new Date().toISOString()
            });

            // Send done event
            reply.raw.write(`event: done\ndata: ${JSON.stringify({
              message: assistantMessage,
              usage: chunk.usage
            })}\n\n`);
          } else {
            // Send chunk event
            reply.raw.write(`event: chunk\ndata: ${JSON.stringify({
              content: chunk.token,
              accumulated: chunk.accumulated,
              done: false
            })}\n\n`);
          }
        }
      } catch (streamError) {
        // Handle streaming errors
        if (streamError.name === 'AbortError') {
          // Request was cancelled - save partial content if any
          if (streamError.accumulated) {
            assistantMessage.content = streamError.accumulated;
            assistantMessage.status = 'complete';
            assistantMessage.llm_info.cancelled = true;
            await messageService.saveMessage(projectId, chatId, assistantMessage);
          }

          reply.raw.write(`event: cancelled\ndata: ${JSON.stringify({
            message: assistantMessage.content ? assistantMessage : null,
            reason: 'Request cancelled'
          })}\n\n`);
        } else {
          // Other error
          assistantMessage.status = 'error';
          assistantMessage.content = streamError.accumulated || '';
          
          reply.raw.write(`event: error\ndata: ${JSON.stringify({
            error: streamError.message,
            partial_content: streamError.accumulated || ''
          })}\n\n`);
        }
      }

      // End the stream
      reply.raw.end();

    } catch (error) {
      console.error('Streaming endpoint error:', error);
      
      // If headers not sent yet, send error response
      if (!reply.raw.headersSent) {
        reply.code(500).send({
          success: false,
          error: error.message || 'Internal server error'
        });
      } else {
        // Headers already sent, send error event
        reply.raw.write(`event: error\ndata: ${JSON.stringify({
          error: error.message || 'Internal server error'
        })}\n\n`);
        reply.raw.end();
      }
    }
  });

  /**
   * Cancel active LLM request
   * POST /api/projects/:projectId/chats/:chatId/cancel
   * 
   * Response:
   * {
   *   success: boolean,
   *   cancelled: boolean,
   *   requestId?: string
   * }
   */
  fastify.post('/api/projects/:projectId/chats/:chatId/cancel', async (request, reply) => {
    const { projectId, chatId } = request.params;

    try {
      // Get active request info before cancelling
      const activeRequest = llmService.getActiveRequest(chatId);
      
      // Cancel the request
      const cancelled = llmService.cancelActiveRequest(chatId);

      reply.send({
        success: true,
        cancelled,
        requestId: activeRequest?.requestId || null,
        message: cancelled ? 'Request cancelled' : 'No active request to cancel'
      });
    } catch (error) {
      console.error('Cancel request error:', error);
      reply.code(500).send({
        success: false,
        error: error.message || 'Failed to cancel request'
      });
    }
  });

  /**
   * Get active request status
   * GET /api/projects/:projectId/chats/:chatId/active-request
   */
  fastify.get('/api/projects/:projectId/chats/:chatId/active-request', async (request, reply) => {
    const { chatId } = request.params;

    const activeRequest = llmService.getActiveRequest(chatId);

    reply.send({
      success: true,
      hasActiveRequest: !!activeRequest,
      data: activeRequest ? {
        requestId: activeRequest.requestId,
        startTime: activeRequest.startTime,
        duration_ms: Date.now() - activeRequest.startTime
      } : null
    });
  });
}

module.exports = streamingRoutes;