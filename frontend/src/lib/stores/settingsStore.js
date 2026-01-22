/**
 * Settings Store
 * 
 * Manages user preferences and application settings.
 * Persists settings to localStorage.
 */

import { writable, get } from 'svelte/store';

// Default settings
const defaultSettings = {
  // UI Settings
  ui: {
    sidebarWidth: 288, // 72 * 4 = 288px (w-72)
    fontSize: 'medium', // small, medium, large
    messageSpacing: 'normal', // compact, normal, relaxed
    showTimestamps: true,
    showModelInfo: true,
    enableAnimations: true
  },
  
  // Editor Settings
  editor: {
    sendOnEnter: true,
    showCharacterCount: false,
    autoFocus: true,
    spellCheck: true
  },
  
  // Chat Settings
  chat: {
    defaultModel: 'openai/gpt-4o-mini',
    maxContextTokens: 32000,
    temperature: 0.7,
    streamResponses: true,
    autoScroll: true
  },
  
  // Notification Settings
  notifications: {
    enabled: true,
    sound: false,
    desktop: false
  },
  
  // Privacy Settings
  privacy: {
    saveHistory: true,
    analytics: false
  }
};

// Create settings store with localStorage persistence
function createSettingsStore() {
  // Load from localStorage or use defaults
  let initialSettings = { ...defaultSettings };
  
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('oinkerui_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Deep merge with defaults to handle new settings
        initialSettings = deepMerge(defaultSettings, parsed);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  const { subscribe, set, update } = writable(initialSettings);
  
  // Save to localStorage on changes
  if (typeof window !== 'undefined') {
    subscribe(value => {
      try {
        localStorage.setItem('oinkerui_settings', JSON.stringify(value));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    });
  }
  
  return {
    subscribe,
    
    /**
     * Update a specific setting category
     */
    updateCategory(category, updates) {
      update(settings => ({
        ...settings,
        [category]: { ...settings[category], ...updates }
      }));
    },
    
    /**
     * Update a single setting
     */
    updateSetting(category, key, value) {
      update(settings => ({
        ...settings,
        [category]: { ...settings[category], [key]: value }
      }));
    },
    
    /**
     * Reset all settings to defaults
     */
    reset() {
      set({ ...defaultSettings });
    },
    
    /**
     * Reset a specific category to defaults
     */
    resetCategory(category) {
      update(settings => ({
        ...settings,
        [category]: { ...defaultSettings[category] }
      }));
    },
    
    /**
     * Export settings as JSON
     */
    export() {
      return JSON.stringify(get({ subscribe }), null, 2);
    },
    
    /**
     * Import settings from JSON
     */
    import(json) {
      try {
        const imported = JSON.parse(json);
        const merged = deepMerge(defaultSettings, imported);
        set(merged);
        return true;
      } catch (error) {
        console.error('Failed to import settings:', error);
        return false;
      }
    }
  };
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

export const settings = createSettingsStore();

// Derived stores for specific settings
import { derived } from 'svelte/store';

export const uiSettings = derived(settings, $settings => $settings.ui);
export const editorSettings = derived(settings, $settings => $settings.editor);
export const chatSettings = derived(settings, $settings => $settings.chat);
export const notificationSettings = derived(settings, $settings => $settings.notifications);
export const privacySettings = derived(settings, $settings => $settings.privacy);