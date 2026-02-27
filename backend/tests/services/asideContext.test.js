/**
 * Tests for Aside and Pure Aside Context Behavior
 * 
 * Verifies that constructContext correctly handles:
 * - Aside messages excluded from future context
 * - Pure aside messages (system + current only)
 * - Aside responses also marked as aside
 */

jest.mock('../../src/config', () => ({
  env: 'test',
  workspace: { root: './workspaces', dataDir: './data' },
  api: { openrouter: { apiKey: 'test-key', baseUrl: 'https://openrouter.ai/api/v1', timeout: 60000 } },
  git: { userName: 'Test', userEmail: 'test@test.com', autoCommitEnabled: false },
  security: { corsOrigins: ['http://localhost:5173'] },
  logging: { level: 'info', format: 'json', debug: false },
  python: { port: 8000, baseUrl: 'http://localhost:8000' },
}));

const { constructContext } = require('../../src/services/llmService');
const projectService = require('../../src/services/projectService');
const chatService = require('../../src/services/chatService');

let testProjectId;
let testChatId;

beforeAll(async () => {
  // Create test project and chat
  const project = await projectService.createProject('Aside Test Project');
  testProjectId = project.id;

  const chat = await chatService.createChat(testProjectId, {
    name: 'Aside Test Chat',
    system_prelude: { content: 'You are a helpful assistant.' },
  });
  testChatId = chat.id;
});

afterAll(async () => {
  // Cleanup
  try {
    await projectService.deleteProject(testProjectId, true);
  } catch (e) {
    // Ignore cleanup errors
  }
});

describe('Aside Context Behavior', () => {
  test('aside messages are excluded from future context', async () => {
    const chat = await chatService.getChat(testProjectId, testChatId);

    // Simulate messages: normal, aside, then current
    const messages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Normal message',
        created_at: '2025-01-01T00:00:01Z',
        include_in_context: true,
        is_aside: false,
        pure_aside: false,
        is_pinned: false,
        is_discarded: false,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Normal response',
        created_at: '2025-01-01T00:00:02Z',
        include_in_context: true,
        is_aside: false,
        pure_aside: false,
        is_pinned: false,
        is_discarded: false,
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Aside message',
        created_at: '2025-01-01T00:00:03Z',
        include_in_context: true,
        is_aside: true,
        pure_aside: false,
        is_pinned: false,
        is_discarded: false,
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'Aside response',
        created_at: '2025-01-01T00:00:04Z',
        include_in_context: true,
        is_aside: true,
        pure_aside: false,
        is_pinned: false,
        is_discarded: false,
      },
    ];

    // Save all messages
    const messageService = require('../../src/services/messageService');
    for (const msg of messages) {
      await messageService.saveMessage(testProjectId, testChatId, msg);
    }

    // Now send a new message - aside messages should be excluded
    const currentMessage = {
      id: 'msg-5',
      role: 'user',
      content: 'New message after aside',
      created_at: '2025-01-01T00:00:05Z',
      include_in_context: true,
      is_aside: false,
      pure_aside: false,
      is_pinned: false,
      is_discarded: false,
    };

    const context = await constructContext(chat, currentMessage, 'openai/gpt-4');

    // Context should include: system prelude, msg-1, msg-2, msg-5 (current)
    // Should NOT include: msg-3 (aside), msg-4 (aside response)
    const contents = context.map(m => m.content);
    
    expect(contents).toContain('Normal message');
    expect(contents).toContain('Normal response');
    expect(contents).toContain('New message after aside');
    expect(contents).not.toContain('Aside message');
    expect(contents).not.toContain('Aside response');
  });

  test('pure aside context contains only system + current message', async () => {
    const chat = await chatService.getChat(testProjectId, testChatId);

    const currentMessage = {
      id: 'msg-pure-aside',
      role: 'user',
      content: 'Pure aside question',
      created_at: '2025-01-01T00:01:00Z',
      include_in_context: true,
      is_aside: true,
      pure_aside: true,
      is_pinned: false,
      is_discarded: false,
    };

    const context = await constructContext(chat, currentMessage, 'openai/gpt-4');

    // Context should be exactly: system prelude + current message
    expect(context.length).toBe(2);
    expect(context[0].role).toBe('system');
    expect(context[0].content).toBe('You are a helpful assistant.');
    expect(context[1].role).toBe('user');
    expect(context[1].content).toBe('Pure aside question');
  });

  test('pinned aside messages are still included in future context', async () => {
    const chat = await chatService.getChat(testProjectId, testChatId);

    // Add a pinned aside message
    const messageService = require('../../src/services/messageService');
    await messageService.saveMessage(testProjectId, testChatId, {
      id: 'msg-pinned-aside',
      role: 'user',
      content: 'Pinned aside message',
      created_at: '2025-01-01T00:00:06Z',
      include_in_context: true,
      is_aside: true,
      pure_aside: false,
      is_pinned: true,
      is_discarded: false,
    });

    const currentMessage = {
      id: 'msg-after-pinned-aside',
      role: 'user',
      content: 'After pinned aside',
      created_at: '2025-01-01T00:00:07Z',
      include_in_context: true,
      is_aside: false,
      pure_aside: false,
      is_pinned: false,
      is_discarded: false,
    };

    const context = await constructContext(chat, currentMessage, 'openai/gpt-4');
    const contents = context.map(m => m.content);

    // Pinned aside should be included despite being aside
    expect(contents).toContain('Pinned aside message');
    expect(contents).toContain('After pinned aside');
  });
});