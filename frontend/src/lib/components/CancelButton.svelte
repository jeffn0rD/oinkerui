<script>
  import { onMount, onDestroy } from 'svelte';

  let { isActive = false, requestType = 'llm', size = 'md', onCancel = () => {} } = $props();

  let isCancelling = $state(false);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  async function handleCancel() {
    if (isCancelling || !isActive) return;
    
    isCancelling = true;
    
    try {
      onCancel();
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  }

  $effect(() => {
    if (!isActive) {
      isCancelling = false;
    }
  });

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
    onclick={handleCancel}
    disabled={isCancelling}
    class="cancel-button flex items-center gap-1 rounded font-medium transition-all {sizeClasses[size]}"
    class:cancelling={isCancelling}
    aria-label="Cancel current request"
    aria-busy={isCancelling}
    title="Cancel (Esc)"
  >
    {#if isCancelling}
      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Cancelling...</span>
    {:else}
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span>Cancel</span>
    {/if}
  </button>
{/if}

<style>
  .cancel-button {
    background-color: rgb(220 38 38);
    color: white;
  }
  
  .cancel-button:hover:not(:disabled) {
    background-color: rgb(185 28 28);
  }
  
  .cancel-button:disabled,
  .cancel-button.cancelling {
    background-color: rgb(248 113 113);
    cursor: wait;
  }
  
  .cancel-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.5);
  }
  
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