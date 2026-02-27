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
  let asideMode = 'normal'; // 'normal', 'aside', 'pure_aside'
  
  function handleSubmit(overrideAside) {
    const mode = overrideAside || asideMode;
    if (message.trim() && !$loading && !disabled) {
      dispatch('send', {
        content: message.trim(),
        is_aside: mode === 'aside' || mode === 'pure_aside',
        pure_aside: mode === 'pure_aside',
      });
      message = '';
      asideMode = 'normal';
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
      
      // Ctrl+Shift+Enter = aside, Ctrl+Alt+Enter = pure aside
      if (event.ctrlKey && event.altKey) {
        handleSubmit('pure_aside');
      } else if (event.ctrlKey) {
        handleSubmit('aside');
      } else {
        handleSubmit();
      }
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

  function cycleAsideMode() {
    if (asideMode === 'normal') asideMode = 'aside';
    else if (asideMode === 'aside') asideMode = 'pure_aside';
    else asideMode = 'normal';
  }
  
  // Focus textarea on mount
  import { onMount } from 'svelte';
  onMount(() => {
    if (textarea) {
      textarea.focus();
    }
  });

  $: asideModeLabel = asideMode === 'aside' ? 'Aside' : asideMode === 'pure_aside' ? 'Pure Aside' : '';
  $: asideModeColor = asideMode === 'aside' ? 'text-yellow-500' : asideMode === 'pure_aside' ? 'text-pink-500' : '';
</script>

<div class="border-t border-border bg-surface p-4">
  <div class="max-w-4xl mx-auto">
    <!-- Aside mode indicator -->
    {#if asideMode !== 'normal'}
      <div class="flex items-center gap-2 mb-2 px-2">
        <span class="text-xs font-medium {asideModeColor} flex items-center gap-1">
          {#if asideMode === 'aside'}
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
            </svg>
            Aside Mode — Message excluded from future context
          {:else}
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
            </svg>
            Pure Aside Mode — Context ignores all prior messages
          {/if}
        </span>
        <button
          on:click={() => asideMode = 'normal'}
          class="text-xs text-muted hover:text-foreground transition-colors"
          title="Cancel aside mode"
        >
          ✕
        </button>
      </div>
    {/if}

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

      <!-- Aside mode toggle button -->
      <button
        on:click={cycleAsideMode}
        class="p-2 rounded-lg hover:bg-surface-hover transition-colors
               {asideMode !== 'normal' ? asideModeColor : 'text-muted hover:text-foreground'}"
        title="Toggle aside mode (Normal → Aside → Pure Aside)"
        disabled={$loading || disabled}
      >
        <svg class="w-5 h-5" fill={asideMode !== 'normal' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M13 5l7 7-7 7M5 5l7 7-7 7" />
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
          placeholder={asideMode === 'aside' ? 'Type aside message...' : asideMode === 'pure_aside' ? 'Type pure aside message...' : placeholder}
          disabled={$loading || disabled}
          class="w-full resize-none rounded-xl border px-4 py-3 pr-12
                 text-foreground placeholder-muted
                 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-colors bg-background
                 {asideMode === 'aside' ? 'border-yellow-400' : asideMode === 'pure_aside' ? 'border-pink-400' : 'border-border'}"
          rows="1"
          style="max-height: 200px"
        ></textarea>
        
        <!-- Send button -->
        <button
          on:click={() => handleSubmit()}
          disabled={!message.trim() || $loading || disabled}
          class="absolute right-2 bottom-2 p-2 rounded-lg
                 {message.trim() && !$loading && !disabled
                   ? 'bg-primary text-white hover:bg-primary-hover' 
                   : 'bg-gray-200 dark:bg-gray-700 text-muted cursor-not-allowed'}
                 transition-colors"
          title="Send message (Enter)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Keyboard shortcuts hint -->
    <div class="flex items-center gap-3 mt-1.5 px-2 text-xs text-muted">
      <span>Enter to send</span>
      <span>·</span>
      <span>Shift+Enter for new line</span>
      <span>·</span>
      <span>Ctrl+Enter for aside</span>
      <span>·</span>
      <span>Ctrl+Alt+Enter for pure aside</span>
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