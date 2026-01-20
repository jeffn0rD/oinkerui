<script>
  import MessageList from './MessageList.svelte';
  import MessageInput from './MessageInput.svelte';
  
  export let messages = [];
</script>

<div class="flex flex-col h-full">
  <MessageList {messages} />
  <MessageInput />
</div>