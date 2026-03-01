<script>
  import { createEventDispatcher } from 'svelte';
  import ProjectList from './ProjectList.svelte';
  import ChatList from './ChatList.svelte';
  import { sidebarCollapsed, theme } from '../stores/uiStore.js';
  
  const dispatch = createEventDispatcher();
  
  let activeTab = 'projects';
  
  function toggleSidebar() {
    sidebarCollapsed.update(v => !v);
  }
  
  function toggleTheme() {
    theme.toggle();
  }
  
  function handleProjectSelect(event) {
    activeTab = 'chats';
    dispatch('projectSelect', event.detail);
  }
  
  function handleProjectCreate() {
    dispatch('projectCreate');
  }
  
  function handleChatSelect(event) {
    dispatch('chatSelect', event.detail);
  }
  
  function handleChatCreate() {
    dispatch('chatCreate');
  }
  
  function handleSettings() {
    dispatch('settings');
  }
</script>

<aside 
  class="flex flex-col h-full bg-surface border-r border-border transition-all duration-300
         {$sidebarCollapsed ? 'w-16' : 'w-72'}"
>
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-border">
    {#if !$sidebarCollapsed}
      <h1 class="text-xl font-bold text-foreground">OinkerUI</h1>
    {/if}
    <button 
      on:click={toggleSidebar}
      class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
      title={$sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg class="w-5 h-5 transition-transform {$sidebarCollapsed ? 'rotate-180' : ''}" 
           fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
    </button>
  </div>
  
  {#if !$sidebarCollapsed}
    <!-- Tab navigation -->
    <div class="flex border-b border-border">
      <button
        on:click={() => activeTab = 'projects'}
        class="flex-1 py-3 text-sm font-medium transition-colors
               {activeTab === 'projects' 
                 ? 'text-primary border-b-2 border-primary' 
                 : 'text-muted hover:text-foreground'}"
      >
        Projects
      </button>
      <button
        on:click={() => activeTab = 'chats'}
        class="flex-1 py-3 text-sm font-medium transition-colors
               {activeTab === 'chats' 
                 ? 'text-primary border-b-2 border-primary' 
                 : 'text-muted hover:text-foreground'}"
      >
        Chats
      </button>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      {#if activeTab === 'projects'}
        <ProjectList 
          on:select={handleProjectSelect}
          on:create={handleProjectCreate}
        />
      {:else}
        <ChatList 
          on:select={handleChatSelect}
          on:create={handleChatCreate}
        />
      {/if}
    </div>
  {:else}
    <!-- Collapsed state - icon buttons -->
    <div class="flex flex-col items-center py-4 space-y-4">
      <button
        on:click={() => { sidebarCollapsed.set(false); activeTab = 'projects'; }}
        class="p-3 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
        title="Projects"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </button>
      <button
        on:click={() => { sidebarCollapsed.set(false); activeTab = 'chats'; }}
        class="p-3 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
        title="Chats"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  {/if}
  
  <!-- Footer -->
  <div class="border-t border-border p-4">
    {#if !$sidebarCollapsed}
      <div class="flex items-center justify-between">
        <button
          on:click={toggleTheme}
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {#if $theme === 'dark'}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span class="text-sm">Light mode</span>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span class="text-sm">Dark mode</span>
          {/if}
        </button>
        
        <button
          on:click={handleSettings}
          class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          title="Settings"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.11 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    {:else}
      <div class="flex flex-col items-center space-y-2">
        <button
          on:click={toggleTheme}
          class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {#if $theme === 'dark'}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          {/if}
        </button>
      </div>
    {/if}
  </div>
</aside>

<style>
  /* Component-specific styles */
</style>