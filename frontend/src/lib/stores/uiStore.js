import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Sidebar state
export const sidebarCollapsed = writable(false);

// Theme management
function createThemeStore() {
  // Get initial theme from localStorage or system preference
  let initialTheme = 'light';
  
  if (browser) {
    const stored = localStorage.getItem('theme');
    if (stored) {
      initialTheme = stored;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initialTheme = 'dark';
    }
  }
  
  const { subscribe, set, update } = writable(initialTheme);
  
  return {
    subscribe,
    set: (value) => {
      if (browser) {
        localStorage.setItem('theme', value);
        // Update document class
        if (value === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      set(value);
    },
    toggle: () => {
      update(current => {
        const newTheme = current === 'light' ? 'dark' : 'light';
        if (browser) {
          localStorage.setItem('theme', newTheme);
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return newTheme;
      });
    }
  };
}

export const theme = createThemeStore();

// Loading states
export const loading = writable(false);
export const loadingMessage = writable('');

// Streaming state for LLM requests
export const streaming = writable({
  isActive: false,
  chatId: null,
  requestType: 'llm',
  startedAt: null
});

export function startStreaming(chatId, requestType = 'llm') {
  streaming.set({
    isActive: true,
    chatId,
    requestType,
    startedAt: Date.now()
  });
}

export function stopStreaming() {
  streaming.set({
    isActive: false,
    chatId: null,
    requestType: 'llm',
    startedAt: null
  });
}

// Notifications/toasts
export const notifications = writable([]);

export function addNotification(notification) {
  const id = Date.now();
  notifications.update(n => [...n, { id, ...notification }]);
  
  // Auto-remove after duration
  if (notification.duration !== 0) {
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 5000);
  }
  
  return id;
}

export function removeNotification(id) {
  notifications.update(n => n.filter(item => item.id !== id));
}

// Modal state
export const modal = writable({
  isOpen: false,
  component: null,
  props: {}
});

export function openModal(component, props = {}) {
  modal.set({ isOpen: true, component, props });
}

export function closeModal() {
  modal.set({ isOpen: false, component: null, props: {} });
}

// Error state
export const error = writable(null);

export function setError(err) {
  error.set(err);
}

export function clearError() {
  error.set(null);
}