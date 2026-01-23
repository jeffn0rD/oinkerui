/**
 * Streaming Service Tests
 * 
 * Tests for LLM response streaming functionality
 */

const path = require('path');

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.WORKSPACE_ROOT = path.join(__dirname, '../../test_workspace_stream');
process.env.OPENROUTER_API_KEY = 'test-key-for-validation';

const llmService = require('../../src/services/llmService');

describe('LLM Streaming Service', () => {
  describe('Active Request Management', () => {
    const testChatId = 'test-chat-123';

    afterEach(() => {
      // Clean up any active requests
      llmService.unregisterActiveRequest(testChatId);
    });

    it('should register an active request', () => {
      const controller = new AbortController();
      const requestId = 'req-123';

      llmService.registerActiveRequest(testChatId, requestId, controller);

      const activeRequest = llmService.getActiveRequest(testChatId);
      expect(activeRequest).toBeDefined();
      expect(activeRequest.requestId).toBe(requestId);
      expect(activeRequest.controller).toBe(controller);
      expect(activeRequest.startTime).toBeDefined();
    });

    it('should unregister an active request', () => {
      const controller = new AbortController();
      llmService.registerActiveRequest(testChatId, 'req-123', controller);

      llmService.unregisterActiveRequest(testChatId);

      const activeRequest = llmService.getActiveRequest(testChatId);
      expect(activeRequest).toBeNull();
    });

    it('should return null for non-existent request', () => {
      const activeRequest = llmService.getActiveRequest('non-existent-chat');
      expect(activeRequest).toBeNull();
    });

    it('should cancel an active request', () => {
      const controller = new AbortController();
      llmService.registerActiveRequest(testChatId, 'req-123', controller);

      const cancelled = llmService.cancelActiveRequest(testChatId);

      expect(cancelled).toBe(true);
      expect(controller.signal.aborted).toBe(true);
      expect(llmService.getActiveRequest(testChatId)).toBeNull();
    });

    it('should return false when cancelling non-existent request', () => {
      const cancelled = llmService.cancelActiveRequest('non-existent-chat');
      expect(cancelled).toBe(false);
    });

    it('should track multiple active requests', () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();

      llmService.registerActiveRequest('chat-1', 'req-1', controller1);
      llmService.registerActiveRequest('chat-2', 'req-2', controller2);

      expect(llmService.getActiveRequest('chat-1')).toBeDefined();
      expect(llmService.getActiveRequest('chat-2')).toBeDefined();

      llmService.cancelActiveRequest('chat-1');
      expect(llmService.getActiveRequest('chat-1')).toBeNull();
      expect(llmService.getActiveRequest('chat-2')).toBeDefined();

      llmService.unregisterActiveRequest('chat-2');
    });
  });

  describe('streamLLMResponse validation', () => {
    it('should throw ValidationError for missing model', async () => {
      const generator = llmService.streamLLMResponse({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      await expect(generator.next()).rejects.toThrow(llmService.ValidationError);
    });

    it('should throw ValidationError for missing messages', async () => {
      const generator = llmService.streamLLMResponse({
        model: 'openai/gpt-4'
      });

      await expect(generator.next()).rejects.toThrow(llmService.ValidationError);
    });

    it('should throw ValidationError for empty messages array', async () => {
      const generator = llmService.streamLLMResponse({
        model: 'openai/gpt-4',
        messages: []
      });

      await expect(generator.next()).rejects.toThrow(llmService.ValidationError);
    });
  });

  describe('Streaming exports', () => {
    it('should export streaming functions', () => {
      expect(typeof llmService.streamLLMResponse).toBe('function');
      expect(typeof llmService.sendLLMMessageStream).toBe('function');
      expect(typeof llmService.registerActiveRequest).toBe('function');
      expect(typeof llmService.unregisterActiveRequest).toBe('function');
      expect(typeof llmService.getActiveRequest).toBe('function');
      expect(typeof llmService.cancelActiveRequest).toBe('function');
    });

    it('should export error classes', () => {
      expect(llmService.ValidationError).toBeDefined();
      expect(llmService.ConfigError).toBeDefined();
      expect(llmService.LLMError).toBeDefined();
      expect(llmService.TimeoutError).toBeDefined();
    });
  });
});