<script>
  import { currentProject } from '../stores/projectStore.js';
  import { currentChat } from '../stores/chatStore.js';
  
  let { files = [] } = $props();
  
  let collapsed = $state(false);
  
  function togglePanel() {
    collapsed = !collapsed;
  }
</script>

<aside class="flex flex-col h-full bg-surface border-l border-border transition-all duration-300 {collapsed ? 'w-10' : 'w-64'}">
  <!-- Toggle button -->
  <div class="flex items-center {collapsed ? 'justify-center' : 'justify-between'} p-2 border-b border-border">
    {#if !collapsed}
      <h2 class="text-sm font-semibold text-foreground px-2">Workspace</h2>
    {/if}
    <button
      onclick={togglePanel}
      class="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
      title={collapsed ? 'Expand workspace' : 'Collapse workspace'}
    >
      <svg class="w-4 h-4 transition-transform {collapsed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>
  </div>

  {#if !collapsed}
    <div class="flex-1 overflow-y-auto p-3">
      {#if $currentProject}
        <!-- Project Info -->
        <div class="mb-4">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Project</h3>
          <div class="p-2 bg-background rounded-lg border border-border">
            <p class="text-sm font-medium text-foreground">{$currentProject.name}</p>
            {#if $currentProject.description}
              <p class="text-xs text-muted mt-1">{$currentProject.description}</p>
            {/if}
          </div>
        </div>

        <!-- Files -->
        <div>
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Files</h3>
          <div class="space-y-1">
            {#each files as file}
              <div class="flex items-center gap-2 p-2 hover:bg-surface-hover rounded-lg cursor-pointer text-sm transition-colors">
                <svg class="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-foreground truncate">{file.name}</span>
              </div>
            {:else}
              <div class="text-center py-6 text-muted">
                <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-xs">No files in workspace</p>
                <p class="text-xs mt-1 opacity-75">Files will appear here when added to the project</p>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <!-- No project selected -->
        <div class="text-center py-8 text-muted">
          <svg class="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p class="text-sm">No project selected</p>
          <p class="text-xs mt-1 opacity-75">Select or create a project to view workspace files</p>
        </div>
      {/if}
    </div>

    {#if $currentChat}
      <!-- Chat Info Footer -->
      <div class="border-t border-border p-3">
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Current Chat</h3>
        <p class="text-sm text-foreground truncate">{$currentChat.name}</p>
        {#if $currentChat.status}
          <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full 
                       {$currentChat.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}">
            {$currentChat.status}
          </span>
        {/if}
      </div>
    {/if}
  {/if}
</aside>

<style>
  /* Component-specific styles */
</style>