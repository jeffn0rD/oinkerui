/**
 * Streaming Service Tests
 * 
 * Tests for LLM response streaming functionality
 * 
 * Note: Active request management has been moved to cancelService
 */

const path = require('path');

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.WORKSPACE_ROOT = path.join(__dirname, '../../test_workspace_stream');
process.env.OPENROUTER_API_KEY = 'test-key-for-validation';

const llmService = require('../../src/services/llmService');
const cancelService = require('../../src/services/cancelService');

describe('LLM Streaming Service', () => {
  describe('Active Request Management (via cancelService)', () => {
    const testChatId = 'test-chat-123';

    afterEach(() => {
      // Clean up any active requests
      cancelService.unregisterRequest(testChatId);
      cancelService.unregisterRequest('chat-1');
      cancelService.unregisterRequest('chat-2');
    });

    it('should register an active request', () => {
      const { requestId, controller, signal } = cancelService.registerRequest(testChatId, {
        type: 'llm',
        timeout: 0 // Disable timeout for tests
      });

      expect(requestId).toBeDefined();
      expect(controller).toBeDefined();
      expect(signal).toBeDefined();

      const activeRequest = cancelService.getActiveRequest(testChatId);
      expect(activeRequest).toBeDefined();
      expect(activeRequest.requestId).toBe(requestId);
      expect(activeRequest.type).toBe('llm');
      expect(activeRequest.startedAt).toBeDefined();
    });

    it('should unregister an active request', () => {
      cancelService.registerRequest(testChatId, { timeout: 0 });

      cancelService.unregisterRequest(testChatId);

      const activeRequest = cancelService.getActiveRequest(testChatId);
      expect(activeRequest).toBeNull();
    });

    it('should return null for non-existent request', () => {
      const activeRequest = cancelService.getActiveRequest('non-existent-chat');
      expect(activeRequest).toBeNull();
    });

    it('should cancel an active request', () => {
      const { controller } = cancelService.registerRequest(testChatId, { timeout: 0 });

      const result = cancelService.cancelRequest(testChatId);

      expect(result.cancelled).toBe(true);
      expect(result.requestType).toBe('llm');
      expect(controller.signal.aborted).toBe(true);
      expect(cancelService.getActiveRequest(testChatId)).toBeNull();
    });

    it('should return cancelled=false when cancelling non-existent request', () => {
      const result = cancelService.cancelRequest('non-existent-chat');
      expect(result.cancelled).toBe(false);
    });

    it('should track multiple active requests', () => {
      cancelService.registerRequest('chat-1', { timeout: 0 });
      cancelService.registerRequest('chat-2', { timeout: 0 });

      expect(cancelService.getActiveRequest('chat-1')).toBeDefined();
      expect(cancelService.getActiveRequest('chat-2')).toBeDefined();

      cancelService.cancelRequest('chat-1');
      expect(cancelService.getActiveRequest('chat-1')).toBeNull();
      expect(cancelService.getActiveRequest('chat-2')).toBeDefined();

      cancelService.unregisterRequest('chat-2');
    });

    it('should track partial responses', () => {
      cancelService.registerRequest(testChatId, { timeout: 0 });
      
      cancelService.updatePartialResponse(testChatId, 'Hello ');
      cancelService.updatePartialResponse(testChatId, 'World');
      
      const partial = cancelService.getPartialResponse(testChatId);
      expect(partial).toBe('Hello World');
    });

    it('should return partial response on cancel', () => {
      cancelService.registerRequest(testChatId, { timeout: 0 });
      cancelService.updatePartialResponse(testChatId, 'Partial content');
      
      const result = cancelService.cancelRequest(testChatId);
      
      expect(result.cancelled).toBe(true);
      expect(result.partialResponse).toBe('Partial content');
    });

    it('should check if request is active', () => {
      expect(cancelService.hasActiveRequest(testChatId)).toBe(false);
      
      cancelService.registerRequest(testChatId, { timeout: 0 });
      expect(cancelService.hasActiveRequest(testChatId)).toBe(true);
      
      cancelService.unregisterRequest(testChatId);
      expect(cancelService.hasActiveRequest(testChatId)).toBe(false);
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
    it('should export streaming functions from llmService', () => {
      expect(typeof llmService.streamLLMResponse).toBe('function');
      expect(typeof llmService.sendLLMMessageStream).toBe('function');
    });

    it('should export error classes from llmService', () => {
      expect(llmService.ValidationError).toBeDefined();
      expect(llmService.ConfigError).toBeDefined();
      expect(llmService.LLMError).toBeDefined();
      expect(llmService.TimeoutError).toBeDefined();
    });

    it('should export request management functions from cancelService', () => {
      expect(typeof cancelService.registerRequest).toBe('function');
      expect(typeof cancelService.unregisterRequest).toBe('function');
      expect(typeof cancelService.getActiveRequest).toBe('function');
      expect(typeof cancelService.cancelRequest).toBe('function');
      expect(typeof cancelService.hasActiveRequest).toBe('function');
      expect(typeof cancelService.updatePartialResponse).toBe('function');
      expect(typeof cancelService.getPartialResponse).toBe('function');
    });
  });
});