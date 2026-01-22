<script>
  import { createEventDispatcher } from 'svelte';
  import { projects, currentProject } from '../stores/projectStore.js';
  
  const dispatch = createEventDispatcher();
  
  function selectProject(project) {
    currentProject.set(project);
    dispatch('select', project);
  }
  
  function createProject() {
    dispatch('create');
  }
  
  function getStatusColor(status) {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'archived': return 'bg-gray-400';
      case 'deleted': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  }
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center justify-between p-4 border-b border-border">
    <h2 class="text-lg font-semibold text-foreground">Projects</h2>
    <button 
      on:click={createProject}
      class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
      title="New Project"
    >
      <svg class="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>
  
  <div class="flex-1 overflow-y-auto p-2 space-y-1">
    {#each $projects as project (project.id)}
      <button
        on:click={() => selectProject(project)}
        class="w-full text-left p-3 rounded-lg transition-colors
               {$currentProject?.id === project.id 
                 ? 'bg-primary/10 border border-primary/30' 
                 : 'hover:bg-surface-hover'}"
      >
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full {getStatusColor(project.status)}"></div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-foreground truncate">{project.name}</div>
            {#if project.description}
              <div class="text-xs text-muted truncate">{project.description}</div>
            {/if}
          </div>
        </div>
        {#if project.chats?.length > 0}
          <div class="mt-1 text-xs text-muted">
            {project.chats.length} chat{project.chats.length !== 1 ? 's' : ''}
          </div>
        {/if}
      </button>
    {:else}
      <div class="text-center py-8 text-muted">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p class="text-sm">No projects yet</p>
        <button 
          on:click={createProject}
          class="mt-2 text-primary hover:underline text-sm"
        >
          Create your first project
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  /* Component-specific styles if needed */
</style>