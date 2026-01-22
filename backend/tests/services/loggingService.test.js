'use strict';

/**
 * Logging Service Tests
 * 
 * Tests for logLLMRequest and getStats functions
 * Spec: spec/functions/logging_and_metrics/log_llm_request.yaml
 * Spec: spec/functions/logging_and_metrics/get_stats.yaml
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const loggingService = require('../../src/services/loggingService');
const projectService = require('../../src/services/projectService');

describe('Logging Service', () => {
  let testWorkspaceRoot;
  let testProjectId;
  let testChatId;
  let testProject;

  beforeEach(async () => {
    // Create temporary workspace for testing
    testWorkspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'oinkerui-logging-test-'));
    
    // Reset config with test workspace
    const config = require('../../src/config');
    config.reset({
      workspace: {
        root: testWorkspaceRoot,
        dataDir: testWorkspaceRoot
      }
    });
    
    // Reset metrics cache
    loggingService.resetMetricsCache();
    
    // Create a test project
    testProject = await projectService.createProject('Test Logging Project');
    testProjectId = testProject.id;
    testChatId = 'test-chat-' + Date.now();
  });

  afterEach(async () => {
    // Cleanup test workspace
    try {
      await fs.rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup test workspace:', error);
    }
  });

  describe('logLLMRequest', () => {
    it('should log a successful LLM request', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success',
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        latency_ms: 1500
      };

      const result = await loggingService.logLLMRequest(entry);

      expect(result.logged).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should generate entry ID if not provided', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success'
      };

      const result = await loggingService.logLLMRequest(entry);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should use provided entry ID', async () => {
      const customId = 'custom-entry-id-123';
      const entry = {
        id: customId,
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success'
      };

      const result = await loggingService.logLLMRequest(entry);

      expect(result.id).toBe(customId);
    });

    it('should create log file in project logs directory', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success'
      };

      await loggingService.logLLMRequest(entry);

      const logPath = path.join(testProject.paths.root, 'logs', 'llm_requests.jsonl');
      const content = await fs.readFile(logPath, 'utf8');
      
      expect(content).toBeTruthy();
      const loggedEntry = JSON.parse(content.trim());
      expect(loggedEntry.model).toBe('openai/gpt-4');
    });

    it('should append multiple entries to log file', async () => {
      const entry1 = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success'
      };
      const entry2 = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'anthropic/claude-3',
        status: 'success'
      };

      await loggingService.logLLMRequest(entry1);
      await loggingService.logLLMRequest(entry2);

      const logPath = path.join(testProject.paths.root, 'logs', 'llm_requests.jsonl');
      const content = await fs.readFile(logPath, 'utf8');
      const lines = content.trim().split('\n');
      
      expect(lines.length).toBe(2);
    });

    it('should throw ValidationError for missing project_id', async () => {
      const entry = {
        chat_id: testChatId,
        model: 'openai/gpt-4'
      };

      await expect(
        loggingService.logLLMRequest(entry)
      ).rejects.toThrow(loggingService.ValidationError);
    });

    it('should throw ValidationError for missing chat_id', async () => {
      const entry = {
        project_id: testProjectId,
        model: 'openai/gpt-4'
      };

      await expect(
        loggingService.logLLMRequest(entry)
      ).rejects.toThrow(loggingService.ValidationError);
    });

    it('should throw ValidationError for missing model', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId
      };

      await expect(
        loggingService.logLLMRequest(entry)
      ).rejects.toThrow(loggingService.ValidationError);
    });

    it('should throw ValidationError for invalid status', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'invalid-status'
      };

      await expect(
        loggingService.logLLMRequest(entry)
      ).rejects.toThrow(loggingService.ValidationError);
    });

    it('should update metrics cache on log', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success',
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        },
        latency_ms: 1500
      };

      await loggingService.logLLMRequest(entry);

      const cachedStats = loggingService.getCachedStats({ type: 'global' });
      expect(cachedStats.summary.totalRequests).toBe(1);
      expect(cachedStats.summary.successfulRequests).toBe(1);
      expect(cachedStats.summary.totalTokens).toBe(150);
    });

    it('should track failed requests in metrics', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'error',
        error: { message: 'API error' }
      };

      await loggingService.logLLMRequest(entry);

      const cachedStats = loggingService.getCachedStats({ type: 'global' });
      expect(cachedStats.summary.failedRequests).toBe(1);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      // Log some test entries
      const entries = [
        {
          project_id: testProjectId,
          chat_id: testChatId,
          model: 'openai/gpt-4',
          status: 'success',
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          latency_ms: 1000
        },
        {
          project_id: testProjectId,
          chat_id: testChatId,
          model: 'openai/gpt-4',
          status: 'success',
          usage: { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 },
          latency_ms: 2000
        },
        {
          project_id: testProjectId,
          chat_id: testChatId,
          model: 'anthropic/claude-3',
          status: 'error',
          latency_ms: 500
        }
      ];

      for (const entry of entries) {
        await loggingService.logLLMRequest(entry);
      }
    });

    it('should return project-level statistics', async () => {
      const stats = await loggingService.getStats({
        type: 'project',
        projectId: testProjectId
      });

      expect(stats.scope.type).toBe('project');
      expect(stats.summary.totalRequests).toBe(3);
      expect(stats.summary.successfulRequests).toBe(2);
      expect(stats.summary.failedRequests).toBe(1);
      expect(stats.summary.totalTokens).toBe(450);
    });

    it('should return chat-level statistics', async () => {
      const stats = await loggingService.getStats({
        type: 'chat',
        projectId: testProjectId,
        chatId: testChatId
      });

      expect(stats.scope.type).toBe('chat');
      expect(stats.summary.totalRequests).toBe(3);
    });

    it('should calculate average latency', async () => {
      const stats = await loggingService.getStats({
        type: 'project',
        projectId: testProjectId
      });

      // (1000 + 2000 + 500) / 3 = 1166.67
      expect(stats.summary.averageLatencyMs).toBeGreaterThan(0);
    });

    it('should group by model', async () => {
      const stats = await loggingService.getStats(
        { type: 'project', projectId: testProjectId },
        { groupBy: 'model' }
      );

      expect(stats.breakdown.length).toBe(2);
      expect(stats.breakdown.some(b => b.model === 'openai/gpt-4')).toBe(true);
      expect(stats.breakdown.some(b => b.model === 'anthropic/claude-3')).toBe(true);
    });

    it('should include per-model statistics', async () => {
      const stats = await loggingService.getStats({
        type: 'project',
        projectId: testProjectId
      });

      expect(stats.models['openai/gpt-4']).toBeDefined();
      expect(stats.models['openai/gpt-4'].requests).toBe(2);
      expect(stats.models['openai/gpt-4'].tokens).toBe(450);
    });

    it('should throw ValidationError for invalid scope type', async () => {
      await expect(
        loggingService.getStats({ type: 'invalid' })
      ).rejects.toThrow(loggingService.ValidationError);
    });

    it('should throw ValidationError for missing projectId in project scope', async () => {
      await expect(
        loggingService.getStats({ type: 'project' })
      ).rejects.toThrow(loggingService.ValidationError);
    });

    it('should throw ValidationError for missing chatId in chat scope', async () => {
      await expect(
        loggingService.getStats({ type: 'chat', projectId: testProjectId })
      ).rejects.toThrow(loggingService.ValidationError);
    });

    it('should return empty stats for project with no logs', async () => {
      const newProject = await projectService.createProject('Empty Project');
      
      const stats = await loggingService.getStats({
        type: 'project',
        projectId: newProject.id
      });

      expect(stats.summary.totalRequests).toBe(0);
      expect(stats.summary.totalTokens).toBe(0);
    });

    it('should estimate cost based on token usage', async () => {
      const stats = await loggingService.getStats({
        type: 'project',
        projectId: testProjectId
      });

      expect(stats.summary.estimatedCost).toBeGreaterThan(0);
    });
  });

  describe('getCachedStats', () => {
    it('should return cached global stats', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success',
        usage: { total_tokens: 100 }
      };

      await loggingService.logLLMRequest(entry);

      const stats = loggingService.getCachedStats({ type: 'global' });
      expect(stats.summary.totalRequests).toBe(1);
    });

    it('should return cached project stats', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success'
      };

      await loggingService.logLLMRequest(entry);

      const stats = loggingService.getCachedStats({
        type: 'project',
        projectId: testProjectId
      });
      expect(stats.summary.totalRequests).toBe(1);
    });

    it('should return cached chat stats', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success'
      };

      await loggingService.logLLMRequest(entry);

      const stats = loggingService.getCachedStats({
        type: 'chat',
        projectId: testProjectId,
        chatId: testChatId
      });
      expect(stats.summary.totalRequests).toBe(1);
    });

    it('should return zero stats for unknown project', () => {
      const stats = loggingService.getCachedStats({
        type: 'project',
        projectId: 'unknown-project'
      });
      expect(stats.summary.totalRequests).toBe(0);
    });
  });

  describe('resetMetricsCache', () => {
    it('should reset all cached metrics', async () => {
      const entry = {
        project_id: testProjectId,
        chat_id: testChatId,
        model: 'openai/gpt-4',
        status: 'success',
        usage: { total_tokens: 100 }
      };

      await loggingService.logLLMRequest(entry);
      
      let stats = loggingService.getCachedStats({ type: 'global' });
      expect(stats.summary.totalRequests).toBe(1);

      loggingService.resetMetricsCache();

      stats = loggingService.getCachedStats({ type: 'global' });
      expect(stats.summary.totalRequests).toBe(0);
    });
  });

  describe('JSONL format verification', () => {
    it('should store entries in valid JSONL format', async () => {
      const entries = [
        { project_id: testProjectId, chat_id: testChatId, model: 'gpt-4', status: 'success' },
        { project_id: testProjectId, chat_id: testChatId, model: 'claude-3', status: 'success' }
      ];

      for (const entry of entries) {
        await loggingService.logLLMRequest(entry);
      }

      const logPath = path.join(testProject.paths.root, 'logs', 'llm_requests.jsonl');
      const content = await fs.readFile(logPath, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(2);
      
      // Each line should be valid JSON
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });
  });
});