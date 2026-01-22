<script>
  import { createEventDispatcher } from 'svelte';
  import { chats, currentChat } from '../stores/chatStore.js';
  import { currentProject } from '../stores/projectStore.js';
  
  const dispatch = createEventDispatcher();
  
  function selectChat(chat) {
    currentChat.set(chat);
    dispatch('select', chat);
  }
  
  function createChat() {
    dispatch('create');
  }
  
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Less than 7 days
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  function getStatusIcon(status) {
    switch (status) {
      case 'active': return '💬';
      case 'closed': return '✓';
      case 'archived': return '📦';
      default: return '💬';
    }
  }
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center justify-between p-4 border-b border-border">
    <h2 class="text-lg font-semibold text-foreground">Chats</h2>
    <button 
      on:click={createChat}
      class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
      title="New Chat"
      disabled={!$currentProject}
    >
      <svg class="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>
  
  {#if !$currentProject}
    <div class="flex-1 flex items-center justify-center p-4">
      <p class="text-muted text-sm text-center">Select a project to view chats</p>
    </div>
  {:else}
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      {#each $chats as chat (chat.id)}
        <button
          on:click={() => selectChat(chat)}
          class="w-full text-left p-3 rounded-lg transition-colors
                 {$currentChat?.id === chat.id 
                   ? 'bg-primary/10 border border-primary/30' 
                   : 'hover:bg-surface-hover'}"
        >
          <div class="flex items-start gap-3">
            <span class="text-lg">{getStatusIcon(chat.status)}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium text-foreground truncate">{chat.name}</span>
                <span class="text-xs text-muted whitespace-nowrap">
                  {formatDate(chat.updated_at || chat.created_at)}
                </span>
              </div>
              {#if chat.lastMessage}
                <div class="text-xs text-muted truncate mt-1">
                  {chat.lastMessage}
                </div>
              {/if}
            </div>
          </div>
        </button>
      {:else}
        <div class="text-center py-8 text-muted">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text-sm">No chats yet</p>
          <button 
            on:click={createChat}
            class="mt-2 text-primary hover:underline text-sm"
          >
            Start a new chat
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Component-specific styles if needed */
</style>