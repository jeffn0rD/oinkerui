'use strict';

/**
 * Project Routes
 * 
 * REST API endpoints for project CRUD operations
 */

const projectService = require('../services/projectService');

async function projectRoutes(fastify, options) {
  
  /**
   * POST /api/projects
   * Create a new project
   */
  fastify.post('/api/projects', async (request, reply) => {
    try {
      const { name, description, default_model, settings } = request.body;

      if (!name) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'Project name is required'
        });
      }

      const project = await projectService.createProject(name, {
        description,
        default_model,
        settings
      });

      return reply.code(201).send(project);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return reply.code(400).send({
          error: error.name,
          message: error.message,
          details: error.details
        });
      }

      if (error.name === 'ConflictError') {
        return reply.code(409).send({
          error: error.name,
          message: error.message,
          details: error.details
        });
      }

      console.error('Error creating project:', error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to create project'
      });
    }
  });

  /**
   * GET /api/projects
   * List all projects
   */
  fastify.get('/api/projects', async (request, reply) => {
    try {
      const { status } = request.query;
      const filter = status ? { status } : {};

      const projects = await projectService.listProjects(filter);
      return reply.send(projects);
    } catch (error) {
      console.error('Error listing projects:', error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to list projects'
      });
    }
  });

  /**
   * GET /api/projects/:projectId
   * Get a specific project
   */
  fastify.get('/api/projects/:projectId', async (request, reply) => {
    try {
      const { projectId } = request.params;
      const project = await projectService.getProject(projectId);
      return reply.send(project);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return reply.code(404).send({
          error: error.name,
          message: error.message,
          details: error.details
        });
      }

      console.error('Error getting project:', error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to get project'
      });
    }
  });

  /**
   * PUT /api/projects/:projectId
   * Update a project
   */
  fastify.put('/api/projects/:projectId', async (request, reply) => {
    try {
      const { projectId } = request.params;
      const updates = request.body;

      const project = await projectService.updateProject(projectId, updates);
      return reply.send(project);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return reply.code(404).send({
          error: error.name,
          message: error.message,
          details: error.details
        });
      }

      if (error.name === 'ValidationError') {
        return reply.code(400).send({
          error: error.name,
          message: error.message,
          details: error.details
        });
      }

      console.error('Error updating project:', error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to update project'
      });
    }
  });

  /**
   * DELETE /api/projects/:projectId
   * Delete a project
   */
  fastify.delete('/api/projects/:projectId', async (request, reply) => {
    try {
      const { projectId } = request.params;
      const { hard } = request.query;

      await projectService.deleteProject(projectId, { hard: hard === 'true' });
      return reply.code(204).send();
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return reply.code(404).send({
          error: error.name,
          message: error.message,
          details: error.details
        });
      }

      console.error('Error deleting project:', error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to delete project'
      });
    }
  });
}

module.exports = projectRoutes;