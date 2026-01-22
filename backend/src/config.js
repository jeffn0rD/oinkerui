require('dotenv').config();

// Create a function to build config so it can be reset for tests
function buildConfig() {
  return {
    env: process.env.NODE_ENV || 'development',
    server: {
      port: parseInt(process.env.NODE_PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
    },
    api: {
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        timeout: parseInt(process.env.API_TIMEOUT || '60000', 10),
      },
    },
    workspace: {
      root: process.env.WORKSPACE_ROOT || './workspaces',
      dataDir: process.env.DATA_DIR || './data',
    },
    git: {
      userName: process.env.GIT_USER_NAME || 'OinkerUI',
      userEmail: process.env.GIT_USER_EMAIL || 'oinkerui@example.com',
      autoCommitEnabled: process.env.AUTO_COMMIT_ENABLED === 'true',
    },
    security: {
      secretKey: process.env.SECRET_KEY,
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
      debug: process.env.DEBUG === 'true',
    },
    python: {
      port: parseInt(process.env.PYTHON_PORT || '8000', 10),
      baseUrl: `http://localhost:${process.env.PYTHON_PORT || '8000'}`,
    },
  };
}

const config = buildConfig();

// Validate required configuration
function validateConfig() {
  const required = ['api.openrouter.apiKey'];
  const missing = [];
  
  required.forEach(path => {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      missing.push(path);
    }
  });
  
  if (missing.length > 0 && config.env !== 'test') {
    console.warn(`Warning: Missing required configuration: ${missing.join(', ')}`);
  }
}

validateConfig();

// Reset function for tests - defined separately to avoid being deleted
function reset(overrides = {}) {
  const newConfig = buildConfig();
  // Delete all keys except 'reset'
  Object.keys(config).forEach(key => {
    if (key !== 'reset') {
      delete config[key];
    }
  });
  // Apply new config and overrides
  Object.assign(config, newConfig, overrides);
  return config;
}

// Add reset function to config object
config.reset = reset;

// Export config with reset function attached
module.exports = config;