<script>
  import { onMount } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import ChatInterface from './lib/components/ChatInterface.svelte';
  import WorkspacePanel from './lib/components/WorkspacePanel.svelte';
  import { projects, currentProject, addProject, setProjects } from './lib/stores/projectStore';
  import { chats, currentChat, messages, setChats, addChat, selectChat, clearChats } from './lib/stores/chatStore';
  import { projectApi, chatApi, messageApi } from './lib/utils/api.js';

  // Modal state
  let showCreateProject = false;
  let showCreateChat = false;
  let newProjectName = '';
  let newProjectDescription = '';
  let newChatName = '';
  let modalError = '';
  let modalLoading = false;

  // Load projects on startup
  onMount(async () => {
    try {
      const data = await projectApi.list();
      setProjects(data.projects || data || []);
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
      const data = await chatApi.list(projectId);
      setChats(data.chats || data || []);
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
      const data = await messageApi.list(projectId, chatId);
      import('./lib/stores/chatStore').then(({ setMessages }) => {
        setMessages(data.messages || data || []);
      });
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
      const project = await projectApi.create({
        name: newProjectName.trim(),
        description: newProjectDescription.trim()
      });
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
      const chat = await chatApi.create($currentProject.id, {
        name: newChatName.trim() || undefined
      });
      addChat(chat);
      selectChat(chat);
      showCreateChat = false;
    } catch (err) {
      modalError = err.message || 'Failed to create chat';
    } finally {
      modalLoading = false;
    }
  }

  // Close modals on Escape key
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      showCreateProject = false;
      showCreateChat = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="h-screen flex flex-col">
  <Header />
  <div class="flex-1 flex overflow-hidden">
    <Sidebar
      on:projectSelect={handleProjectSelect}
      on:projectCreate={handleProjectCreate}
      on:chatSelect={handleChatSelect}
      on:chatCreate={handleChatCreate}
    />
    <main class="flex-1 overflow-auto">
      <ChatInterface messages={$messages} />
    </main>
    <WorkspacePanel files={[]} />
  </div>
</div>

<!-- Create Project Modal -->
{#if showCreateProject}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click|self={() => showCreateProject = false}>
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
            autofocus
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
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click|self={() => showCreateChat = false}>
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
          autofocus
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

<style>
  /* Component-specific styles */
</style>