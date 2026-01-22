<script>
  import { currentProject } from '../stores/projectStore.js';
  import { currentChat } from '../stores/chatStore.js';
  import { theme } from '../stores/uiStore.js';
  
  export let showBreadcrumb = true;
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
    
    <!-- User menu -->
    <button class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors">
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