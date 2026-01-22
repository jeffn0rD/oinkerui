'use strict';

/**
 * Data Entity Service Tests
 * 
 * Tests for createDataEntity, getDataEntity, listDataEntities, 
 * updateDataEntity, and deleteDataEntity functions
 * Spec: spec/domain.yaml#DataEntity
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const dataEntityService = require('../../src/services/dataEntityService');
const projectService = require('../../src/services/projectService');

describe('Data Entity Service', () => {
  let testWorkspaceRoot;
  let testProjectId;
  let testProject;

  beforeEach(async () => {
    // Create temporary workspace for testing
    testWorkspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'oinkerui-entity-test-'));
    
    // Reset config with test workspace
    const config = require('../../src/config');
    config.reset({
      workspace: {
        root: testWorkspaceRoot,
        dataDir: testWorkspaceRoot
      }
    });
    
    // Create a test project
    testProject = await projectService.createProject('Test Entity Project');
    testProjectId = testProject.id;
  });

  afterEach(async () => {
    // Cleanup test workspace
    try {
      await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup test workspace:', error);
    }
  });

  describe('createDataEntity', () => {
    it('should create a file entity', async () => {
      const entity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'test-file.txt',
        type: 'file',
        path: 'files/test-file.txt',
        content: 'Hello, World!'
      });

      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('test-file.txt');
      expect(entity.type).toBe('file');
      expect(entity.status).toBe('active');
      expect(entity.path).toBe('files/test-file.txt');
      expect(entity.project_id).toBe(testProjectId);
      expect(entity.created_at).toBeDefined();
      expect(entity.mime_type).toBe('text/plain');
    });

    it('should create an object entity', async () => {
      const entity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'config',
        type: 'object',
        path: 'data/config.json',
        content: { key: 'value', nested: { a: 1 } }
      });

      expect(entity.type).toBe('object');
      expect(entity.mime_type).toBe('application/json');
      
      // Verify file was created with JSON content
      const filePath = path.join(testProject.paths.root, 'data/config.json');
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.key).toBe('value');
      expect(parsed.nested.a).toBe(1);
    });

    it('should create a directory entity', async () => {
      const entity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'assets',
        type: 'directory',
        path: 'assets'
      });

      expect(entity.type).toBe('directory');
      
      // Verify directory was created
      const dirPath = path.join(testProject.paths.root, 'assets');
      const stat = await fs.stat(dirPath);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should create a db_table entity (metadata only)', async () => {
      const entity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'users_table',
        type: 'db_table',
        path: 'db/users',
        metadata: { columns: ['id', 'name', 'email'] }
      });

      expect(entity.type).toBe('db_table');
      expect(entity.metadata.columns).toEqual(['id', 'name', 'email']);
    });

    it('should throw ValidationError for missing name', async () => {
      await expect(
        dataEntityService.createDataEntity(testProjectId, {
          type: 'file',
          path: 'test.txt'
        })
      ).rejects.toThrow(dataEntityService.ValidationError);
    });

    it('should throw ValidationError for invalid name', async () => {
      await expect(
        dataEntityService.createDataEntity(testProjectId, {
          name: '!invalid',
          type: 'file',
          path: 'test.txt'
        })
      ).rejects.toThrow(dataEntityService.ValidationError);
    });

    it('should throw ValidationError for missing type', async () => {
      await expect(
        dataEntityService.createDataEntity(testProjectId, {
          name: 'test',
          path: 'test.txt'
        })
      ).rejects.toThrow(dataEntityService.ValidationError);
    });

    it('should throw ValidationError for invalid type', async () => {
      await expect(
        dataEntityService.createDataEntity(testProjectId, {
          name: 'test',
          type: 'invalid-type',
          path: 'test.txt'
        })
      ).rejects.toThrow(dataEntityService.ValidationError);
    });

    it('should throw ValidationError for absolute path', async () => {
      await expect(
        dataEntityService.createDataEntity(testProjectId, {
          name: 'test',
          type: 'file',
          path: '/absolute/path.txt'
        })
      ).rejects.toThrow(dataEntityService.ValidationError);
    });

    it('should throw ValidationError for path traversal', async () => {
      await expect(
        dataEntityService.createDataEntity(testProjectId, {
          name: 'test',
          type: 'file',
          path: '../outside/path.txt'
        })
      ).rejects.toThrow(dataEntityService.ValidationError);
    });

    it('should throw ConflictError for duplicate path', async () => {
      await dataEntityService.createDataEntity(testProjectId, {
        name: 'test',
        type: 'file',
        path: 'test.txt',
        content: 'first'
      });

      await expect(
        dataEntityService.createDataEntity(testProjectId, {
          name: 'test2',
          type: 'file',
          path: 'test.txt',
          content: 'second'
        })
      ).rejects.toThrow(dataEntityService.ConflictError);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      await expect(
        dataEntityService.createDataEntity('non-existent-project-id', {
          name: 'test',
          type: 'file',
          path: 'test.txt'
        })
      ).rejects.toThrow(dataEntityService.NotFoundError);
    });
  });

  describe('getDataEntity', () => {
    let testEntity;

    beforeEach(async () => {
      testEntity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'test-file.txt',
        type: 'file',
        path: 'files/test-file.txt',
        content: 'Test content'
      });
    });

    it('should retrieve entity by ID', async () => {
      const entity = await dataEntityService.getDataEntity(testProjectId, testEntity.id);

      expect(entity.id).toBe(testEntity.id);
      expect(entity.name).toBe('test-file.txt');
    });

    it('should include content when requested', async () => {
      const entity = await dataEntityService.getDataEntity(
        testProjectId, 
        testEntity.id, 
        { includeContent: true }
      );

      expect(entity.content).toBe('Test content');
    });

    it('should parse JSON content for object entities', async () => {
      const objectEntity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'config',
        type: 'object',
        path: 'config.json',
        content: { key: 'value' }
      });

      const entity = await dataEntityService.getDataEntity(
        testProjectId,
        objectEntity.id,
        { includeContent: true }
      );

      expect(entity.content).toEqual({ key: 'value' });
    });

    it('should throw ValidationError for missing entity ID', async () => {
      await expect(
        dataEntityService.getDataEntity(testProjectId, null)
      ).rejects.toThrow(dataEntityService.ValidationError);
    });

    it('should throw NotFoundError for non-existent entity', async () => {
      await expect(
        dataEntityService.getDataEntity(testProjectId, 'non-existent-id')
      ).rejects.toThrow(dataEntityService.NotFoundError);
    });
  });

  describe('listDataEntities', () => {
    beforeEach(async () => {
      // Create multiple entities
      await dataEntityService.createDataEntity(testProjectId, {
        name: 'file1.txt',
        type: 'file',
        path: 'files/file1.txt',
        content: 'Content 1'
      });
      
      await dataEntityService.createDataEntity(testProjectId, {
        name: 'file2.txt',
        type: 'file',
        path: 'files/file2.txt',
        content: 'Content 2'
      });
      
      await dataEntityService.createDataEntity(testProjectId, {
        name: 'config',
        type: 'object',
        path: 'data/config.json',
        content: { key: 'value' }
      });
      
      await dataEntityService.createDataEntity(testProjectId, {
        name: 'assets',
        type: 'directory',
        path: 'assets'
      });
    });

    it('should list all entities in project', async () => {
      const entities = await dataEntityService.listDataEntities(testProjectId);

      expect(entities.length).toBe(4);
    });

    it('should filter by type', async () => {
      const files = await dataEntityService.listDataEntities(testProjectId, { type: 'file' });
      const objects = await dataEntityService.listDataEntities(testProjectId, { type: 'object' });
      const directories = await dataEntityService.listDataEntities(testProjectId, { type: 'directory' });

      expect(files.length).toBe(2);
      expect(objects.length).toBe(1);
      expect(directories.length).toBe(1);
    });

    it('should filter by path prefix', async () => {
      const filesInDir = await dataEntityService.listDataEntities(testProjectId, { 
        pathPrefix: 'files/' 
      });

      expect(filesInDir.length).toBe(2);
    });

    it('should filter by status', async () => {
      const activeEntities = await dataEntityService.listDataEntities(testProjectId, { 
        status: 'active' 
      });

      expect(activeEntities.length).toBe(4);
    });

    it('should return empty array for project with no entities', async () => {
      const newProject = await projectService.createProject('Empty Project');
      const entities = await dataEntityService.listDataEntities(newProject.id);

      expect(entities).toEqual([]);
    });
  });

  describe('updateDataEntity', () => {
    let testEntity;

    beforeEach(async () => {
      testEntity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'test-file.txt',
        type: 'file',
        path: 'test-file.txt',
        content: 'Original content'
      });
    });

    it('should update entity name', async () => {
      const updated = await dataEntityService.updateDataEntity(
        testProjectId,
        testEntity.id,
        { name: 'renamed-file.txt' }
      );

      expect(updated.name).toBe('renamed-file.txt');
      expect(updated.updated_at).not.toBe(testEntity.updated_at);
    });

    it('should update entity status', async () => {
      const updated = await dataEntityService.updateDataEntity(
        testProjectId,
        testEntity.id,
        { status: 'modified' }
      );

      expect(updated.status).toBe('modified');
    });

    it('should update entity content', async () => {
      const updated = await dataEntityService.updateDataEntity(
        testProjectId,
        testEntity.id,
        { content: 'Updated content' }
      );

      expect(updated.status).toBe('modified');
      
      // Verify file content was updated
      const filePath = path.join(testProject.paths.root, 'test-file.txt');
      const content = await fs.readFile(filePath, 'utf8');
      expect(content).toBe('Updated content');
    });

    it('should update object entity content', async () => {
      const objectEntity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'config',
        type: 'object',
        path: 'config.json',
        content: { old: 'value' }
      });

      const updated = await dataEntityService.updateDataEntity(
        testProjectId,
        objectEntity.id,
        { content: { new: 'value' } }
      );

      // Verify JSON content was updated
      const filePath = path.join(testProject.paths.root, 'config.json');
      const content = await fs.readFile(filePath, 'utf8');
      expect(JSON.parse(content)).toEqual({ new: 'value' });
    });

    it('should update metadata', async () => {
      const updated = await dataEntityService.updateDataEntity(
        testProjectId,
        testEntity.id,
        { metadata: { custom: 'data' } }
      );

      expect(updated.metadata.custom).toBe('data');
    });

    it('should throw ValidationError for invalid name', async () => {
      await expect(
        dataEntityService.updateDataEntity(testProjectId, testEntity.id, { name: '!invalid' })
      ).rejects.toThrow(dataEntityService.ValidationError);
    });

    it('should throw ValidationError for invalid status', async () => {
      await expect(
        dataEntityService.updateDataEntity(testProjectId, testEntity.id, { status: 'invalid' })
      ).rejects.toThrow(dataEntityService.ValidationError);
    });

    it('should throw NotFoundError for non-existent entity', async () => {
      await expect(
        dataEntityService.updateDataEntity(testProjectId, 'non-existent-id', { name: 'new' })
      ).rejects.toThrow(dataEntityService.NotFoundError);
    });
  });

  describe('deleteDataEntity', () => {
    let testEntity;

    beforeEach(async () => {
      testEntity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'test-file.txt',
        type: 'file',
        path: 'test-file.txt',
        content: 'Content to delete'
      });
    });

    it('should soft delete entity (mark as deleted)', async () => {
      await dataEntityService.deleteDataEntity(testProjectId, testEntity.id);

      const entity = await dataEntityService.getDataEntity(testProjectId, testEntity.id);
      expect(entity.status).toBe('deleted');
      
      // File should still exist
      const filePath = path.join(testProject.paths.root, 'test-file.txt');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should hard delete entity (remove file)', async () => {
      await dataEntityService.deleteDataEntity(testProjectId, testEntity.id, { hard: true });

      // Entity should not exist in index
      await expect(
        dataEntityService.getDataEntity(testProjectId, testEntity.id)
      ).rejects.toThrow(dataEntityService.NotFoundError);
      
      // File should be deleted
      const filePath = path.join(testProject.paths.root, 'test-file.txt');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should hard delete directory entity', async () => {
      const dirEntity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'test-dir',
        type: 'directory',
        path: 'test-dir'
      });

      await dataEntityService.deleteDataEntity(testProjectId, dirEntity.id, { hard: true });

      // Directory should be deleted
      const dirPath = path.join(testProject.paths.root, 'test-dir');
      const exists = await fs.access(dirPath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should throw NotFoundError for non-existent entity', async () => {
      await expect(
        dataEntityService.deleteDataEntity(testProjectId, 'non-existent-id')
      ).rejects.toThrow(dataEntityService.NotFoundError);
    });
  });

  describe('readEntityContent and writeEntityContent', () => {
    let testEntity;

    beforeEach(async () => {
      testEntity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'test-file.txt',
        type: 'file',
        path: 'test-file.txt',
        content: 'Initial content'
      });
    });

    it('should read entity content', async () => {
      const content = await dataEntityService.readEntityContent(testProjectId, testEntity.id);
      expect(content).toBe('Initial content');
    });

    it('should write entity content', async () => {
      await dataEntityService.writeEntityContent(testProjectId, testEntity.id, 'New content');
      
      const content = await dataEntityService.readEntityContent(testProjectId, testEntity.id);
      expect(content).toBe('New content');
    });
  });

  describe('Entity index persistence', () => {
    it('should persist entities across service calls', async () => {
      // Create entity
      const entity = await dataEntityService.createDataEntity(testProjectId, {
        name: 'persistent.txt',
        type: 'file',
        path: 'persistent.txt',
        content: 'Persistent content'
      });

      // List should include the entity
      const entities = await dataEntityService.listDataEntities(testProjectId);
      expect(entities.some(e => e.id === entity.id)).toBe(true);

      // Get should retrieve the entity
      const retrieved = await dataEntityService.getDataEntity(testProjectId, entity.id);
      expect(retrieved.name).toBe('persistent.txt');
    });
  });
});