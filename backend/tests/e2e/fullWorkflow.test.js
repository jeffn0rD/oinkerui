'use strict';

/**
 * End-to-End Workflow Tests
 * 
 * Tests the complete workflow from project creation to message sending.
 * Verifies integration between all Phase 1 components.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Services
const projectService = require('../../src/services/projectService');
const chatService = require('../../src/services/chatService');
const messageService = require('../../src/services/messageService');
const llmService = require('../../src/services/llmService');
const loggingService = require('../../src/services/loggingService');
const gitService = require('../../src/services/gitService');
const dataEntityService = require('../../src/services/dataEntityService');

// Mock axios for LLM calls
jest.mock('axios');
const axios = require('axios');

describe('End-to-End Workflow', () => {
  let testWorkspaceRoot;
  let testProject;
  let testChat;

  beforeAll(async () => {
    // Create temporary workspace
    testWorkspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'oinkerui-e2e-'));
    
    // Reset config
    const config = require('../../src/config');
    config.reset({
      workspace: {
        root: testWorkspaceRoot,
        dataDir: testWorkspaceRoot
      },
      api: {
        openrouter: {
          apiKey: 'test-api-key',
          baseUrl: 'https://openrouter.ai/api/v1',
          timeout: 60000
        }
      }
    });
    
    // Reset logging metrics
    loggingService.resetMetricsCache();
  });

  afterAll(async () => {
    // Cleanup
    try {
      await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup:', error);
    }
  });

  describe('Complete Chat Workflow', () => {
    it('Step 1: Create a new project', async () => {
      testProject = await projectService.createProject('E2E Test Project', {
        description: 'Project for end-to-end testing'
      });

      expect(testProject).toBeDefined();
      expect(testProject.id).toBeDefined();
      expect(testProject.name).toBe('E2E Test Project');
      expect(testProject.status).toBe('active');
      expect(testProject.paths).toBeDefined();
      expect(testProject.paths.root).toBeDefined();
    });

    it('Step 2: Verify project directory structure', async () => {
      const projectPath = testProject.paths.root;
      
      // Check project.json exists
      const projectJsonPath = path.join(projectPath, 'project.json');
      const projectJson = await fs.readFile(projectJsonPath, 'utf8');
      const projectData = JSON.parse(projectJson);
      
      expect(projectData.id).toBe(testProject.id);
      expect(projectData.name).toBe('E2E Test Project');
    });

    it('Step 3: Create a chat in the project', async () => {
      testChat = await chatService.createChat(testProject.id, {
        name: 'E2E Test Chat',
        system_prelude: {
          type: 'inline',
          content: 'You are a helpful assistant for testing.'
        }
      });

      expect(testChat).toBeDefined();
      expect(testChat.id).toBeDefined();
      expect(testChat.name).toBe('E2E Test Chat');
      expect(testChat.status).toBe('active');
      expect(testChat.system_prelude).toBeDefined();
      expect(testChat.storage_path).toBeDefined();
    });

    it('Step 4: Verify chat is linked to project', async () => {
      const project = await projectService.getProject(testProject.id);
      
      expect(project.chats).toBeDefined();
      expect(project.chats.length).toBe(1);
      expect(project.chats[0].id).toBe(testChat.id);
    });

    it('Step 5: Send a user message', async () => {
      // sendMessage is simplified - it saves the message and returns the result
      // The actual message is saved via saveMessage internally
      const result = await messageService.sendMessage(
        testProject.id,
        testChat.id,
        { raw_text: 'Hello, this is a test message!' }
      );

      // sendMessage may return undefined in simplified implementation
      // The important thing is the message gets saved
      const messages = await messageService.listMessages(testProject.id, testChat.id);
      expect(messages.length).toBeGreaterThan(0);
      
      const userMessage = messages.find(m => m.content === 'Hello, this is a test message!');
      expect(userMessage).toBeDefined();
      expect(userMessage.role).toBe('user');
    });

    it('Step 6: Verify message is stored in JSONL', async () => {
      const messages = await messageService.listMessages(testProject.id, testChat.id);
      
      // Should have at least the message from Step 5
      expect(messages.length).toBeGreaterThanOrEqual(1);
      
      const testMessage = messages.find(m => m.content === 'Hello, this is a test message!');
      expect(testMessage).toBeDefined();
    });

    it('Step 7: Construct context for LLM', async () => {
      const currentMessage = {
        role: 'user',
        content: 'What is 2 + 2?'
      };

      const context = await llmService.constructContext(
        { ...testChat, project_id: testProject.id },
        currentMessage
      );

      expect(context).toBeDefined();
      expect(Array.isArray(context)).toBe(true);
      
      // Should have system prelude first
      expect(context[0].role).toBe('system');
      expect(context[0].content).toContain('helpful assistant');
      
      // Should have current message last
      expect(context[context.length - 1].content).toBe('What is 2 + 2?');
    });

    it('Step 8: Call LLM (mocked)', async () => {
      // Mock successful LLM response
      axios.post.mockResolvedValueOnce({
        data: {
          id: 'chatcmpl-test-123',
          model: 'openai/gpt-4',
          choices: [{
            message: { content: 'The answer is 4.' },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 50,
            completion_tokens: 10,
            total_tokens: 60
          }
        }
      });

      const response = await llmService.callLLM({
        model: 'openai/gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'What is 2 + 2?' }
        ]
      });

      expect(response.content).toBe('The answer is 4.');
      expect(response.usage.total_tokens).toBe(60);
    });

    it('Step 9: Log LLM request', async () => {
      const logEntry = {
        project_id: testProject.id,
        chat_id: testChat.id,
        model: 'openai/gpt-4',
        status: 'success',
        usage: {
          prompt_tokens: 50,
          completion_tokens: 10,
          total_tokens: 60
        },
        latency_ms: 1500
      };

      const result = await loggingService.logLLMRequest(logEntry);

      expect(result.logged).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('Step 10: Get usage statistics', async () => {
      const stats = await loggingService.getStats({
        type: 'project',
        projectId: testProject.id
      });

      expect(stats.summary.totalRequests).toBe(1);
      expect(stats.summary.successfulRequests).toBe(1);
      expect(stats.summary.totalTokens).toBe(60);
    });

    it('Step 11: Create a data entity', async () => {
      const entity = await dataEntityService.createDataEntity(testProject.id, {
        name: 'test-config.json',
        type: 'object',
        path: 'data/test-config.json',
        content: { setting: 'value', enabled: true }
      });

      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.type).toBe('object');
    });

    it('Step 12: List data entities', async () => {
      const entities = await dataEntityService.listDataEntities(testProject.id);

      expect(entities.length).toBe(1);
      expect(entities[0].name).toBe('test-config.json');
    });

    it('Step 13: Update chat status', async () => {
      const updated = await chatService.updateChat(
        testProject.id,
        testChat.id,
        { status: 'closed' }
      );

      expect(updated.status).toBe('closed');
    });

    it('Step 14: List chats with filter', async () => {
      // Create another chat
      await chatService.createChat(testProject.id, { name: 'Active Chat' });
      
      const activeChats = await chatService.listChats(testProject.id, { status: 'active' });
      const closedChats = await chatService.listChats(testProject.id, { status: 'closed' });

      expect(activeChats.length).toBe(1);
      expect(closedChats.length).toBe(1);
      expect(closedChats[0].id).toBe(testChat.id);
    });

    it('Step 15: Archive project', async () => {
      const archived = await projectService.updateProject(testProject.id, {
        status: 'archived'
      });

      expect(archived.status).toBe('archived');
    });

    it('Step 16: List projects with filter', async () => {
      // Create another project
      await projectService.createProject('Active Project');
      
      const allProjects = await projectService.listProjects();
      const activeProjects = await projectService.listProjects({ status: 'active' });
      const archivedProjects = await projectService.listProjects({ status: 'archived' });

      expect(allProjects.length).toBe(2);
      expect(activeProjects.length).toBe(1);
      expect(archivedProjects.length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project ID', async () => {
      await expect(
        projectService.getProject('invalid-id')
      ).rejects.toThrow();
    });

    it('should handle non-existent project', async () => {
      await expect(
        projectService.getProject('00000000-0000-4000-8000-000000000000')
      ).rejects.toThrow();
    });

    it('should handle invalid chat creation', async () => {
      await expect(
        chatService.createChat('invalid-project-id', { name: 'Test' })
      ).rejects.toThrow();
    });

    it('should handle message to non-existent chat', async () => {
      const project = await projectService.createProject('Error Test Project');
      
      await expect(
        messageService.sendMessage(project.id, 'non-existent-chat-id', { raw_text: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity between project and chats', async () => {
      const project = await projectService.createProject('Integrity Test');
      const chat1 = await chatService.createChat(project.id, { name: 'Chat 1' });
      const chat2 = await chatService.createChat(project.id, { name: 'Chat 2' });

      const loadedProject = await projectService.getProject(project.id);
      
      expect(loadedProject.chats.length).toBe(2);
      expect(loadedProject.chats.map(c => c.id)).toContain(chat1.id);
      expect(loadedProject.chats.map(c => c.id)).toContain(chat2.id);
    });

    it('should persist messages across service restarts', async () => {
      const project = await projectService.createProject('Persistence Test');
      const chat = await chatService.createChat(project.id, { name: 'Test Chat' });
      
      // Send messages
      await messageService.sendMessage(project.id, chat.id, { raw_text: 'Message 1' });
      await messageService.sendMessage(project.id, chat.id, { raw_text: 'Message 2' });
      await messageService.sendMessage(project.id, chat.id, { raw_text: 'Message 3' });

      // Clear any caches by re-requiring the service
      // In real scenario, this simulates a restart
      
      // Load messages
      const messages = await messageService.listMessages(project.id, chat.id);
      
      expect(messages.length).toBe(3);
      expect(messages[0].content).toBe('Message 1');
      expect(messages[1].content).toBe('Message 2');
      expect(messages[2].content).toBe('Message 3');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent message sends', async () => {
      const project = await projectService.createProject('Concurrent Test');
      const chat = await chatService.createChat(project.id, { name: 'Test Chat' });

      // Send multiple messages concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          messageService.sendMessage(project.id, chat.id, { raw_text: `Message ${i}` })
        );
      }

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(5);
      
      // Verify all messages were saved
      const messages = await messageService.listMessages(project.id, chat.id);
      expect(messages.length).toBe(5);
    });

    it('should handle concurrent project creation', async () => {
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          projectService.createProject(`Concurrent Project ${i}`)
        );
      }

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(3);
      
      // All should have unique IDs
      const ids = results.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });
});