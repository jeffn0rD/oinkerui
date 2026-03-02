<script>
  import { onMount } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import ChatInterface from './lib/components/ChatInterface.svelte';
  import WorkspacePanel from './lib/components/WorkspacePanel.svelte';
  import { projects, currentProject, addProject, setProjects } from './lib/stores/projectStore';
  import { chats, currentChat, messages, setChats, addChat, selectChat, clearChats, setMessages, addMessage, updateMessage } from './lib/stores/chatStore';
  import { theme, loading, startStreaming, stopStreaming } from './lib/stores/uiStore.js';
  import { projectApi, chatApi, messageApi, healthApi } from './lib/utils/api.js';

  // Modal state
  let showCreateProject = $state(false);
  let showCreateChat = $state(false);
  let showSettings = $state(false);
  let showProfile = $state(false);
  let newProjectName = $state('');
  let newProjectDescription = $state('');
  let newChatName = $state('');
  let modalError = $state('');
  let modalLoading = $state(false);

  // Settings state
  let apiKeyMasked = $state('••••••••');
  let serverStatus = $state('checking...');

  // Active stream controller
  let activeStreamController = $state(null);

  async function checkServerStatus() {
    try {
      await healthApi.check();
      serverStatus = 'Connected';
    } catch {
      serverStatus = 'Disconnected';
    }
  }

  // Helper to unwrap API responses
  function unwrap(response) {
    if (response && response.data !== undefined) return response.data;
    if (Array.isArray(response)) return response;
    return response || [];
  }

  // Load projects on startup
  onMount(async () => {
    try {
      const response = await projectApi.list();
      setProjects(unwrap(response));
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  });

  // =========================================================================
  // Reactive data loading - using $effect instead of store subscriptions
  // to properly integrate with Svelte 5 reactivity
  // =========================================================================
  let _lastProjectId = null;
  let _lastChatId = null;

  // Watch currentProject changes
  $effect(() => {
    const project = $currentProject;
    const pid = project?.id;
    if (pid && pid !== _lastProjectId) {
      _lastProjectId = pid;
      loadChatsForProject(pid);
    } else if (!pid) {
      _lastProjectId = null;
    }
  });

  // Watch currentChat changes
  $effect(() => {
    const chat = $currentChat;
    const cid = chat?.id;
    if (cid && cid !== _lastChatId) {
      _lastChatId = cid;
      const pid = _lastProjectId;
      if (pid) {
        loadMessagesForChat(pid, cid);
      }
    } else if (!cid) {
      _lastChatId = null;
    }
  });

  async function loadChatsForProject(projectId) {
    clearChats();
    try {
      const response = await chatApi.list(projectId);
      setChats(unwrap(response));
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  }

  async function loadMessagesForChat(projectId, chatId) {
    try {
      const response = await messageApi.list(projectId, chatId);
      setMessages(unwrap(response));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  async function reloadMessages(projectId, chatId) {
    try {
      const response = await messageApi.list(projectId, chatId);
      setMessages(unwrap(response));
    } catch (err) {
      console.error('Failed to reload messages:', err);
    }
  }

  // =========================================================================
  // Event handlers (called directly by child components via callback props)
  // =========================================================================

  function handleProjectSelect(project) {
    currentProject.set(project);
  }

  function handleProjectCreate() {
    newProjectName = '';
    newProjectDescription = '';
    modalError = '';
    showCreateProject = true;
  }

  async function submitCreateProject() {
    if (!newProjectName.trim()) {
      modalError = 'Project name is required';
      return;
    }
    modalLoading = true;
    modalError = '';
    try {
      const response = await projectApi.create({
        name: newProjectName.trim(),
        description: newProjectDescription.trim()
      });
      const project = response?.data || response;
      addProject(project);
      currentProject.set(project);
      showCreateProject = false;
    } catch (err) {
      modalError = err.message || 'Failed to create project';
    } finally {
      modalLoading = false;
    }
  }

  function handleChatSelect(chat) {
    _lastChatId = null; // Reset so messages load for new selection
    selectChat(chat);
  }

  function handleChatCreate() {
    if (!$currentProject) {
      alert('Please select a project first');
      return;
    }
    newChatName = '';
    modalError = '';
    showCreateChat = true;
  }

  async function submitCreateChat() {
    modalLoading = true;
    modalError = '';
    try {
      const response = await chatApi.create($currentProject.id, {
        name: newChatName.trim() || undefined
      });
      const chat = response?.data || response;
      addChat(chat);
      _lastChatId = null; // Reset so messages load for new chat
      selectChat(chat);
      showCreateChat = false;
    } catch (err) {
      modalError = err.message || 'Failed to create chat';
    } finally {
      modalLoading = false;
    }
  }

  // Handle sending a message from ChatInterface
  function handleSendMessage(detail) {
    const { projectId, chatId, content, model, is_aside, pure_aside } = detail;

    startStreaming(chatId, 'llm');

    const assistantMsgId = `streaming-${Date.now()}`;
    addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      status: 'streaming'
    });

    try {
      activeStreamController = messageApi.stream(projectId, chatId, {
        raw_text: content,
        model_id: model || undefined,
        is_aside: is_aside || false,
        pure_aside: pure_aside || false
      }, {
        onToken(token, fullContent) {
          updateMessage(assistantMsgId, { content: fullContent });
        },
        onComplete(fullContent, metadata) {
          updateMessage(assistantMsgId, {
            content: fullContent,
            status: 'complete'
          });
          stopStreaming();
          loading.set(false);
          activeStreamController = null;
          reloadMessages(projectId, chatId);
        },
        onError(error) {
          console.error('Stream error:', error);
          updateMessage(assistantMsgId, {
            content: error.message || 'Error generating response',
            status: 'error'
          });
          stopStreaming();
          loading.set(false);
          activeStreamController = null;
        }
      });
    } catch (error) {
      console.error('Failed to start stream:', error);
      updateMessage(assistantMsgId, {
        content: 'Failed to send message: ' + (error.message || 'Unknown error'),
        status: 'error'
      });
      stopStreaming();
      loading.set(false);
    }
  }

  function handleCancel() {
    if (activeStreamController) {
      activeStreamController.abort();
      activeStreamController = null;
    }
  }

  async function handleFork(detail) {
    const { projectId, chatId, name, fromMessageId } = detail;
    try {
      const response = await chatApi.fork(projectId, chatId, { name, fromMessageId });
      const forkedChat = response?.data || response;
      addChat(forkedChat);
      _lastChatId = null;
      selectChat(forkedChat);
    } catch (err) {
      console.error('Failed to fork chat:', err);
    }
  }

  async function handleFlagUpdate(detail) {
    const { messageId, flags } = detail;
    if (!$currentProject || !$currentChat) return;
    try {
      const response = await messageApi.updateFlags(
        $currentProject.id, $currentChat.id, messageId, flags
      );
      const updated = response?.data || response;
      updateMessage(messageId, updated);
    } catch (err) {
      console.error('Failed to update flags:', err);
    }
  }

  function handleSettings() {
    checkServerStatus();
    showSettings = true;
  }

  function handleProfile() {
    showProfile = true;
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      showCreateProject = false;
      showCreateChat = false;
      showSettings = false;
      showProfile = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="h-screen flex flex-col">
  <Header onSettings={handleSettings} onProfile={handleProfile} />
  <div class="flex-1 flex overflow-hidden">
    <Sidebar
      onProjectSelect={handleProjectSelect}
      onProjectCreate={handleProjectCreate}
      onChatSelect={handleChatSelect}
      onChatCreate={handleChatCreate}
      onSettings={handleSettings}
    />
    <main class="flex-1 overflow-auto">
      <ChatInterface
        onSend={handleSendMessage}
        onCancel={handleCancel}
        onFork={handleFork}
        onFlagUpdate={handleFlagUpdate}
      />
    </main>
    <WorkspacePanel files={[]} />
  </div>
</div>

<!-- Create Project Modal -->
{#if showCreateProject}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-label="Create project" onclick={(e) => { if (e.target === e.currentTarget) showCreateProject = false; }}>
    <div class="bg-surface border border-border rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
      <h2 class="text-xl font-semibold text-foreground mb-4">Create New Project</h2>

      {#if modalError}
        <div class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {modalError}
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1" for="project-name">
            Project Name <span class="text-red-500">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            bind:value={newProjectName}
            placeholder="My Project"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
            onkeydown={(e) => e.key === 'Enter' && submitCreateProject()}
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1" for="project-desc">
            Description <span class="text-muted text-xs">(optional)</span>
          </label>
          <textarea
            id="project-desc"
            bind:value={newProjectDescription}
            placeholder="What is this project about?"
            rows="3"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          ></textarea>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button
          onclick={() => showCreateProject = false}
          class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          disabled={modalLoading}
        >
          Cancel
        </button>
        <button
          onclick={submitCreateProject}
          class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={modalLoading}
        >
          {modalLoading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Create Chat Modal -->
{#if showCreateChat}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-label="Create chat" onclick={(e) => { if (e.target === e.currentTarget) showCreateChat = false; }}>
    <div class="bg-surface border border-border rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
      <h2 class="text-xl font-semibold text-foreground mb-4">Create New Chat</h2>
      <p class="text-sm text-muted mb-4">
        Project: <span class="text-foreground font-medium">{$currentProject?.name}</span>
      </p>

      {#if modalError}
        <div class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {modalError}
        </div>
      {/if}

      <div>
        <label class="block text-sm font-medium text-foreground mb-1" for="chat-name">
          Chat Name <span class="text-muted text-xs">(optional)</span>
        </label>
        <input
          id="chat-name"
          type="text"
          bind:value={newChatName}
          placeholder="New Chat"
          class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
          onkeydown={(e) => e.key === 'Enter' && submitCreateChat()}
        />
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button
          onclick={() => showCreateChat = false}
          class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          disabled={modalLoading}
        >
          Cancel
        </button>
        <button
          onclick={submitCreateChat}
          class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={modalLoading}
        >
          {modalLoading ? 'Creating...' : 'Create Chat'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Settings Modal -->
{#if showSettings}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-label="Settings" onclick={(e) => { if (e.target === e.currentTarget) showSettings = false; }}>
    <div class="bg-surface border border-border rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-foreground">Settings</h2>
        <button onclick={() => showSettings = false} class="p-1 rounded hover:bg-surface-hover text-muted hover:text-foreground" aria-label="Close settings">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <div>
          <h3 class="text-sm font-medium text-foreground mb-2">Appearance</h3>
          <div class="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
            <span class="text-sm text-foreground">Theme</span>
            <button
              onclick={() => theme.toggle()}
              class="px-3 py-1.5 text-sm rounded-lg bg-surface-hover text-foreground hover:bg-primary/10 transition-colors"
            >
              {$theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-medium text-foreground mb-2">Server Status</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span class="text-sm text-foreground">API Server</span>
              <span class="text-sm {serverStatus === 'Connected' ? 'text-green-500' : 'text-red-500'}">{serverStatus}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span class="text-sm text-foreground">API Key</span>
              <span class="text-sm text-muted">{apiKeyMasked}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-medium text-foreground mb-2">About</h3>
          <div class="p-3 bg-background rounded-lg border border-border">
            <p class="text-sm text-foreground font-medium">OinkerUI</p>
            <p class="text-xs text-muted mt-1">LLM-assisted development workbench</p>
            <p class="text-xs text-muted mt-1">Powered by OpenRouter</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <button
          onclick={() => showSettings = false}
          class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Profile Modal -->
{#if showProfile}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-label="Profile" onclick={(e) => { if (e.target === e.currentTarget) showProfile = false; }}>
    <div class="bg-surface border border-border rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-foreground">Profile</h2>
        <button onclick={() => showProfile = false} class="p-1 rounded hover:bg-surface-hover text-muted hover:text-foreground" aria-label="Close profile">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex flex-col items-center mb-6">
        <div class="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-3">
          <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-foreground">Local User</h3>
        <p class="text-sm text-muted">OinkerUI Developer</p>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
          <span class="text-sm text-muted">Projects</span>
          <span class="text-sm text-foreground font-medium">{$projects.length}</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
          <span class="text-sm text-muted">Active Chats</span>
          <span class="text-sm text-foreground font-medium">{$chats.length}</span>
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <button
          onclick={() => showProfile = false}
          class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}