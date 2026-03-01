<script>
  import { createEventDispatcher } from 'svelte';
  import { currentProject } from '../stores/projectStore.js';
  import { currentChat } from '../stores/chatStore.js';
  import { theme } from '../stores/uiStore.js';
  
  export let showBreadcrumb = true;
  
  const dispatch = createEventDispatcher();
  
  function handleProfile() {
    dispatch('profile');
  }
  
  function handleSettings() {
    dispatch('settings');
  }
</script>

<header class="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
  <div class="flex items-center gap-4">
    <!-- Breadcrumb -->
    {#if showBreadcrumb}
      <nav class="flex items-center gap-2 text-sm">
        <span class="text-muted">OinkerUI</span>
        
        {#if $currentProject}
          <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-foreground font-medium">{$currentProject.name}</span>
        {/if}
        
        {#if $currentChat}
          <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-foreground">{$currentChat.name}</span>
        {/if}
      </nav>
    {/if}
  </div>
  
  <div class="flex items-center gap-2">
    <!-- Status indicator -->
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">
      <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      <span>Connected</span>
    </div>
    
    <!-- Settings button -->
    <button 
      on:click={handleSettings}
      class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
      title="Settings"
      aria-label="Settings"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    
    <!-- User menu -->
    <button 
      on:click={handleProfile}
      class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
      title="Profile"
      aria-label="Profile"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </button>
  </div>
</header>

<style>
  /* Component-specific styles */
</style>