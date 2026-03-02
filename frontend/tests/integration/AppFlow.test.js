import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the stores
vi.mock('../../src/lib/stores/chatStore.js', () => {
  const { writable } = require('svelte/store');
  return {
    currentChat: writable(null),
    messages: writable([]),
    chats: writable([]),
    setChats: vi.fn(),
    addChat: vi.fn(),
    selectChat: vi.fn(),
    clearChats: vi.fn(),
    setMessages: vi.fn()
  };
});

vi.mock('../../src/lib/stores/projectStore.js', () => {
  const { writable } = require('svelte/store');
  return {
    currentProject: writable(null),
    projects: writable([]),
    setProjects: vi.fn(),
    addProject: vi.fn()
  };
});

vi.mock('../../src/lib/stores/uiStore.js', () => {
  const { writable } = require('svelte/store');
  const themeStore = writable('dark');
  themeStore.toggle = vi.fn();
  return {
    loading: writable(false),
    streaming: writable(false),
    theme: themeStore,
    sidebarCollapsed: writable(false),
    stopStreaming: vi.fn(),
    startStreaming: vi.fn()
  };
});

vi.mock('../../src/lib/stores/contextStore.js', () => {
  const { writable, derived } = require('svelte/store');
  const tokenStats = writable({ total: 0, available: 32000, usagePercent: 0, system: 0, messages: 0, remaining: 32000 });
  const contextMessages = writable([]);
  const pinnedMessages = writable([]);
  const contextDisplay = writable({ isExpanded: false });
  return {
    tokenStats,
    contextMessages,
    pinnedMessages,
    contextDisplay,
    contextConfig: writable({ maxTokens: 32000, reservedTokens: 1000, tokenEstimateRatio: 4 }),
    toggleContextPanel: vi.fn()
  };
});

vi.mock('../../src/lib/utils/api.js', () => ({
  projectApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 'new-proj', name: 'Test', slug: 'test', status: 'active' })
  },
  chatApi: {
    list: vi.fn().mockResolvedValue({ success: true, data: [] }),
    create: vi.fn().mockResolvedValue({ success: true, data: { id: 'new-chat', name: 'New Chat', status: 'active' } }),
    cancel: vi.fn(),
    getStatus: vi.fn()
  },
  messageApi: {
    list: vi.fn().mockResolvedValue({ success: true, data: [] })
  },
  healthApi: {
    check: vi.fn().mockResolvedValue({ status: 'ok' })
  },
  templateApi: {
    list: vi.fn().mockResolvedValue([])
  },
  modelApi: {
    list: vi.fn().mockResolvedValue({ models: [], default_model: 'openai/gpt-4o-mini', allow_custom: true })
  }
}));

import App from '../../src/App.svelte';
import { projectApi } from '../../src/lib/utils/api.js';
import { projects, currentProject, setProjects } from '../../src/lib/stores/projectStore.js';
import { chats, currentChat } from '../../src/lib/stores/chatStore.js';

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentProject.set(null);
    currentChat.set(null);
    projects.set([]);
    chats.set([]);
  });

  it('renders the main layout with header, sidebar, and workspace', async () => {
    render(App);
    // Should have the OinkerUI text (appears in header breadcrumb and sidebar)
    const oinkerElements = screen.getAllByText('OinkerUI');
    expect(oinkerElements.length).toBeGreaterThan(0);
    // Should have Projects tab (may appear multiple times)
    const projectElements = screen.getAllByText('Projects');
    expect(projectElements.length).toBeGreaterThan(0);
    // Should have Connected status (async health check)
    await vi.waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('loads projects on mount', async () => {
    projectApi.list.mockResolvedValue([
      { id: 'p1', name: 'Project 1', status: 'active' }
    ]);

    render(App);

    // Wait for onMount to complete
    await vi.waitFor(() => {
      expect(projectApi.list).toHaveBeenCalled();
    });
  });

  it('shows create project modal when + button is clicked', async () => {
    render(App);

    // Find and click the new project button (+ icon in Projects section)
    const addButtons = screen.getAllByTitle('New Project');
    await fireEvent.click(addButtons[0]);

    // Modal should appear
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  });

  it('shows settings modal when settings button is clicked', async () => {
    render(App);

    // Find settings button in header
    const settingsButtons = screen.getAllByTitle('Settings');
    await fireEvent.click(settingsButtons[0]);

    // Settings modal should appear
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Server Status')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('shows profile modal when profile button is clicked', async () => {
    render(App);

    // Find profile button
    const profileButton = screen.getByTitle('Profile');
    await fireEvent.click(profileButton);

    // Profile modal should appear
    expect(screen.getByText('Local User')).toBeInTheDocument();
    expect(screen.getByText('OinkerUI Developer')).toBeInTheDocument();
  });

  it('closes modals on Escape key', async () => {
    render(App);

    // Open settings
    const settingsButtons = screen.getAllByTitle('Settings');
    await fireEvent.click(settingsButtons[0]);
    expect(screen.getByText('Appearance')).toBeInTheDocument();

    // Press Escape
    await fireEvent.keyDown(window, { key: 'Escape' });

    // Modal should be closed
    expect(screen.queryByText('Appearance')).not.toBeInTheDocument();
  });
});