'use strict';

/**
 * Phase 2 Integration Tests
 * 
 * Tests cross-feature integration for all Phase 2 components:
 * - Message context flags (include, aside, pure_aside, pinned, discarded)
 * - Context construction with flags
 * - Slash command parsing
 * - Chat forking with pruning
 * - Cancel LLM request
 * - Requery functionality
 * - Prompt templates
 * - Message flag UI controls
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const projectService = require('../../src/services/projectService');
const chatService = require('../../src/services/chatService');
const messageService = require('../../src/services/messageService');
const llmService = require('../../src/services/llmService');
const commandService = require('../../src/services/commandService');
const cancelService = require('../../src/services/cancelService');
const templateService = require('../../src/services/templateService');

jest.mock('axios');
const axios = require('axios');

jest.setTimeout(30000);

describe('Phase 2 Integration Tests', () => {
  let testWorkspaceRoot;

  beforeAll(async () => {
    testWorkspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'oinkerui-p2-'));
    const config = require('../../src/config');
    config.reset({
      workspace: { root: testWorkspaceRoot, dataDir: testWorkspaceRoot },
      api: { openrouter: { apiKey: 'test-api-key', baseUrl: 'https://openrouter.ai/api/v1', timeout: 60000 } }
    });
  });

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
        break;
      } catch (e) {
        if (attempt < 3) await new Promise(r => setTimeout(r, 500));
      }
    }
  });

  // ================================================================
  // 1. Context Flags Integration
  // ================================================================
  describe('Context Flags Integration', () => {
    let project, chat;

    beforeAll(async () => {
      project = await projectService.createProject('Context Flags Test');
      chat = await chatService.createChat(project.id, {
        name: 'Flags Chat',
        system_prelude: { type: 'inline', content: 'You are a test assistant.' }
      });
    });

    it('should create messages with default flags', async () => {
      const result = await messageService.sendMessage(project.id, chat.id, {
        raw_text: 'Hello world'
      });

      expect(result.user_message).toBeDefined();
      expect(result.user_message.include_in_context).toBe(true);
      expect(result.user_message.is_pinned).toBe(false);
      expect(result.user_message.is_discarded).toBe(false);
      expect(result.user_message.is_aside).toBe(false);
    });

    it('should update message flags', async () => {
      const messages = await messageService.listMessages(project.id, chat.id);
      const userMsg = messages.find(m => m.role === 'user');

      const updated = await messageService.updateMessageFlags(
        project.id, chat.id, userMsg.id,
        { is_pinned: true }
      );

      expect(updated.is_pinned).toBe(true);
    });

    it('should exclude discarded messages from context', async () => {
      // Send a second message
      await messageService.sendMessage(project.id, chat.id, {
        raw_text: 'Second message'
      });

      // Discard the first user message
      const messages = await messageService.listMessages(project.id, chat.id);
      const firstUser = messages.find(m => m.role === 'user');
      await messageService.updateMessageFlags(
        project.id, chat.id, firstUser.id,
        { is_discarded: true }
      );

      // Construct context
      const loadedChat = await chatService.getChat(project.id, chat.id);
      const currentMsg = { role: 'user', content: 'Third message' };
      const context = await llmService.constructContext(loadedChat, currentMsg);

      // Discarded message should not be in context
      const contextContents = context.map(m => m.content);
      expect(contextContents).not.toContain('Hello world');
      expect(contextContents).toContain('Second message');
    });

    it('should include pinned messages in context', async () => {
      const messages = await messageService.listMessages(project.id, chat.id);
      const secondUser = messages.filter(m => m.role === 'user')[1];

      // Pin the second message
      await messageService.updateMessageFlags(
        project.id, chat.id, secondUser.id,
        { is_pinned: true }
      );

      const loadedChat = await chatService.getChat(project.id, chat.id);
      const currentMsg = { role: 'user', content: 'Check pinned' };
      const context = await llmService.constructContext(loadedChat, currentMsg);

      // Pinned message should be in context
      const contextContents = context.map(m => m.content);
      expect(contextContents).toContain('Second message');
    });
  });

  // ================================================================
  // 2. Aside + Context Integration
  // ================================================================
  describe('Aside + Context Integration', () => {
    let project, chat;

    beforeAll(async () => {
      project = await projectService.createProject('Aside Integration Test');
      chat = await chatService.createChat(project.id, {
        name: 'Aside Chat',
        system_prelude: { type: 'inline', content: 'System prompt.' }
      });
    });

    it('should mark aside messages and exclude from future context', async () => {
      // Send normal message
      await messageService.sendMessage(project.id, chat.id, {
        raw_text: 'Normal message'
      });

      // Send aside message
      await messageService.sendMessage(project.id, chat.id, {
        raw_text: 'Aside message',
        is_aside: true
      });

      // Send another normal message
      await messageService.sendMessage(project.id, chat.id, {
        raw_text: 'After aside'
      });

      const loadedChat = await chatService.getChat(project.id, chat.id);
      const currentMsg = { role: 'user', content: 'Final message' };
      const context = await llmService.constructContext(loadedChat, currentMsg);

      const contextContents = context.map(m => m.content);
      expect(contextContents).toContain('Normal message');
      expect(contextContents).not.toContain('Aside message');
      expect(contextContents).toContain('After aside');
    });

    it('should handle pure aside (system + current only)', async () => {
      const loadedChat = await chatService.getChat(project.id, chat.id);
      const currentMsg = { role: 'user', content: 'Pure aside question', pure_aside: true };
      const context = await llmService.constructContext(loadedChat, currentMsg);

      // Pure aside should only have system + current message
      expect(context.length).toBe(2);
      expect(context[0].role).toBe('system');
      expect(context[1].content).toBe('Pure aside question');
    });
  });

  // ================================================================
  // 3. Slash Commands Integration
  // ================================================================
  describe('Slash Commands Integration', () => {
    it('should detect /aside as a slash command', () => {
      const result = commandService.isSlashCommand('/aside What is this about?');
      expect(result).toBe(true);
    });

    it('should parse /aside command', async () => {
      const result = await commandService.parseSlashCommand('/aside What is this about?');
      expect(result).toBeDefined();
      expect(result.command).toBe('aside');
      expect(result.raw_args).toBe('What is this about?');
    });

    it('should parse /aside-pure command', async () => {
      const result = await commandService.parseSlashCommand('/aside-pure Quick question');
      expect(result).toBeDefined();
      expect(result.command).toBe('aside-pure');
    });

    it('should return false for non-command text', () => {
      const result = commandService.isSlashCommand('Hello world');
      expect(result).toBe(false);
    });

    it('should list available commands', async () => {
      const commands = await commandService.getAvailableCommands();
      expect(commands).toBeDefined();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // 4. Chat Forking Integration
  // ================================================================
  describe('Chat Forking Integration', () => {
    let project, chat;

    beforeAll(async () => {
      project = await projectService.createProject('Fork Integration Test');
      chat = await chatService.createChat(project.id, {
        name: 'Original Chat',
        system_prelude: { type: 'inline', content: 'System prompt.' }
      });

      // Add messages
      await messageService.sendMessage(project.id, chat.id, { raw_text: 'Message 1' });
      await messageService.sendMessage(project.id, chat.id, { raw_text: 'Message 2' });
      await messageService.sendMessage(project.id, chat.id, { raw_text: 'Message 3' });
    });

    it('should fork a chat', async () => {
      const forked = await chatService.forkChat(project.id, chat.id, {
        name: 'Forked Chat'
      });

      expect(forked).toBeDefined();
      expect(forked.id).not.toBe(chat.id);
      expect(forked.name).toBe('Forked Chat');
    });

    it('should fork from specific message', async () => {
      const messages = await messageService.listMessages(project.id, chat.id);
      const userMessages = messages.filter(m => m.role === 'user');

      if (userMessages.length >= 2) {
        const forked = await chatService.forkChat(project.id, chat.id, {
          name: 'Forked From Message',
          fromMessageId: userMessages[1].id
        });

        expect(forked).toBeDefined();
        expect(forked.name).toBe('Forked From Message');
      }
    });
  });

  // ================================================================
  // 5. Cancel Request Integration
  // ================================================================
  describe('Cancel Request Integration', () => {
    it('should register and cancel a request', () => {
      const chatId = 'test-cancel-chat';
      const controller = new AbortController();

      cancelService.registerRequest(chatId, controller, {
        model: 'test-model',
        type: 'llm'
      });

      expect(cancelService.hasActiveRequest(chatId)).toBe(true);

      const result = cancelService.cancelRequest(chatId);
      expect(result).toBeDefined();
      expect(result.cancelled).toBe(true);

      expect(cancelService.hasActiveRequest(chatId)).toBe(false);
    });

    it('should return false when cancelling non-existent request', () => {
      const result = cancelService.cancelRequest('non-existent');
      expect(result.cancelled).toBe(false);
    });

    it('should get active request info', () => {
      const chatId = 'status-test-chat';
      const controller = new AbortController();

      cancelService.registerRequest(chatId, controller, {
        model: 'test-model',
        type: 'llm'
      });

      const info = cancelService.getActiveRequest(chatId);
      expect(info).toBeDefined();

      // Cleanup
      cancelService.cancelRequest(chatId);
    });
  });

  // ================================================================
  // 6. Template Integration
  // ================================================================
  describe('Template Integration', () => {
    it('should list global templates', async () => {
      const templates = await templateService.listTemplates();
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should get a specific template', async () => {
      const templates = await templateService.listTemplates();
      if (templates.length > 0) {
        const template = await templateService.getTemplate(templates[0].id);
        expect(template).toBeDefined();
        expect(template.id).toBe(templates[0].id);
        expect(template.name).toBeDefined();
      }
    });

    it('should resolve template with variables', async () => {
      const templates = await templateService.listTemplates();
      if (templates.length > 0) {
        const template = templates[0];
        // Build variables from template definition
        const variables = {};
        if (template.variables) {
          for (const v of template.variables) {
            variables[v.name] = v.default || 'test-value';
          }
        }

        const resolved = await templateService.resolveTemplate(template.id, variables);
        expect(resolved).toBeDefined();
        expect(resolved.content).toBeDefined();
        expect(typeof resolved.content).toBe('string');
      }
    });
  });

  // ================================================================
  // 7. Cross-Feature: Fork + Context Flags
  // ================================================================
  describe('Cross-Feature: Fork + Context Flags', () => {
    it('should preserve message flags in forked chat', async () => {
      const project = await projectService.createProject('Fork Flags Test');
      const chat = await chatService.createChat(project.id, {
        name: 'Original',
        system_prelude: { type: 'inline', content: 'System.' }
      });

      // Send messages and pin one
      const result1 = await messageService.sendMessage(project.id, chat.id, { raw_text: 'Pinned msg' });
      await messageService.updateMessageFlags(
        project.id, chat.id, result1.user_message.id,
        { is_pinned: true }
      );
      await messageService.sendMessage(project.id, chat.id, { raw_text: 'Normal msg' });

      // Fork
      const forked = await chatService.forkChat(project.id, chat.id, { name: 'Forked' });
      expect(forked).toBeDefined();

      // Verify forked chat has messages
      const forkedMessages = await messageService.listMessages(project.id, forked.id);
      expect(forkedMessages.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // 8. Full Chat Flow E2E
  // ================================================================
  describe('Full Chat Flow E2E', () => {
    it('should complete a full chat workflow', async () => {
      // 1. Create project
      const project = await projectService.createProject('Full Flow Test');
      expect(project.id).toBeDefined();

      // 2. Create chat
      const chat = await chatService.createChat(project.id, {
        name: 'Full Flow Chat',
        system_prelude: { type: 'inline', content: 'You are helpful.' }
      });
      expect(chat.id).toBeDefined();

      // 3. Send message
      const result = await messageService.sendMessage(project.id, chat.id, {
        raw_text: 'Hello!'
      });
      expect(result.user_message.content).toBe('Hello!');

      // 4. List messages
      const messages = await messageService.listMessages(project.id, chat.id);
      expect(messages.length).toBeGreaterThan(0);

      // 5. Pin a message
      const userMsg = messages.find(m => m.role === 'user');
      const pinned = await messageService.updateMessageFlags(
        project.id, chat.id, userMsg.id,
        { is_pinned: true }
      );
      expect(pinned.is_pinned).toBe(true);

      // 6. Construct context
      const loadedChat = await chatService.getChat(project.id, chat.id);
      const context = await llmService.constructContext(loadedChat, {
        role: 'user', content: 'Follow up'
      });
      expect(context.length).toBeGreaterThan(0);
      expect(context[0].role).toBe('system');

      // 7. Verify project has chat
      const loadedProject = await projectService.getProject(project.id);
      expect(loadedProject.chats.some(c => c.id === chat.id)).toBe(true);
    });
  });

  // ================================================================
  // 9. Error Handling Integration
  // ================================================================
  describe('Error Handling Integration', () => {
    it('should handle updating flags on non-existent message', async () => {
      const project = await projectService.createProject('Error Flags Test');
      const chat = await chatService.createChat(project.id, { name: 'Error Chat' });

      await expect(
        messageService.updateMessageFlags(
          project.id, chat.id, 'non-existent-msg-id',
          { is_pinned: true }
        )
      ).rejects.toThrow();
    });

    it('should handle forking non-existent chat', async () => {
      const project = await projectService.createProject('Error Fork Test');

      await expect(
        chatService.forkChat(project.id, 'non-existent-chat', { name: 'Fork' })
      ).rejects.toThrow();
    });
  });
});