/**
 * Template Routes
 * 
 * API endpoints for prompt template management.
 * Provides listing, retrieval, and resolution of templates.
 * 
 * Spec: spec/functions/backend_node/list_templates.yaml
 *       spec/functions/backend_node/resolve_template.yaml
 */

const templateService = require('../services/templateService');

async function templateRoutes(fastify) {
  /**
   * GET /api/templates
   * List available templates (global + project)
   */
  fastify.get('/api/templates', async (request, reply) => {
    const { projectId, category, search } = request.query;

    try {
      const templates = templateService.listTemplates({
        projectId,
        category,
        search,
      });

      return { templates };
    } catch (err) {
      reply.code(500).send({
        error: 'TEMPLATE_LIST_ERROR',
        message: err.message,
      });
    }
  });

  /**
   * GET /api/templates/:templateId
   * Get a single template by ID
   */
  fastify.get('/api/templates/:templateId', async (request, reply) => {
    const { templateId } = request.params;
    const { projectId } = request.query;

    const template = templateService.getTemplate(templateId, projectId);

    if (!template) {
      return reply.code(404).send({
        error: 'TEMPLATE_NOT_FOUND',
        message: `Template not found: ${templateId}`,
      });
    }

    return template;
  });

  /**
   * POST /api/templates/resolve
   * Resolve a template with variable substitution
   */
  fastify.post('/api/templates/resolve', async (request, reply) => {
    const { templateId, variables, projectId, useJinja, strict } = request.body || {};

    if (!templateId) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'templateId is required',
      });
    }

    try {
      const result = await templateService.resolveTemplate(
        templateId,
        variables || {},
        { projectId, useJinja, strict },
      );

      return result;
    } catch (err) {
      if (err.message.includes('not found')) {
        return reply.code(404).send({
          error: 'TEMPLATE_NOT_FOUND',
          message: err.message,
        });
      }
      if (err.message.includes('Missing required')) {
        return reply.code(400).send({
          error: 'MISSING_VARIABLES',
          message: err.message,
        });
      }
      return reply.code(500).send({
        error: 'TEMPLATE_RESOLVE_ERROR',
        message: err.message,
      });
    }
  });

  /**
   * POST /api/templates/render-inline
   * Render an inline template string (not from stored templates)
   */
  fastify.post('/api/templates/render-inline', async (request, reply) => {
    const { template, variables, useJinja, strict } = request.body || {};

    if (!template) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'template is required',
      });
    }

    try {
      if (useJinja) {
        const pythonTools = require('../services/pythonToolsClient');
        const result = await pythonTools.renderTemplate(template, variables || {}, { strict });
        return result;
      } else {
        const result = templateService.simpleSubstitute(template, variables || {});
        return result;
      }
    } catch (err) {
      return reply.code(400).send({
        error: 'RENDER_ERROR',
        message: err.message,
      });
    }
  });
}

module.exports = templateRoutes;