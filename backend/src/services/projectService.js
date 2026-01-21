'use strict';

/**
 * Project Service
 * 
 * Implements Project CRUD operations according to spec/functions/backend_node/create_project.yaml
 * and related specifications.
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const simpleGit = require('simple-git');
const config = require('../config');

// Custom error classes
class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class ConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConflictError';
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'NotFoundError';
    this.details = details;
  }
}

class FileSystemError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'FileSystemError';
    this.details = details;
  }
}

class GitError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'GitError';
    this.details = details;
  }
}

/**
 * Project index management
 */
class ProjectIndex {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.indexPath = path.join(workspaceRoot, 'projects', 'index.json');
  }

  async load() {
    try {
      // Ensure projects directory exists
      await fs.mkdir(path.dirname(this.indexPath), { recursive: true });
      
      // Try to read existing index
      const data = await fs.readFile(this.indexPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Index doesn't exist, return empty structure
        return { projects: [] };
      }
      throw new FileSystemError('Failed to load project index', { error: error.message });
    }
  }

  async save(index) {
    try {
      await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf8');
    } catch (error) {
      throw new FileSystemError('Failed to save project index', { error: error.message });
    }
  }

  async findBySlug(slug) {
    const index = await this.load();
    return index.projects.find(p => p.slug === slug && p.status !== 'deleted');
  }

  async findById(projectId) {
    const index = await this.load();
    return index.projects.find(p => p.id === projectId);
  }

  async add(project) {
    const index = await this.load();
    index.projects.push({
      id: project.id,
      name: project.name,
      slug: project.slug,
      status: project.status,
      created_at: project.created_at,
      updated_at: project.updated_at
    });
    await this.save(index);
  }

  async update(project) {
    const index = await this.load();
    const idx = index.projects.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      index.projects[idx] = {
        id: project.id,
        name: project.name,
        slug: project.slug,
        status: project.status,
        created_at: project.created_at,
        updated_at: project.updated_at
      };
      await this.save(index);
    }
  }

  async list(filter = {}) {
    const index = await this.load();
    let projects = index.projects;

    if (filter.status) {
      projects = projects.filter(p => p.status === filter.status);
    }

    return projects;
  }
}

/**
 * createProject
 * 
 * Create a new project with the given name and configuration.
 * Initializes the project directory structure, Git repository,
 * and creates the initial project metadata.
 * 
 * @param {string} projectName - Human-readable name of the project
 * @param {Object} options - Optional project configuration
 * @returns {Promise<Object>} Created project object with ID and metadata
 * 
 * @see spec/functions/backend_node/create_project.yaml
 */
async function createProject(projectName, options = {}) {
  // Step 1: Validation
  if (!projectName || typeof projectName !== 'string') {
    throw new ValidationError('Project name is required and must be a string');
  }

  const namePattern = /^[a-zA-Z0-9][a-zA-Z0-9_\- ]*$/;
  if (!namePattern.test(projectName) || projectName.length > 100 || projectName.length < 1) {
    throw new ValidationError('Invalid project name. Must be 1-100 characters and match pattern ^[a-zA-Z0-9][a-zA-Z0-9_\\- ]*$');
  }

  // Step 2: Generate slug
  const slug = slugify(projectName, { lower: true, strict: true });

  // Step 3: Check conflicts
  const projectIndex = new ProjectIndex(config.workspaceRoot);
  const existing = await projectIndex.findBySlug(slug);
  if (existing) {
    throw new ConflictError('Project with this name already exists', { slug });
  }

  // Step 4: Generate ID
  const projectId = uuidv4();

  // Step 5: Create directory structure
  const projectPath = path.join(config.workspaceRoot, 'projects', slug);
  
  try {
    await fs.mkdir(projectPath, { recursive: true });
    await fs.mkdir(path.join(projectPath, 'chats'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'data'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'logs'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'public'), { recursive: true });
  } catch (error) {
    throw new FileSystemError('Failed to create project directories', { error: error.message });
  }

  try {
    // Step 6: Initialize Git
    const git = simpleGit(projectPath);
    await git.init();
    await git.addConfig('user.name', 'OinkerUI');
    await git.addConfig('user.email', 'oinkerui@local');

    // Create .gitignore
    const gitignore = `# OinkerUI Project
*.log
.DS_Store
node_modules/
.env
.env.local
`;
    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore, 'utf8');

    // Step 7: Create project metadata
    const project = {
      id: projectId,
      name: projectName,
      slug: slug,
      description: options.description || '',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      default_model: options.default_model || config.defaultModel || 'openai/gpt-4',
      settings: {
        auto_commit: options.settings?.auto_commit ?? true,
        context_window: options.settings?.context_window ?? 8000,
        ...options.settings
      },
      paths: {
        root: projectPath,
        chats_dir: 'chats',
        data_dir: 'data',
        logs_dir: 'logs',
        public_dir: 'public'
      }
    };

    await fs.writeFile(
      path.join(projectPath, 'project.json'),
      JSON.stringify(project, null, 2),
      'utf8'
    );

    // Step 8: Update index
    await projectIndex.add(project);

    // Step 9: Log event (simplified for now)
    console.log('Project created:', { projectId, slug, name: projectName });

    // Step 10: Return project object
    return project;

  } catch (error) {
    // Cleanup on failure
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Failed to cleanup after error:', cleanupError);
    }

    if (error.name === 'ValidationError' || error.name === 'ConflictError') {
      throw error;
    }

    if (error.message && error.message.includes('git')) {
      throw new GitError('Failed to initialize Git repository', { error: error.message });
    }

    throw new FileSystemError('Failed to create project', { error: error.message });
  }
}

/**
 * getProject
 * 
 * Retrieve a project by ID
 * 
 * @param {string} projectId - UUID of the project
 * @returns {Promise<Object>} Project object
 */
async function getProject(projectId) {
  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  const projectIndex = new ProjectIndex(config.workspaceRoot);
  const projectMeta = await projectIndex.findById(projectId);

  if (!projectMeta) {
    throw new NotFoundError('Project not found', { projectId });
  }

  // Load full project data from project.json
  const projectPath = path.join(config.workspaceRoot, 'projects', projectMeta.slug);
  const projectJsonPath = path.join(projectPath, 'project.json');

  try {
    const data = await fs.readFile(projectJsonPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new FileSystemError('Failed to load project data', { projectId, error: error.message });
  }
}

/**
 * listProjects
 * 
 * List all projects with optional filtering
 * 
 * @param {Object} filter - Filter options (e.g., { status: 'active' })
 * @returns {Promise<Array>} Array of project objects
 */
async function listProjects(filter = {}) {
  const projectIndex = new ProjectIndex(config.workspaceRoot);
  const projects = await projectIndex.list(filter);

  // Load full project data for each
  const fullProjects = await Promise.all(
    projects.map(async (projectMeta) => {
      try {
        return await getProject(projectMeta.id);
      } catch (error) {
        console.error(`Failed to load project ${projectMeta.id}:`, error);
        return projectMeta; // Return index entry if full load fails
      }
    })
  );

  return fullProjects;
}

/**
 * updateProject
 * 
 * Update project metadata
 * 
 * @param {string} projectId - UUID of the project
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated project object
 */
async function updateProject(projectId, updates) {
  const project = await getProject(projectId);

  // Update allowed fields
  const allowedFields = ['name', 'description', 'default_model', 'settings', 'status'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      project[field] = updates[field];
    }
  }

  project.updated_at = new Date().toISOString();

  // Save to project.json
  const projectPath = path.join(config.workspaceRoot, 'projects', project.slug);
  await fs.writeFile(
    path.join(projectPath, 'project.json'),
    JSON.stringify(project, null, 2),
    'utf8'
  );

  // Update index
  const projectIndex = new ProjectIndex(config.workspaceRoot);
  await projectIndex.update(project);

  return project;
}

/**
 * deleteProject
 * 
 * Delete a project (soft delete by default)
 * 
 * @param {string} projectId - UUID of the project
 * @param {Object} options - Delete options (e.g., { hard: true })
 * @returns {Promise<void>}
 */
async function deleteProject(projectId, options = {}) {
  const project = await getProject(projectId);

  if (options.hard) {
    // Hard delete - remove from filesystem
    const projectPath = path.join(config.workspaceRoot, 'projects', project.slug);
    await fs.rm(projectPath, { recursive: true, force: true });

    // Remove from index
    const projectIndex = new ProjectIndex(config.workspaceRoot);
    const index = await projectIndex.load();
    index.projects = index.projects.filter(p => p.id !== projectId);
    await projectIndex.save(index);
  } else {
    // Soft delete - mark as deleted
    await updateProject(projectId, { status: 'deleted' });
  }
}

module.exports = {
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  ValidationError,
  ConflictError,
  NotFoundError,
  FileSystemError,
  GitError
};