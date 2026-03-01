<script>
  import { createEventDispatcher } from 'svelte';
  import MessageList from './MessageList.svelte';
  import MessageInput from './MessageInput.svelte';
  import CancelButton from './CancelButton.svelte';
  import ContextSizeDisplay from './ContextSizeDisplay.svelte';
  import { currentChat, messages } from '../stores/chatStore.js';
  import { currentProject } from '../stores/projectStore.js';
  import { loading, streaming, stopStreaming } from '../stores/uiStore.js';
  import { chatApi, messageApi } from '../utils/api.js';
  
  const dispatch = createEventDispatcher();
  
  // Model selection
  const AVAILABLE_MODELS = [
    { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
    { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
    { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', provider: 'Meta' },
  ];
  
  let selectedModel = 'openai/gpt-4';
  let showModelDropdown = false;
  let showChatMenu = false;
  
  $: currentModelName = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel.split('/').pop();
  
  // Update model from chat settings if available
  $: if ($currentChat?.default_model) {
    selectedModel = $currentChat.default_model;
  }
  
  async function handleSendMessage(event) {
    const { content, is_aside, pure_aside } = event.detail;
    
    if (!$currentProject || !$currentChat) {
      console.error('No project or chat selected');
      return;
    }
    
    // Add user message to UI immediately
    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      is_aside: is_aside || false,
      pure_aside: pure_aside || false,
    };
    
    messages.update(msgs => [...msgs, userMessage]);
    loading.set(true);
    
    // Dispatch event for parent to handle streaming
    dispatch('send', {
      projectId: $currentProject.id,
      chatId: $currentChat.id,
      content,
      model: selectedModel,
      is_aside: is_aside || false,
      pure_aside: pure_aside || false,
    });
  }
  
  async function handleCancel() {
    if (!$currentProject || !$currentChat) return;
    
    try {
      await chatApi.cancel($currentProject.id, $currentChat.id);
      stopStreaming();
      loading.set(false);
      dispatch('cancel');
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  }
  
  function handleFork() {
    if (!$currentProject || !$currentChat) return;
    dispatch('fork', {
      projectId: $currentProject.id,
      chatId: $currentChat.id,
      name: `Fork of ${$currentChat.name}`,
    });
    showChatMenu = false;
  }
  
  function handleForkFromMessage(event) {
    if (!$currentProject || !$currentChat) return;
    dispatch('fork', {
      projectId: $currentProject.id,
      chatId: $currentChat.id,
      name: `Fork of ${$currentChat.name}`,
      fromMessageId: event.detail.messageId,
    });
  }
  
  function handleFlagUpdate(event) {
    dispatch('flagUpdate', event.detail);
  }
  
  function selectModel(modelId) {
    selectedModel = modelId;
    showModelDropdown = false;
  }
  
  function handleClickOutside(event) {
    if (showModelDropdown) showModelDropdown = false;
    if (showChatMenu) showChatMenu = false;
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="flex flex-col h-full bg-background">
  <!-- Chat header -->
  {#if $currentChat}
    <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
      <div class="flex items-center gap-3">
        <h2 class="font-semibold text-foreground">{$currentChat.name}</h2>
        {#if $currentChat.status !== 'active'}
          <span class="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-muted">
            {$currentChat.status}
          </span>
        {/if}
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Model selector -->
        <div class="relative">
          <button
            on:click|stopPropagation={() => showModelDropdown = !showModelDropdown}
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-hover text-foreground transition-colors"
            title="Select model"
          >
            <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{currentModelName}</span>
            <svg class="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {#if showModelDropdown}
            <div class="absolute right-0 top-full mt-1 w-64 bg-surface border border-border rounded-lg shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
              {#each AVAILABLE_MODELS as model}
                <button
                  on:click|stopPropagation={() => selectModel(model.id)}
                  class="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center justify-between
                         {selectedModel === model.id ? 'bg-primary/10 text-primary' : 'text-foreground'}"
                >
                  <div>
                    <div class="font-medium">{model.name}</div>
                    <div class="text-xs text-muted">{model.provider}</div>
                  </div>
                  {#if selectedModel === model.id}
                    <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Cancel button - shows during active streaming -->
        <CancelButton 
          isActive={$streaming.isActive && $streaming.chatId === $currentChat?.id}
          requestType={$streaming.requestType}
          size="sm"
          on:cancel={handleCancel}
        />
        
        <!-- Chat menu -->
        <div class="relative">
          <button 
            on:click|stopPropagation={() => showChatMenu = !showChatMenu}
            class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
            title="Chat options"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {#if showChatMenu}
            <div class="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 py-1">
              <button
                on:click|stopPropagation={handleFork}
                class="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover text-foreground transition-colors flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Fork Chat
              </button>
              <button
                on:click|stopPropagation={() => { showChatMenu = false; }}
                class="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover text-foreground transition-colors flex items-center gap-2"
                disabled
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Requery Last
              </button>
              <hr class="my-1 border-border" />
              <button
                on:click|stopPropagation={() => { showChatMenu = false; }}
                class="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover text-red-500 transition-colors flex items-center gap-2"
                disabled
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Chat
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Messages area -->
  <div class="flex-1 overflow-hidden">
    {#if $currentChat}
      <MessageList 
        on:pin={(e) => handleFlagUpdate({ detail: { messageId: e.detail.messageId, flags: { is_pinned: e.detail.pinned } } })}
        on:discard={(e) => handleFlagUpdate({ detail: { messageId: e.detail.messageId, flags: { is_discarded: e.detail.discarded } } })}
        on:flagUpdate={handleFlagUpdate}
        on:fork={handleForkFromMessage}
      />
    {:else}
      <div class="flex flex-col items-center justify-center h-full text-muted">
        <svg class="w-20 h-20 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-xl font-medium">Select a chat to start</p>
        <p class="text-sm mt-1">Choose a chat from the sidebar or create a new one</p>
      </div>
    {/if}
  </div>
  
  <!-- Input area -->
  {#if $currentChat}
    <div class="border-t border-border bg-surface">
      <!-- Context size display (compact) -->
      <div class="flex items-center justify-between px-4 pt-2">
        <ContextSizeDisplay compact={true} />
        {#if $streaming.isActive}
          <CancelButton on:cancel={handleCancel} size="sm" />
        {/if}
      </div>
      <MessageInput 
        on:send={handleSendMessage}
        disabled={$currentChat.status !== 'active'}
        projectId={$currentProject?.id || ''}
        placeholder={$currentChat.status !== 'active' 
          ? 'This chat is ' + $currentChat.status 
          : 'Type your message... (/ for commands)'}
      />
    </div>
  {/if}
</div>

<style>
  /* Component-specific styles */
</style>