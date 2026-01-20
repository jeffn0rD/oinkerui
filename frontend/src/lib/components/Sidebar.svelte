<script>
  export let projects = [];
</script>

<aside class="w-64 bg-surface border-r border-border p-4">
  <h2 class="text-lg font-semibold mb-4">Projects</h2>
  <div class="space-y-2">
    {#each projects as project}
      <div class="p-2 hover:bg-gray-100 rounded cursor-pointer">
        {project.name}
      </div>
    {:else}
      <p class="text-gray-500 text-sm">No projects yet</p>
    {/each}
  </div>
</aside>