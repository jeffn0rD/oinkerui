/**
 * Python Tools Client Service
 * Provides Node.js integration with the Python FastAPI tools backend.
 * Handles template rendering, code execution, and utility calls.
 */

const config = require('../config');

const PYTHON_BASE_URL = config.python?.baseUrl || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Make a request to the Python tools backend.
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function pythonRequest(endpoint, options = {}) {
  const url = `${PYTHON_BASE_URL}${endpoint}`;
  const timeout = options.timeout || DEFAULT_TIMEOUT;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.detail?.message || data.message || 'Python tools request failed');
      error.status = response.status;
      error.code = data.detail?.error || data.error || 'PYTHON_TOOLS_ERROR';
      error.details = data.detail || data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error(`Python tools request timed out after ${timeout}ms`);
      error.code = 'PYTHON_TOOLS_TIMEOUT';
      throw error;
    }
    if (err.cause?.code === 'ECONNREFUSED') {
      const error = new Error('Python tools backend is not running');
      error.code = 'PYTHON_TOOLS_UNAVAILABLE';
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if the Python tools backend is available.
 * @returns {Promise<boolean>}
 */
async function isAvailable() {
  try {
    const result = await pythonRequest('/health', { timeout: 5000 });
    return result.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Render a Jinja2 template with variables.
 * @param {string} template - Jinja2 template string
 * @param {object} variables - Template variables
 * @param {object} options - Render options (strict, autoescape)
 * @returns {Promise<{content: string, variables_used: string[], warnings: string[]}>}
 */
async function renderTemplate(template, variables = {}, options = {}) {
  return pythonRequest('/tools/render-template', {
    method: 'POST',
    body: { template, variables, options },
  });
}

/**
 * Validate a Jinja2 template without rendering.
 * @param {string} template - Jinja2 template string
 * @returns {Promise<{valid: boolean, variables: string[], error: string|null}>}
 */
async function validateTemplate(template) {
  return pythonRequest('/tools/validate-template', {
    method: 'POST',
    body: { template },
  });
}

/**
 * List available Jinja2 template filters.
 * @returns {Promise<{filters: Array<{name: string, description: string}>}>}
 */
async function getTemplateFilters() {
  return pythonRequest('/tools/template-filters');
}

/**
 * Execute code in a sandboxed environment.
 * @param {string} code - Code to execute
 * @param {string} language - 'python' or 'shell'
 * @param {string} projectPath - Project root directory
 * @param {object} options - Execution options (timeout, working_dir)
 * @returns {Promise<{success: boolean, exit_code: number, stdout: string, stderr: string, duration_ms: number}>}
 */
async function executeCode(code, language, projectPath, options = {}) {
  const timeout = ((options.timeout || 30) + 5) * 1000; // Add 5s buffer for HTTP overhead
  return pythonRequest('/tools/execute', {
    method: 'POST',
    body: {
      code,
      language,
      project_path: projectPath,
      options,
    },
    timeout,
  });
}

/**
 * Generate a unified diff between two texts.
 * @param {string} original - Original text
 * @param {string} modified - Modified text
 * @param {string} filename - Filename for diff header
 * @returns {Promise<{diff: string, has_changes: boolean, additions: number, deletions: number}>}
 */
async function generateDiff(original, modified, filename = 'file') {
  return pythonRequest('/tools/diff', {
    method: 'POST',
    body: { original, modified, filename },
  });
}

/**
 * Count tokens for text using tiktoken.
 * @param {string} text - Text to count tokens for
 * @param {string} model - Model for tokenizer selection
 * @returns {Promise<{token_count: number, model: string}>}
 */
async function countTokens(text, model = 'gpt-4') {
  return pythonRequest('/tools/count-tokens', {
    method: 'POST',
    body: { text, model },
  });
}

module.exports = {
  isAvailable,
  renderTemplate,
  validateTemplate,
  getTemplateFilters,
  executeCode,
  generateDiff,
  countTokens,
};