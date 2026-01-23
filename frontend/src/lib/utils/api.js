/**
 * API Utility
 * 
 * Handles HTTP requests to the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

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
      throw new ApiError(
        data.message || data.error || 'Request failed',
        response.status,
        data
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error or other issue
    throw new ApiError(
      error.message || 'Network error',
      0,
      null
    );
  }
}

// Project API
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

// Chat API
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
    request(`/projects/${projectId}/chats/${chatId}/status`)
};

// Message API
export const messageApi = {
  list: (projectId, chatId) => 
    request(`/projects/${projectId}/chats/${chatId}/messages`),
  
  get: (projectId, chatId, messageId) => 
    request(`/projects/${projectId}/chats/${chatId}/messages/${messageId}`),
  
  send: (projectId, chatId, data) => 
    request(`/projects/${projectId}/chats/${chatId}/messages`, {
      method: 'POST',
      body: data
    })
};

// Health check
export const healthApi = {
  check: () => request('/health')
};

export { ApiError, request };