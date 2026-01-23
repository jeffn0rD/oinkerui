import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the stores before importing the component
vi.mock('../../src/lib/stores/projectStore.js', () => {
  const { writable } = require('svelte/store');
  return {
    currentProject: writable(null),
    projects: writable([])
  };
});

vi.mock('../../src/lib/stores/chatStore.js', () => {
  const { writable } = require('svelte/store');
  return {
    currentChat: writable(null),
    chats: writable([]),
    messages: writable([])
  };
});

vi.mock('../../src/lib/stores/uiStore.js', () => {
  const { writable } = require('svelte/store');
  return {
    theme: writable('dark'),
    loading: writable(false),
    streaming: writable(false),
    stopStreaming: vi.fn(),
    startStreaming: vi.fn()
  };
});

import Header from '../../src/lib/components/Header.svelte';
import { currentProject } from '../../src/lib/stores/projectStore.js';
import { currentChat } from '../../src/lib/stores/chatStore.js';

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentProject.set(null);
    currentChat.set(null);
  });

  it('renders project name when project is selected', () => {
    currentProject.set({ id: 'proj-1', name: 'Test Project' });
    render(Header);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('shows OinkerUI branding', () => {
    render(Header);
    expect(screen.getByText('OinkerUI')).toBeInTheDocument();
  });

  it('shows chat name when chat is selected', () => {
    currentProject.set({ id: 'proj-1', name: 'Test Project' });
    currentChat.set({ id: 'chat-1', name: 'Test Chat' });
    render(Header);
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
  });

  it('shows connection status', () => {
    render(Header);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });
});