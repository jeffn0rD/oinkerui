import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock the stores before importing the component
vi.mock('../../src/lib/stores/chatStore.js', () => {
  const { writable } = require('svelte/store');
  return {
    currentChat: writable(null),
    messages: writable([]),
    chats: writable([])
  };
});

vi.mock('../../src/lib/stores/projectStore.js', () => {
  const { writable } = require('svelte/store');
  return {
    currentProject: writable(null),
    projects: writable([])
  };
});

vi.mock('../../src/lib/stores/uiStore.js', () => {
  const { writable } = require('svelte/store');
  return {
    loading: writable(false),
    streaming: writable(false),
    theme: writable('dark'),
    stopStreaming: vi.fn(),
    startStreaming: vi.fn()
  };
});

vi.mock('../../src/lib/utils/api.js', () => ({
  chatApi: {
    cancel: vi.fn(),
    getStatus: vi.fn()
  }
}));

import ChatInterface from '../../src/lib/components/ChatInterface.svelte';
import { currentChat, messages } from '../../src/lib/stores/chatStore.js';
import { currentProject } from '../../src/lib/stores/projectStore.js';

describe('Chat Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores
    currentChat.set(null);
    currentProject.set(null);
    messages.set([]);
  });

  it('renders chat interface with empty state when no chat selected', () => {
    render(ChatInterface);
    // When no chat is selected, it shows the empty state
    expect(screen.getByText('Select a chat to start')).toBeInTheDocument();
  });

  it('renders message input when chat is selected', () => {
    // Set up stores with a selected chat (status must be 'active' for normal placeholder)
    currentProject.set({ id: 'proj-1', name: 'Test Project' });
    currentChat.set({ id: 'chat-1', name: 'Test Chat', status: 'active' });
    messages.set([]);
    
    render(ChatInterface);
    
    // Should show the message input area
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
  });

  it('displays messages when chat has messages', () => {
    // Set up stores with messages
    currentProject.set({ id: 'proj-1', name: 'Test Project' });
    currentChat.set({ id: 'chat-1', name: 'Test Chat' });
    messages.set([
      { id: '1', role: 'user', content: 'Hello', created_at: new Date().toISOString() },
      { id: '2', role: 'assistant', content: 'Hi there!', created_at: new Date().toISOString() }
    ]);
    
    render(ChatInterface);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });
});