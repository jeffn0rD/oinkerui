// backend/src/index.js
const fastify = require('fastify')({ logger: true });
const path = require('path');

// Register plugins
fastify.register(require('@fastify/cors'));
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../../frontend/dist'),
  prefix: '/',
});

// Health check endpoint
fastify.get('/api/health', async (_request, _reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
