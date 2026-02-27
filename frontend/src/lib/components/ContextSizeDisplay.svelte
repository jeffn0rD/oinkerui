<script>
  /**
   * ContextSizeDisplay Component
   * 
   * Shows real-time context size estimation with a progress bar
   * indicating tokens used vs model maximum.
   * 
   * Color coding:
   * - Green: <70% usage
   * - Yellow: 70-90% usage
   * - Red: >90% usage
   * 
   * Spec: spec/functions/frontend_svelte/context_size_display.yaml
   */
  
  import { tokenStats, contextMessages, pinnedMessages, toggleContextPanel, contextDisplay } from '../stores/contextStore.js';
  
  export let compact = false;
  
  // Determine color based on usage percentage
  $: usageColor = getUsageColor($tokenStats.usagePercent);
  $: barWidth = Math.min(100, $tokenStats.usagePercent);
  
  function getUsageColor(percent) {
    if (percent >= 90) return { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-100 dark:bg-red-900/30' };
    if (percent >= 70) return { bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-100 dark:bg-green-900/30' };
  }
  
  function formatTokens(count) {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  }
</script>

{#if compact}
  <!-- Compact mode: just the bar and numbers -->
  <button 
    class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors text-xs"
    on:click={toggleContextPanel}
    title="Context: {$tokenStats.total} / {$tokenStats.available} tokens ({$tokenStats.usagePercent}%)"
  >
    <div class="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div 
        class="h-full rounded-full transition-all duration-300 {usageColor.bg}"
        style="width: {barWidth}%"
      ></div>
    </div>
    <span class="text-muted {usageColor.text}">
      {formatTokens($tokenStats.total)}/{formatTokens($tokenStats.available)}
    </span>
  </button>
{:else}
  <!-- Full mode: detailed display -->
  <div class="rounded-lg border border-border bg-surface p-3">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span class="text-sm font-medium text-foreground">Context Window</span>
      </div>
      <span class="text-xs {usageColor.text} font-medium">
        {$tokenStats.usagePercent}%
      </span>
    </div>
    
    <!-- Progress bar -->
    <div class="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2">
      <div 
        class="h-full rounded-full transition-all duration-300 {usageColor.bg}"
        style="width: {barWidth}%"
      ></div>
    </div>
    
    <!-- Token counts -->
    <div class="flex items-center justify-between text-xs text-muted">
      <span>{formatTokens($tokenStats.total)} tokens used</span>
      <span>{formatTokens($tokenStats.available)} max</span>
    </div>
    
    <!-- Breakdown (expandable) -->
    {#if $contextDisplay.isExpanded}
      <div class="mt-3 pt-3 border-t border-border space-y-1.5">
        {#if $tokenStats.system > 0}
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted">System prompt</span>
            <span class="text-foreground">{formatTokens($tokenStats.system)}</span>
          </div>
        {/if}
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted">Messages ({$contextMessages.length})</span>
          <span class="text-foreground">{formatTokens($tokenStats.messages)}</span>
        </div>
        {#if $pinnedMessages.length > 0}
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted">
              <svg class="w-3 h-3 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
              </svg>
              Pinned
            </span>
            <span class="text-foreground">{$pinnedMessages.length}</span>
          </div>
        {/if}
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted">Remaining</span>
          <span class="{$tokenStats.remaining > 0 ? 'text-green-500' : 'text-red-500'}">
            {formatTokens($tokenStats.remaining)}
          </span>
        </div>
      </div>
    {/if}
    
    <!-- Toggle expand -->
    <button 
      class="w-full mt-2 text-xs text-muted hover:text-foreground transition-colors text-center"
      on:click={toggleContextPanel}
    >
      {$contextDisplay.isExpanded ? '▲ Less' : '▼ More'}
    </button>
  </div>
{/if}

<style>
  /* Component-specific styles */
</style>