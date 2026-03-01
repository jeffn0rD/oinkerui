/**
 * Model Routes
 * 
 * REST API endpoints for model configuration
 * 
 * Routes:
 * - GET /api/models - List available models
 */

const config = require('../config');

// Default model list - can be overridden via MODELS env var or config
const DEFAULT_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
];

function getConfiguredModels() {
  // Check for MODELS env var (JSON array or comma-separated model IDs)
  const modelsEnv = process.env.MODELS;
  if (modelsEnv) {
    try {
      // Try JSON parse first
      const parsed = JSON.parse(modelsEnv);
      if (Array.isArray(parsed)) {
        return parsed.map(m => {
          if (typeof m === 'string') {
            // Just a model ID string like "openai/gpt-4o"
            const parts = m.split('/');
            return {
              id: m,
              name: parts.length > 1 ? parts.slice(1).join('/') : m,
              provider: parts[0] || 'Custom'
            };
          }
          return m; // Already an object with id, name, provider
        });
      }
    } catch {
      // Not JSON - treat as comma-separated model IDs
      return modelsEnv.split(',').map(id => {
        const trimmed = id.trim();
        const parts = trimmed.split('/');
        return {
          id: trimmed,
          name: parts.length > 1 ? parts.slice(1).join('/') : trimmed,
          provider: parts[0] || 'Custom'
        };
      }).filter(m => m.id);
    }
  }
  
  return DEFAULT_MODELS;
}

async function modelRoutes(fastify, options) {
  /**
   * List available models
   * GET /api/models
   * 
   * Returns the configured model list. Models can be configured via:
   * - MODELS env var (JSON array of objects or comma-separated model IDs)
   * - Default built-in list
   * 
   * Response also includes the default model and whether custom entry is allowed.
   */
  fastify.get('/api/models', async (request, reply) => {
    const models = getConfiguredModels();
    const defaultModel = process.env.DEFAULT_MODEL || 'openai/gpt-4o-mini';
    
    reply.send({
      success: true,
      data: {
        models,
        default_model: defaultModel,
        allow_custom: true // Always allow typing custom OpenRouter model names
      }
    });
  });
}

module.exports = modelRoutes;
