<script>
  let message = '';
  
  function handleSubmit() {
    if (message.trim()) {
      // TODO: Send message to backend
      console.log('Sending message:', message);
      message = '';
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="border-t border-border p-4">
  <div class="flex gap-2">
    <textarea
      bind:value={message}
      on:keydown={handleKeydown}
      placeholder="Type your message..."
      class="input flex-1 resize-none"
      rows="3"
    ></textarea>
    <button
      on:click={handleSubmit}
      class="btn btn-primary self-end"
      disabled={!message.trim()}
    >
      Send
    </button>
  </div>
</div>