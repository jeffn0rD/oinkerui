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
/**
 * constructContext
 * 
 * Build the message context array for an LLM request following the 7-step
 * context construction algorithm defined in spec/context.yaml.
 * 
 * Algorithm Steps:
 * 1. Prepare system prelude - Start with chat.system_prelude as first message
 * 2. Handle pure_aside - If current_prompt.pure_aside==true, return [system, current] only
 * 3. Filter prior messages - Exclude discarded, aside, include_in_context=false
 * 4. Order prior messages - Sort by created_at ascending
 * 5. Assemble initial context - [system] + prior_ordered + [current]
 * 6. Estimate tokens - Calculate total tokens vs limit
 * 7. Truncate if needed - Remove oldest non-pinned first, preserve pinned
 * 
 * @param {Object} chat - Chat object with message history
 * @param {Object} currentMessage - Current user message being processed
 * @param {string} [modelId] - Model ID for token limit lookup
 * @returns {Promise<Array>} Array of messages formatted for LLM API
 * 
 * Spec: spec/functions/backend_node/construct_context.yaml
 * Context Algorithm: spec/context.yaml
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
  
  // =========================================================================
  // STEP 1: Prepare system prelude
  // =========================================================================
  // Start with chat.system_prelude as the first message
  const systemMessage = chat.system_prelude?.content ? {
    role: 'system',
    content: chat.system_prelude.content
  } : null;
  
  // =========================================================================
  // STEP 2: Handle pure_aside (TERMINATES EARLY)
  // =========================================================================
  // If pure_aside is true, ignore all prior messages; context is only
  // system prelude + current prompt
  if (currentMessage.pure_aside === true) {
    const context = [];
    if (systemMessage) {
      context.push(systemMessage);
    }
    context.push({
      role: currentMessage.role || 'user',
      content: currentMessage.content
    });
    
    console.log('Context constructed (pure_aside):', {
      event: 'context_constructed',
      pure_aside: true,
      messageCount: context.length,
      hasSystemPrelude: !!systemMessage
    });
    
    return context;
  }
  
  // =========================================================================
  // Load all messages from chat JSONL file
  // =========================================================================
  let allMessages = [];
  
  if (chat.storage_path) {
    try {
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
        allMessages = [];
      } else if (error.name === 'NotFoundError') {
        throw error;
      } else {
        throw new FileSystemError('Failed to read chat storage', { error: error.message });
      }
    }
  }
  
  // =========================================================================
  // STEP 3: Filter prior messages
  // =========================================================================
  // Consider all messages with created_at < current_prompt.created_at
  // Exclude messages where:
  //   - is_discarded == true, OR
  //   - include_in_context == false, OR
  //   - is_aside == true (aside messages are not included in future contexts)
  // Include pinned messages regardless of recency, if not discarded
  const currentTime = currentMessage.created_at ? new Date(currentMessage.created_at) : new Date();
  
  const priorCandidates = allMessages.filter(m => {
    // Must be before current message
    const msgTime = new Date(m.created_at);
    if (msgTime >= currentTime) return false;
    
    // Never include discarded messages
    if (m.is_discarded === true) return false;
    
    // Check include_in_context flag (default true)
    if (m.include_in_context === false) return false;
    
    // Aside messages excluded from future context (unless pinned)
    if (m.is_aside === true && m.is_pinned !== true) return false;
    
    return true;
  });
  
  // =========================================================================
  // STEP 4: Order prior messages
  // =========================================================================
  // Sort prior_candidates by created_at ascending
  // Pinned messages remain in chronological position but marked for retention
  const priorOrdered = [...priorCandidates].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );
  
  // =========================================================================
  // STEP 5: Assemble initial context
  // =========================================================================
  // Construct: [system_message] + prior_ordered + [current_prompt]
  // (We'll format this after truncation)
  
  // =========================================================================
  // STEP 6: Estimate tokens
  // =========================================================================
  let maxTokens = 32000; // Default
  try {
    const project = await projectService.getProject(chat.project_id);
    maxTokens = project.settings?.max_context_tokens || 32000;
  } catch (error) {
    console.warn('Could not get project settings, using default max_context_tokens');
  }
  
  // Calculate token usage
  let systemTokens = systemMessage ? countTokens(systemMessage.content) : 0;
  let currentTokens = countTokens(currentMessage.content);
  let reservedTokens = systemTokens + currentTokens;
  
  // Calculate tokens for all prior messages
  const messagesWithTokens = priorOrdered.map(m => ({
    message: m,
    tokens: countTokens(m.content),
    isPinned: m.is_pinned === true
  }));
  
  const totalPriorTokens = messagesWithTokens.reduce((sum, m) => sum + m.tokens, 0);
  const estimatedTokens = reservedTokens + totalPriorTokens;
  
  // =========================================================================
  // STEP 7: Truncate if needed
  // =========================================================================
  let selectedMessages = messagesWithTokens;
  
  if (estimatedTokens > maxTokens) {
    // Apply truncation:
    // 1. Always keep system_message (already reserved)
    // 2. Always keep pinned messages if possible
    // 3. Remove oldest non-pinned messages first until under limit
    
    const availableBudget = maxTokens - reservedTokens;
    
    // Separate pinned and non-pinned
    const pinnedMsgs = messagesWithTokens.filter(m => m.isPinned);
    const nonPinnedMsgs = messagesWithTokens.filter(m => !m.isPinned);
    
    // Calculate pinned tokens
    const pinnedTokens = pinnedMsgs.reduce((sum, m) => sum + m.tokens, 0);
    
    if (pinnedTokens > availableBudget) {
      console.warn('Pinned messages exceed token budget', {
        pinnedTokens,
        availableBudget,
        pinnedCount: pinnedMsgs.length
      });
      // Still include pinned messages even if over budget
      selectedMessages = pinnedMsgs;
    } else {
      // Start with pinned messages
      let usedBudget = pinnedTokens;
      const includedNonPinned = [];
      
      // Add non-pinned from newest to oldest (reverse order) until budget exhausted
      // Then we'll re-sort chronologically
      const nonPinnedNewestFirst = [...nonPinnedMsgs].reverse();
      
      for (const m of nonPinnedNewestFirst) {
        if (usedBudget + m.tokens <= availableBudget) {
          includedNonPinned.push(m);
          usedBudget += m.tokens;
        }
      }
      
      // Combine and sort chronologically
      selectedMessages = [...pinnedMsgs, ...includedNonPinned].sort((a, b) =>
        new Date(a.message.created_at) - new Date(b.message.created_at)
      );
    }
    
    console.log('Context truncated:', {
      event: 'context_truncated',
      originalCount: messagesWithTokens.length,
      selectedCount: selectedMessages.length,
      pinnedCount: pinnedMsgs.length,
      estimatedTokens,
      maxTokens
    });
  }
  
  // =========================================================================
  // Format final context array
  // =========================================================================
  const context = [];
  
  // System prelude first (invariant: system_first)
  if (systemMessage) {
    context.push(systemMessage);
  }
  
  // Add selected prior messages
  for (const m of selectedMessages) {
    context.push({
      role: m.message.role,
      content: m.message.content
    });
  }
  
  // Current message last (invariant: current_prompt_last)
  context.push({
    role: currentMessage.role || 'user',
    content: currentMessage.content
  });
  
  console.log('Context constructed:', {
    event: 'context_constructed',
    totalMessages: allMessages.length,
    priorCandidates: priorCandidates.length,
    selectedMessages: selectedMessages.length,
    finalContextSize: context.length,
    hasSystemPrelude: !!systemMessage,
    estimatedTokens: reservedTokens + selectedMessages.reduce((sum, m) => sum + m.tokens, 0),
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

// =============================================================================
// Active Request Tracking (for cancellation)
// =============================================================================

// Map of chatId -> { requestId, controller, startTime }
const activeRequests = new Map();

/**
 * Register an active request for tracking
 * @param {string} chatId - Chat ID
 * @param {string} requestId - Request ID
 * @param {AbortController} controller - Abort controller
 */
function registerActiveRequest(chatId, requestId, controller) {
  activeRequests.set(chatId, {
    requestId,
    controller,
    startTime: Date.now()
  });
}

/**
 * Unregister an active request
 * @param {string} chatId - Chat ID
 */
function unregisterActiveRequest(chatId) {
  activeRequests.delete(chatId);
}

/**
 * Get active request for a chat
 * @param {string} chatId - Chat ID
 * @returns {Object|null} Active request info or null
 */
function getActiveRequest(chatId) {
  return activeRequests.get(chatId) || null;
}

/**
 * Cancel an active request
 * @param {string} chatId - Chat ID
 * @returns {boolean} True if request was cancelled
 */
function cancelActiveRequest(chatId) {
  const request = activeRequests.get(chatId);
  if (request) {
    request.controller.abort();
    activeRequests.delete(chatId);
    return true;
  }
  return false;
}

// =============================================================================
// Streaming LLM Response
// =============================================================================

/**
 * streamLLMResponse
 * 
 * Stream an LLM response from OpenRouter using Server-Sent Events.
 * Yields tokens as they arrive for real-time display.
 * 
 * @param {Object} request - LLM request configuration
 * @param {string} request.model - Model identifier
 * @param {Array} request.messages - Array of messages for context
 * @param {number} [request.temperature=0.7] - Temperature
 * @param {number} [request.max_tokens] - Maximum tokens in response
 * @param {AbortSignal} [request.abortSignal] - Signal to cancel the request
 * @param {Object} [callbacks] - Optional callbacks
 * @param {Function} [callbacks.onToken] - Called for each token
 * @param {Function} [callbacks.onComplete] - Called when streaming completes
 * @param {Function} [callbacks.onError] - Called on error
 * @returns {AsyncGenerator} Yields tokens as they arrive
 * 
 * Spec: spec/functions/backend_node/stream_llm_response.yaml
 */
async function* streamLLMResponse(request, callbacks = {}) {
  // Step 1: Validate request
  if (!request.model) {
    throw new ValidationError('Model is required');
  }
  if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
    throw new ValidationError('Messages are required and must be a non-empty array');
  }

  // Get API key
  const apiKey = config.api?.openrouter?.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ConfigError('OPENROUTER_API_KEY not set');
  }

  // Step 2: Prepare SSE request with stream=true
  const body = {
    model: request.model,
    messages: request.messages,
    stream: true,
    ...(request.max_tokens && { max_tokens: request.max_tokens }),
    ...(request.temperature !== undefined && { temperature: request.temperature })
  };

  const baseUrl = config.api?.openrouter?.baseUrl || 'https://openrouter.ai/api/v1';
  const url = `${baseUrl}/chat/completions`;

  let accumulated = '';
  const startTime = Date.now();

  try {
    // Step 3: Open connection with streaming
    const response = await axios({
      method: 'POST',
      url,
      data: body,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'OinkerUI'
      },
      responseType: 'stream',
      signal: request.abortSignal,
      timeout: config.api?.openrouter?.streamTimeout || 300000 // 5 minutes for streaming
    });

    // Step 4: Process SSE chunks
    const stream = response.data;
    let buffer = '';

    for await (const chunk of stream) {
      // Check for abort
      if (request.abortSignal?.aborted) {
        throw new Error('Request aborted');
      }

      buffer += chunk.toString();
      
      // Process complete SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue; // Skip empty lines and comments
        }

        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6);
          
          // Check for stream end
          if (data === '[DONE]') {
            // Step 6: Handle completion
            const finalResult = {
              token: '',
              done: true,
              accumulated,
              usage: {
                prompt_tokens: 0, // Not available in streaming
                completion_tokens: countTokens(accumulated),
                total_tokens: countTokens(accumulated)
              },
              latency_ms: Date.now() - startTime
            };

            if (callbacks.onComplete) {
              callbacks.onComplete(accumulated);
            }

            yield finalResult;
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (delta?.content) {
              // Step 5: Yield token
              accumulated += delta.content;
              
              const tokenResult = {
                token: delta.content,
                done: false,
                accumulated
              };

              if (callbacks.onToken) {
                callbacks.onToken(delta.content);
              }

              yield tokenResult;
            }

            // Check for finish reason
            if (finishReason) {
              const finalResult = {
                token: '',
                done: true,
                accumulated,
                finish_reason: finishReason,
                usage: parsed.usage || {
                  prompt_tokens: 0,
                  completion_tokens: countTokens(accumulated),
                  total_tokens: countTokens(accumulated)
                },
                latency_ms: Date.now() - startTime
              };

              if (callbacks.onComplete) {
                callbacks.onComplete(accumulated);
              }

              yield finalResult;
              return;
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE data:', parseError.message);
          }
        }
      }
    }

    // If we get here without a [DONE], yield final result
    if (accumulated) {
      yield {
        token: '',
        done: true,
        accumulated,
        latency_ms: Date.now() - startTime
      };
    }

  } catch (error) {
    // Step 7 & 8: Handle cancellation and errors
    if (error.name === 'AbortError' || error.message === 'Request aborted' || request.abortSignal?.aborted) {
      const abortError = new Error('Request cancelled');
      abortError.name = 'AbortError';
      abortError.accumulated = accumulated;
      
      if (callbacks.onError) {
        callbacks.onError(abortError);
      }
      
      throw abortError;
    }

    if (error.code === 'ECONNABORTED') {
      const timeoutError = new TimeoutError('Stream request timed out');
      timeoutError.accumulated = accumulated;
      
      if (callbacks.onError) {
        callbacks.onError(timeoutError);
      }
      
      throw timeoutError;
    }

    const llmError = new LLMError(error.message || 'Streaming failed');
    llmError.accumulated = accumulated;
    
    if (callbacks.onError) {
      callbacks.onError(llmError);
    }
    
    throw llmError;
  }
}

/**
 * sendLLMMessageStream
 * 
 * High-level function to send a message and stream the response.
 * Combines context construction with streaming LLM call.
 * 
 * @param {string} projectId - Project ID
 * @param {string} chatId - Chat ID
 * @param {Object} message - User message
 * @param {Object} [options] - Options for the LLM call
 * @param {Object} [callbacks] - Streaming callbacks
 * @returns {AsyncGenerator} Yields tokens as they arrive
 */
async function* sendLLMMessageStream(projectId, chatId, message, options = {}, callbacks = {}) {
  const chatService = require('./chatService');
  
  // Get chat
  const chat = await chatService.getChat(projectId, chatId);
  
  // Get project for model selection
  const project = await projectService.getProject(projectId);
  const model = options.model || project.default_model || 'openai/gpt-4o-mini';
  
  // Construct context
  const context = await constructContext(chat, message, model);
  
  // Create abort controller for this request
  const controller = new AbortController();
  const requestId = require('uuid').v4();
  
  // Register active request
  registerActiveRequest(chatId, requestId, controller);
  
  try {
    // Stream LLM response
    const stream = streamLLMResponse({
      model,
      messages: context,
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      abortSignal: controller.signal
    }, callbacks);
    
    for await (const chunk of stream) {
      yield chunk;
    }
  } finally {
    // Unregister active request
    unregisterActiveRequest(chatId);
  }
}

module.exports = {
  callLLM,
  constructContext,
  sendLLMMessage,
  streamLLMResponse,
  sendLLMMessageStream,
  countTokens,
  // Active request management
  registerActiveRequest,
  unregisterActiveRequest,
  getActiveRequest,
  cancelActiveRequest,
  // Export error classes for testing
  ValidationError,
  ConfigError,
  LLMError,
  TimeoutError,
  RateLimitError,
  AuthenticationError
};