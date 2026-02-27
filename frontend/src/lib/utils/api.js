/**
 * API Utility
 * 
 * Handles HTTP requests to the backend API.
 * Provides typed API clients for all backend endpoints.
 * 
 * Spec: spec/functions/frontend_svelte/api_client.yaml
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// =============================================================================
// Error Classes
// =============================================================================

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class NetworkError extends ApiError {
  constructor(message) {
    super(message, 0, null);
    this.name = 'NetworkError';
  }
}

class ValidationError extends ApiError {
  constructor(message, data = null) {
    super(message, 400, data);
    this.name = 'ValidationError';
  }
}

// =============================================================================
// Core Request Function
// =============================================================================

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  
  try {
    const response = await fetch(url, config);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      const message = data?.message || data?.error || 'Request failed';
      if (response.status === 400) {
        throw new ValidationError(message, data);
      }
      throw new ApiError(message, response.status, data);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error or other issue
    throw new NetworkError(error.message || 'Network error');
  }
}

// =============================================================================
// Project API
// =============================================================================

export const projectApi = {
  list: () => request('/projects'),
  
  get: (projectId) => request(`/projects/${projectId}`),
  
  create: (data) => request('/projects', {
    method: 'POST',
    body: data
  }),
  
  update: (projectId, data) => request(`/projects/${projectId}`, {
    method: 'PUT',
    body: data
  }),
  
  delete: (projectId, hard = false) => request(`/projects/${projectId}?hard=${hard}`, {
    method: 'DELETE'
  })
};

// =============================================================================
// Chat API
// =============================================================================

export const chatApi = {
  list: (projectId) => request(`/projects/${projectId}/chats`),
  
  get: (projectId, chatId) => request(`/projects/${projectId}/chats/${chatId}`),
  
  create: (projectId, data = {}) => request(`/projects/${projectId}/chats`, {
    method: 'POST',
    body: data
  }),
  
  update: (projectId, chatId, data) => request(`/projects/${projectId}/chats/${chatId}`, {
    method: 'PUT',
    body: data
  }),
  
  delete: (projectId, chatId, hard = false) => 
    request(`/projects/${projectId}/chats/${chatId}?hard=${hard}`, {
      method: 'DELETE'
    }),
  
  /**
   * Fork a chat with optional message point and pruning
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID to fork
   * @param {Object} options - Fork options
   * @param {string} [options.fromMessageId] - Fork from this message
   * @param {boolean} [options.prune] - Exclude discarded/excluded messages
   * @param {string} [options.name] - Name for the forked chat
   * @returns {Promise<Object>} Forked chat object
   */
  fork: (projectId, chatId, options = {}) =>
    request(`/projects/${projectId}/chats/${chatId}/fork`, {
      method: 'POST',
      body: options
    }),
  
  /**
   * Cancel an active LLM request for a chat
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Cancellation result
   */
  cancel: (projectId, chatId) =>
    request(`/projects/${projectId}/chats/${chatId}/cancel`, {
      method: 'POST'
    }),
  
  /**
   * Get active request status for a chat
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Status info
   */
  getStatus: (projectId, chatId) =>
    request(`/projects/${projectId}/chats/${chatId}/status`),
  
  /**
   * Get active request info for a chat
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Active request info
   */
  getActiveRequest: (projectId, chatId) =>
    request(`/projects/${projectId}/chats/${chatId}/active-request`),
  
  /**
   * Get context preview for a chat
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @param {Object} options - Preview options
   * @param {string} [options.draftMessage] - Draft message to include
   * @param {string} [options.modelId] - Model for token limits
   * @returns {Promise<Object>} Context preview with token counts
   */
  contextPreview: (projectId, chatId, options = {}) =>
    request(`/projects/${projectId}/chats/${chatId}/context-preview`, {
      method: 'POST',
      body: options
    })
};

// =============================================================================
// Message API
// =============================================================================

export const messageApi = {
  list: (projectId, chatId) => 
    request(`/projects/${projectId}/chats/${chatId}/messages`),
  
  get: (projectId, chatId, messageId) => 
    request(`/projects/${projectId}/chats/${chatId}/messages/${messageId}`),
  
  send: (projectId, chatId, data) => 
    request(`/projects/${projectId}/chats/${chatId}/messages`, {
      method: 'POST',
      body: data
    }),
  
  /**
   * Update message flags (pin, discard, include_in_context, aside)
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID
   * @param {Object} flags - Flags to update
   * @returns {Promise<Object>} Updated message
   */
  updateFlags: (projectId, chatId, messageId, flags) =>
    request(`/projects/${projectId}/chats/${chatId}/messages/${messageId}/flags`, {
      method: 'PATCH',
      body: flags
    }),
  
  /**
   * Requery - regenerate the last LLM response
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @param {Object} options - Requery options
   * @param {boolean} [options.keepPrevious] - Keep previous response as branch
   * @param {string} [options.modelId] - Model override
   * @param {number} [options.temperature] - Temperature override
   * @returns {Promise<Object>} Requery result
   */
  requery: (projectId, chatId, options = {}) =>
    request(`/projects/${projectId}/chats/${chatId}/requery`, {
      method: 'POST',
      body: options
    }),
  
  /**
   * Stream a message response using Server-Sent Events
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @param {Object} data - Message data
   * @param {Object} callbacks - Event callbacks
   * @param {Function} callbacks.onToken - Called for each token
   * @param {Function} callbacks.onComplete - Called when streaming completes
   * @param {Function} callbacks.onError - Called on error
   * @returns {AbortController} Controller to cancel the stream
   */
  stream: (projectId, chatId, data, callbacks = {}) => {
    const controller = new AbortController();
    const url = `${API_BASE_URL}/projects/${projectId}/chats/${chatId}/messages/stream`;
    
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (callbacks.onError) {
          callbacks.onError(new ApiError(
            errorData.error || 'Stream request failed',
            response.status,
            errorData
          ));
        }
        return;
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process SSE events from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                if (callbacks.onComplete) {
                  callbacks.onComplete(fullContent);
                }
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.error) {
                  if (callbacks.onError) {
                    callbacks.onError(new ApiError(parsed.error, 500));
                  }
                  return;
                }
                
                if (parsed.token) {
                  fullContent += parsed.token;
                  if (callbacks.onToken) {
                    callbacks.onToken(parsed.token, fullContent);
                  }
                }
                
                if (parsed.done) {
                  if (callbacks.onComplete) {
                    callbacks.onComplete(fullContent, parsed);
                  }
                  return;
                }
              } catch (e) {
                // Non-JSON data line, treat as token
                fullContent += data;
                if (callbacks.onToken) {
                  callbacks.onToken(data, fullContent);
                }
              }
            }
          }
        }
        
        // Stream ended without [DONE]
        if (callbacks.onComplete) {
          callbacks.onComplete(fullContent);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          if (callbacks.onComplete) {
            callbacks.onComplete(fullContent);
          }
        } else if (callbacks.onError) {
          callbacks.onError(error);
        }
      }
    }).catch((error) => {
      if (error.name !== 'AbortError' && callbacks.onError) {
        callbacks.onError(new NetworkError(error.message));
      }
    });
    
    return controller;
  }
};

// =============================================================================
// Command API
// =============================================================================

export const commandApi = {
  /**
   * List all available commands
   * @returns {Promise<Object>} Command list
   */
  list: () => request('/commands'),
  
  /**
   * Get details for a specific command
   * @param {string} commandName - Command name
   * @returns {Promise<Object>} Command details
   */
  get: (commandName) => request(`/commands/${commandName}`)
};

// =============================================================================
// Health API
// =============================================================================

export const healthApi = {
  check: () => request('/health')
};

export { ApiError, NetworkError, ValidationError, request };