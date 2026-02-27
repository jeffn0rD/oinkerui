<script>
  import { createEventDispatcher } from 'svelte';
  import { loading } from '../stores/uiStore.js';
  import TemplateSelector from './TemplateSelector.svelte';
  
  export let placeholder = 'Type your message...';
  export let disabled = false;
  export let projectId = '';
  
  const dispatch = createEventDispatcher();
  
  let message = '';
  let textarea;
  let isComposing = false;
  let showTemplateSelector = false;
  
  function handleSubmit() {
    if (message.trim() && !$loading && !disabled) {
      dispatch('send', { content: message.trim() });
      message = '';
      // Reset textarea height
      if (textarea) {
        textarea.style.height = 'auto';
      }
    }
  }
  
  function handleKeydown(event) {
    // Don't submit during IME composition
    if (isComposing) return;
    
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
    
    // Ctrl+T to open template selector
    if ((event.ctrlKey || event.metaKey) && event.key === 't') {
      event.preventDefault();
      showTemplateSelector = true;
    }
  }
  
  function handleInput() {
    // Auto-resize textarea
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }
  
  function handleCompositionStart() {
    isComposing = true;
  }
  
  function handleCompositionEnd() {
    isComposing = false;
  }
  
  function handleTemplateSelect(content) {
    message = content;
    // Resize textarea
    if (textarea) {
      textarea.style.height = 'auto';
      requestAnimationFrame(() => {
        if (textarea) {
          textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
          textarea.focus();
        }
      });
    }
  }
  
  // Focus textarea on mount
  import { onMount } from 'svelte';
  onMount(() => {
    if (textarea) {
      textarea.focus();
    }
  });
</script>

<div class="border-t border-border bg-surface p-4">
  <div class="max-w-4xl mx-auto">
    <div class="flex gap-3 items-end">
      <!-- Attachment button -->
      <button
        class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
        title="Attach file"
        disabled={$loading || disabled}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>
      
      <!-- Template button -->
      <button
        on:click={() => showTemplateSelector = true}
        class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
        title="Prompt Templates (Ctrl+T)"
        disabled={$loading || disabled}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      </button>
      
      <!-- Text input -->
      <div class="flex-1 relative">
        <textarea
          bind:this={textarea}
          bind:value={message}
          on:keydown={handleKeydown}
          on:input={handleInput}
          on:compositionstart={handleCompositionStart}
          on:compositionend={handleCompositionEnd}
          {placeholder}
          disabled={$loading || disabled}
          class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-12
                 text-foreground placeholder-muted
                 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-colors"
          rows="1"
          style="min-height: 48px; max-height: 200px;"
        ></textarea>
        
        <!-- Character count (optional) -->
        {#if message.length > 1000}
          <div class="absolute bottom-2 right-14 text-xs text-muted">
            {message.length}
          </div>
        {/if}
      </div>
      
      <!-- Send button -->
      <button
        on:click={handleSubmit}
        disabled={!message.trim() || $loading || disabled}
        class="p-3 rounded-xl bg-primary text-white
               hover:bg-primary-hover
               disabled:opacity-50 disabled:cursor-not-allowed
               transition-colors"
        title="Send message (Enter)"
      >
        {#if $loading}
          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        {/if}
      </button>
    </div>
    
    <!-- Hints -->
    <div class="flex items-center justify-between mt-2 text-xs text-muted">
      <span>Press <kbd class="px-1.5 py-0.5 bg-surface-hover rounded">Enter</kbd> to send, <kbd class="px-1.5 py-0.5 bg-surface-hover rounded">Ctrl+T</kbd> for templates</span>
      {#if $loading}
        <span class="flex items-center gap-1">
          <span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          AI is thinking...
        </span>
      {/if}
    </div>
  </div>
</div>

<!-- Template Selector Modal -->
<TemplateSelector
  isOpen={showTemplateSelector}
  {projectId}
  onSelect={handleTemplateSelect}
  onClose={() => showTemplateSelector = false}
/>

<style>
  textarea {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }
  
  textarea::-webkit-scrollbar {
    width: 6px;
  }
  
  textarea::-webkit-scrollbar-track {
    background: transparent;
  }
  
  textarea::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
    border-radius: 3px;
  }
</style>