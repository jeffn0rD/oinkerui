/**
 * Data Entity Service
 * 
 * Responsibilities:
 * - Create, read, update, and delete data entities
 * - Manage file storage and retrieval
 * - Handle JSON/YAML object storage
 * - Maintain entity-project relationships
 * 
 * Spec Reference: spec/domain.yaml#DataEntity
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const yaml = require('js-yaml');
const config = require('../config');
const projectService = require('./projectService');

// Import shared error classes
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  FileSystemError
} = require('../errors');

// Valid entity types
const VALID_TYPES = ['object', 'file', 'directory', 'db_table', 'env_var_set'];
const VALID_STATUSES = ['active', 'modified', 'deleted'];

/**
 * Validate entity name
 * @param {string} name - Entity name
 * @throws {ValidationError} If name is invalid
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Entity name is required');
  }
  
  if (name.length < 1 || name.length > 100) {
    throw new ValidationError('Entity name must be between 1 and 100 characters');
  }
  
  // Name must start with alphanumeric and contain only alphanumeric, underscore, hyphen, space, or dot
  const namePattern = /^[a-zA-Z0-9][a-zA-Z0-9_\- .]*$/;
  if (!namePattern.test(name)) {
    throw new ValidationError('Entity name must start with alphanumeric and contain only alphanumeric, underscore, hyphen, space, or dot');
  }
}

/**
 * Validate entity path (must be relative and within project)
 * @param {string} entityPath - Entity path
 * @throws {ValidationError} If path is invalid
 */
function validatePath(entityPath) {
  if (!entityPath || typeof entityPath !== 'string') {
    throw new ValidationError('Entity path is required');
  }
  
  // Path must be relative (not start with /)
  if (entityPath.startsWith('/')) {
    throw new ValidationError('Entity path must be relative');
  }
  
  // Path must not contain .. (directory traversal)
  if (entityPath.includes('..')) {
    throw new ValidationError('Entity path must not contain directory traversal (..)');
  }
  
  // Path must not be empty after normalization
  const normalized = path.normalize(entityPath);
  if (!normalized || normalized === '.') {
    throw new ValidationError('Entity path is invalid');
  }
}

/**
 * createDataEntity
 * 
 * Create a new data entity within a project.
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {Object} options - Entity options
 * @param {string} options.name - Human-readable entity name
 * @param {string} options.type - Entity type (object, file, directory, db_table, env_var_set)
 * @param {string} options.path - Path to entity (relative to project root)
 * @param {*} [options.content] - Content for file/object entities
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Promise<Object>} Created entity object
 * @throws {ValidationError} If parameters are invalid
 * @throws {NotFoundError} If project not found
 * @throws {ConflictError} If entity already exists at path
 */
async function createDataEntity(projectId, options) {
  // Validate project exists
  const project = await projectService.getProject(projectId);
  
  // Validate required fields
  if (!options) {
    throw new ValidationError('Entity options are required');
  }
  
  validateName(options.name);
  validatePath(options.path);
  
  if (!options.type || !VALID_TYPES.includes(options.type)) {
    throw new ValidationError(`Entity type must be one of: ${VALID_TYPES.join(', ')}`);
  }
  
  // Check if entity already exists at path
  const entityPath = path.join(project.paths.root, options.path);
  try {
    await fs.access(entityPath);
    throw new ConflictError('Entity already exists at path', { path: options.path });
  } catch (error) {
    if (error.name === 'ConflictError') throw error;
    // File doesn't exist, which is what we want
  }
  
  // Create entity object
  const entity = {
    id: uuidv4(),
    project_id: projectId,
    name: options.name,
    type: options.type,
    status: 'active',
    path: options.path,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: options.metadata || {}
  };
  
  // Create the entity based on type
  try {
    switch (options.type) {
      case 'file':
        // Ensure parent directory exists
        await fs.mkdir(path.dirname(entityPath), { recursive: true });
        // Write file content
        const fileContent = options.content || '';
        await fs.writeFile(entityPath, fileContent, 'utf8');
        entity.size = Buffer.byteLength(fileContent, 'utf8');
        entity.mime_type = getMimeType(options.path);
        break;
        
      case 'object':
        // Store as JSON file
        await fs.mkdir(path.dirname(entityPath), { recursive: true });
        const jsonContent = JSON.stringify(options.content || {}, null, 2);
        await fs.writeFile(entityPath, jsonContent, 'utf8');
        entity.size = Buffer.byteLength(jsonContent, 'utf8');
        entity.mime_type = 'application/json';
        break;
        
      case 'directory':
        // Create directory
        await fs.mkdir(entityPath, { recursive: true });
        entity.size = 0;
        break;
        
      case 'db_table':
      case 'env_var_set':
        // These are metadata-only entities, store in entity index
        break;
        
      default:
        throw new ValidationError(`Unsupported entity type: ${options.type}`);
    }
  } catch (error) {
    if (error.name === 'ValidationError') throw error;
    throw new FileSystemError('Failed to create entity', { error: error.message });
  }
  
  // Add entity to project's entity index
  await addEntityToIndex(project, entity);
  
  console.log('Data entity created:', {
    event: 'data_entity_created',
    entityId: entity.id,
    projectId,
    name: entity.name,
    type: entity.type,
    path: entity.path
  });
  
  return entity;
}

/**
 * getDataEntity
 * 
 * Retrieve a data entity by ID.
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {string} entityId - UUID of the entity
 * @param {Object} [options] - Options
 * @param {boolean} [options.includeContent=false] - Include entity content
 * @returns {Promise<Object>} Entity object
 * @throws {ValidationError} If IDs are invalid
 * @throws {NotFoundError} If entity not found
 */
async function getDataEntity(projectId, entityId, options = {}) {
  // Validate project exists
  const project = await projectService.getProject(projectId);
  
  if (!entityId) {
    throw new ValidationError('Entity ID is required');
  }
  
  // Load entity index
  const entities = await loadEntityIndex(project);
  const entity = entities.find(e => e.id === entityId);
  
  if (!entity) {
    throw new NotFoundError('Entity not found', { entityId });
  }
  
  // Include content if requested
  if (options.includeContent && (entity.type === 'file' || entity.type === 'object')) {
    try {
      const entityPath = path.join(project.paths.root, entity.path);
      const content = await fs.readFile(entityPath, 'utf8');
      
      if (entity.type === 'object') {
        entity.content = JSON.parse(content);
      } else {
        entity.content = content;
      }
    } catch (error) {
      // Content not available
      entity.content = null;
    }
  }
  
  return entity;
}

/**
 * listDataEntities
 * 
 * List all data entities in a project.
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {Object} [options] - Filter options
 * @param {string} [options.type] - Filter by entity type
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.pathPrefix] - Filter by path prefix
 * @returns {Promise<Array>} Array of entity objects
 * @throws {ValidationError} If project ID is invalid
 * @throws {NotFoundError} If project not found
 */
async function listDataEntities(projectId, options = {}) {
  // Validate project exists
  const project = await projectService.getProject(projectId);
  
  // Load entity index
  let entities = await loadEntityIndex(project);
  
  // Apply filters
  if (options.type) {
    entities = entities.filter(e => e.type === options.type);
  }
  
  if (options.status) {
    entities = entities.filter(e => e.status === options.status);
  }
  
  if (options.pathPrefix) {
    entities = entities.filter(e => e.path.startsWith(options.pathPrefix));
  }
  
  return entities;
}

/**
 * updateDataEntity
 * 
 * Update a data entity's metadata or content.
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {string} entityId - UUID of the entity
 * @param {Object} updates - Fields to update
 * @param {string} [updates.name] - New entity name
 * @param {string} [updates.status] - New status
 * @param {*} [updates.content] - New content (for file/object types)
 * @param {Object} [updates.metadata] - Updated metadata
 * @returns {Promise<Object>} Updated entity object
 * @throws {ValidationError} If parameters are invalid
 * @throws {NotFoundError} If entity not found
 */
async function updateDataEntity(projectId, entityId, updates) {
  // Get existing entity
  const project = await projectService.getProject(projectId);
  const entities = await loadEntityIndex(project);
  const entityIndex = entities.findIndex(e => e.id === entityId);
  
  if (entityIndex === -1) {
    throw new NotFoundError('Entity not found', { entityId });
  }
  
  const entity = entities[entityIndex];
  
  // Validate and apply updates
  if (updates.name !== undefined) {
    validateName(updates.name);
    entity.name = updates.name;
  }
  
  if (updates.status !== undefined) {
    if (!VALID_STATUSES.includes(updates.status)) {
      throw new ValidationError(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    entity.status = updates.status;
  }
  
  if (updates.metadata !== undefined) {
    entity.metadata = { ...entity.metadata, ...updates.metadata };
  }
  
  // Update content if provided
  if (updates.content !== undefined && (entity.type === 'file' || entity.type === 'object')) {
    try {
      const entityPath = path.join(project.paths.root, entity.path);
      
      if (entity.type === 'object') {
        const jsonContent = JSON.stringify(updates.content, null, 2);
        await fs.writeFile(entityPath, jsonContent, 'utf8');
        entity.size = Buffer.byteLength(jsonContent, 'utf8');
      } else {
        await fs.writeFile(entityPath, updates.content, 'utf8');
        entity.size = Buffer.byteLength(updates.content, 'utf8');
      }
      
      entity.status = 'modified';
    } catch (error) {
      throw new FileSystemError('Failed to update entity content', { error: error.message });
    }
  }
  
  // Update timestamp
  entity.updated_at = new Date().toISOString();
  
  // Save updated index
  entities[entityIndex] = entity;
  await saveEntityIndex(project, entities);
  
  console.log('Data entity updated:', {
    event: 'data_entity_updated',
    entityId: entity.id,
    projectId,
    updates: Object.keys(updates)
  });
  
  return entity;
}

/**
 * deleteDataEntity
 * 
 * Delete a data entity.
 * 
 * @param {string} projectId - UUID of the parent project
 * @param {string} entityId - UUID of the entity
 * @param {Object} [options] - Delete options
 * @param {boolean} [options.hard=false] - If true, delete file; if false, mark as deleted
 * @returns {Promise<void>}
 * @throws {ValidationError} If IDs are invalid
 * @throws {NotFoundError} If entity not found
 */
async function deleteDataEntity(projectId, entityId, options = {}) {
  // Get existing entity
  const project = await projectService.getProject(projectId);
  const entities = await loadEntityIndex(project);
  const entityIndex = entities.findIndex(e => e.id === entityId);
  
  if (entityIndex === -1) {
    throw new NotFoundError('Entity not found', { entityId });
  }
  
  const entity = entities[entityIndex];
  
  if (options.hard) {
    // Hard delete - remove file and from index
    try {
      const entityPath = path.join(project.paths.root, entity.path);
      
      if (entity.type === 'directory') {
        await fs.rm(entityPath, { recursive: true, force: true });
      } else if (entity.type === 'file' || entity.type === 'object') {
        await fs.unlink(entityPath);
      }
    } catch (error) {
      // File might not exist, continue with index removal
    }
    
    // Remove from index
    entities.splice(entityIndex, 1);
    
    console.log('Data entity deleted (hard):', {
      event: 'data_entity_deleted_hard',
      entityId: entity.id,
      projectId
    });
  } else {
    // Soft delete - mark as deleted
    entity.status = 'deleted';
    entity.updated_at = new Date().toISOString();
    entities[entityIndex] = entity;
    
    console.log('Data entity deleted (soft):', {
      event: 'data_entity_deleted_soft',
      entityId: entity.id,
      projectId
    });
  }
  
  await saveEntityIndex(project, entities);
}

/**
 * Load entity index from project
 * @param {Object} project - Project object
 * @returns {Promise<Array>} Array of entities
 */
async function loadEntityIndex(project) {
  const indexPath = path.join(project.paths.root, 'data', 'entities.json');
  
  try {
    const content = await fs.readFile(indexPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw new FileSystemError('Failed to load entity index', { error: error.message });
  }
}

/**
 * Save entity index to project
 * @param {Object} project - Project object
 * @param {Array} entities - Array of entities
 */
async function saveEntityIndex(project, entities) {
  const dataDir = path.join(project.paths.root, 'data');
  const indexPath = path.join(dataDir, 'entities.json');
  
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(indexPath, JSON.stringify(entities, null, 2), 'utf8');
  } catch (error) {
    throw new FileSystemError('Failed to save entity index', { error: error.message });
  }
}

/**
 * Add entity to project index
 * @param {Object} project - Project object
 * @param {Object} entity - Entity to add
 */
async function addEntityToIndex(project, entity) {
  const entities = await loadEntityIndex(project);
  entities.push(entity);
  await saveEntityIndex(project, entities);
}

/**
 * Get MIME type from file extension
 * @param {string} filePath - File path
 * @returns {string} MIME type
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.py': 'text/x-python',
    '.html': 'text/html',
    '.css': 'text/css',
    '.xml': 'application/xml',
    '.csv': 'text/csv',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Read entity content
 * @param {string} projectId - Project ID
 * @param {string} entityId - Entity ID
 * @returns {Promise<*>} Entity content
 */
async function readEntityContent(projectId, entityId) {
  const entity = await getDataEntity(projectId, entityId, { includeContent: true });
  return entity.content;
}

/**
 * Write entity content
 * @param {string} projectId - Project ID
 * @param {string} entityId - Entity ID
 * @param {*} content - New content
 * @returns {Promise<Object>} Updated entity
 */
async function writeEntityContent(projectId, entityId, content) {
  return updateDataEntity(projectId, entityId, { content });
}

module.exports = {
  createDataEntity,
  getDataEntity,
  listDataEntities,
  updateDataEntity,
  deleteDataEntity,
  readEntityContent,
  writeEntityContent,
  // Export error classes for testing
  ValidationError,
  NotFoundError,
  ConflictError,
  FileSystemError
};