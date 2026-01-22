// backend/src/index.js
const path = require('path');

function buildApp(opts = {}) {
  const fastify = require('fastify')({ 
    logger: opts.logger !== false 
  });

  // Register plugins
  fastify.register(require('@fastify/cors'));
  fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '../../frontend/dist'),
    prefix: '/',
  });

  // Register routes
  fastify.register(require('./routes/projects'));

  // Health check endpoint
  fastify.get('/api/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return fastify;
}

// Start server only if not in test mode
if (require.main === module) {
  const app = buildApp();
  
  const start = async () => {
    try {
      await app.listen({ port: 3000, host: '0.0.0.0' });
      console.log('Server listening on http://localhost:3000');
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };

  start();
}

module.exports = buildApp;
