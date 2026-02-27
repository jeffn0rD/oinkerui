/**
 * Chat Service Tests
 * 
 * Unit tests for chat CRUD operations
 */

const { describe, it, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs').promises;
const path = require('path');
const chatService = require('../../src/services/chatService');
const projectService = require('../../src/services/projectService');

// Mock project for testing
let testProject;
let testProjectId;
let testWorkspaceRoot;

describe('Chat Service', () => {
  beforeEach(async () => {
    // Create temporary workspace for testing
    const os = require('os');
    testWorkspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'oinkerui-chat-test-'));
    
    // Reset config with test workspace
    const config = require('../../src/config');
    config.reset({
      workspace: {
        root: testWorkspaceRoot,
        dataDir: testWorkspaceRoot
      }
    });
    
    // Create a test project
    testProject = await projectService.createProject('Test Project for Chats', {
      description: 'Project for testing chat operations'
    });
    testProjectId = testProject.id;
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

  describe('createChat', () => {
    it('should create chat with default name', async () => {
      const chat = await chatService.createChat(testProjectId);

      expect(chat).toBeDefined();
      expect(chat.id).toBeDefined();
      expect(chat.project_id).toBe(testProjectId);
      expect(chat.name).toMatch(/^Chat /);
      expect(chat.status).toBe('active');
      expect(chat.created_at).toBeDefined();
      expect(chat.updated_at).toBeDefined();
      expect(chat.storage_path).toMatch(/^chats\/.+\.jsonl$/);

      // Verify storage file exists
      const storagePath = path.join(testProject.paths.root, chat.storage_path);
      const fileExists = await fs.access(storagePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify chat is in project's chat list
      const updatedProject = await projectService.getProject(testProjectId);
      expect(updatedProject.chats).toBeDefined();
      expect(updatedProject.chats.length).toBe(1);
      expect(updatedProject.chats[0].id).toBe(chat.id);
    });

    it('should create chat with custom name', async () => {
      const customName = 'My Custom Chat';
      const chat = await chatService.createChat(testProjectId, { name: customName });

      expect(chat.name).toBe(customName);
    });

    it('should create chat with inline system prelude', async () => {
      const systemPrelude = {
        content: 'You are a helpful assistant.'
      };

      const chat = await chatService.createChat(testProjectId, {
        name: 'Chat with Prelude',
        system_prelude: systemPrelude
      });

      expect(chat.system_prelude).toBeDefined();
      expect(chat.system_prelude.source_type).toBe('inline');
      expect(chat.system_prelude.content).toBe(systemPrelude.content);

      // Verify system message was written to storage
      const storagePath = path.join(testProject.paths.root, chat.storage_path);
      const content = await fs.readFile(storagePath, 'utf8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(1);

      const systemMessage = JSON.parse(lines[0]);
      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toBe(systemPrelude.content);
      expect(systemMessage.chat_id).toBe(chat.id);
      expect(systemMessage.project_id).toBe(testProjectId);
    });

    it('should throw ValidationError for invalid project ID', async () => {
      await expect(
        chatService.createChat('invalid-uuid')
      ).rejects.toThrow(chatService.ValidationError);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      const fakeProjectId = '00000000-0000-4000-8000-000000000000';
      await expect(
        chatService.createChat(fakeProjectId)
      ).rejects.toThrow(chatService.NotFoundError);
    });

    it('should throw ValidationError for archived project', async () => {
      // Archive the project
      await projectService.updateProject(testProjectId, { status: 'archived' });

      await expect(
        chatService.createChat(testProjectId)
      ).rejects.toThrow(chatService.ValidationError);
    });

    it('should throw ValidationError for chat name exceeding 200 characters', async () => {
      const longName = 'a'.repeat(201);
      await expect(
        chatService.createChat(testProjectId, { name: longName })
      ).rejects.toThrow(chatService.ValidationError);
    });

    it('should handle empty system prelude content', async () => {
      const chat = await chatService.createChat(testProjectId, {
        system_prelude: { content: '' }
      });

      // Should create chat but not write system message
      const storagePath = path.join(testProject.paths.root, chat.storage_path);
      const content = await fs.readFile(storagePath, 'utf8');
      expect(content).toBe('');
    });
  });

  describe('getChat', () => {
    it('should retrieve existing chat', async () => {
      const createdChat = await chatService.createChat(testProjectId, {
        name: 'Test Chat'
      });

      const retrievedChat = await chatService.getChat(testProjectId, createdChat.id);

      expect(retrievedChat).toBeDefined();
      expect(retrievedChat.id).toBe(createdChat.id);
      expect(retrievedChat.name).toBe('Test Chat');
    });

    it('should throw ValidationError for invalid project ID', async () => {
      await expect(
        chatService.getChat('invalid-uuid', '00000000-0000-4000-8000-000000000000')
      ).rejects.toThrow(chatService.ValidationError);
    });

    it('should throw ValidationError for invalid chat ID', async () => {
      await expect(
        chatService.getChat(testProjectId, 'invalid-uuid')
      ).rejects.toThrow(chatService.ValidationError);
    });

    it('should throw NotFoundError for non-existent chat', async () => {
      const fakeChatId = '00000000-0000-4000-8000-000000000000';
      await expect(
        chatService.getChat(testProjectId, fakeChatId)
      ).rejects.toThrow(chatService.NotFoundError);
    });
  });

  describe('listChats', () => {
    it('should list all chats in project', async () => {
      // Create multiple chats
      await chatService.createChat(testProjectId, { name: 'Chat 1' });
      await chatService.createChat(testProjectId, { name: 'Chat 2' });
      await chatService.createChat(testProjectId, { name: 'Chat 3' });

      const chats = await chatService.listChats(testProjectId);

      expect(chats).toBeDefined();
      expect(chats.length).toBe(3);
      expect(chats[0].name).toBe('Chat 1');
      expect(chats[1].name).toBe('Chat 2');
      expect(chats[2].name).toBe('Chat 3');
    });

    it('should filter chats by status', async () => {
      // Create chats with different statuses
      const chat1 = await chatService.createChat(testProjectId, { name: 'Active Chat' });
      const chat2 = await chatService.createChat(testProjectId, { name: 'Chat to Close' });
      
      // Close one chat
      await chatService.updateChat(testProjectId, chat2.id, { status: 'closed' });

      // List only active chats
      const activeChats = await chatService.listChats(testProjectId, { status: 'active' });
      expect(activeChats.length).toBe(1);
      expect(activeChats[0].id).toBe(chat1.id);

      // List only closed chats
      const closedChats = await chatService.listChats(testProjectId, { status: 'closed' });
      expect(closedChats.length).toBe(1);
      expect(closedChats[0].id).toBe(chat2.id);
    });

    it('should return empty array for project with no chats', async () => {
      const chats = await chatService.listChats(testProjectId);
      expect(chats).toEqual([]);
    });

    it('should throw ValidationError for invalid project ID', async () => {
      await expect(
        chatService.listChats('invalid-uuid')
      ).rejects.toThrow(chatService.ValidationError);
    });
  });

  describe('updateChat', () => {
    it('should update chat name', async () => {
      const chat = await chatService.createChat(testProjectId, { name: 'Original Name' });

      const updatedChat = await chatService.updateChat(testProjectId, chat.id, {
        name: 'Updated Name'
      });

      expect(updatedChat.name).toBe('Updated Name');
      expect(updatedChat.updated_at).not.toBe(chat.updated_at);
    });

    it('should update chat status', async () => {
      const chat = await chatService.createChat(testProjectId);

      const updatedChat = await chatService.updateChat(testProjectId, chat.id, {
        status: 'closed'
      });

      expect(updatedChat.status).toBe('closed');
    });

    it('should throw ValidationError for invalid status', async () => {
      const chat = await chatService.createChat(testProjectId);

      await expect(
        chatService.updateChat(testProjectId, chat.id, { status: 'invalid' })
      ).rejects.toThrow(chatService.ValidationError);
    });

    it('should throw ValidationError for name exceeding 200 characters', async () => {
      const chat = await chatService.createChat(testProjectId);
      const longName = 'a'.repeat(201);

      await expect(
        chatService.updateChat(testProjectId, chat.id, { name: longName })
      ).rejects.toThrow(chatService.ValidationError);
    });

    it('should throw NotFoundError for non-existent chat', async () => {
      const fakeChatId = '00000000-0000-4000-8000-000000000000';
      await expect(
        chatService.updateChat(testProjectId, fakeChatId, { name: 'New Name' })
      ).rejects.toThrow(chatService.NotFoundError);
    });
  });

  describe('deleteChat', () => {
    it('should soft delete chat (archive)', async () => {
      const chat = await chatService.createChat(testProjectId);

      await chatService.deleteChat(testProjectId, chat.id);

      // Chat should still exist but be archived
      const archivedChat = await chatService.getChat(testProjectId, chat.id);
      expect(archivedChat.status).toBe('archived');

      // Storage file should still exist
      const storagePath = path.join(testProject.paths.root, chat.storage_path);
      const fileExists = await fs.access(storagePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should hard delete chat', async () => {
      const chat = await chatService.createChat(testProjectId);
      const storagePath = path.join(testProject.paths.root, chat.storage_path);

      await chatService.deleteChat(testProjectId, chat.id, { hard: true });

      // Chat should not exist in project
      await expect(
        chatService.getChat(testProjectId, chat.id)
      ).rejects.toThrow(chatService.NotFoundError);

      // Storage file should be deleted
      const fileExists = await fs.access(storagePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should throw NotFoundError for non-existent chat', async () => {
      const fakeChatId = '00000000-0000-4000-8000-000000000000';
      await expect(
        chatService.deleteChat(testProjectId, fakeChatId)
      ).rejects.toThrow(chatService.NotFoundError);
    });
  });

  describe('chat-project relationship', () => {
    it('should verify chat belongs to project', async () => {
      const chat = await chatService.createChat(testProjectId);

      expect(chat.project_id).toBe(testProjectId);

      const project = await projectService.getProject(testProjectId);
      const projectChat = project.chats.find(c => c.id === chat.id);
      expect(projectChat).toBeDefined();
      expect(projectChat.project_id).toBe(testProjectId);
    });

    it('should maintain chat list integrity', async () => {
      // Create multiple chats
      const chat1 = await chatService.createChat(testProjectId);
      const chat2 = await chatService.createChat(testProjectId);
      const chat3 = await chatService.createChat(testProjectId);

      const project = await projectService.getProject(testProjectId);
      expect(project.chats.length).toBe(3);

      // Delete one chat
      await chatService.deleteChat(testProjectId, chat2.id, { hard: true });

      const updatedProject = await projectService.getProject(testProjectId);
      expect(updatedProject.chats.length).toBe(2);
      expect(updatedProject.chats.find(c => c.id === chat1.id)).toBeDefined();
      expect(updatedProject.chats.find(c => c.id === chat2.id)).toBeUndefined();
      expect(updatedProject.chats.find(c => c.id === chat3.id)).toBeDefined();
    });
  });

  describe('forkChat', () => {
    let messageService;
    let testChat;
    let testMessages;

    beforeEach(async () => {
      messageService = require('../../src/services/messageService');
      const { v4: uuidv4 } = require('uuid');
      
      // Create a chat with messages for forking tests
      testChat = await chatService.createChat(testProjectId, {
        name: 'Original Chat'
      });

      // Add several messages with required id field
      testMessages = [];
      const roles = ['user', 'assistant', 'user', 'assistant', 'user'];
      const contents = ['Hello', 'Hi there!', 'How are you?', 'I am fine.', 'Great!'];
      
      for (let i = 0; i < roles.length; i++) {
        const msg = await messageService.saveMessage(testProjectId, testChat.id, {
          id: uuidv4(),
          role: roles[i],
          content: contents[i],
          include_in_context: true
        });
        testMessages.push(msg);
      }
    });

    it('should fork entire chat with all messages', async () => {
      const forkedChat = await chatService.forkChat(testProjectId, testChat.id);

      expect(forkedChat).toBeDefined();
      expect(forkedChat.id).not.toBe(testChat.id);
      expect(forkedChat.name).toBe('Fork of Original Chat');
      expect(forkedChat.forked_from_chat_id).toBe(testChat.id);
      expect(forkedChat.message_count).toBe(testMessages.length);

      // Verify messages were copied
      const forkedMessages = await messageService.listMessages(testProjectId, forkedChat.id);
      expect(forkedMessages.length).toBe(testMessages.length);

      // Verify message content matches
      for (let i = 0; i < testMessages.length; i++) {
        expect(forkedMessages[i].content).toBe(testMessages[i].content);
        expect(forkedMessages[i].role).toBe(testMessages[i].role);
        // IDs should be different
        expect(forkedMessages[i].id).not.toBe(testMessages[i].id);
      }
    });

    it('should fork with custom name', async () => {
      const forkedChat = await chatService.forkChat(testProjectId, testChat.id, {
        name: 'My Custom Fork'
      });

      expect(forkedChat.name).toBe('My Custom Fork');
    });

    it('should fork from specific message point', async () => {
      // Fork from the 3rd message (index 2)
      const forkPointMessage = testMessages[2];
      const forkedChat = await chatService.forkChat(testProjectId, testChat.id, {
        fromMessageId: forkPointMessage.id
      });

      expect(forkedChat.forked_at_message_id).toBe(forkPointMessage.id);
      // Should have messages 0, 1, 2 (3 messages)
      expect(forkedChat.message_count).toBe(3);

      // Verify only first 3 messages were copied
      const forkedMessages = await messageService.listMessages(testProjectId, forkedChat.id);
      expect(forkedMessages.length).toBe(3);
      expect(forkedMessages[0].content).toBe('Hello');
      expect(forkedMessages[1].content).toBe('Hi there!');
      expect(forkedMessages[2].content).toBe('How are you?');
    });

    it('should fork with pruning - exclude discarded messages', async () => {
      // Mark a message as discarded
      await messageService.updateMessageFlags(testProjectId, testChat.id, testMessages[1].id, {
        is_discarded: true
      });

      const forkedChat = await chatService.forkChat(testProjectId, testChat.id, {
        prune: true
      });

      // Should have 4 messages (5 total - 1 discarded)
      expect(forkedChat.message_count).toBe(4);

      // Verify discarded message was excluded
      const forkedMessages = await messageService.listMessages(testProjectId, forkedChat.id);
      const contents = forkedMessages.map(m => m.content);
      expect(contents).not.toContain('Hi there!');
      expect(contents).toContain('Hello');
      expect(contents).toContain('How are you?');
    });

    it('should fork with pruning - exclude context-excluded messages', async () => {
      // Mark a message as excluded from context
      await messageService.updateMessageFlags(testProjectId, testChat.id, testMessages[2].id, {
        include_in_context: false
      });

      const forkedChat = await chatService.forkChat(testProjectId, testChat.id, {
        prune: true
      });

      // Should have 4 messages (5 total - 1 excluded)
      expect(forkedChat.message_count).toBe(4);

      const forkedMessages = await messageService.listMessages(testProjectId, forkedChat.id);
      const contents = forkedMessages.map(m => m.content);
      expect(contents).not.toContain('How are you?');
    });

    it('should set forked_from metadata correctly', async () => {
      const forkedChat = await chatService.forkChat(testProjectId, testChat.id);

      expect(forkedChat.forked_from_chat_id).toBe(testChat.id);
      expect(forkedChat.project_id).toBe(testProjectId);
    });

    it('should not modify original chat', async () => {
      const originalMessages = await messageService.listMessages(testProjectId, testChat.id);
      
      await chatService.forkChat(testProjectId, testChat.id, { prune: true });

      // Original chat should be unchanged
      const afterForkMessages = await messageService.listMessages(testProjectId, testChat.id);
      expect(afterForkMessages.length).toBe(originalMessages.length);
      
      const originalChat = await chatService.getChat(testProjectId, testChat.id);
      expect(originalChat.name).toBe('Original Chat');
    });

    it('should throw NotFoundError for invalid message ID', async () => {
      await expect(
        chatService.forkChat(testProjectId, testChat.id, {
          fromMessageId: 'non-existent-message-id'
        })
      ).rejects.toThrow('Message not found');
    });

    it('should throw NotFoundError for invalid chat ID', async () => {
      await expect(
        chatService.forkChat(testProjectId, '00000000-0000-4000-8000-000000000000')
      ).rejects.toThrow('Chat not found');
    });

    it('should throw ValidationError for invalid project ID', async () => {
      await expect(
        chatService.forkChat('invalid-id', testChat.id)
      ).rejects.toThrow('Invalid project ID format');
    });
  });
});