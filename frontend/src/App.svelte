<script>
  import Header from './lib/components/Header.svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import ChatInterface from './lib/components/ChatInterface.svelte';
  import WorkspacePanel from './lib/components/WorkspacePanel.svelte';
  import { projects } from './lib/stores/projectStore';
  import { messages } from './lib/stores/chatStore';
</script>

<div class="h-screen flex flex-col">
  <Header />
  <div class="flex-1 flex overflow-hidden">
    <Sidebar projects={$projects} />
    <main class="flex-1 overflow-auto">
      <ChatInterface messages={$messages} />
    </main>
    <WorkspacePanel files={[]} />
  </div>
</div>