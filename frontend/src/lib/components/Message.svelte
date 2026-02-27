<script>
  import { createEventDispatcher } from 'svelte';
  import MessageFlagControls from './MessageFlagControls.svelte';
  
  export let message;
  export let onFlagChange = () => {};
  
  const dispatch = createEventDispatcher();
  
  // Determine if this is a user or assistant message
  $: isUser = message.role === 'user';
  $: isAssistant = message.role === 'assistant';
  $: isSystem = message.role === 'system';
  
  // Flag states
  $: isPinned = !!message.is_pinned;
  $: isAside = !!message.is_aside;
  $: isPureAside = !!message.pure_aside;
  $: isDiscarded = !!message.is_discarded;
  $: isExcluded = message.include_in_context === false;
  
  // Format timestamp
  function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Simple markdown-like formatting
  function formatContent(content) {
    if (!content) return '';
    
    // Escape HTML
    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Code blocks (```code```)
    formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
    });
    
    // Inline code (`code`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Bold (**text**)
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic (*text*)
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }
  
  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    dispatch('copy', message);
  }
  
  async function handleFlagChange(messageId, flagName, newValue) {
    await onFlagChange(messageId, flagName, newValue);
    dispatch('flagChanged', { messageId, flag: flagName, value: newValue });
  }

  let showControls = false;
</script>

<div 
  class="message-container flex gap-3 {isUser ? 'flex-row-reverse' : ''}"
  class:is-pinned={isPinned}
  class:is-aside={isAside}
  class:is-pure-aside={isPureAside}
  class:is-discarded={isDiscarded}
  class:is-excluded={isExcluded}
  role="article"
  aria-label="{message.role} message"
  on:mouseenter={() => showControls = true}
  on:mouseleave={() => showControls = false}
>
  <!-- Avatar -->
  <div class="flex-shrink-0">
    {#if isUser}
      <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
        U
      </div>
    {:else if isAssistant}
      <div class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium">
        AI
      </div>
    {:else}
      <div class="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-medium">
        S
      </div>
    {/if}
  </div>
  
  <!-- Message content -->
  <div class="flex-1 max-w-[80%] {isUser ? 'items-end' : 'items-start'}">
    <!-- Flag controls (shown on hover) -->
    <div class="flag-controls-wrapper flex items-center gap-2 mb-1 min-h-[24px] {isUser ? 'justify-end' : 'justify-start'}">
      {#if showControls || isPinned || isAside || isDiscarded || isExcluded}
        <MessageFlagControls
          {message}
          onFlagChange={handleFlagChange}
          compact={true}
        />
      {/if}

      <!-- Persistent flag indicators -->
      <div class="flex items-center gap-1">
        {#if isPinned}
          <span class="text-blue-500 text-xs flex items-center gap-0.5" title="Pinned">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            Pinned
          </span>
        {/if}
        {#if isAside}
          <span class="text-yellow-500 text-xs flex items-center gap-0.5" title="Aside">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
            </svg>
            Aside
          </span>
        {/if}
        {#if isDiscarded}
          <span class="text-red-500 text-xs flex items-center gap-0.5" title="Discarded">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Discarded
          </span>
        {/if}
      </div>
    </div>

    <div 
      class="message-bubble rounded-2xl px-4 py-3 
             {isUser 
               ? 'bg-primary text-white rounded-br-md' 
               : isSystem 
                 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-foreground border border-yellow-300 dark:border-yellow-700'
                 : 'bg-surface text-foreground rounded-bl-md border border-border'}"
    >
      {#if isSystem}
        <div class="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">System</div>
      {/if}
      
      <div class="message-content prose prose-sm dark:prose-invert max-w-none">
        {@html formatContent(message.content)}
      </div>
    </div>
    
    <!-- Message metadata and actions -->
    <div class="flex items-center gap-2 mt-1 px-2 {isUser ? 'justify-end' : 'justify-start'}">
      <span class="text-xs text-muted">
        {formatTime(message.created_at)}
      </span>
      
      {#if message.llm_info?.model}
        <span class="text-xs text-muted">
          · {message.llm_info.model}
        </span>
      {/if}
      
      <!-- Action buttons -->
      <div class="message-actions opacity-0 transition-opacity flex gap-1">
        <button 
          on:click={handleCopy}
          class="p-1 rounded hover:bg-surface-hover text-muted hover:text-foreground"
          title="Copy"
          aria-label="Copy message"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .message-container:hover .message-actions {
    opacity: 1;
  }
  
  .message-container.is-aside {
    opacity: 0.7;
    border-left: 3px solid #eab308;
    padding-left: 0.5rem;
  }
  
  .message-container.is-pure-aside {
    opacity: 0.6;
    border-left: 3px solid #ec4899;
    padding-left: 0.5rem;
  }
  
  .message-container.is-pinned {
    border-left: 3px solid #3b82f6;
    padding-left: 0.5rem;
  }
  
  .message-container.is-discarded {
    opacity: 0.4;
  }
  
  .message-container.is-discarded .message-content {
    text-decoration: line-through;
  }
  
  .message-container.is-excluded {
    opacity: 0.5;
  }
  
  :global(.code-block) {
    background-color: var(--color-surface, #1f2937);
    border-radius: 0.5rem;
    padding: 1rem;
    overflow-x: auto;
    margin: 0.5rem 0;
  }
  
  :global(.inline-code) {
    background-color: var(--color-surface, #374151);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.875em;
  }
  
  :global(.dark .code-block) {
    background-color: #1e293b;
  }
  
  :global(.dark .inline-code) {
    background-color: #334155;
  }
</style>