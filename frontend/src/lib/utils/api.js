/**
 * API Utility
 * 
 * Handles HTTP requests to the backend API.
 * Provides typed API clients for all backend endpoints.
 * 
 * Spec: spec/functions/frontend_svelte/api_client.yaml
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
  
  fork: (projectId, chatId, options = {}) =>
    request(`/projects/${projectId}/chats/${chatId}/fork`, {
      method: 'POST',
      body: options
    }),
  
  cancel: (projectId, chatId) =>
    request(`/projects/${projectId}/chats/${chatId}/cancel`, {
      method: 'POST'
    }),
  
  getStatus: (projectId, chatId) =>
    request(`/projects/${projectId}/chats/${chatId}/status`),
  
  getActiveRequest: (projectId, chatId) =>
    request(`/projects/${projectId}/chats/${chatId}/active-request`),
  
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
  
  updateFlags: (projectId, chatId, messageId, flags) =>
    request(`/projects/${projectId}/chats/${chatId}/messages/${messageId}/flags`, {
      method: 'PATCH',
      body: flags
    }),
  
  requery: (projectId, chatId, options = {}) =>
    request(`/projects/${projectId}/chats/${chatId}/requery`, {
      method: 'POST',
      body: options
    }),
  
  /**
   * Stream a message response using Server-Sent Events.
   * 
   * The backend sends NAMED SSE events:
   *   event: user_message\ndata: {...}\n\n
   *   event: chunk\ndata: {"content":"...", "accumulated":"...", "done":false}\n\n
   *   event: done\ndata: {"message":{...}, "usage":{...}}\n\n
   *   event: error\ndata: {"error":"..."}\n\n
   *   event: cancelled\ndata: {"reason":"..."}\n\n
   * 
   * This parser handles both named events AND plain data-only lines for robustness.
   * 
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @param {Object} data - Message data (raw_text, model_id, is_aside, pure_aside)
   * @param {Object} callbacks - Event callbacks
   * @param {Function} callbacks.onToken - Called for each token: (token, fullContent)
   * @param {Function} callbacks.onComplete - Called when streaming completes: (fullContent, metadata)
   * @param {Function} callbacks.onError - Called on error: (error)
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
      let currentEventType = null;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE events from buffer
          // SSE events are separated by double newlines
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || ''; // Keep incomplete event in buffer
          
          for (const part of parts) {
            if (!part.trim()) continue;
            
            const lines = part.split('\n');
            let eventType = null;
            let eventData = null;
            
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                eventData = line.slice(6);
              } else if (line.startsWith('data:')) {
                eventData = line.slice(5);
              }
            }
            
            // If no event type, fall back to tracking state
            if (!eventType && currentEventType) {
              eventType = currentEventType;
            }
            
            if (eventData === null) continue;
            
            // Handle [DONE] sentinel
            if (eventData.trim() === '[DONE]') {
              if (callbacks.onComplete) {
                callbacks.onComplete(fullContent);
              }
              return;
            }
            
            try {
              const parsed = JSON.parse(eventData);
              
              // Route based on event type
              switch (eventType) {
                case 'user_message':
                  // User message saved on server - we already show it locally
                  break;
                  
                case 'chunk':
                  // Streaming token chunk
                  if (parsed.content) {
                    fullContent = parsed.accumulated || (fullContent + parsed.content);
                    if (callbacks.onToken) {
                      callbacks.onToken(parsed.content, fullContent);
                    }
                  }
                  break;
                  
                case 'done':
                  // Stream complete
                  if (parsed.message?.content) {
                    fullContent = parsed.message.content;
                  }
                  if (callbacks.onComplete) {
                    callbacks.onComplete(fullContent, parsed);
                  }
                  return;
                  
                case 'error':
                  if (callbacks.onError) {
                    callbacks.onError(new ApiError(
                      parsed.error || 'Stream error',
                      500,
                      parsed
                    ));
                  }
                  return;
                  
                case 'cancelled':
                  if (callbacks.onComplete) {
                    const cancelContent = parsed.message?.content || fullContent;
                    callbacks.onComplete(cancelContent, { cancelled: true });
                  }
                  return;
                  
                default:
                  // Unknown or no event type - try to handle generically
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
                  if (parsed.content && !eventType) {
                    fullContent = parsed.accumulated || (fullContent + parsed.content);
                    if (callbacks.onToken) {
                      callbacks.onToken(parsed.content, fullContent);
                    }
                  }
                  if (parsed.done) {
                    if (callbacks.onComplete) {
                      callbacks.onComplete(fullContent, parsed);
                    }
                    return;
                  }
                  break;
              }
            } catch (e) {
              // Non-JSON data line - treat as raw token
              if (eventData.trim()) {
                fullContent += eventData;
                if (callbacks.onToken) {
                  callbacks.onToken(eventData, fullContent);
                }
              }
            }
          }
        }
        
        // Stream ended without explicit done event
        if (callbacks.onComplete) {
          callbacks.onComplete(fullContent);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          if (callbacks.onComplete) {
            callbacks.onComplete(fullContent, { cancelled: true });
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
// Model API
// =============================================================================

export const modelApi = {
  /**
   * List available models from the server
   * @returns {Promise<Object>} Model list with defaults and custom entries
   */
  list: () => request('/models'),
};

// =============================================================================
// Template API
// =============================================================================

export const templateApi = {
  list: (options = {}) => {
    const params = new URLSearchParams();
    if (options.projectId) params.set('projectId', options.projectId);
    if (options.category) params.set('category', options.category);
    if (options.search) params.set('search', options.search);
    const qs = params.toString();
    return request(`/templates${qs ? '?' + qs : ''}`);
  },

  get: (templateId, projectId) => {
    const qs = projectId ? `?projectId=${projectId}` : '';
    return request(`/templates/${templateId}${qs}`);
  },

  resolve: (templateId, variables = {}, options = {}) =>
    request('/templates/resolve', {
      method: 'POST',
      body: { templateId, variables, ...options },
    }),

  renderInline: (template, variables = {}, options = {}) =>
    request('/templates/render-inline', {
      method: 'POST',
      body: { template, variables, ...options },
    }),
};

// =============================================================================
// Command API
// =============================================================================

export const commandApi = {
  list: () => request('/commands'),
  get: (commandName) => request(`/commands/${commandName}`)
};

// =============================================================================
// Health API
// =============================================================================

export const healthApi = {
  check: () => request('/health')
};

export { ApiError, NetworkError, ValidationError, request };
