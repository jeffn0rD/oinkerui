<script>
  /**
   * CancelButton Component
   * 
   * Button to cancel in-progress LLM requests with visual feedback.
   * Shows only when there is an active request and provides
   * keyboard shortcut support (Escape key).
   * 
   * Spec: spec/functions/frontend_svelte/cancel_button.yaml
   */
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Props
  export let isActive = false;
  export let requestType = 'llm';
  export let size = 'md';
  
  // Internal state
  let isCancelling = false;
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  // Handle cancel click
  async function handleCancel() {
    if (isCancelling || !isActive) return;
    
    isCancelling = true;
    
    try {
      dispatch('cancel');
    } catch (error) {
      console.error('Cancel failed:', error);
      dispatch('cancelFailed', { error: error.message });
    }
  }
  
  // Reset cancelling state when isActive changes to false
  $: if (!isActive) {
    isCancelling = false;
  }
  
  // Keyboard shortcut handler
  function handleKeydown(event) {
    if (event.key === 'Escape' && isActive && !isCancelling) {
      event.preventDefault();
      handleCancel();
    }
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });
  
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if isActive}
  <button
    on:click={handleCancel}
    disabled={isCancelling}
    class="cancel-button flex items-center gap-1 rounded font-medium transition-all {sizeClasses[size]}"
    class:cancelling={isCancelling}
    aria-label="Cancel current request"
    aria-busy={isCancelling}
    title="Cancel (Esc)"
  >
    {#if isCancelling}
      <!-- Spinner -->
      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Cancelling...</span>
    {:else}
      <!-- Cancel icon -->
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span>Cancel</span>
    {/if}
  </button>
{/if}

<style>
  .cancel-button {
    background-color: rgb(220 38 38); /* red-600 */
    color: white;
  }
  
  .cancel-button:hover:not(:disabled) {
    background-color: rgb(185 28 28); /* red-700 */
  }
  
  .cancel-button:disabled,
  .cancel-button.cancelling {
    background-color: rgb(248 113 113); /* red-400 */
    cursor: wait;
  }
  
  .cancel-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.5);
  }
  
  /* Animation for showing/hiding */
  .cancel-button {
    animation: fadeIn 150ms ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>