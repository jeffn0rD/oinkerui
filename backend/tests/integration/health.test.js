const request = require('supertest');

describe('Health Check API', () => {
  let app;

  beforeAll(() => {
    // Import app after environment is set
    app = require('../../src/index');
  });

  describe('GET /health', () => {
    it('returns health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    it('includes timestamp', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
    });
  });
});