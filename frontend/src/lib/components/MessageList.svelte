<script>
  export let messages = [];
</script>

<div class="flex-1 overflow-y-auto p-4 space-y-4">
  {#each messages as message}
    <div class="card">
      <div class="font-semibold mb-2">{message.role}</div>
      <div class="text-sm">{message.content}</div>
    </div>
  {:else}
    <div class="text-center text-gray-500 mt-8">
      <p>No messages yet. Start a conversation!</p>
    </div>
  {/each}
</div>