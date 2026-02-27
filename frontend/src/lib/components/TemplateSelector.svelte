<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { templateApi } from '../utils/api.js';

  export let isOpen = false;
  export let projectId = '';
  export let onSelect = () => {};
  export let onClose = () => {};

  const dispatch = createEventDispatcher();

  let templates = [];
  let selectedTemplate = null;
  let variables = {};
  let preview = '';
  let isLoading = false;
  let isRendering = false;
  let error = '';
  let searchQuery = '';
  let selectedCategory = '';
  let categories = [];

  $: if (isOpen) {
    loadTemplates();
  }

  $: if (!isOpen) {
    resetState();
  }

  async function loadTemplates() {
    isLoading = true;
    error = '';
    try {
      const result = await templateApi.list({
        projectId,
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
      });
      templates = result.templates || [];
      
      // Extract unique categories
      const catSet = new Set(templates.map(t => t.category));
      categories = Array.from(catSet).sort();
    } catch (err) {
      error = err.message || 'Failed to load templates';
      templates = [];
    } finally {
      isLoading = false;
    }
  }

  function selectTemplate(template) {
    selectedTemplate = template;
    // Initialize variables with defaults
    variables = {};
    for (const v of template.variables || []) {
      variables[v.name] = v.default || '';
    }
    preview = '';
    renderPreview();
  }

  async function renderPreview() {
    if (!selectedTemplate) return;
    isRendering = true;
    try {
      const result = await templateApi.resolve(
        selectedTemplate.id,
        variables,
        { projectId },
      );
      preview = result.content || '';
    } catch (err) {
      preview = `Error: ${err.message}`;
    } finally {
      isRendering = false;
    }
  }

  function handleVariableChange() {
    // Debounce preview rendering
    clearTimeout(handleVariableChange._timeout);
    handleVariableChange._timeout = setTimeout(renderPreview, 300);
  }

  function handleInsert() {
    if (preview) {
      onSelect(preview);
      dispatch('select', { content: preview, templateId: selectedTemplate?.id });
      handleClose();
    }
  }

  function handleClose() {
    onClose();
    dispatch('close');
  }

  function resetState() {
    selectedTemplate = null;
    variables = {};
    preview = '';
    error = '';
    searchQuery = '';
    selectedCategory = '';
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function handleSearchInput() {
    loadTemplates();
  }

  function handleCategoryChange() {
    loadTemplates();
  }

  // Filter templates by category in the UI
  $: filteredTemplates = templates;
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    role="dialog"
    aria-modal="true"
    aria-label="Template Selector"
    on:keydown={handleKeydown}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0" on:click={handleClose}></div>
    
    <div class="relative bg-surface border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 class="text-lg font-semibold text-foreground">Prompt Templates</h2>
        <button
          on:click={handleClose}
          class="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search & Filter -->
      <div class="px-5 py-3 border-b border-border flex gap-3">
        <input
          type="text"
          bind:value={searchQuery}
          on:input={handleSearchInput}
          placeholder="Search templates..."
          class="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {#if categories.length > 1}
          <select
            bind:value={selectedCategory}
            on:change={handleCategoryChange}
            class="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All categories</option>
            {#each categories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1 flex overflow-hidden min-h-0">
        {#if !selectedTemplate}
          <!-- Template List -->
          <div class="flex-1 overflow-y-auto p-3">
            {#if isLoading}
              <div class="flex items-center justify-center py-8 text-muted">
                <svg class="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading templates...
              </div>
            {:else if error}
              <div class="text-center py-8 text-red-400">{error}</div>
            {:else if filteredTemplates.length === 0}
              <div class="text-center py-8 text-muted">No templates found</div>
            {:else}
              <div class="space-y-2">
                {#each filteredTemplates as template}
                  <button
                    on:click={() => selectTemplate(template)}
                    class="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-surface-hover transition-colors"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-medium text-foreground text-sm">{template.name}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-muted">{template.category}</span>
                    </div>
                    <p class="text-xs text-muted line-clamp-2">{template.description}</p>
                    {#if template.variables?.length > 0}
                      <div class="flex gap-1 mt-2 flex-wrap">
                        {#each template.variables as v}
                          <span class="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {v.name}{v.required ? '*' : ''}
                          </span>
                        {/each}
                      </div>
                    {/if}
                    {#if template.scope === 'project'}
                      <span class="text-xs text-primary mt-1 inline-block">📁 Project template</span>
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <!-- Template Detail / Variables -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Back button + template name -->
            <div class="px-4 py-3 border-b border-border flex items-center gap-2">
              <button
                on:click={() => { selectedTemplate = null; preview = ''; }}
                class="p-1 rounded hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
                aria-label="Back to list"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span class="font-medium text-foreground text-sm">{selectedTemplate.name}</span>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-4">
              <!-- Variables Form -->
              {#if selectedTemplate.variables?.length > 0}
                <div>
                  <h3 class="text-sm font-medium text-foreground mb-2">Variables</h3>
                  <div class="space-y-3">
                    {#each selectedTemplate.variables as v}
                      <div>
                        <label class="block text-xs text-muted mb-1" for="var-{v.name}">
                          {v.name}
                          {#if v.required}<span class="text-red-400">*</span>{/if}
                          {#if v.description}
                            <span class="text-muted"> — {v.description}</span>
                          {/if}
                        </label>
                        {#if v.description?.includes('code') || v.description?.includes('text') || v.description?.includes('Code') || v.description?.includes('Text')}
                          <textarea
                            id="var-{v.name}"
                            bind:value={variables[v.name]}
                            on:input={handleVariableChange}
                            placeholder={v.default || v.name}
                            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                            rows="3"
                          ></textarea>
                        {:else}
                          <input
                            id="var-{v.name}"
                            type="text"
                            bind:value={variables[v.name]}
                            on:input={handleVariableChange}
                            placeholder={v.default || v.name}
                            class="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Preview -->
              <div>
                <h3 class="text-sm font-medium text-foreground mb-2">Preview</h3>
                <div class="p-3 rounded-lg border border-border bg-background text-sm text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {#if isRendering}
                    <span class="text-muted">Rendering...</span>
                  {:else if preview}
                    {preview}
                  {:else}
                    <span class="text-muted">Fill in variables to see preview</span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Insert Button -->
            <div class="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                on:click={() => { selectedTemplate = null; preview = ''; }}
                class="px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                Back
              </button>
              <button
                on:click={handleInsert}
                disabled={!preview || isRendering}
                class="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Insert into Prompt
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>