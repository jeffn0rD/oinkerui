<script>
  import { createEventDispatcher } from 'svelte';
  import MessageList from './MessageList.svelte';
  import MessageInput from './MessageInput.svelte';
  import CancelButton from './CancelButton.svelte';
  import ContextSizeDisplay from './ContextSizeDisplay.svelte';
  import { currentChat, messages } from '../stores/chatStore.js';
  import { currentProject } from '../stores/projectStore.js';
  import { loading, streaming, stopStreaming } from '../stores/uiStore.js';
  import { chatApi } from '../utils/api.js';
  
  const dispatch = createEventDispatcher();
  
  async function handleSendMessage(event) {
    const { content } = event.detail;
    
    if (!$currentProject || !$currentChat) {
      console.error('No project or chat selected');
      return;
    }
    
    // Add user message to UI immediately
    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    
    messages.update(msgs => [...msgs, userMessage]);
    loading.set(true);
    
    try {
      // Dispatch event for parent to handle API call
      dispatch('send', {
        projectId: $currentProject.id,
        chatId: $currentChat.id,
        content
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the temporary message on error
      messages.update(msgs => msgs.filter(m => m.id !== userMessage.id));
    }
  }
  
  function handleMessagePin(event) {
    dispatch('pin', event.detail);
  }
  
  function handleMessageDiscard(event) {
    dispatch('discard', event.detail);
  }
  
  async function handleCancel() {
    if (!$currentProject || !$currentChat) return;
    
    try {
      const result = await chatApi.cancel($currentProject.id, $currentChat.id);
      
      // Stop streaming state
      stopStreaming();
      loading.set(false);
      
      // If there was a partial response, we could handle it here
      if (result.data?.partialResponse) {
        console.log('Partial response preserved:', result.data.partialResponse.length, 'chars');
      }
      
      dispatch('cancelled', result.data);
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  }
</script>

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
        <!-- Cancel button - shows during active streaming -->
        <CancelButton 
          isActive={$streaming.isActive && $streaming.chatId === $currentChat?.id}
          requestType={$streaming.requestType}
          size="sm"
          on:cancel={handleCancel}
        />
        
        <!-- Chat settings button -->
        <button 
          class="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          title="Chat settings"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Messages area -->
  <div class="flex-1 overflow-hidden">
    {#if $currentChat}
      <MessageList 
        on:pin={handleMessagePin}
        on:discard={handleMessageDiscard}
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
          <CancelButton on:cancel={handleCancel} />
        {/if}
      </div>
      <MessageInput 
        on:send={handleSendMessage}
        disabled={$currentChat.status !== 'active'}
        placeholder={$currentChat.status !== 'active' 
          ? 'This chat is ' + $currentChat.status 
          : 'Type your message...'}
      />
    </div>
  {/if}
</div>

<style>
  /* Component-specific styles */
</style>