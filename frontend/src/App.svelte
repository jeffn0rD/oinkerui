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
  let showCreateProject = false;
  let showCreateChat = false;
  let showSettings = false;
  let showProfile = false;
  let newProjectName = '';
  let newProjectDescription = '';
  let newChatName = '';
  let modalError = '';
  let modalLoading = false;

  // Settings state
  let apiKeyMasked = '••••••••';
  let serverStatus = 'checking...';

  // Active stream controller
  let activeStreamController = null;

  async function checkServerStatus() {
    try {
      await healthApi.check();
      serverStatus = 'Connected';
    } catch {
      serverStatus = 'Disconnected';
    }
  }

  // Helper to unwrap API responses - backend wraps in { success, data }
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

  // When current project changes, load its chats
  $: if ($currentProject) {
    loadChats($currentProject.id);
  }

  async function loadChats(projectId) {
    clearChats();
    try {
      const response = await chatApi.list(projectId);
      setChats(unwrap(response));
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  }

  // When current chat changes, load its messages
  $: if ($currentChat && $currentProject) {
    loadMessages($currentProject.id, $currentChat.id);
  }

  async function loadMessages(projectId, chatId) {
    try {
      const response = await messageApi.list(projectId, chatId);
      setMessages(unwrap(response));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  // Handle project selection from sidebar
  function handleProjectSelect(event) {
    const project = event.detail;
    currentProject.set(project);
  }

  // Handle project create button
  function handleProjectCreate() {
    newProjectName = '';
    newProjectDescription = '';
    modalError = '';
    showCreateProject = true;
  }

  // Submit new project
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

  // Handle chat selection from sidebar
  function handleChatSelect(event) {
    const chat = event.detail;
    selectChat(chat);
  }

  // Handle chat create button
  function handleChatCreate() {
    if (!$currentProject) {
      alert('Please select a project first');
      return;
    }
    newChatName = '';
    modalError = '';
    showCreateChat = true;
  }

  // Submit new chat
  async function submitCreateChat() {
    modalLoading = true;
    modalError = '';
    try {
      const response = await chatApi.create($currentProject.id, {
        name: newChatName.trim() || undefined
      });
      const chat = response?.data || response;
      addChat(chat);
      selectChat(chat);
      showCreateChat = false;
    } catch (err) {
      modalError = err.message || 'Failed to create chat';
    } finally {
      modalLoading = false;
    }
  }

  // Handle sending a message from ChatInterface
  async function handleSendMessage(event) {
    const { projectId, chatId, content, is_aside, pure_aside } = event.detail;

    startStreaming(chatId, 'llm');

    // Create a placeholder assistant message for streaming
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
        is_aside: is_aside || false,
        pure_aside: pure_aside || false
      }, {
        onToken(token, fullContent) {
          updateMessage(assistantMsgId, { content: fullContent });
        },
        onComplete(fullContent, metadata) {
          // Replace streaming message with final content
          updateMessage(assistantMsgId, {
            content: fullContent,
            status: 'complete'
          });
          stopStreaming();
          loading.set(false);
          activeStreamController = null;

          // Reload messages to get server-side IDs
          loadMessages(projectId, chatId);
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

  // Handle cancel from ChatInterface
  function handleCancel() {
    if (activeStreamController) {
      activeStreamController.abort();
      activeStreamController = null;
    }
  }

  // Handle fork from ChatInterface
  async function handleFork(event) {
    const { projectId, chatId, name, fromMessageId } = event.detail;
    try {
      const response = await chatApi.fork(projectId, chatId, { name, fromMessageId });
      const forkedChat = response?.data || response;
      addChat(forkedChat);
      selectChat(forkedChat);
    } catch (err) {
      console.error('Failed to fork chat:', err);
    }
  }

  // Handle message flag updates
  async function handleFlagUpdate(event) {
    const { messageId, flags } = event.detail;
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

  // Open settings modal
  function handleSettings() {
    checkServerStatus();
    showSettings = true;
  }

  // Open profile modal
  function handleProfile() {
    showProfile = true;
  }

  // Close modals on Escape key
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      showCreateProject = false;
      showCreateChat = false;
      showSettings = false;
      showProfile = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="h-screen flex flex-col">
  <Header on:settings={handleSettings} on:profile={handleProfile} />
  <div class="flex-1 flex overflow-hidden">
    <Sidebar
      on:projectSelect={handleProjectSelect}
      on:projectCreate={handleProjectCreate}
      on:chatSelect={handleChatSelect}
      on:chatCreate={handleChatCreate}
      on:settings={handleSettings}
    />
    <main class="flex-1 overflow-auto">
      <ChatInterface
        messages={$messages}
        on:send={handleSendMessage}
        on:cancel={handleCancel}
        on:fork={handleFork}
        on:flagUpdate={handleFlagUpdate}
      />
    </main>
    <WorkspacePanel files={[]} />
  </div>
</div>

<!-- Create Project Modal -->
{#if showCreateProject}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-label="Create project" on:click|self={() => showCreateProject = false} on:keydown={(e) => e.key === 'Escape' && (showCreateProject = false)}>
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
            on:keydown={(e) => e.key === 'Enter' && submitCreateProject()}
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
          on:click={() => showCreateProject = false}
          class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          disabled={modalLoading}
        >
          Cancel
        </button>
        <button
          on:click={submitCreateProject}
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
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-label="Create chat" on:click|self={() => showCreateChat = false} on:keydown={(e) => e.key === 'Escape' && (showCreateChat = false)}>
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
          on:keydown={(e) => e.key === 'Enter' && submitCreateChat()}
        />
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button
          on:click={() => showCreateChat = false}
          class="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          disabled={modalLoading}
        >
          Cancel
        </button>
        <button
          on:click={submitCreateChat}
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
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-label="Settings" on:click|self={() => showSettings = false} on:keydown={(e) => e.key === 'Escape' && (showSettings = false)}>
    <div class="bg-surface border border-border rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-foreground">Settings</h2>
        <button on:click={() => showSettings = false} class="p-1 rounded hover:bg-surface-hover text-muted hover:text-foreground" aria-label="Close settings">
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
              on:click={() => theme.toggle()}
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
          on:click={() => showSettings = false}
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
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-label="Profile" on:click|self={() => showProfile = false} on:keydown={(e) => e.key === 'Escape' && (showProfile = false)}>
    <div class="bg-surface border border-border rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-foreground">Profile</h2>
        <button on:click={() => showProfile = false} class="p-1 rounded hover:bg-surface-hover text-muted hover:text-foreground" aria-label="Close profile">
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
          on:click={() => showProfile = false}
          class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Component-specific styles */
</style>