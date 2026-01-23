/**
 * Command Service Tests
 * 
 * Tests for slash command parsing and execution
 */

const path = require('path');
const fs = require('fs').promises;

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.WORKSPACE_ROOT = path.join(__dirname, '../../test_workspace_cmd');

const commandService = require('../../src/services/commandService');

describe('Command Service', () => {
  beforeAll(async () => {
    // Initialize command registry
    await commandService.initializeCommandRegistry();
  });

  describe('isSlashCommand', () => {
    it('should return true for strings starting with /', () => {
      expect(commandService.isSlashCommand('/help')).toBe(true);
      expect(commandService.isSlashCommand('/aside test')).toBe(true);
      expect(commandService.isSlashCommand('/ ')).toBe(true);
    });

    it('should return false for non-slash strings', () => {
      expect(commandService.isSlashCommand('hello')).toBe(false);
      expect(commandService.isSlashCommand('hello /command')).toBe(false);
      expect(commandService.isSlashCommand('')).toBe(false);
      expect(commandService.isSlashCommand(null)).toBe(false);
      expect(commandService.isSlashCommand(undefined)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(commandService.isSlashCommand('  /help')).toBe(false); // Leading space - not a command
      expect(commandService.isSlashCommand('/help  ')).toBe(true); // Trailing space OK
      expect(commandService.isSlashCommand(' /help')).toBe(false); // Single leading space - not a command
    });
  });

  describe('parseSlashCommand', () => {
    it('should parse simple command with no arguments', async () => {
      const result = await commandService.parseSlashCommand('/aside');
      
      expect(result.command).toBe('aside');
      expect(result.args).toEqual([]);
      expect(result.options).toEqual({});
      expect(result.raw_args).toBe('');
    });

    it('should parse command with positional arguments', async () => {
      const result = await commandService.parseSlashCommand('/pin message-123');
      
      expect(result.command).toBe('pin');
      expect(result.args).toEqual(['message-123']);
      expect(result.raw_args).toBe('message-123');
    });

    it('should parse command with options', async () => {
      const result = await commandService.parseSlashCommand('/chat-fork --from=msg-123 --prune');
      
      expect(result.command).toBe('chat-fork');
      expect(result.options.from).toBe('msg-123');
      expect(result.options.prune).toBe(true);
    });

    it('should handle quoted strings', async () => {
      const result = await commandService.parseSlashCommand('/commit "This is a commit message"');
      
      expect(result.command).toBe('commit');
      expect(result.args).toEqual(['This is a commit message']);
    });

    it('should be case insensitive', async () => {
      const result = await commandService.parseSlashCommand('/ASIDE');
      expect(result.command).toBe('aside');
    });

    it('should handle command aliases', async () => {
      const result = await commandService.parseSlashCommand('/run test.py');
      expect(result.command).toBe('execute');
      expect(result.args).toEqual(['test.py']);
    });

    it('should throw ValidationError for non-slash input', async () => {
      await expect(
        commandService.parseSlashCommand('hello')
      ).rejects.toThrow(commandService.ValidationError);
    });

    it('should throw ValidationError for empty command', async () => {
      await expect(
        commandService.parseSlashCommand('/')
      ).rejects.toThrow(commandService.ValidationError);
    });

    it('should throw UnknownCommandError for unknown command', async () => {
      await expect(
        commandService.parseSlashCommand('/unknowncommand')
      ).rejects.toThrow(commandService.UnknownCommandError);
    });

    it('should provide suggestions for unknown commands', async () => {
      try {
        await commandService.parseSlashCommand('/asid');
      } catch (error) {
        expect(error.name).toBe('UnknownCommandError');
        expect(error.suggestions).toBeDefined();
        expect(Array.isArray(error.suggestions)).toBe(true);
      }
    });

    it('should include command definition in result', async () => {
      const result = await commandService.parseSlashCommand('/aside');
      
      expect(result.definition).toBeDefined();
      expect(result.definition.name).toBe('aside');
      expect(result.definition.handler_type).toBe('meta');
    });
  });

  describe('executeSlashCommand', () => {
    const mockContext = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      chatId: '123e4567-e89b-12d3-a456-426614174001'
    };

    it('should execute /aside command', async () => {
      const parsed = await commandService.parseSlashCommand('/aside');
      const result = await commandService.executeSlashCommand(parsed, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.command).toBe('aside');
      expect(result.data.flags.is_aside).toBe(true);
      expect(result.continueWithLLM).toBe(true);
    });

    it('should execute /aside-pure command', async () => {
      const parsed = await commandService.parseSlashCommand('/aside-pure');
      const result = await commandService.executeSlashCommand(parsed, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.command).toBe('aside-pure');
      expect(result.data.flags.pure_aside).toBe(true);
      expect(result.data.flags.is_aside).toBe(true);
    });

    it('should execute /pin command without message ID', async () => {
      const parsed = await commandService.parseSlashCommand('/pin');
      const result = await commandService.executeSlashCommand(parsed, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.command).toBe('pin');
      expect(result.data.flags.is_pinned).toBe(true);
    });

    it('should execute /requery command', async () => {
      const parsed = await commandService.parseSlashCommand('/requery');
      const result = await commandService.executeSlashCommand(parsed, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.command).toBe('requery');
      expect(result.triggerRequery).toBe(true);
    });

    it('should return error for /discard without message ID', async () => {
      const parsed = await commandService.parseSlashCommand('/discard');
      const result = await commandService.executeSlashCommand(parsed, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Message ID required');
    });

    it('should return error for /commit without message', async () => {
      const parsed = await commandService.parseSlashCommand('/commit');
      const result = await commandService.executeSlashCommand(parsed, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Commit message required');
    });
  });

  describe('getAvailableCommands', () => {
    it('should return array of commands', async () => {
      const commands = await commandService.getAvailableCommands();
      
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
    });

    it('should include expected commands', async () => {
      const commands = await commandService.getAvailableCommands();
      const commandNames = commands.map(c => c.name);
      
      expect(commandNames).toContain('aside');
      expect(commandNames).toContain('aside-pure');
      expect(commandNames).toContain('pin');
      expect(commandNames).toContain('requery');
    });
  });

  describe('getCommandDefinition', () => {
    it('should return command definition by name', async () => {
      const cmd = await commandService.getCommandDefinition('aside');
      
      expect(cmd).toBeDefined();
      expect(cmd.name).toBe('aside');
      expect(cmd.description).toBeDefined();
    });

    it('should return command definition by alias', async () => {
      const cmd = await commandService.getCommandDefinition('run');
      
      expect(cmd).toBeDefined();
      expect(cmd.name).toBe('execute');
    });

    it('should return null for unknown command', async () => {
      const cmd = await commandService.getCommandDefinition('unknowncommand');
      expect(cmd).toBeNull();
    });

    it('should be case insensitive', async () => {
      const cmd = await commandService.getCommandDefinition('ASIDE');
      expect(cmd).toBeDefined();
      expect(cmd.name).toBe('aside');
    });
  });
});