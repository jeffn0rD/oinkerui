/**
 * Template Service
 * 
 * Manages prompt templates - loading, caching, merging global/project templates,
 * and resolving templates with variable substitution.
 * 
 * Spec: spec/functions/backend_node/resolve_template.yaml
 *       spec/functions/backend_node/list_templates.yaml
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const config = require('../config');

// Template cache
let globalTemplatesCache = null;
let globalTemplatesMtime = 0;
const projectTemplatesCache = new Map();

/**
 * Get the global templates directory path.
 * @returns {string}
 */
function getGlobalTemplatesDir() {
  // Check for explicit config, otherwise look relative to project root
  if (config.templates?.globalDir) {
    return path.resolve(config.templates.globalDir);
  }
  // Default: templates/global at project root (one level up from backend/)
  return path.resolve(__dirname, '../../../templates/global');
}

/**
 * Get the project templates directory path.
 * @param {string} projectId - Project ID
 * @returns {string}
 */
function getProjectTemplatesDir(projectId) {
  const workspaceRoot = config.workspace?.root || './workspaces';
  return path.resolve(workspaceRoot, projectId, 'templates');
}

/**
 * Load a single template from a YAML file.
 * @param {string} filePath - Path to template YAML file
 * @param {string} scope - 'global' or 'project'
 * @returns {object|null} Parsed template or null
 */
function loadTemplateFile(filePath, scope) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const template = yaml.load(content);
    
    if (!template || !template.id || !template.template) {
      return null;
    }

    return {
      id: template.id,
      name: template.name || template.id,
      description: template.description || '',
      category: template.category || 'general',
      scope,
      variables: (template.variables || []).map(v => ({
        name: v.name,
        required: v.required !== false,
        default: v.default || '',
        description: v.description || '',
      })),
      template: template.template,
    };
  } catch (err) {
    console.warn(`Failed to load template ${filePath}: ${err.message}`);
    return null;
  }
}

/**
 * Load all templates from a directory.
 * @param {string} dir - Directory path
 * @param {string} scope - 'global' or 'project'
 * @returns {object[]} Array of templates
 */
function loadTemplatesFromDir(dir, scope) {
  const templates = [];

  if (!fs.existsSync(dir)) {
    return templates;
  }

  try {
    const files = fs.readdirSync(dir).filter(f => 
      f.endsWith('.yaml') || f.endsWith('.yml')
    );

    for (const file of files) {
      const template = loadTemplateFile(path.join(dir, file), scope);
      if (template) {
        templates.push(template);
      }
    }
  } catch (err) {
    console.warn(`Failed to read templates directory ${dir}: ${err.message}`);
  }

  return templates;
}

/**
 * Load global templates with caching.
 * @returns {object[]} Global templates
 */
function loadGlobalTemplates() {
  const dir = getGlobalTemplatesDir();

  // Check if cache is still valid
  try {
    if (fs.existsSync(dir)) {
      const stat = fs.statSync(dir);
      if (globalTemplatesCache && stat.mtimeMs <= globalTemplatesMtime) {
        return globalTemplatesCache;
      }
      globalTemplatesMtime = stat.mtimeMs;
    }
  } catch {
    // Fall through to reload
  }

  globalTemplatesCache = loadTemplatesFromDir(dir, 'global');
  return globalTemplatesCache;
}

/**
 * Load project templates.
 * @param {string} projectId - Project ID
 * @returns {object[]} Project templates
 */
function loadProjectTemplates(projectId) {
  if (!projectId) return [];
  
  const dir = getProjectTemplatesDir(projectId);
  return loadTemplatesFromDir(dir, 'project');
}

/**
 * List available prompt templates.
 * Returns merged list of global and project templates.
 * Project templates override global templates with the same ID.
 * 
 * @param {object} options - Filtering options
 * @param {string} [options.projectId] - Include project templates
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.search] - Search in name/description
 * @returns {object[]} Array of template summaries
 */
function listTemplates(options = {}) {
  const { projectId, category, search } = options;

  // Load templates
  const globalTemplates = loadGlobalTemplates();
  const projectTemplates = loadProjectTemplates(projectId);

  // Merge: project templates override global with same ID
  const templateMap = new Map();
  
  for (const t of globalTemplates) {
    templateMap.set(t.id, t);
  }
  for (const t of projectTemplates) {
    templateMap.set(t.id, t);
  }

  let templates = Array.from(templateMap.values());

  // Filter by category
  if (category) {
    templates = templates.filter(t => t.category === category);
  }

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.description.toLowerCase().includes(searchLower) ||
      t.id.toLowerCase().includes(searchLower)
    );
  }

  // Sort by category, then name
  templates.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  // Return summaries (without full template content)
  return templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    scope: t.scope,
    variables: t.variables,
  }));
}

/**
 * Get a single template by ID.
 * @param {string} templateId - Template ID
 * @param {string} [projectId] - Project ID for project templates
 * @returns {object|null} Full template or null
 */
function getTemplate(templateId, projectId) {
  // Check project templates first (they override global)
  if (projectId) {
    const projectTemplates = loadProjectTemplates(projectId);
    const projectTemplate = projectTemplates.find(t => t.id === templateId);
    if (projectTemplate) return projectTemplate;
  }

  // Check global templates
  const globalTemplates = loadGlobalTemplates();
  return globalTemplates.find(t => t.id === templateId) || null;
}

/**
 * Simple variable substitution using {{ var }} syntax.
 * Does not use Jinja2 - just basic string replacement.
 * @param {string} templateContent - Template string
 * @param {object} variables - Variables to substitute
 * @returns {object} Result with content and metadata
 */
function simpleSubstitute(templateContent, variables = {}) {
  let content = templateContent;
  const variablesUsed = [];
  const missingVariables = [];

  // Find all {{ var }} patterns
  const varPattern = /\{\{\s*(\w+)\s*\}\}/g;
  const foundVars = new Set();
  let match;

  while ((match = varPattern.exec(templateContent)) !== null) {
    foundVars.add(match[1]);
  }

  for (const varName of foundVars) {
    if (variables[varName] !== undefined) {
      variablesUsed.push(varName);
      const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g');
      content = content.replace(regex, String(variables[varName]));
    } else {
      missingVariables.push(varName);
    }
  }

  return {
    content,
    variables_used: variablesUsed,
    missing_variables: missingVariables,
  };
}

/**
 * Resolve a prompt template by substituting variables.
 * For simple {{ var }} syntax, does local substitution.
 * For full Jinja2 features, delegates to Python tools backend.
 * 
 * @param {string} templateId - Template ID or path
 * @param {object} variables - Variables to substitute
 * @param {object} options - Resolution options
 * @param {string} [options.projectId] - Project context
 * @param {boolean} [options.useJinja] - Use full Jinja2 rendering
 * @param {boolean} [options.strict] - Fail on missing variables
 * @returns {Promise<object>} Resolved template
 */
async function resolveTemplate(templateId, variables = {}, options = {}) {
  const { projectId, useJinja = false, strict = false } = options;
  const startTime = Date.now();

  // Load template
  const template = getTemplate(templateId, projectId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Apply defaults for missing variables
  const resolvedVars = { ...variables };
  for (const varDef of template.variables) {
    if (resolvedVars[varDef.name] === undefined && varDef.default) {
      resolvedVars[varDef.name] = varDef.default;
    }
  }

  // Check required variables in strict mode
  if (strict) {
    const missing = template.variables
      .filter(v => v.required && resolvedVars[v.name] === undefined)
      .map(v => v.name);
    
    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }
  }

  let result;

  if (useJinja) {
    // Delegate to Python tools backend for full Jinja2
    try {
      const pythonTools = require('./pythonToolsClient');
      result = await pythonTools.renderTemplate(
        template.template,
        resolvedVars,
        { strict }
      );
    } catch (err) {
      // Fall back to simple substitution if Python backend unavailable
      console.warn(`Jinja2 rendering failed, falling back to simple substitution: ${err.message}`);
      result = simpleSubstitute(template.template, resolvedVars);
    }
  } else {
    result = simpleSubstitute(template.template, resolvedVars);
  }

  return {
    content: result.content,
    template_id: template.id,
    template_name: template.name,
    variables_used: result.variables_used || [],
    missing_variables: result.missing_variables || [],
    warnings: result.warnings || [],
    render_time_ms: Date.now() - startTime,
  };
}

/**
 * Clear template caches.
 */
function clearCache() {
  globalTemplatesCache = null;
  globalTemplatesMtime = 0;
  projectTemplatesCache.clear();
}

module.exports = {
  listTemplates,
  getTemplate,
  resolveTemplate,
  simpleSubstitute,
  clearCache,
  // Exported for testing
  loadGlobalTemplates,
  loadProjectTemplates,
  getGlobalTemplatesDir,
  getProjectTemplatesDir,
};