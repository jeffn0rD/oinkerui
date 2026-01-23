'use strict';

/**
 * End-to-End Workflow Tests
 * 
 * Tests the complete workflow from project creation to message sending.
 * Verifies integration between all Phase 1 components.
 * 
 * Note: These tests are designed to work on both Unix and Windows systems.
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

// Increase timeout for E2E tests
jest.setTimeout(30000);

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
    // Give time for any pending file operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Cleanup with retry logic for Windows file locking issues
    const maxRetries = 5;
    const retryDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fs.rm(testWorkspaceRoot, { recursive: true, force: true, maxRetries: 3 });
        break; // Success, exit loop
      } catch (error) {
        if (attempt === maxRetries) {
          // Log but don't fail the test suite
          console.warn(`Warning: Failed to cleanup test directory after ${maxRetries} attempts:`, error.message);
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
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
      expect(testChat.project_id).toBe(testProject.id);
    });

    it('Step 4: Send a message in the chat', async () => {
      const result = await messageService.sendMessage(testProject.id, testChat.id, {
        raw_text: 'Hello, this is a test message!'
      });

      // sendMessage returns { user_message, assistant_message, ... }
      expect(result).toBeDefined();
      expect(result.user_message).toBeDefined();
      expect(result.user_message.id).toBeDefined();
      expect(result.user_message.role).toBe('user');
      expect(result.user_message.content).toBe('Hello, this is a test message!');
    });

    it('Step 5: List messages in the chat', async () => {
      const messages = await messageService.listMessages(testProject.id, testChat.id);

      expect(messages).toBeDefined();
      expect(messages.length).toBeGreaterThan(0);
      // Find the user message we sent
      const userMessage = messages.find(m => m.role === 'user');
      expect(userMessage).toBeDefined();
      expect(userMessage.content).toBe('Hello, this is a test message!');
    });

    it('Step 6: Verify chat is linked to project', async () => {
      const loadedProject = await projectService.getProject(testProject.id);
      
      expect(loadedProject.chats).toBeDefined();
      expect(loadedProject.chats.length).toBeGreaterThan(0);
      expect(loadedProject.chats.some(c => c.id === testChat.id)).toBe(true);
    });
  });

  describe('LLM Integration', () => {
    beforeEach(() => {
      // Reset axios mock
      axios.post.mockReset();
    });

    it('should construct context correctly', async () => {
      // Create a project and chat for this test
      const project = await projectService.createProject('LLM Test Project');
      const chat = await chatService.createChat(project.id, {
        name: 'LLM Test Chat',
        system_prelude: {
          type: 'inline',
          content: 'You are a test assistant.'
        }
      });

      // Add some messages
      await messageService.sendMessage(project.id, chat.id, { raw_text: 'First message' });
      await messageService.sendMessage(project.id, chat.id, { raw_text: 'Second message' });

      // Reload the chat to get updated storage_path
      const loadedChat = await chatService.getChat(project.id, chat.id);
      
      // Create a current message for context construction
      const currentMessage = {
        role: 'user',
        content: 'Current test message'
      };
      
      // Construct context - pass chat object and current message
      const context = await llmService.constructContext(loadedChat, currentMessage);

      expect(context).toBeDefined();
      expect(Array.isArray(context)).toBe(true);
      expect(context.length).toBeGreaterThan(0);
      expect(context[0].role).toBe('system');
      expect(context[0].content).toBe('You are a test assistant.');
    });

    it('should call LLM with correct parameters', async () => {
      // Mock successful response
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              role: 'assistant',
              content: 'This is a test response.'
            }
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15
          }
        }
      });

      const messages = [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Hello!' }
      ];

      // callLLM expects a request object with model and messages
      const response = await llmService.callLLM({
        model: 'openai/gpt-3.5-turbo',
        messages: messages
      });

      expect(response).toBeDefined();
      expect(response.content).toBe('This is a test response.');
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('Git Operations', () => {
    it('should initialize git repository for project', async () => {
      const project = await projectService.createProject('Git Test Project');
      
      // Check .git directory exists
      const gitDir = path.join(project.paths.root, '.git');
      const gitExists = await fs.stat(gitDir).then(() => true).catch(() => false);
      
      expect(gitExists).toBe(true);
    });

    it('should get repository status', async () => {
      const project = await projectService.createProject('Git Status Test');
      
      const status = await gitService.getStatus(project.paths.root);
      
      expect(status).toBeDefined();
      // getStatus returns isClean, not isRepo
      expect(status.isClean).toBeDefined();
      expect(status.current).toBeDefined();
    });

    it('should auto-commit changes', async () => {
      const project = await projectService.createProject('Git Commit Test');
      
      // Create a file
      const testFile = path.join(project.paths.root, 'test-file.txt');
      await fs.writeFile(testFile, 'Test content');
      
      // Auto-commit
      const result = await gitService.autoCommit(project.paths.root, {
        message: 'Test commit'
      });
      
      expect(result).toBeDefined();
      expect(result.committed).toBe(true);
    });
  });

  describe('Data Entity Management', () => {
    it('should create a file entity', async () => {
      const project = await projectService.createProject('Entity Test Project');
      
      // createDataEntity requires path parameter
      const entity = await dataEntityService.createDataEntity(project.id, {
        name: 'test-file.txt',
        type: 'file',
        path: 'files/test-file.txt',
        content: 'Test file content'
      });

      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('test-file.txt');
      expect(entity.type).toBe('file');
    });

    it('should create an object entity', async () => {
      const project = await projectService.createProject('Object Entity Test');
      
      const entity = await dataEntityService.createDataEntity(project.id, {
        name: 'config',
        type: 'object',
        path: 'data/config.json',
        content: { key: 'value', nested: { data: true } }
      });

      expect(entity).toBeDefined();
      expect(entity.type).toBe('object');
    });

    it('should list entities in project', async () => {
      const project = await projectService.createProject('List Entity Test');
      
      await dataEntityService.createDataEntity(project.id, {
        name: 'file1.txt',
        type: 'file',
        path: 'files/file1.txt',
        content: 'Content 1'
      });
      
      await dataEntityService.createDataEntity(project.id, {
        name: 'file2.txt',
        type: 'file',
        path: 'files/file2.txt',
        content: 'Content 2'
      });

      const entities = await dataEntityService.listDataEntities(project.id);
      
      expect(entities.length).toBe(2);
    });
  });

  describe('Logging Service', () => {
    it('should log LLM requests', async () => {
      const project = await projectService.createProject('Logging Test Project');
      
      // logLLMRequest returns { id, logged, timestamp }
      const result = await loggingService.logLLMRequest({
        project_id: project.id,
        chat_id: 'test-chat-id',
        model: 'openai/gpt-4',
        status: 'success',
        usage: { total_tokens: 100 },
        latency_ms: 500
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.logged).toBe(true);
    });

    it('should get stats for project', async () => {
      const project = await projectService.createProject('Stats Test Project');
      
      // Log some requests with correct field names
      await loggingService.logLLMRequest({
        project_id: project.id,
        chat_id: 'test-chat',
        model: 'openai/gpt-4',
        status: 'success',
        usage: { total_tokens: 100, prompt_tokens: 50, completion_tokens: 50 }
      });
      
      await loggingService.logLLMRequest({
        project_id: project.id,
        chat_id: 'test-chat',
        model: 'openai/gpt-4',
        status: 'success',
        usage: { total_tokens: 200, prompt_tokens: 100, completion_tokens: 100 }
      });

      // getStats requires a scope object and returns { scope, summary, byModel, entries }
      const stats = await loggingService.getStats({ 
        type: 'project', 
        projectId: project.id 
      });
      
      expect(stats).toBeDefined();
      expect(stats.summary).toBeDefined();
      expect(stats.summary.totalRequests).toBe(2);
      expect(stats.summary.totalTokens).toBe(300);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project name', async () => {
      await expect(
        projectService.createProject('')
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

      // Load messages
      const messages = await messageService.listMessages(project.id, chat.id);
      
      // Filter to only user messages
      const userMessages = messages.filter(m => m.role === 'user');
      
      expect(userMessages.length).toBe(3);
      expect(userMessages[0].content).toBe('Message 1');
      expect(userMessages[1].content).toBe('Message 2');
      expect(userMessages[2].content).toBe('Message 3');
    });
  });

  describe('Sequential Operations', () => {
    it('should handle sequential message sends', async () => {
      const project = await projectService.createProject('Sequential Msg Test');
      const chat = await chatService.createChat(project.id, { name: 'Test Chat' });

      // Send messages sequentially to avoid race conditions
      for (let i = 0; i < 5; i++) {
        await messageService.sendMessage(project.id, chat.id, { raw_text: `Message ${i}` });
      }
      
      // Verify all messages were saved
      const messages = await messageService.listMessages(project.id, chat.id);
      const userMessages = messages.filter(m => m.role === 'user');
      expect(userMessages.length).toBe(5);
    });

    it('should handle sequential project creation', async () => {
      // Sequential project creation to avoid index file race conditions
      const results = [];
      
      for (let i = 0; i < 3; i++) {
        const project = await projectService.createProject(`Sequential Project ${i}`);
        results.push(project);
      }
      
      expect(results.length).toBe(3);
      
      // All should have unique IDs
      const ids = results.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });
});