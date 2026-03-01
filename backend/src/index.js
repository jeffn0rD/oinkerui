// backend/src/index.js
const path = require('path');
const fs = require('fs');

function buildApp(opts = {}) {
  const fastify = require('fastify')({ 
    logger: opts.logger !== false 
  });

  // Register plugins
  fastify.register(require('@fastify/cors'), {
    origin: true,
    credentials: true
  });

  // Only serve static files if frontend/dist exists (production mode)
  const distPath = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(distPath)) {
    fastify.register(require('@fastify/static'), {
      root: distPath,
      prefix: '/',
    });
  } else {
    fastify.log.info('Frontend dist not found - running in API-only mode (use Vite dev server for frontend)');
  }

  // Register routes
  fastify.register(require('./routes/projects'));
  fastify.register(require('./routes/chats'));
  fastify.register(require('./routes/messages'));
  fastify.register(require('./routes/streaming'));
  fastify.register(require('./routes/templates'));
  fastify.register(require('./routes/models'));

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
