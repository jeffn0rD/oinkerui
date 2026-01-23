<script>
  import { afterUpdate, tick } from 'svelte';
  import { messages } from '../stores/chatStore.js';
  import Message from './Message.svelte';
  
  export let autoScroll = true;
  
  let container;
  let shouldScroll = true;
  
  // Auto-scroll to bottom when new messages arrive
  afterUpdate(async () => {
    if (autoScroll && shouldScroll && container) {
      await tick();
      // Check container still exists after tick (component might have unmounted)
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  });
  
  function handleScroll() {
    if (!container) return;
    // Check if user has scrolled up
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    shouldScroll = isAtBottom;
  }
</script>

<div 
  bind:this={container}
  on:scroll={handleScroll}
  class="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
>
  {#each $messages as message, index (message.id || index)}
    <Message {message} />
  {:else}
    <div class="flex flex-col items-center justify-center h-full text-muted">
      <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p class="text-lg font-medium">No messages yet</p>
      <p class="text-sm mt-1">Start a conversation by typing a message below</p>
    </div>
  {/each}
  
  {#if !shouldScroll && $messages.length > 0}
    <button
      on:click={() => { shouldScroll = true; container.scrollTop = container.scrollHeight; }}
      class="fixed bottom-24 right-8 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-colors"
      title="Scroll to bottom"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  {/if}
</div>

<style>
  /* Smooth scrolling */
  div {
    scroll-behavior: smooth;
  }
</style>