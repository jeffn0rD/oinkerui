/**
 * Sync Store
 * 
 * Handles synchronization between frontend state and backend API.
 * Provides actions that update both local state and backend.
 */

import { get } from 'svelte/store';
import { projectApi, chatApi, messageApi } from '../utils/api.js';
import { 
  projects, currentProject, setProjects, addProject, updateProject, removeProject, selectProject,
  projectsLoading 
} from './projectStore.js';
import { 
  chats, currentChat, messages, setChats, addChat, updateChat, removeChat, selectChat,
  setMessages, addMessage, updateMessage, replaceMessage, clearChats,
  chatsLoading, messagesLoading 
} from './chatStore.js';
import { loading, setError, addNotification } from './uiStore.js';

/**
 * Project Sync Actions
 */
export const projectSync = {
  /**
   * Fetch all projects from backend
   */
  async fetchAll() {
    projectsLoading.set(true);
    try {
      const data = await projectApi.list();
      setProjects(data.projects || data || []);
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
      const project = await projectApi.get(projectId);
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
      const project = await projectApi.create({ name, ...options });
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
      const project = await projectApi.update(projectId, updates);
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

/**
 * Chat Sync Actions
 */
export const chatSync = {
  /**
   * Fetch all chats for a project
   */
  async fetchAll(projectId) {
    chatsLoading.set(true);
    try {
      const data = await chatApi.list(projectId);
      setChats(data.chats || data || []);
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
      const chat = await chatApi.get(projectId, chatId);
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
      const chat = await chatApi.create(projectId, options);
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
      const chat = await chatApi.update(projectId, chatId, updates);
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
   * Select a chat and load its messages
   */
  async select(projectId, chat) {
    selectChat(chat);
    if (chat) {
      await messageSync.fetchAll(projectId, chat.id);
    }
  }
};

/**
 * Message Sync Actions
 */
export const messageSync = {
  /**
   * Fetch all messages for a chat
   */
  async fetchAll(projectId, chatId) {
    messagesLoading.set(true);
    try {
      const data = await messageApi.list(projectId, chatId);
      setMessages(data.messages || data || []);
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
   * Send a message and get AI response
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
    
    try {
      const response = await messageApi.send(projectId, chatId, {
        raw_text: content,
        ...options
      });
      
      // Replace temp message with real one
      if (response.userMessage) {
        replaceMessage(tempId, response.userMessage);
      }
      
      // Add assistant response if present
      if (response.assistantMessage) {
        addMessage(response.assistantMessage);
      }
      
      return response;
    } catch (error) {
      // Remove temp message on error
      removeMessage(tempId);
      setError(error);
      addNotification({ type: 'error', message: 'Failed to send message' });
      throw error;
    } finally {
      loading.set(false);
    }
  },

  /**
   * Update a message (e.g., pin/unpin)
   */
  async update(projectId, chatId, messageId, updates) {
    try {
      // Optimistic update
      updateMessage(messageId, updates);
      
      // TODO: Add backend API for message updates when available
      // const message = await messageApi.update(projectId, chatId, messageId, updates);
      // updateMessage(messageId, message);
      
      return { id: messageId, ...updates };
    } catch (error) {
      setError(error);
      throw error;
    }
  }
};

/**
 * Initialize all stores by fetching data from backend
 */
export async function initializeFromBackend() {
  try {
    await projectSync.fetchAll();
    
    // If there's a stored current project, select it
    const stored = localStorage.getItem('currentProjectId');
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

// Subscribe to store changes to persist selections
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