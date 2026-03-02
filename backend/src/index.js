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

  // Register API routes FIRST (before static file serving)
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

  // Only serve static files if frontend/dist exists (production mode)
  const distPath = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(distPath)) {
    fastify.register(require('@fastify/static'), {
      root: distPath,
      prefix: '/',
      wildcard: false,  // Don't catch all routes - let API routes take priority
    });

    // SPA fallback: serve index.html for non-API, non-file routes
    fastify.setNotFoundHandler((request, reply) => {
      // Don't intercept API routes
      if (request.url.startsWith('/api/')) {
        reply.code(404).send({ error: 'Not found', message: `Route ${request.method} ${request.url} not found` });
        return;
      }
      // Serve index.html for SPA client-side routing
      reply.sendFile('index.html');
    });
  } else {
    fastify.log.info('Frontend dist not found - running in API-only mode (use Vite dev server for frontend)');
  }

  return fastify;
}

// Start server only if not in test mode
if (require.main === module) {
  const config = require('./config');
  const app = buildApp();
  
  const start = async () => {
    try {
      const port = config.server.port;
      const host = config.server.host;
      await app.listen({ port, host });
      console.log(`Server listening on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };

  start();
}

module.exports = buildApp;