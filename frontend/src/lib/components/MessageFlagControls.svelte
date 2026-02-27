<script>
  import { createEventDispatcher } from 'svelte';

  export let message;
  export let onFlagChange = () => {};
  export let disabled = false;
  export let compact = true;

  const dispatch = createEventDispatcher();

  let isUpdating = false;
  let pendingFlags = {};

  // Flag definitions
  const flags = [
    {
      key: 'is_pinned',
      label: 'Pin',
      tooltip: 'Pin message (always include in context)',
      activeClass: 'text-blue-500',
      icon: 'pin',
    },
    {
      key: 'include_in_context',
      label: 'Context',
      tooltip: 'Include in LLM context',
      activeClass: 'text-green-500',
      icon: 'eye',
    },
    {
      key: 'is_aside',
      label: 'Aside',
      tooltip: 'Mark as aside (exclude from future context)',
      activeClass: 'text-yellow-500',
      icon: 'aside',
    },
    {
      key: 'is_discarded',
      label: 'Discard',
      tooltip: 'Discard message (never include)',
      activeClass: 'text-red-500',
      icon: 'trash',
    },
  ];

  function getFlagValue(flagKey) {
    if (flagKey in pendingFlags) {
      return pendingFlags[flagKey];
    }
    if (flagKey === 'include_in_context') {
      return message?.include_in_context !== false;
    }
    return !!message?.[flagKey];
  }

  async function toggleFlag(flagKey) {
    if (disabled || isUpdating) return;

    const currentValue = getFlagValue(flagKey);
    const newValue = !currentValue;

    // Optimistic update
    pendingFlags = { ...pendingFlags, [flagKey]: newValue };
    isUpdating = true;

    try {
      await onFlagChange(message.id, flagKey, newValue);
      dispatch('flagChanged', {
        messageId: message.id,
        flag: flagKey,
        value: newValue,
      });
    } catch (err) {
      // Rollback on error
      const { [flagKey]: _, ...rest } = pendingFlags;
      pendingFlags = rest;
      console.error(`Failed to update flag ${flagKey}:`, err);
    } finally {
      isUpdating = false;
      // Clear pending flag after success
      const { [flagKey]: _, ...rest } = pendingFlags;
      pendingFlags = rest;
    }
  }

  function handleKeydown(event, flagKey) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlag(flagKey);
    }
  }
</script>

<div
  class="flex items-center gap-0.5"
  role="toolbar"
  aria-label="Message flag controls"
>
  {#each flags as flag}
    {@const isActive = getFlagValue(flag.key)}
    <button
      on:click={() => toggleFlag(flag.key)}
      on:keydown={(e) => handleKeydown(e, flag.key)}
      class="p-1 rounded transition-colors
             {disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-hover cursor-pointer'}
             {isActive ? flag.activeClass : 'text-muted'}"
      title={flag.tooltip}
      aria-label="{flag.label}: {isActive ? 'active' : 'inactive'}"
      aria-pressed={isActive}
      {disabled}
    >
      {#if flag.icon === 'pin'}
        <svg class="w-3.5 h-3.5" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      {:else if flag.icon === 'eye'}
        {#if isActive}
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        {:else}
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        {/if}
      {:else if flag.icon === 'aside'}
        <svg class="w-3.5 h-3.5" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      {:else if flag.icon === 'trash'}
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      {/if}

      {#if !compact}
        <span class="text-xs ml-1">{flag.label}</span>
      {/if}
    </button>
  {/each}
</div>