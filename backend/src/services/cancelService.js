/**
 * Cancel Service
 * 
 * Manages active request tracking and cancellation for LLM requests.
 * Provides centralized request lifecycle management with timeout support.
 * 
 * Spec Reference: spec/functions/backend_node/cancel_request.yaml
 */

const { v4: uuidv4 } = require('uuid');
const { ValidationError, NotFoundError } = require('../errors');

// Map of chatId -> { requestId, type, controller, startedAt, partialResponse, timeoutId }
const activeRequests = new Map();

// Default timeout in milliseconds (2 minutes)
const DEFAULT_TIMEOUT_MS = 120000;

/**
 * Register a new active request for tracking
 * 
 * @param {string} chatId - Chat ID
 * @param {Object} options - Request options
 * @param {string} [options.type='llm'] - Request type ('llm', 'tool', 'workflow')
 * @param {number} [options.timeout] - Timeout in milliseconds
 * @param {Function} [options.onTimeout] - Callback when timeout occurs
 * @returns {Object} Request tracking info with controller
 */
function registerRequest(chatId, options = {}) {
  if (!chatId) {
    throw new ValidationError('Chat ID is required');
  }
  
  // Cancel any existing request for this chat
  if (activeRequests.has(chatId)) {
    cancelRequest(chatId);
  }
  
  const controller = new AbortController();
  const requestId = uuidv4();
  const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
  
  const requestInfo = {
    requestId,
    type: options.type || 'llm',
    controller,
    startedAt: Date.now(),
    partialResponse: '',
    timeoutId: null
  };
  
  // Set up timeout auto-cancellation
  if (timeout > 0) {
    requestInfo.timeoutId = setTimeout(() => {
      console.log('Request timeout:', {
        event: 'request_timeout',
        chatId,
        requestId,
        timeout,
        elapsed: Date.now() - requestInfo.startedAt
      });
      
      // Call timeout callback if provided
      if (options.onTimeout) {
        options.onTimeout(requestInfo);
      }
      
      // Cancel the request
      cancelRequest(chatId);
    }, timeout);
  }
  
  activeRequests.set(chatId, requestInfo);
  
  console.log('Request registered:', {
    event: 'request_registered',
    chatId,
    requestId,
    type: requestInfo.type,
    timeout
  });
  
  return {
    requestId,
    controller,
    signal: controller.signal
  };
}

/**
 * Update partial response for an active request
 * 
 * @param {string} chatId - Chat ID
 * @param {string} content - Partial response content to append
 */
function updatePartialResponse(chatId, content) {
  const request = activeRequests.get(chatId);
  if (request) {
    request.partialResponse += content;
  }
}

/**
 * Get partial response for an active request
 * 
 * @param {string} chatId - Chat ID
 * @returns {string} Partial response content
 */
function getPartialResponse(chatId) {
  const request = activeRequests.get(chatId);
  return request ? request.partialResponse : '';
}

/**
 * Get active request info for a chat
 * 
 * @param {string} chatId - Chat ID
 * @returns {Object|null} Active request info or null
 */
function getActiveRequest(chatId) {
  const request = activeRequests.get(chatId);
  if (!request) return null;
  
  return {
    requestId: request.requestId,
    type: request.type,
    startedAt: request.startedAt,
    elapsed: Date.now() - request.startedAt,
    hasPartialResponse: request.partialResponse.length > 0
  };
}

/**
 * Check if a chat has an active request
 * 
 * @param {string} chatId - Chat ID
 * @returns {boolean} True if active request exists
 */
function hasActiveRequest(chatId) {
  return activeRequests.has(chatId);
}

/**
 * Cancel an active request
 * 
 * @param {string} chatId - Chat ID
 * @returns {Object} Cancellation result
 */
function cancelRequest(chatId) {
  const request = activeRequests.get(chatId);
  
  if (!request) {
    return {
      cancelled: false,
      requestId: null,
      requestType: null,
      partialResponse: null
    };
  }
  
  // Clear timeout if set
  if (request.timeoutId) {
    clearTimeout(request.timeoutId);
  }
  
  // Trigger abort signal
  try {
    request.controller.abort();
  } catch (error) {
    console.warn('Error aborting request:', error.message);
  }
  
  const result = {
    cancelled: true,
    requestId: request.requestId,
    requestType: request.type,
    partialResponse: request.partialResponse || null
  };
  
  // Remove from tracking
  activeRequests.delete(chatId);
  
  console.log('Request cancelled:', {
    event: 'request_cancelled',
    chatId,
    requestId: request.requestId,
    type: request.type,
    elapsed: Date.now() - request.startedAt,
    hasPartialResponse: !!request.partialResponse
  });
  
  return result;
}

/**
 * Unregister a request (called on successful completion)
 * 
 * @param {string} chatId - Chat ID
 */
function unregisterRequest(chatId) {
  const request = activeRequests.get(chatId);
  
  if (request) {
    // Clear timeout if set
    if (request.timeoutId) {
      clearTimeout(request.timeoutId);
    }
    
    activeRequests.delete(chatId);
    
    console.log('Request unregistered:', {
      event: 'request_unregistered',
      chatId,
      requestId: request.requestId,
      elapsed: Date.now() - request.startedAt
    });
  }
}

/**
 * Get all active requests (for debugging/monitoring)
 * 
 * @returns {Array} Array of active request info
 */
function getAllActiveRequests() {
  const requests = [];
  for (const [chatId, request] of activeRequests) {
    requests.push({
      chatId,
      requestId: request.requestId,
      type: request.type,
      startedAt: request.startedAt,
      elapsed: Date.now() - request.startedAt
    });
  }
  return requests;
}

/**
 * Clear all active requests (for cleanup/shutdown)
 */
function clearAllRequests() {
  for (const [chatId] of activeRequests) {
    cancelRequest(chatId);
  }
}

module.exports = {
  registerRequest,
  updatePartialResponse,
  getPartialResponse,
  getActiveRequest,
  hasActiveRequest,
  cancelRequest,
  unregisterRequest,
  getAllActiveRequests,
  clearAllRequests,
  DEFAULT_TIMEOUT_MS
};