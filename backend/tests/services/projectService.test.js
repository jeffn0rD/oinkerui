'use strict';

/**
 * Project Service Tests
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const projectService = require('../../src/services/projectService');

describe('ProjectService', () => {
  let testWorkspaceRoot;

  beforeEach(async () => {
    // Create temporary workspace for testing
    testWorkspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'oinkerui-test-'));
    
    // Reset config with test workspace
    const config = require('../../src/config');
    config.reset({
      workspace: {
        root: testWorkspaceRoot,
        dataDir: testWorkspaceRoot
      }
    });
  });

  afterEach(async () => {
    // Cleanup test workspace
    try {
      await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup test workspace:', error);
    }
  });

  describe('createProject', () => {
    test('should create a project with valid name', async () => {
      const projectName = 'Test Project';
      const project = await projectService.createProject(projectName);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe(projectName);
      expect(project.slug).toBe('test-project');
      expect(project.status).toBe('active');
      expect(project.paths).toBeDefined();

      // Verify directory structure
      const projectPath = path.join(testWorkspaceRoot, 'projects', project.slug);
      const stats = await fs.stat(projectPath);
      expect(stats.isDirectory()).toBe(true);

      // Verify subdirectories
      const chatsDir = await fs.stat(path.join(projectPath, 'chats'));
      expect(chatsDir.isDirectory()).toBe(true);

      const dataDir = await fs.stat(path.join(projectPath, 'data'));
      expect(dataDir.isDirectory()).toBe(true);

      // Verify project.json
      const projectJson = await fs.readFile(path.join(projectPath, 'project.json'), 'utf8');
      const savedProject = JSON.parse(projectJson);
      expect(savedProject.id).toBe(project.id);

      // Verify Git initialization
      const gitDir = await fs.stat(path.join(projectPath, '.git'));
      expect(gitDir.isDirectory()).toBe(true);
    });

    test('should reject invalid project name', async () => {
      await expect(projectService.createProject('')).rejects.toThrow('Project name is required');
      await expect(projectService.createProject('!invalid')).rejects.toThrow('Invalid project name');
      await expect(projectService.createProject('a'.repeat(101))).rejects.toThrow('Invalid project name');
    });

    test('should reject duplicate project names', async () => {
      const projectName = 'Duplicate Project';
      await projectService.createProject(projectName);
      
      await expect(projectService.createProject(projectName)).rejects.toThrow('Project with this name already exists');
    });

    test('should create project with options', async () => {
      const projectName = 'Project With Options';
      const options = {
        description: 'Test description',
        default_model: 'openai/gpt-3.5-turbo',
        settings: {
          auto_commit: false,
          context_window: 4000
        }
      };

      const project = await projectService.createProject(projectName, options);

      expect(project.description).toBe(options.description);
      expect(project.default_model).toBe(options.default_model);
      expect(project.settings.auto_commit).toBe(false);
      expect(project.settings.context_window).toBe(4000);
    });
  });

  describe('getProject', () => {
    test('should retrieve existing project', async () => {
      const created = await projectService.createProject('Get Test Project');
      const retrieved = await projectService.getProject(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(created.name);
      expect(retrieved.slug).toBe(created.slug);
    });

    test('should throw NotFoundError for non-existent project', async () => {
      await expect(projectService.getProject('non-existent-id')).rejects.toThrow('Project not found');
    });

    test('should throw ValidationError for missing project ID', async () => {
      await expect(projectService.getProject()).rejects.toThrow('Project ID is required');
    });
  });

  describe('listProjects', () => {
    test('should list all projects', async () => {
      await projectService.createProject('Project 1');
      await projectService.createProject('Project 2');
      await projectService.createProject('Project 3');

      const projects = await projectService.listProjects();
      expect(projects.length).toBe(3);
    });

    test('should filter projects by status', async () => {
      const p1 = await projectService.createProject('Active Project');
      await projectService.createProject('Another Active');
      const p3 = await projectService.createProject('To Delete');
      
      await projectService.deleteProject(p3.id); // Soft delete

      const activeProjects = await projectService.listProjects({ status: 'active' });
      expect(activeProjects.length).toBe(2);

      const deletedProjects = await projectService.listProjects({ status: 'deleted' });
      expect(deletedProjects.length).toBe(1);
    });

    test('should return empty array when no projects exist', async () => {
      const projects = await projectService.listProjects();
      expect(projects).toEqual([]);
    });
  });

  describe('updateProject', () => {
    test('should update project fields', async () => {
      const project = await projectService.createProject('Update Test');
      
      const updated = await projectService.updateProject(project.id, {
        description: 'Updated description',
        default_model: 'openai/gpt-4'
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.default_model).toBe('openai/gpt-4');
      expect(updated.updated_at).not.toBe(project.updated_at);
    });

    test('should throw NotFoundError for non-existent project', async () => {
      await expect(projectService.updateProject('non-existent', {})).rejects.toThrow('Project not found');
    });
  });

  describe('deleteProject', () => {
    test('should soft delete project by default', async () => {
      const project = await projectService.createProject('Delete Test');
      await projectService.deleteProject(project.id);

      const retrieved = await projectService.getProject(project.id);
      expect(retrieved.status).toBe('deleted');

      // Directory should still exist
      const projectPath = path.join(testWorkspaceRoot, 'projects', project.slug);
      const stats = await fs.stat(projectPath);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should hard delete project when specified', async () => {
      const project = await projectService.createProject('Hard Delete Test');
      await projectService.deleteProject(project.id, { hard: true });

      // Project should not be in index
      await expect(projectService.getProject(project.id)).rejects.toThrow('Project not found');

      // Directory should not exist
      const projectPath = path.join(testWorkspaceRoot, 'projects', project.slug);
      await expect(fs.stat(projectPath)).rejects.toThrow();
    });

    test('should throw NotFoundError for non-existent project', async () => {
      await expect(projectService.deleteProject('non-existent')).rejects.toThrow('Project not found');
    });
  });
});