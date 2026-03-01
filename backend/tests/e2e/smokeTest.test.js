/**
 * Server Smoke Test
 * 
 * Actually starts the Fastify server and tests real HTTP request/response cycles.
 * This catches issues that unit tests miss:
 * - Route registration failures
 * - Middleware/plugin issues  
 * - Real request/response serialization
 * - SSE streaming format
 * - Cross-service integration
 */

const buildApp = require('../../src/index');
const fs = require('fs');
const path = require('path');

let app;
const SUFFIX = Date.now(); // Unique suffix to avoid conflicts

// Ensure workspace directories exist
beforeAll(async () => {
  const dirs = ['workspaces', 'data', 'workspaces/projects'];
  for (const dir of dirs) {
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
  app = buildApp({ logger: false });
  await app.ready();
});

afterAll(async () => {
  if (app) await app.close();
});

// Helper: unwrap response body - handles both wrapped {success,data} and raw formats
function getData(body) {
  const parsed = typeof body === 'string' ? JSON.parse(body) : body;
  if (parsed && parsed.data !== undefined) return parsed.data;
  return parsed;
}

describe('Server Smoke Test', () => {
  // =========================================================================
  // Health & Basic Routes
  // =========================================================================
  
  describe('Health Check', () => {
    it('GET /api/health returns ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      });
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });

  // =========================================================================
  // Models Endpoint
  // =========================================================================
  
  describe('Models', () => {
    it('GET /api/models returns model list with required fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/models'
      });
      expect(response.statusCode).toBe(200);
      const data = getData(response.body);
      expect(data.models).toBeDefined();
      expect(Array.isArray(data.models)).toBe(true);
      expect(data.models.length).toBeGreaterThan(0);
      expect(data.default_model).toBeDefined();
      expect(data.allow_custom).toBe(true);
      
      for (const model of data.models) {
        expect(model.id).toBeDefined();
        expect(typeof model.id).toBe('string');
        expect(model.name).toBeDefined();
        expect(model.provider).toBeDefined();
      }
    });
  });

  // =========================================================================
  // Full CRUD Flow: Project → Chat → Messages
  // =========================================================================
  
  describe('Full CRUD Flow', () => {
    let projectId;
    let chatId;
    const projectName = `SmokeProject_${SUFFIX}`;
    const chatName = `SmokeChat_${SUFFIX}`;

    it('creates a project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: projectName, description: 'Smoke test' }
      });
      expect(response.statusCode).toBe(201);
      const data = getData(response.body);
      expect(data.id).toBeDefined();
      expect(data.name).toBe(projectName);
      projectId = data.id;
    });

    it('lists projects including the new one', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects'
      });
      expect(response.statusCode).toBe(200);
      const data = getData(response.body);
      expect(Array.isArray(data)).toBe(true);
      expect(data.some(p => p.id === projectId)).toBe(true);
    });

    it('creates a chat in the project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/chats`,
        payload: { name: chatName }
      });
      expect(response.statusCode).toBe(201);
      const data = getData(response.body);
      expect(data.id).toBeDefined();
      expect(data.name).toBe(chatName);
      expect(data.status).toBe('active');
      chatId = data.id;
    });

    it('lists chats in the project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/chats`
      });
      expect(response.statusCode).toBe(200);
      const data = getData(response.body);
      expect(Array.isArray(data)).toBe(true);
      expect(data.some(c => c.id === chatId)).toBe(true);
    });

    it('returns empty messages for new chat', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/chats/${chatId}/messages`
      });
      expect(response.statusCode).toBe(200);
      const data = getData(response.body);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('rejects streaming with empty input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/chats/${chatId}/messages/stream`,
        payload: { raw_text: '' }
      });
      expect(response.statusCode).toBe(400);
    });

    it.skip('accepts streaming request for valid input (may error without API key)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/chats/${chatId}/messages/stream`,
        payload: { raw_text: 'Hello test', model_id: 'openai/gpt-4o-mini' }
      });
      // Without a valid API key, expect either SSE start (200) or server error (500/502)
      expect([200, 500, 502]).toContain(response.statusCode);
    });

    it('returns no active request status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/chats/${chatId}/status`
      });
      expect(response.statusCode).toBe(200);
      const data = getData(response.body);
      expect(data.hasActiveRequest).toBe(false);
    });

    it('handles cancel with no active request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/chats/${chatId}/cancel`
      });
      expect(response.statusCode).toBe(200);
    });

    it('forks a chat', async () => {
      const forkName = `Fork_${SUFFIX}`;
      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/chats/${chatId}/fork`,
        payload: { name: forkName }
      });
      expect(response.statusCode).toBe(201);
      const data = getData(response.body);
      expect(data.name).toBe(forkName);
    });

    it('deletes the project', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${projectId}?hard=true`
      });
      expect(response.statusCode).toBe(204);
    });
  });

  // =========================================================================
  // Templates & Commands
  // =========================================================================
  
  describe('Templates', () => {
    it('GET /api/templates returns a response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/templates'
      });
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Commands', () => {
    it('GET /api/commands returns command list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/commands'
      });
      expect(response.statusCode).toBe(200);
      const data = getData(response.body);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // =========================================================================
  // Error Handling
  // =========================================================================
  
  describe('Error Handling', () => {
    it('returns 404 for non-existent project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/non-existent-id-12345'
      });
      expect(response.statusCode).toBe(404);
    });

    it('returns error for non-existent chat in valid project', async () => {
      const projResp = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: `ErrTest_${SUFFIX}` }
      });
      const projData = getData(projResp.body);
      const projectId = projData.id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/chats/non-existent-chat-id`
      });
      // Accept 400 or 404 - implementation may validate format first
      expect([400, 404]).toContain(response.statusCode);

      // Cleanup
      await app.inject({ method: 'DELETE', url: `/api/projects/${projectId}?hard=true` });
    });
  });
});
