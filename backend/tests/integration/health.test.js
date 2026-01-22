const request = require('supertest');

describe('Health Check API', () => {
  let app;

  beforeAll(async () => {
    // Build app for testing (without starting server)
    const buildApp = require('../../src/index');
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    // Close the app after tests
    await app.close();
  });

  describe('GET /api/health', () => {
    it('returns health status', async () => {
      const response = await request(app.server)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    it('includes timestamp', async () => {
      const response = await request(app.server)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
    });
  });
});