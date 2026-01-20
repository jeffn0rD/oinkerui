<script>
  export let files = [];
</script>

<div class="bg-surface border-l border-border p-4 w-64">
  <h2 class="text-lg font-semibold mb-4">Workspace</h2>
  <div class="space-y-2">
    {#each files as file}
      <div class="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm">
        {file.name}
      </div>
    {:else}
      <p class="text-gray-500 text-sm">No files</p>
    {/each}
  </div>
</div>