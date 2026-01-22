'use strict';

/**
 * LLM Service Tests
 * 
 * Tests for callLLM and constructContext functions
 * Spec: spec/functions/backend_node/call_llm.yaml
 * Spec: spec/functions/backend_node/construct_context.yaml
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const axios = require('axios');

// Mock axios
jest.mock('axios');

const llmService = require('../../src/services/llmService');
const projectService = require('../../src/services/projectService');
const chatService = require('../../src/services/chatService');

describe('LLM Service', () => {
  let testWorkspaceRoot;
  let testProjectId;
  let testChatId;

  beforeEach(async () => {
    // Create temporary workspace for testing
    testWorkspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'oinkerui-llm-test-'));
    
    // Reset config with test workspace
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
    
    // Reset axios mock
    axios.post.mockReset();
  });

  afterEach(async () => {
    // Cleanup test workspace
    try {
      await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup test workspace:', error);
    }
  });

  describe('callLLM', () => {
    it('should make successful LLM call', async () => {
      // Mock successful response
      axios.post.mockResolvedValueOnce({
        data: {
          id: 'chatcmpl-123',
          model: 'openai/gpt-4',
          choices: [{
            message: { content: 'Hello! How can I help you?' },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 8,
            total_tokens: 18
          }
        }
      });

      const response = await llmService.callLLM({
        model: 'openai/gpt-4',
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(response.content).toBe('Hello! How can I help you?');
      expect(response.model).toBe('openai/gpt-4');
      expect(response.usage.total_tokens).toBe(18);
      expect(response.request_id).toBe('chatcmpl-123');
      expect(response.finish_reason).toBe('stop');
      expect(response.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it('should throw ValidationError for missing model', async () => {
      await expect(
        llmService.callLLM({
          messages: [{ role: 'user', content: 'Hello' }]
        })
      ).rejects.toThrow(llmService.ValidationError);
    });

    it('should throw ValidationError for empty messages', async () => {
      await expect(
        llmService.callLLM({
          model: 'openai/gpt-4',
          messages: []
        })
      ).rejects.toThrow(llmService.ValidationError);
    });

    it('should throw ValidationError for missing messages', async () => {
      await expect(
        llmService.callLLM({
          model: 'openai/gpt-4'
        })
      ).rejects.toThrow(llmService.ValidationError);
    });

    it('should throw ValidationError for invalid message format', async () => {
      await expect(
        llmService.callLLM({
          model: 'openai/gpt-4',
          messages: [{ content: 'Hello' }] // Missing role
        })
      ).rejects.toThrow(llmService.ValidationError);
    });

    it('should throw ValidationError for invalid max_tokens', async () => {
      await expect(
        llmService.callLLM({
          model: 'openai/gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: -1
        })
      ).rejects.toThrow(llmService.ValidationError);
    });

    it('should throw ValidationError for invalid temperature', async () => {
      await expect(
        llmService.callLLM({
          model: 'openai/gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 3.0
        })
      ).rejects.toThrow(llmService.ValidationError);
    });

    it('should handle timeout error', async () => {
      // Mock timeout error
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';
      axios.post.mockRejectedValue(timeoutError);

      await expect(
        llmService.callLLM({
          model: 'openai/gpt-4',
          messages: [{ role: 'user', content: 'Hello' }]
        }, { maxRetries: 1 })
      ).rejects.toThrow(llmService.TimeoutError);
    });

    it('should handle rate limit error (429)', async () => {
      // Mock 429 response
      const rateLimitError = new Error('Rate limit');
      rateLimitError.response = {
        status: 429,
        headers: { 'retry-after': '60' },
        data: { error: { message: 'Rate limit exceeded' } }
      };
      axios.post.mockRejectedValue(rateLimitError);

      await expect(
        llmService.callLLM({
          model: 'openai/gpt-4',
          messages: [{ role: 'user', content: 'Hello' }]
        })
      ).rejects.toThrow(llmService.RateLimitError);
    });

    it('should handle authentication error (401)', async () => {
      // Mock 401 response
      const authError = new Error('Unauthorized');
      authError.response = {
        status: 401,
        data: { error: { message: 'Invalid API key' } }
      };
      axios.post.mockRejectedValue(authError);

      await expect(
        llmService.callLLM({
          model: 'openai/gpt-4',
          messages: [{ role: 'user', content: 'Hello' }]
        })
      ).rejects.toThrow(llmService.AuthenticationError);
    });

    it('should handle generic LLM error (4xx)', async () => {
      // Mock 400 response
      const badRequestError = new Error('Bad request');
      badRequestError.response = {
        status: 400,
        data: { error: { message: 'Invalid model' } }
      };
      axios.post.mockRejectedValue(badRequestError);

      await expect(
        llmService.callLLM({
          model: 'invalid-model',
          messages: [{ role: 'user', content: 'Hello' }]
        })
      ).rejects.toThrow(llmService.LLMError);
    });

    it('should include optional parameters in request', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          id: 'chatcmpl-123',
          model: 'openai/gpt-4',
          choices: [{
            message: { content: '{"result": "test"}' },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        }
      });

      await llmService.callLLM({
        model: 'openai/gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 100,
        temperature: 0.7,
        output_format: 'json'
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'openai/gpt-4',
          max_tokens: 100,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
        expect.any(Object)
      );
    });

    it('should set correct headers', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          id: 'chatcmpl-123',
          model: 'openai/gpt-4',
          choices: [{
            message: { content: 'Hello!' },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
        }
      });

      await llmService.callLLM({
        model: 'openai/gpt-4',
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
            'X-Title': 'OinkerUI'
          })
        })
      );
    });
  });

  describe('constructContext', () => {
    let testProject;
    let testChat;

    beforeEach(async () => {
      // Create a test project
      testProject = await projectService.createProject('Test LLM Project');
      testProjectId = testProject.id;

      // Create a test chat
      testChat = await chatService.createChat(testProjectId, {
        name: 'Test Chat'
      });
      testChatId = testChat.id;
    });

    it('should include system prelude first', async () => {
      // Create chat with system prelude
      const chatWithPrelude = {
        ...testChat,
        project_id: testProjectId,
        system_prelude: {
          content: 'You are a helpful assistant'
        }
      };

      const context = await llmService.constructContext(
        chatWithPrelude,
        { role: 'user', content: 'Hello' }
      );

      expect(context[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant'
      });
      expect(context[context.length - 1]).toEqual({
        role: 'user',
        content: 'Hello'
      });
    });

    it('should include current message last', async () => {
      const context = await llmService.constructContext(
        { ...testChat, project_id: testProjectId },
        { role: 'user', content: 'Current message' }
      );

      expect(context[context.length - 1]).toEqual({
        role: 'user',
        content: 'Current message'
      });
    });

    it('should exclude discarded messages', async () => {
      // Write messages to chat storage
      const storagePath = path.join(testProject.paths.root, testChat.storage_path);
      const messages = [
        { id: '1', role: 'user', content: 'Message 1', is_discarded: false, include_in_context: true, created_at: new Date().toISOString() },
        { id: '2', role: 'assistant', content: 'Message 2', is_discarded: true, include_in_context: true, created_at: new Date().toISOString() }
      ];
      await fs.writeFile(storagePath, messages.map(m => JSON.stringify(m)).join('\n'));

      const context = await llmService.constructContext(
        { ...testChat, project_id: testProjectId },
        { role: 'user', content: 'Current' }
      );

      // Should have Message 1 and Current, but not Message 2
      expect(context.some(c => c.content === 'Message 1')).toBe(true);
      expect(context.some(c => c.content === 'Message 2')).toBe(false);
      expect(context.some(c => c.content === 'Current')).toBe(true);
    });

    it('should always include pinned messages', async () => {
      const storagePath = path.join(testProject.paths.root, testChat.storage_path);
      const messages = [
        { id: '1', role: 'user', content: 'Important pinned', is_pinned: true, include_in_context: true, created_at: new Date().toISOString() },
        { id: '2', role: 'assistant', content: 'Regular message', is_pinned: false, include_in_context: true, created_at: new Date().toISOString() }
      ];
      await fs.writeFile(storagePath, messages.map(m => JSON.stringify(m)).join('\n'));

      const context = await llmService.constructContext(
        { ...testChat, project_id: testProjectId },
        { role: 'user', content: 'Current' }
      );

      expect(context.some(c => c.content === 'Important pinned')).toBe(true);
    });

    it('should exclude aside messages unless pinned', async () => {
      const storagePath = path.join(testProject.paths.root, testChat.storage_path);
      const messages = [
        { id: '1', role: 'user', content: 'Aside not pinned', is_aside: true, is_pinned: false, include_in_context: true, created_at: new Date().toISOString() },
        { id: '2', role: 'user', content: 'Aside but pinned', is_aside: true, is_pinned: true, include_in_context: true, created_at: new Date().toISOString() }
      ];
      await fs.writeFile(storagePath, messages.map(m => JSON.stringify(m)).join('\n'));

      const context = await llmService.constructContext(
        { ...testChat, project_id: testProjectId },
        { role: 'user', content: 'Current' }
      );

      expect(context.some(c => c.content === 'Aside not pinned')).toBe(false);
      expect(context.some(c => c.content === 'Aside but pinned')).toBe(true);
    });

    it('should maintain chronological order', async () => {
      const storagePath = path.join(testProject.paths.root, testChat.storage_path);
      const now = new Date();
      const messages = [
        { id: '1', role: 'user', content: 'First', include_in_context: true, created_at: new Date(now.getTime() - 2000).toISOString() },
        { id: '2', role: 'assistant', content: 'Second', include_in_context: true, created_at: new Date(now.getTime() - 1000).toISOString() },
        { id: '3', role: 'user', content: 'Third', include_in_context: true, created_at: now.toISOString() }
      ];
      await fs.writeFile(storagePath, messages.map(m => JSON.stringify(m)).join('\n'));

      const context = await llmService.constructContext(
        { ...testChat, project_id: testProjectId },
        { role: 'user', content: 'Current' }
      );

      // Find indices
      const firstIdx = context.findIndex(c => c.content === 'First');
      const secondIdx = context.findIndex(c => c.content === 'Second');
      const thirdIdx = context.findIndex(c => c.content === 'Third');
      const currentIdx = context.findIndex(c => c.content === 'Current');

      expect(firstIdx).toBeLessThan(secondIdx);
      expect(secondIdx).toBeLessThan(thirdIdx);
      expect(thirdIdx).toBeLessThan(currentIdx);
    });

    it('should handle empty chat', async () => {
      const context = await llmService.constructContext(
        { ...testChat, project_id: testProjectId },
        { role: 'user', content: 'First message' }
      );

      expect(context.length).toBe(1);
      expect(context[0]).toEqual({
        role: 'user',
        content: 'First message'
      });
    });

    it('should throw ValidationError for missing chat', async () => {
      await expect(
        llmService.constructContext(null, { role: 'user', content: 'Hello' })
      ).rejects.toThrow(llmService.ValidationError);
    });

    it('should throw ValidationError for missing current message', async () => {
      await expect(
        llmService.constructContext({ ...testChat, project_id: testProjectId }, null)
      ).rejects.toThrow(llmService.ValidationError);
    });

    it('should throw ValidationError for message without content', async () => {
      await expect(
        llmService.constructContext(
          { ...testChat, project_id: testProjectId },
          { role: 'user' }
        )
      ).rejects.toThrow(llmService.ValidationError);
    });
  });

  describe('countTokens', () => {
    it('should estimate tokens for text', () => {
      // ~4 chars per token
      const text = 'Hello world'; // 11 chars
      const tokens = llmService.countTokens(text);
      expect(tokens).toBe(3); // ceil(11/4) = 3
    });

    it('should return 0 for empty text', () => {
      expect(llmService.countTokens('')).toBe(0);
      expect(llmService.countTokens(null)).toBe(0);
      expect(llmService.countTokens(undefined)).toBe(0);
    });

    it('should handle long text', () => {
      const text = 'a'.repeat(1000);
      const tokens = llmService.countTokens(text);
      expect(tokens).toBe(250); // ceil(1000/4) = 250
    });
  });
});