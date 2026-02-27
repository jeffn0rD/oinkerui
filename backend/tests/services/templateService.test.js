/**
 * Tests for Template Service
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock config before requiring templateService
jest.mock('../../src/config', () => ({
  workspace: {
    root: './workspaces',
  },
  python: {
    baseUrl: 'http://localhost:8000',
  },
}));

const templateService = require('../../src/services/templateService');

describe('templateService', () => {
  beforeEach(() => {
    templateService.clearCache();
  });

  describe('simpleSubstitute', () => {
    test('substitutes simple variables', () => {
      const result = templateService.simpleSubstitute(
        'Hello, {{ name }}!',
        { name: 'World' }
      );
      expect(result.content).toBe('Hello, World!');
      expect(result.variables_used).toContain('name');
      expect(result.missing_variables).toHaveLength(0);
    });

    test('handles multiple variables', () => {
      const result = templateService.simpleSubstitute(
        '{{ greeting }}, {{ name }}!',
        { greeting: 'Hi', name: 'Alice' }
      );
      expect(result.content).toBe('Hi, Alice!');
      expect(result.variables_used).toContain('greeting');
      expect(result.variables_used).toContain('name');
    });

    test('reports missing variables', () => {
      const result = templateService.simpleSubstitute(
        'Hello, {{ name }}! You are {{ age }}.',
        { name: 'Alice' }
      );
      expect(result.content).toBe('Hello, Alice! You are {{ age }}.');
      expect(result.missing_variables).toContain('age');
    });

    test('handles empty variables', () => {
      const result = templateService.simpleSubstitute(
        'Hello, {{ name }}!',
        {}
      );
      expect(result.content).toBe('Hello, {{ name }}!');
      expect(result.missing_variables).toContain('name');
    });

    test('handles template with no variables', () => {
      const result = templateService.simpleSubstitute(
        'Hello, World!',
        {}
      );
      expect(result.content).toBe('Hello, World!');
      expect(result.variables_used).toHaveLength(0);
      expect(result.missing_variables).toHaveLength(0);
    });

    test('handles variable with extra spaces', () => {
      const result = templateService.simpleSubstitute(
        'Hello, {{  name  }}!',
        { name: 'World' }
      );
      expect(result.content).toBe('Hello, World!');
    });

    test('handles repeated variables', () => {
      const result = templateService.simpleSubstitute(
        '{{ name }} is {{ name }}',
        { name: 'Alice' }
      );
      expect(result.content).toBe('Alice is Alice');
    });
  });

  describe('listTemplates', () => {
    test('returns array of templates', () => {
      const templates = templateService.listTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    test('templates have required fields', () => {
      const templates = templateService.listTemplates();
      for (const t of templates) {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('description');
        expect(t).toHaveProperty('category');
        expect(t).toHaveProperty('scope');
        expect(t).toHaveProperty('variables');
      }
    });

    test('loads global templates', () => {
      const templates = templateService.listTemplates();
      const globalTemplates = templates.filter(t => t.scope === 'global');
      expect(globalTemplates.length).toBeGreaterThan(0);
    });

    test('filters by category', () => {
      const templates = templateService.listTemplates({ category: 'development' });
      for (const t of templates) {
        expect(t.category).toBe('development');
      }
    });

    test('filters by search', () => {
      const templates = templateService.listTemplates({ search: 'code' });
      for (const t of templates) {
        const searchable = `${t.name} ${t.description} ${t.id}`.toLowerCase();
        expect(searchable).toContain('code');
      }
    });

    test('returns empty for non-existent category', () => {
      const templates = templateService.listTemplates({ category: 'nonexistent' });
      expect(templates).toHaveLength(0);
    });

    test('templates do not include full template content', () => {
      const templates = templateService.listTemplates();
      for (const t of templates) {
        expect(t).not.toHaveProperty('template');
      }
    });
  });

  describe('getTemplate', () => {
    test('returns template by ID', () => {
      const template = templateService.getTemplate('code-review');
      expect(template).not.toBeNull();
      expect(template.id).toBe('code-review');
      expect(template).toHaveProperty('template');
    });

    test('returns null for non-existent template', () => {
      const template = templateService.getTemplate('nonexistent');
      expect(template).toBeNull();
    });

    test('template has variables', () => {
      const template = templateService.getTemplate('code-review');
      expect(template.variables).toBeDefined();
      expect(template.variables.length).toBeGreaterThan(0);
    });
  });

  describe('resolveTemplate', () => {
    test('resolves template with variables', async () => {
      const result = await templateService.resolveTemplate(
        'code-review',
        { language: 'JavaScript', code: 'const x = 1;', focus: 'readability' }
      );
      expect(result.content).toContain('JavaScript');
      expect(result.content).toContain('const x = 1;');
      expect(result.template_id).toBe('code-review');
      expect(result.render_time_ms).toBeGreaterThanOrEqual(0);
    });

    test('applies default values', async () => {
      const result = await templateService.resolveTemplate(
        'code-review',
        { language: 'Python', code: 'x = 1' }
      );
      // 'focus' has default 'general'
      expect(result.content).toContain('general');
    });

    test('throws for non-existent template', async () => {
      await expect(
        templateService.resolveTemplate('nonexistent', {})
      ).rejects.toThrow('Template not found');
    });

    test('throws for missing required variables in strict mode', async () => {
      await expect(
        templateService.resolveTemplate('code-review', {}, { strict: true })
      ).rejects.toThrow('Missing required variables');
    });

    test('returns variables_used and missing_variables', async () => {
      const result = await templateService.resolveTemplate(
        'code-review',
        { language: 'Go' }
      );
      expect(result.variables_used).toContain('language');
      expect(result.missing_variables).toContain('code');
    });
  });
});