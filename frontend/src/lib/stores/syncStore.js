/**
 * Sync Store
 * 
 * Handles synchronization between frontend state and backend API.
 * Provides actions that update both local state and backend.
 * Includes streaming support and optimistic updates.
 * 
 * Spec: spec/functions/frontend_svelte/handle_send_message.yaml
 */

import { get } from 'svelte/store';
import { projectApi, chatApi, messageApi, commandApi } from '../utils/api.js';
import { 
  projects, currentProject, setProjects, addProject, updateProject, removeProject, selectProject,
  projectsLoading 
} from './projectStore.js';
import { 
  chats, currentChat, messages, setChats, addChat, updateChat, removeChat, selectChat,
  setMessages, addMessage, updateMessage, replaceMessage, clearChats,
  chatsLoading, messagesLoading 
} from './chatStore.js';
import { loading, setError, clearError, addNotification, startStreaming, stopStreaming } from './uiStore.js';

// =============================================================================
// Project Sync Actions
// =============================================================================

export const projectSync = {
  /**
   * Fetch all projects from backend
   */
  async fetchAll() {
    projectsLoading.set(true);
    try {
      const data = await projectApi.list();
      setProjects(data.projects || data.data?.projects || data || []);
      return data;
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to load projects' });
      throw error;
    } finally {
      projectsLoading.set(false);
    }
  },

  /**
   * Fetch a single project
   */
  async fetch(projectId) {
    try {
      const data = await projectApi.get(projectId);
      const project = data.data || data;
      updateProject(projectId, project);
      return project;
    } catch (error) {
      setError(error);
      throw error;
    }
  },

  /**
   * Create a new project
   */
  async create(name, options = {}) {
    loading.set(true);
    try {
      const data = await projectApi.create({ name, ...options });
      const project = data.data || data;
      addProject(project);
      addNotification({ type: 'success', message: `Project "${name}" created` });
      return project;
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to create project' });
      throw error;
    } finally {
      loading.set(false);
    }
  },

  /**
   * Update a project
   */
  async update(projectId, updates) {
    try {
      const data = await projectApi.update(projectId, updates);
      const project = data.data || data;
      updateProject(projectId, project);
      return project;
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to update project' });
      throw error;
    }
  },

  /**
   * Delete a project
   */
  async delete(projectId, hard = false) {
    try {
      await projectApi.delete(projectId, hard);
      removeProject(projectId);
      addNotification({ type: 'success', message: 'Project deleted' });
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to delete project' });
      throw error;
    }
  },

  /**
   * Select a project and load its chats
   */
  async select(project) {
    selectProject(project);
    if (project) {
      await chatSync.fetchAll(project.id);
    } else {
      clearChats();
    }
  }
};

// =============================================================================
// Chat Sync Actions
// =============================================================================

export const chatSync = {
  /**
   * Fetch all chats for a project
   */
  async fetchAll(projectId) {
    chatsLoading.set(true);
    try {
      const data = await chatApi.list(projectId);
      setChats(data.chats || data.data?.chats || data || []);
      return data;
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to load chats' });
      throw error;
    } finally {
      chatsLoading.set(false);
    }
  },

  /**
   * Fetch a single chat
   */
  async fetch(projectId, chatId) {
    try {
      const data = await chatApi.get(projectId, chatId);
      const chat = data.data || data;
      updateChat(chatId, chat);
      return chat;
    } catch (error) {
      setError(error);
      throw error;
    }
  },

  /**
   * Create a new chat
   */
  async create(projectId, options = {}) {
    loading.set(true);
    try {
      const data = await chatApi.create(projectId, options);
      const chat = data.data || data;
      addChat(chat);
      addNotification({ type: 'success', message: 'New chat created' });
      return chat;
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to create chat' });
      throw error;
    } finally {
      loading.set(false);
    }
  },

  /**
   * Update a chat
   */
  async update(projectId, chatId, updates) {
    try {
      const data = await chatApi.update(projectId, chatId, updates);
      const chat = data.data || data;
      updateChat(chatId, chat);
      return chat;
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to update chat' });
      throw error;
    }
  },

  /**
   * Delete a chat
   */
  async delete(projectId, chatId, hard = false) {
    try {
      await chatApi.delete(projectId, chatId, hard);
      removeChat(chatId);
      addNotification({ type: 'success', message: 'Chat deleted' });
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to delete chat' });
      throw error;
    }
  },

  /**
   * Fork a chat
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID to fork
   * @param {Object} options - Fork options (fromMessageId, prune, name)
   * @returns {Promise<Object>} Forked chat
   */
  async fork(projectId, chatId, options = {}) {
    loading.set(true);
    try {
      const data = await chatApi.fork(projectId, chatId, options);
      const forkedChat = data.data || data;
      addChat(forkedChat);
      addNotification({ type: 'success', message: `Chat forked: ${forkedChat.name}` });
      return forkedChat;
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to fork chat' });
      throw error;
    } finally {
      loading.set(false);
    }
  },

  /**
   * Select a chat and load its messages
   */
  async select(projectId, chat) {
    selectChat(chat);
    if (chat) {
      await messageSync.fetchAll(projectId, chat.id);
    }
  }
};

// =============================================================================
// Message Sync Actions
// =============================================================================

// Track active stream controller for cancellation
let activeStreamController = null;

export const messageSync = {
  /**
   * Fetch all messages for a chat
   */
  async fetchAll(projectId, chatId) {
    messagesLoading.set(true);
    try {
      const data = await messageApi.list(projectId, chatId);
      setMessages(data.messages || data.data?.messages || data || []);
      return data;
    } catch (error) {
      setError(error);
      addNotification({ type: 'error', message: 'Failed to load messages' });
      throw error;
    } finally {
      messagesLoading.set(false);
    }
  },

  /**
   * Send a message and get AI response (non-streaming)
   */
  async send(projectId, chatId, content, options = {}) {
    // Create temporary user message for immediate UI feedback
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      _pending: true
    };
    
    addMessage(tempMessage);
    loading.set(true);
    clearError();
    
    try {
      const response = await messageApi.send(projectId, chatId, {
        raw_text: content,
        ...options
      });
      
      const data = response.data || response;
      
      // Replace temp message with real one
      if (data.userMessage) {
        replaceMessage(tempId, data.userMessage);
      }
      
      // Add assistant response if present
      if (data.assistantMessage) {
        addMessage(data.assistantMessage);
      }
      
      return data;
    } catch (error) {
      // Remove temp message on error
      const { removeMessage } = await import('./chatStore.js');
      removeMessage(tempId);
      setError(error);
      addNotification({ type: 'error', message: 'Failed to send message' });
      throw error;
    } finally {
      loading.set(false);
    }
  },

  /**
   * Send a message with streaming response
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @param {string} content - Message content
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async sendStream(projectId, chatId, content, options = {}) {
    // Create temporary user message
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      _pending: true
    };
    
    addMessage(tempMessage);
    loading.set(true);
    startStreaming(chatId);
    clearError();
    
    // Create placeholder for assistant response
    const assistantTempId = `assistant-temp-${Date.now()}`;
    const assistantPlaceholder = {
      id: assistantTempId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      _streaming: true
    };
    addMessage(assistantPlaceholder);
    
    // Start streaming
    activeStreamController = messageApi.stream(projectId, chatId, {
      raw_text: content,
      stream: true,
      ...options
    }, {
      onToken: (token, fullContent) => {
        // Update the assistant message with accumulated content
        updateMessage(assistantTempId, { content: fullContent });
      },
      
      onComplete: (fullContent, metadata) => {
        // Finalize the assistant message
        updateMessage(assistantTempId, {
          content: fullContent,
          _streaming: false,
          status: 'complete'
        });
        
        // Update user message if we got real IDs back
        if (metadata?.userMessageId) {
          replaceMessage(tempId, {
            ...tempMessage,
            id: metadata.userMessageId,
            _pending: false
          });
        }
        if (metadata?.assistantMessageId) {
          updateMessage(assistantTempId, {
            id: metadata.assistantMessageId
          });
        }
        
        loading.set(false);
        stopStreaming();
        activeStreamController = null;
      },
      
      onError: (error) => {
        // Remove placeholder if no content was received
        const currentMessages = get(messages);
        const assistantMsg = currentMessages.find(m => m.id === assistantTempId);
        if (assistantMsg && !assistantMsg.content) {
          const { removeMessage } = require('./chatStore.js');
          removeMessage(assistantTempId);
        } else {
          // Keep partial content but mark as error
          updateMessage(assistantTempId, {
            _streaming: false,
            _error: true,
            status: 'error'
          });
        }
        
        loading.set(false);
        stopStreaming();
        activeStreamController = null;
        setError(error);
        addNotification({ type: 'error', message: error.message || 'Streaming failed' });
      }
    });
  },

  /**
   * Cancel the active streaming request
   */
  async cancelStream(projectId, chatId) {
    if (activeStreamController) {
      activeStreamController.abort();
      activeStreamController = null;
    }
    
    // Also cancel on the backend
    try {
      await chatApi.cancel(projectId, chatId);
    } catch (error) {
      console.warn('Failed to cancel backend request:', error);
    }
    
    loading.set(false);
    stopStreaming();
  },

  /**
   * Update message flags (pin, discard, include_in_context, aside)
   * @param {string} projectId - Project ID
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID
   * @param {Object} flags - Flags to update
   * @returns {Promise<Object>} Updated message
   */
  async updateFlags(projectId, chatId, messageId, flags) {
    // Optimistic update
    updateMessage(messageId, flags);
    
    try {
      const data = await messageApi.updateFlags(projectId, chatId, messageId, flags);
      const message = data.data || data;
      updateMessage(messageId, message);
      return message;
    } catch (error) {
      // Rollback optimistic update
      const invertedFlags = {};
      for (const [key, value] of Object.entries(flags)) {
        if (typeof value === 'boolean') {
          invertedFlags[key] = !value;
        }
      }
      updateMessage(messageId, invertedFlags);
      
      setError(error);
      addNotification({ type: 'error', message: 'Failed to update message flags' });
      throw error;
    }
  }
};

// =============================================================================
// Command Sync Actions
// =============================================================================

export const commandSync = {
  /**
   * Fetch available commands
   */
  async fetchAll() {
    try {
      const data = await commandApi.list();
      return data.commands || data.data?.commands || data || [];
    } catch (error) {
      console.warn('Failed to load commands:', error);
      return [];
    }
  },

  /**
   * Get command details
   */
  async get(commandName) {
    try {
      const data = await commandApi.get(commandName);
      return data.command || data.data?.command || data;
    } catch (error) {
      console.warn(`Failed to get command ${commandName}:`, error);
      return null;
    }
  }
};

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize all stores by fetching data from backend
 */
export async function initializeFromBackend() {
  try {
    await projectSync.fetchAll();
    
    // If there's a stored current project, select it
    const stored = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
    if (stored) {
      const projectList = get(projects);
      const project = projectList.find(p => p.id === stored);
      if (project) {
        await projectSync.select(project);
        
        // Also restore current chat if stored
        const storedChatId = localStorage.getItem('currentChatId');
        if (storedChatId) {
          const chatList = get(chats);
          const chat = chatList.find(c => c.id === storedChatId);
          if (chat) {
            await chatSync.select(project.id, chat);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize from backend:', error);
  }
}

// =============================================================================
// Persistence - Subscribe to store changes
// =============================================================================

if (typeof window !== 'undefined') {
  currentProject.subscribe(project => {
    if (project) {
      localStorage.setItem('currentProjectId', project.id);
    } else {
      localStorage.removeItem('currentProjectId');
    }
  });
  
  currentChat.subscribe(chat => {
    if (chat) {
      localStorage.setItem('currentChatId', chat.id);
    } else {
      localStorage.removeItem('currentChatId');
    }
  });
}