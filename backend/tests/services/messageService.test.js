/**
 * Message Service Tests
 * 
 * Unit tests for message CRUD operations
 */

const { describe, it, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs').promises;
const path = require('path');
const messageService = require('../../src/services/messageService');
const projectService = require('../../src/services/projectService');
const chatService = require('../../src/services/chatService');

// Test data
let testProject;
let testProjectId;
let testChat;
let testChatId;
let testWorkspaceRoot;

describe('Message Service', () => {
  beforeEach(async () => {
    // Create temporary workspace for testing
    const os = require('os');
    testWorkspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'oinkerui-message-test-'));
    
    // Reset config with test workspace
    const config = require('../../src/config');
    config.reset({
      workspace: {
        root: testWorkspaceRoot,
        dataDir: testWorkspaceRoot
      }
    });
    
    // Create a test project
    testProject = await projectService.createProject('Test Project for Messages', {
      description: 'Project for testing message operations'
    });
    testProjectId = testProject.id;

    // Create a test chat
    testChat = await chatService.createChat(testProjectId, {
      name: 'Test Chat'
    });
    testChatId = testChat.id;
  });

  afterEach(async () => {
    // Clean up test project
    try {
      await projectService.deleteProject(testProjectId, { hard: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Clean up test workspace
    try {
      await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('saveMessage', () => {
    it('should save a message in append mode', async () => {
      const message = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'Hello, world!',
        status: 'complete',
        include_in_context: true
      };

      const saved = await messageService.saveMessage(testProjectId, testChatId, message);

      expect(saved).toBeDefined();
      expect(saved.id).toBe(message.id);
      expect(saved.chat_id).toBe(testChatId);
      expect(saved.project_id).toBe(testProjectId);
      expect(saved.created_at).toBeDefined();

      // Verify message is in storage
      const messages = await messageService.listMessages(testProjectId, testChatId);
      expect(messages.length).toBe(1);
      expect(messages[0].id).toBe(message.id);
    });

    it('should save multiple messages in order', async () => {
      const message1 = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'First message',
        status: 'complete'
      };

      const message2 = {
        id: require('uuid').v4(),
        role: 'assistant',
        content: 'Second message',
        status: 'complete'
      };

      await messageService.saveMessage(testProjectId, testChatId, message1);
      await messageService.saveMessage(testProjectId, testChatId, message2);

      const messages = await messageService.listMessages(testProjectId, testChatId);
      expect(messages.length).toBe(2);
      expect(messages[0].id).toBe(message1.id);
      expect(messages[1].id).toBe(message2.id);
    });

    it('should update a message in update mode', async () => {
      const message = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'Original content',
        status: 'complete'
      };

      await messageService.saveMessage(testProjectId, testChatId, message);

      // Update the message
      message.content = 'Updated content';
      await messageService.saveMessage(testProjectId, testChatId, message, { mode: 'update' });

      const messages = await messageService.listMessages(testProjectId, testChatId);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('Updated content');
    });

    it('should throw ValidationError for invalid chat ID', async () => {
      const message = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'Test',
        status: 'complete'
      };

      await expect(
        messageService.saveMessage(testProjectId, 'invalid-uuid', message)
      ).rejects.toThrow(messageService.ValidationError);
    });

    it('should throw ValidationError for chat_id mismatch', async () => {
      const message = {
        id: require('uuid').v4(),
        chat_id: 'different-chat-id',
        role: 'user',
        content: 'Test',
        status: 'complete'
      };

      await expect(
        messageService.saveMessage(testProjectId, testChatId, message)
      ).rejects.toThrow(messageService.ValidationError);
    });

    it('should throw ValidationError for missing required fields', async () => {
      const message = {
        id: require('uuid').v4(),
        content: 'Test'
        // Missing role
      };

      await expect(
        messageService.saveMessage(testProjectId, testChatId, message)
      ).rejects.toThrow(messageService.ValidationError);
    });

    it('should set created_at if not provided', async () => {
      const message = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'Test',
        status: 'complete'
      };

      const saved = await messageService.saveMessage(testProjectId, testChatId, message);
      expect(saved.created_at).toBeDefined();
    });
  });

  describe('getMessage', () => {
    it('should retrieve a message by ID', async () => {
      const message = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'Test message',
        status: 'complete'
      };

      await messageService.saveMessage(testProjectId, testChatId, message);

      const retrieved = await messageService.getMessage(testProjectId, testChatId, message.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(message.id);
      expect(retrieved.content).toBe(message.content);
    });

    it('should throw NotFoundError for non-existent message', async () => {
      const fakeMessageId = '00000000-0000-4000-8000-000000000000';
      await expect(
        messageService.getMessage(testProjectId, testChatId, fakeMessageId)
      ).rejects.toThrow(messageService.NotFoundError);
    });

    it('should throw ValidationError for invalid message ID', async () => {
      await expect(
        messageService.getMessage(testProjectId, testChatId, 'invalid-uuid')
      ).rejects.toThrow(messageService.ValidationError);
    });
  });

  describe('listMessages', () => {
    it('should list all messages in a chat', async () => {
      const message1 = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'Message 1',
        status: 'complete'
      };

      const message2 = {
        id: require('uuid').v4(),
        role: 'assistant',
        content: 'Message 2',
        status: 'complete'
      };

      await messageService.saveMessage(testProjectId, testChatId, message1);
      await messageService.saveMessage(testProjectId, testChatId, message2);

      const messages = await messageService.listMessages(testProjectId, testChatId);
      expect(messages.length).toBe(2);
    });

    it('should filter messages by role', async () => {
      const userMessage = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'User message',
        status: 'complete'
      };

      const assistantMessage = {
        id: require('uuid').v4(),
        role: 'assistant',
        content: 'Assistant message',
        status: 'complete'
      };

      await messageService.saveMessage(testProjectId, testChatId, userMessage);
      await messageService.saveMessage(testProjectId, testChatId, assistantMessage);

      const userMessages = await messageService.listMessages(testProjectId, testChatId, { role: 'user' });
      expect(userMessages.length).toBe(1);
      expect(userMessages[0].role).toBe('user');

      const assistantMessages = await messageService.listMessages(testProjectId, testChatId, { role: 'assistant' });
      expect(assistantMessages.length).toBe(1);
      expect(assistantMessages[0].role).toBe('assistant');
    });

    it('should filter messages by include_in_context', async () => {
      const message1 = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'Included message',
        status: 'complete',
        include_in_context: true
      };

      const message2 = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'Excluded message',
        status: 'complete',
        include_in_context: false
      };

      await messageService.saveMessage(testProjectId, testChatId, message1);
      await messageService.saveMessage(testProjectId, testChatId, message2);

      const includedMessages = await messageService.listMessages(testProjectId, testChatId, { include_in_context: true });
      expect(includedMessages.length).toBe(1);
      expect(includedMessages[0].include_in_context).toBe(true);
    });

    it('should return empty array for chat with no messages', async () => {
      const messages = await messageService.listMessages(testProjectId, testChatId);
      expect(messages).toEqual([]);
    });

    it('should preserve message order', async () => {
      const messages = [];
      for (let i = 0; i < 5; i++) {
        const message = {
          id: require('uuid').v4(),
          role: 'user',
          content: `Message ${i}`,
          status: 'complete'
        };
        messages.push(message);
        await messageService.saveMessage(testProjectId, testChatId, message);
      }

      const retrieved = await messageService.listMessages(testProjectId, testChatId);
      expect(retrieved.length).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(retrieved[i].content).toBe(`Message ${i}`);
      }
    });
  });

  describe('sendMessage', () => {
    it('should send a user message', async () => {
      const request = {
        raw_text: 'Hello, assistant!'
      };

      const response = await messageService.sendMessage(testProjectId, testChatId, request);

      expect(response).toBeDefined();
      expect(response.user_message).toBeDefined();
      expect(response.user_message.content).toBe(request.raw_text);
      expect(response.user_message.role).toBe('user');
      expect(response.user_message.status).toBe('complete');

      // Verify message is saved
      const messages = await messageService.listMessages(testProjectId, testChatId);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe(request.raw_text);
    });

    it('should throw ValidationError for empty raw_text', async () => {
      const request = {
        raw_text: ''
      };

      await expect(
        messageService.sendMessage(testProjectId, testChatId, request)
      ).rejects.toThrow(messageService.ValidationError);
    });

    it('should throw ValidationError for missing raw_text', async () => {
      const request = {};

      await expect(
        messageService.sendMessage(testProjectId, testChatId, request)
      ).rejects.toThrow(messageService.ValidationError);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      const fakeProjectId = '00000000-0000-4000-8000-000000000000';
      const request = {
        raw_text: 'Test'
      };

      await expect(
        messageService.sendMessage(fakeProjectId, testChatId, request)
      ).rejects.toThrow(messageService.NotFoundError);
    });

    it('should throw NotFoundError for non-existent chat', async () => {
      const fakeChatId = '00000000-0000-4000-8000-000000000000';
      const request = {
        raw_text: 'Test'
      };

      await expect(
        messageService.sendMessage(testProjectId, fakeChatId, request)
      ).rejects.toThrow(messageService.NotFoundError);
    });

    it('should handle is_aside flag', async () => {
      const request = {
        raw_text: 'This is an aside',
        is_aside: true
      };

      const response = await messageService.sendMessage(testProjectId, testChatId, request);
      expect(response.user_message.is_aside).toBe(true);
    });
  });

  describe('JSONL format verification', () => {
    it('should store messages in valid JSONL format', async () => {
      const message1 = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'First',
        status: 'complete'
      };

      const message2 = {
        id: require('uuid').v4(),
        role: 'assistant',
        content: 'Second',
        status: 'complete'
      };

      await messageService.saveMessage(testProjectId, testChatId, message1);
      await messageService.saveMessage(testProjectId, testChatId, message2);

      // Read raw file content
      const storagePath = path.join(testProject.paths.root, testChat.storage_path);
      const content = await fs.readFile(storagePath, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(2);

      // Each line should be valid JSON
      const parsed1 = JSON.parse(lines[0]);
      const parsed2 = JSON.parse(lines[1]);

      expect(parsed1.id).toBe(message1.id);
      expect(parsed2.id).toBe(message2.id);
    });
  });

  describe('updateMessageFlags', () => {
    let testMessageId;

    beforeEach(async () => {
      // Create a test message
      const message = {
        id: require('uuid').v4(),
        role: 'user',
        content: 'Test message for flag updates',
        status: 'complete',
        include_in_context: true,
        is_aside: false,
        pure_aside: false,
        is_pinned: false,
        is_discarded: false
      };
      await messageService.saveMessage(testProjectId, testChatId, message);
      testMessageId = message.id;
    });

    it('should update is_pinned flag', async () => {
      const updated = await messageService.updateMessageFlags(
        testProjectId, testChatId, testMessageId,
        { is_pinned: true }
      );

      expect(updated.is_pinned).toBe(true);
      expect(updated.updated_at).toBeDefined();

      // Verify persisted
      const retrieved = await messageService.getMessage(testProjectId, testChatId, testMessageId);
      expect(retrieved.is_pinned).toBe(true);
    });

    it('should update is_aside flag', async () => {
      const updated = await messageService.updateMessageFlags(
        testProjectId, testChatId, testMessageId,
        { is_aside: true }
      );

      expect(updated.is_aside).toBe(true);
    });

    it('should enforce is_discarded implies include_in_context=false', async () => {
      const updated = await messageService.updateMessageFlags(
        testProjectId, testChatId, testMessageId,
        { is_discarded: true }
      );

      expect(updated.is_discarded).toBe(true);
      expect(updated.include_in_context).toBe(false);
    });

    it('should enforce pure_aside implies is_aside=true', async () => {
      const updated = await messageService.updateMessageFlags(
        testProjectId, testChatId, testMessageId,
        { pure_aside: true }
      );

      expect(updated.pure_aside).toBe(true);
      expect(updated.is_aside).toBe(true);
    });

    it('should update multiple flags at once', async () => {
      const updated = await messageService.updateMessageFlags(
        testProjectId, testChatId, testMessageId,
        { is_pinned: true, include_in_context: false }
      );

      expect(updated.is_pinned).toBe(true);
      expect(updated.include_in_context).toBe(false);
    });

    it('should throw ValidationError for invalid message ID', async () => {
      await expect(
        messageService.updateMessageFlags(testProjectId, testChatId, 'invalid-id', { is_pinned: true })
      ).rejects.toThrow(messageService.ValidationError);
    });

    it('should throw ValidationError when no flags provided', async () => {
      await expect(
        messageService.updateMessageFlags(testProjectId, testChatId, testMessageId, {})
      ).rejects.toThrow(messageService.ValidationError);
    });

    it('should throw ValidationError for non-boolean flag values', async () => {
      await expect(
        messageService.updateMessageFlags(testProjectId, testChatId, testMessageId, { is_pinned: 'yes' })
      ).rejects.toThrow(messageService.ValidationError);
    });

    it('should throw NotFoundError for non-existent message', async () => {
      const fakeMessageId = require('uuid').v4();
      await expect(
        messageService.updateMessageFlags(testProjectId, testChatId, fakeMessageId, { is_pinned: true })
      ).rejects.toThrow(messageService.NotFoundError);
    });
  });

  describe('sendMessage with context flags', () => {
    it('should create message with all default flags', async () => {
      const request = { raw_text: 'Test message' };
      const response = await messageService.sendMessage(testProjectId, testChatId, request);

      expect(response.user_message.include_in_context).toBe(true);
      expect(response.user_message.is_aside).toBe(false);
      expect(response.user_message.pure_aside).toBe(false);
      expect(response.user_message.is_pinned).toBe(false);
      expect(response.user_message.is_discarded).toBe(false);
    });

    it('should respect pure_aside flag in request', async () => {
      const request = { raw_text: 'Pure aside message', pure_aside: true };
      const response = await messageService.sendMessage(testProjectId, testChatId, request);

      expect(response.user_message.pure_aside).toBe(true);
    });

    it('should respect is_pinned flag in request', async () => {
      const request = { raw_text: 'Pinned message', is_pinned: true };
      const response = await messageService.sendMessage(testProjectId, testChatId, request);

      expect(response.user_message.is_pinned).toBe(true);
    });
  });
});