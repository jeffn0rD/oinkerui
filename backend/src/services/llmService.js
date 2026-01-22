/**
 * LLM Service
 * 
 * Responsibilities:
 * - Make API calls to OpenRouter for LLM responses
 * - Construct context arrays for LLM requests
 * - Handle authentication, retries, and error handling
 * - Support response streaming (future)
 * 
 * Spec Reference: spec/modules/backend_node.yaml
 * Function Specs: 
 * - spec/functions/backend_node/call_llm.yaml
 * - spec/functions/backend_node/construct_context.yaml
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const projectService = require('./projectService');

// Import shared error classes
const {
  ValidationError,
  ConfigError,
  LLMError,
  TimeoutError,
  RateLimitError,
  AuthenticationError,
  FileSystemError
} = require('../errors');

// Token counting - use simple estimation (chars / 4) as fallback
// In production, use tiktoken for accurate counting
function countTokens(text) {
  if (!text) return 0;
  // Simple estimation: ~4 characters per token on average
  // This is a reasonable approximation for English text
  return Math.ceil(text.length / 4);
}

/**
 * callLLM
 * 
 * Make an API call to OpenRouter to get an LLM response.
 * Handles authentication, request formatting, response parsing,
 * error handling, and retry logic.
 * 
 * @param {Object} request - LLM request configuration
 * @param {string} request.model - Valid OpenRouter model ID
 * @param {Array} request.messages - Non-empty array of {role, content}
 * @param {number} [request.max_tokens] - Optional, positive integer
 * @param {number} [request.temperature] - Optional, 0.0-2.0
 * @param {string} [request.output_format] - Optional, 'text' or 'json'
 * @returns {Promise<Object>} LLM response with content and metadata
 * @throws {ValidationError} If request parameters are invalid
 * @throws {ConfigError} If API key is not configured
 * @throws {LLMError} If API returns error
 * @throws {TimeoutError} If request times out
 * @throws {RateLimitError} If rate limit exceeded
 * @throws {AuthenticationError} If API key is invalid
 * 
 * Spec: spec/functions/backend_node/call_llm.yaml
 */
async function callLLM(request, options = {}) {
  // Step 1: Validate request parameters
  if (!request.model) {
    throw new ValidationError('Model is required');
  }
  if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
    throw new ValidationError('Messages are required and must be a non-empty array');
  }
  
  // Validate each message has role and content
  for (const msg of request.messages) {
    if (!msg.role || !msg.content) {
      throw new ValidationError('Each message must have role and content');
    }
  }
  
  // Validate optional parameters
  if (request.max_tokens !== undefined && (typeof request.max_tokens !== 'number' || request.max_tokens <= 0)) {
    throw new ValidationError('max_tokens must be a positive integer');
  }
  if (request.temperature !== undefined && (typeof request.temperature !== 'number' || request.temperature < 0 || request.temperature > 2)) {
    throw new ValidationError('temperature must be between 0.0 and 2.0');
  }
  
  // Step 2: Get API key from environment
  const apiKey = config.api?.openrouter?.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ConfigError('OPENROUTER_API_KEY not set');
  }
  
  // Step 3: Format request body per OpenRouter API spec
  const body = {
    model: request.model,
    messages: request.messages,
    ...(request.max_tokens && { max_tokens: request.max_tokens }),
    ...(request.temperature !== undefined && { temperature: request.temperature }),
    ...(request.output_format === 'json' && { 
      response_format: { type: 'json_object' } 
    })
  };
  
  const startTime = Date.now();
  const timeout = options.timeout || config.api?.openrouter?.timeout || 60000;
  const maxRetries = options.maxRetries || 3;
  
  let lastError;
  
  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Step 4: POST to /api/v1/chat/completions with timeout
      const response = await axios.post(
        config.api?.openrouter?.baseUrl + '/chat/completions' || 'https://openrouter.ai/api/v1/chat/completions',
        body,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'OinkerUI'
          },
          timeout
        }
      );
      
      const latencyMs = Date.now() - startTime;
      
      // Step 5-6: Check HTTP status and parse JSON response
      const data = response.data;
      
      if (!data.choices || data.choices.length === 0) {
        throw new LLMError('No choices in response');
      }
      
      const choice = data.choices[0];
      
      // Step 7-8: Extract content and metadata, return LLMResponse
      const llmResponse = {
        content: choice.message?.content || '',
        model: data.model,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0
        },
        request_id: data.id,
        finish_reason: choice.finish_reason,
        latency_ms: latencyMs
      };
      
      // Log request timing (without sensitive data)
      console.log('LLM request completed:', {
        event: 'llm_request_complete',
        model: request.model,
        latency_ms: latencyMs,
        prompt_tokens: llmResponse.usage.prompt_tokens,
        completion_tokens: llmResponse.usage.completion_tokens,
        finish_reason: llmResponse.finish_reason,
        request_id: llmResponse.request_id
      });
      
      return llmResponse;
      
    } catch (error) {
      lastError = error;
      
      // Step 5: Handle errors
      if (error.code === 'ECONNABORTED') {
        // Timeout - retry with backoff
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`LLM request timeout, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new TimeoutError('LLM request timed out', { attempts: attempt });
      }
      
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;
      
      if (status === 401) {
        throw new AuthenticationError('Invalid API key');
      }
      
      if (status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'];
        throw new RateLimitError('Rate limit exceeded', { retryAfter });
      }
      
      // Server errors (5xx) - retry with backoff
      if (status >= 500 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`LLM server error (${status}), retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Client errors (4xx except 429) - don't retry
      if (status >= 400) {
        throw new LLMError(message, { status });
      }
      
      // Unknown error - propagate
      throw error;
    }
  }
  
  // Should not reach here, but just in case
  throw lastError || new LLMError('Unknown error');
}

/**
 * constructContext
 * 
 * Build the message context array for an LLM request following the context
 * construction algorithm. This function selects which messages to include,
 * respects token limits, handles pinned/aside messages, and applies
 * truncation strategies.
 * 
 * @param {Object} chat - Chat object with message history
 * @param {Object} currentMessage - Current user message being processed
 * @param {string} [modelId] - Model ID for token limit lookup
 * @returns {Promise<Array>} Array of messages formatted for LLM API
 * @throws {ValidationError} If chat has no messages
 * @throws {FileSystemError} If chat storage file not found
 * 
 * Spec: spec/functions/backend_node/construct_context.yaml
 */
async function constructContext(chat, currentMessage, modelId) {
  // Validate inputs
  if (!chat) {
    throw new ValidationError('Chat is required');
  }
  if (!currentMessage) {
    throw new ValidationError('Current message is required');
  }
  if (!currentMessage.content) {
    throw new ValidationError('Current message must have content');
  }
  
  // Step 1: Load all messages from chat JSONL file
  let allMessages = [];
  
  if (chat.storage_path) {
    try {
      // Get project to find the storage path
      const project = await projectService.getProject(chat.project_id);
      const storagePath = path.join(project.paths.root, chat.storage_path);
      
      const content = await fs.readFile(storagePath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const message = JSON.parse(line);
          allMessages.push(message);
        } catch (parseError) {
          console.warn('Failed to parse message line:', parseError.message);
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet - that's okay, just use empty array
        allMessages = [];
      } else if (error.name === 'NotFoundError') {
        throw error;
      } else {
        throw new FileSystemError('Failed to read chat storage', { error: error.message });
      }
    }
  }
  
  // Step 2: Filter out discarded messages
  // Step 3: Filter out aside messages (unless pinned)
  const eligibleMessages = allMessages.filter(m =>
    !m.is_discarded &&
    m.include_in_context !== false &&
    (!m.is_aside || m.is_pinned)
  );
  
  // Step 4: Separate pinned messages from regular messages
  const pinnedMessages = eligibleMessages.filter(m => m.is_pinned);
  const regularMessages = eligibleMessages.filter(m => !m.is_pinned);
  
  // Step 5: Get max_context_tokens from project settings or model config
  let maxTokens = 32000; // Default
  try {
    const project = await projectService.getProject(chat.project_id);
    maxTokens = project.settings?.max_context_tokens || 32000;
  } catch (error) {
    // Use default if project not found
    console.warn('Could not get project settings, using default max_context_tokens');
  }
  
  // Step 6-8: Calculate and reserve tokens
  let usedTokens = 0;
  const selectedMessages = [];
  
  // Reserve tokens for system prelude
  if (chat.system_prelude?.content) {
    usedTokens += countTokens(chat.system_prelude.content);
  }
  
  // Reserve tokens for current message
  usedTokens += countTokens(currentMessage.content);
  
  // Reserve tokens for pinned messages (always include)
  for (const msg of pinnedMessages) {
    const msgTokens = countTokens(msg.content);
    usedTokens += msgTokens;
    selectedMessages.push(msg);
  }
  
  // Check if over budget already
  if (usedTokens > maxTokens) {
    console.warn('Pinned messages exceed token budget', {
      usedTokens,
      maxTokens,
      pinnedCount: pinnedMessages.length
    });
  }
  
  // Step 9: Sort remaining messages by created_at descending (newest first)
  const sortedRegular = [...regularMessages].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  
  // Step 10: Add messages until budget exhausted
  const remainingBudget = maxTokens - usedTokens;
  let budgetUsed = 0;
  
  for (const msg of sortedRegular) {
    // Skip if this is the current message (already counted)
    if (msg.id === currentMessage.id) continue;
    
    const msgTokens = countTokens(msg.content);
    if (budgetUsed + msgTokens <= remainingBudget) {
      selectedMessages.push(msg);
      budgetUsed += msgTokens;
    }
  }
  
  // Step 11: Sort selected messages chronologically
  selectedMessages.sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );
  
  // Step 12: Format as [{role, content}] array
  const context = [];
  
  // System prelude first (if present)
  if (chat.system_prelude?.content) {
    context.push({
      role: 'system',
      content: chat.system_prelude.content
    });
  }
  
  // Add selected messages
  for (const msg of selectedMessages) {
    context.push({
      role: msg.role,
      content: msg.content
    });
  }
  
  // Current message last
  context.push({
    role: currentMessage.role || 'user',
    content: currentMessage.content
  });
  
  console.log('Context constructed:', {
    event: 'context_constructed',
    totalMessages: allMessages.length,
    eligibleMessages: eligibleMessages.length,
    selectedMessages: selectedMessages.length + 1, // +1 for current
    pinnedMessages: pinnedMessages.length,
    hasSystemPrelude: !!chat.system_prelude?.content,
    estimatedTokens: usedTokens + budgetUsed,
    maxTokens
  });
  
  return context;
}

/**
 * sendLLMMessage
 * 
 * High-level function to send a message to the LLM and get a response.
 * Combines context construction and LLM calling.
 * 
 * @param {string} projectId - Project ID
 * @param {string} chatId - Chat ID
 * @param {Object} message - User message
 * @param {Object} [options] - Options for the LLM call
 * @returns {Promise<Object>} LLM response
 */
async function sendLLMMessage(projectId, chatId, message, options = {}) {
  const chatService = require('./chatService');
  
  // Get chat
  const chat = await chatService.getChat(projectId, chatId);
  
  // Get project for model selection
  const project = await projectService.getProject(projectId);
  const model = options.model || project.default_model || 'openai/gpt-4o-mini';
  
  // Construct context
  const context = await constructContext(chat, message, model);
  
  // Call LLM
  const response = await callLLM({
    model,
    messages: context,
    max_tokens: options.max_tokens,
    temperature: options.temperature,
    output_format: options.output_format
  }, options);
  
  return response;
}

module.exports = {
  callLLM,
  constructContext,
  sendLLMMessage,
  countTokens,
  // Export error classes for testing
  ValidationError,
  ConfigError,
  LLMError,
  TimeoutError,
  RateLimitError,
  AuthenticationError
};