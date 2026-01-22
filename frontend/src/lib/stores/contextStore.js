/**
 * Context Store
 * 
 * Manages the context window display and token counting.
 * Tracks which messages are included in context and token usage.
 */

import { writable, derived, get } from 'svelte/store';
import { messages, currentChat } from './chatStore.js';

// Context configuration
export const contextConfig = writable({
  maxTokens: 32000,
  reservedTokens: 1000, // Reserved for system prompt and response
  tokenEstimateRatio: 4 // Approximate chars per token
});

// Messages included in context (computed from messages)
export const contextMessages = derived(
  [messages, currentChat],
  ([$messages, $currentChat]) => {
    if (!$messages || $messages.length === 0) return [];
    
    // Filter messages that should be in context
    return $messages.filter(m => 
      !m.is_discarded && 
      m.include_in_context !== false &&
      (!m.is_aside || m.is_pinned)
    );
  }
);

// Pinned messages
export const pinnedMessages = derived(messages, $messages => 
  $messages.filter(m => m.is_pinned && !m.is_discarded)
);

// Token usage statistics
export const tokenStats = derived(
  [contextMessages, contextConfig, currentChat],
  ([$contextMessages, $config, $currentChat]) => {
    let totalTokens = 0;
    let systemTokens = 0;
    let messageTokens = 0;
    
    // Estimate tokens for system prelude
    if ($currentChat?.system_prelude?.content) {
      systemTokens = estimateTokens($currentChat.system_prelude.content, $config.tokenEstimateRatio);
    }
    
    // Estimate tokens for messages
    for (const msg of $contextMessages) {
      messageTokens += estimateTokens(msg.content, $config.tokenEstimateRatio);
    }
    
    totalTokens = systemTokens + messageTokens;
    
    const availableTokens = $config.maxTokens - $config.reservedTokens;
    const usagePercent = Math.min(100, (totalTokens / availableTokens) * 100);
    
    return {
      total: totalTokens,
      system: systemTokens,
      messages: messageTokens,
      available: availableTokens,
      remaining: Math.max(0, availableTokens - totalTokens),
      usagePercent: Math.round(usagePercent),
      isNearLimit: usagePercent > 80,
      isOverLimit: totalTokens > availableTokens
    };
  }
);

// Context display state
export const contextDisplay = writable({
  isExpanded: false,
  showTokens: true,
  highlightPinned: true
});

/**
 * Estimate token count for text
 * @param {string} text - Text to estimate
 * @param {number} ratio - Characters per token ratio
 * @returns {number} Estimated token count
 */
function estimateTokens(text, ratio = 4) {
  if (!text) return 0;
  return Math.ceil(text.length / ratio);
}

/**
 * Update context display settings
 */
export function updateContextDisplay(updates) {
  contextDisplay.update(current => ({ ...current, ...updates }));
}

/**
 * Toggle context panel expansion
 */
export function toggleContextPanel() {
  contextDisplay.update(current => ({ 
    ...current, 
    isExpanded: !current.isExpanded 
  }));
}

/**
 * Get context summary for display
 */
export function getContextSummary() {
  const $contextMessages = get(contextMessages);
  const $pinnedMessages = get(pinnedMessages);
  const $tokenStats = get(tokenStats);
  
  return {
    messageCount: $contextMessages.length,
    pinnedCount: $pinnedMessages.length,
    tokenStats: $tokenStats
  };
}

/**
 * Check if a message is in the current context
 * @param {string} messageId - Message ID to check
 * @returns {boolean} True if message is in context
 */
export function isMessageInContext(messageId) {
  const $contextMessages = get(contextMessages);
  return $contextMessages.some(m => m.id === messageId);
}