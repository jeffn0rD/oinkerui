/**
 * Logging Service
 * 
 * Responsibilities:
 * - Log LLM requests with full context
 * - Track token usage and performance metrics
 * - Aggregate statistics for projects, chats, and globally
 * - Persist logs in JSONL format
 * 
 * Spec Reference: spec/modules/logging_and_metrics.yaml
 * Function Specs: 
 * - spec/functions/logging_and_metrics/log_llm_request.yaml
 * - spec/functions/logging_and_metrics/get_stats.yaml
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pino = require('pino');
const config = require('../config');
const projectService = require('./projectService');

// Import shared error classes
const {
  ValidationError,
  NotFoundError,
  FileSystemError
} = require('../errors');

// Create system logger
const logger = pino({
  level: config.logging?.level || 'info',
  transport: config.env === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  } : undefined
});

// In-memory metrics cache for quick access
const metricsCache = {
  global: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalLatencyMs: 0
  },
  projects: new Map(),
  chats: new Map()
};

/**
 * logLLMRequest
 * 
 * Log an LLM request with full context including messages, usage statistics,
 * timing information, and touched resources. Creates a structured log entry
 * for auditing, debugging, and metrics collection.
 * 
 * @param {Object} entry - Log entry data
 * @param {string} entry.project_id - Required UUID of the project
 * @param {string} entry.chat_id - Required UUID of the chat
 * @param {string} entry.model - Required model identifier
 * @param {string} [entry.status] - pending|success|error|timeout
 * @param {Object} [entry.usage] - Token usage statistics
 * @param {number} [entry.latency_ms] - Request latency in milliseconds
 * @param {Array} [entry.messages_included] - Messages included in context
 * @param {string} [entry.response_content] - LLM response content
 * @param {Object} [entry.error] - Error details if status is error
 * @returns {Promise<Object>} Result of logging operation
 * @throws {ValidationError} If entry data is invalid
 * @throws {FileSystemError} If cannot write to log file
 * 
 * Spec: spec/functions/logging_and_metrics/log_llm_request.yaml
 */
async function logLLMRequest(entry) {
  // Step 1: Validate required fields
  if (!entry.project_id) {
    throw new ValidationError('project_id is required');
  }
  if (!entry.chat_id) {
    throw new ValidationError('chat_id is required');
  }
  if (!entry.model) {
    throw new ValidationError('model is required');
  }
  
  // Validate status if provided
  const validStatuses = ['pending', 'success', 'error', 'timeout'];
  if (entry.status && !validStatuses.includes(entry.status)) {
    throw new ValidationError(`status must be one of: ${validStatuses.join(', ')}`);
  }
  
  // Step 2: Generate entry ID if not present
  if (!entry.id) {
    entry.id = uuidv4();
  }
  
  // Step 3: Set timestamps
  if (!entry.timestamp_start) {
    entry.timestamp_start = new Date().toISOString();
  }
  if (!entry.timestamp_end && entry.status !== 'pending') {
    entry.timestamp_end = new Date().toISOString();
  }
  
  // Step 4: Resolve log file path
  let logPath;
  try {
    const project = await projectService.getProject(entry.project_id);
    const logDir = path.join(project.paths.root, 'logs');
    
    // Ensure log directory exists
    await fs.mkdir(logDir, { recursive: true });
    
    logPath = path.join(logDir, 'llm_requests.jsonl');
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throw error;
    }
    throw new FileSystemError('Failed to resolve log path', { error: error.message });
  }
  
  // Step 5: Serialize entry to JSON
  const jsonLine = JSON.stringify(entry);
  
  // Step 6: Append to log file
  try {
    await fs.appendFile(logPath, jsonLine + '\n', 'utf8');
  } catch (error) {
    throw new FileSystemError('Failed to write to log file', { error: error.message });
  }
  
  // Step 7: Update in-memory metrics cache
  updateMetricsCache(entry);
  
  // Log to system logger
  logger.info({
    event: 'llm_request_logged',
    entry_id: entry.id,
    project_id: entry.project_id,
    chat_id: entry.chat_id,
    model: entry.model,
    status: entry.status,
    tokens: entry.usage?.total_tokens,
    latency_ms: entry.latency_ms
  });
  
  // Step 8: Return result
  return {
    id: entry.id,
    logged: true,
    timestamp: entry.timestamp_start
  };
}

/**
 * Update the in-memory metrics cache with a new entry
 * @param {Object} entry - Log entry
 */
function updateMetricsCache(entry) {
  const isSuccess = entry.status === 'success';
  const isError = entry.status === 'error' || entry.status === 'timeout';
  
  // Update global metrics
  metricsCache.global.totalRequests++;
  if (isSuccess) metricsCache.global.successfulRequests++;
  if (isError) metricsCache.global.failedRequests++;
  
  if (entry.usage) {
    metricsCache.global.totalTokens += entry.usage.total_tokens || 0;
    metricsCache.global.promptTokens += entry.usage.prompt_tokens || 0;
    metricsCache.global.completionTokens += entry.usage.completion_tokens || 0;
  }
  
  if (entry.latency_ms) {
    metricsCache.global.totalLatencyMs += entry.latency_ms;
  }
  
  // Update project metrics
  if (!metricsCache.projects.has(entry.project_id)) {
    metricsCache.projects.set(entry.project_id, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalLatencyMs: 0
    });
  }
  
  const projectMetrics = metricsCache.projects.get(entry.project_id);
  projectMetrics.totalRequests++;
  if (isSuccess) projectMetrics.successfulRequests++;
  if (isError) projectMetrics.failedRequests++;
  
  if (entry.usage) {
    projectMetrics.totalTokens += entry.usage.total_tokens || 0;
    projectMetrics.promptTokens += entry.usage.prompt_tokens || 0;
    projectMetrics.completionTokens += entry.usage.completion_tokens || 0;
  }
  
  if (entry.latency_ms) {
    projectMetrics.totalLatencyMs += entry.latency_ms;
  }
  
  // Update chat metrics
  const chatKey = `${entry.project_id}:${entry.chat_id}`;
  if (!metricsCache.chats.has(chatKey)) {
    metricsCache.chats.set(chatKey, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalLatencyMs: 0
    });
  }
  
  const chatMetrics = metricsCache.chats.get(chatKey);
  chatMetrics.totalRequests++;
  if (isSuccess) chatMetrics.successfulRequests++;
  if (isError) chatMetrics.failedRequests++;
  
  if (entry.usage) {
    chatMetrics.totalTokens += entry.usage.total_tokens || 0;
    chatMetrics.promptTokens += entry.usage.prompt_tokens || 0;
    chatMetrics.completionTokens += entry.usage.completion_tokens || 0;
  }
  
  if (entry.latency_ms) {
    chatMetrics.totalLatencyMs += entry.latency_ms;
  }
}

/**
 * getStats
 * 
 * Retrieve usage statistics and metrics for a project, chat, or globally.
 * Aggregates data from LLM request logs to provide insights on token usage,
 * request counts, latency, costs, and error rates.
 * 
 * @param {Object} scope - Scope for statistics
 * @param {string} scope.type - 'project' | 'chat' | 'global'
 * @param {string} [scope.projectId] - Required for project/chat scope
 * @param {string} [scope.chatId] - Required for chat scope
 * @param {Object} [options] - Statistics options
 * @param {string} [options.fromDate] - Start date filter (ISO string)
 * @param {string} [options.toDate] - End date filter (ISO string)
 * @param {string} [options.groupBy] - 'day' | 'week' | 'month' | 'model'
 * @returns {Promise<Object>} Aggregated statistics
 * @throws {ValidationError} If scope is invalid
 * @throws {NotFoundError} If project or chat not found
 * 
 * Spec: spec/functions/logging_and_metrics/get_stats.yaml
 */
async function getStats(scope, options = {}) {
  // Step 1: Validate scope parameters
  const validTypes = ['project', 'chat', 'global'];
  if (!scope || !validTypes.includes(scope.type)) {
    throw new ValidationError(`scope.type must be one of: ${validTypes.join(', ')}`);
  }
  
  if (scope.type === 'project' && !scope.projectId) {
    throw new ValidationError('projectId is required for project scope');
  }
  
  if (scope.type === 'chat') {
    if (!scope.projectId) {
      throw new ValidationError('projectId is required for chat scope');
    }
    if (!scope.chatId) {
      throw new ValidationError('chatId is required for chat scope');
    }
  }
  
  // Step 2: Determine log files to read
  let logFiles = [];
  
  if (scope.type === 'global') {
    // Read all project log files
    try {
      const projectsDir = path.join(config.workspace.root, 'projects');
      const projects = await fs.readdir(projectsDir);
      
      for (const projectSlug of projects) {
        const logPath = path.join(projectsDir, projectSlug, 'logs', 'llm_requests.jsonl');
        try {
          await fs.access(logPath);
          logFiles.push(logPath);
        } catch {
          // Log file doesn't exist for this project
        }
      }
    } catch (error) {
      // Projects directory doesn't exist
      logFiles = [];
    }
  } else if (scope.type === 'project' || scope.type === 'chat') {
    // Read specific project log file
    try {
      const project = await projectService.getProject(scope.projectId);
      const logPath = path.join(project.paths.root, 'logs', 'llm_requests.jsonl');
      
      try {
        await fs.access(logPath);
        logFiles.push(logPath);
      } catch {
        // Log file doesn't exist
      }
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw error;
      }
    }
  }
  
  // Step 3: Load and parse log entries
  let entries = [];
  
  for (const logFile of logFiles) {
    try {
      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          entries.push(entry);
        } catch {
          // Skip invalid lines
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  // Step 4: Filter by scope and date range
  if (scope.type === 'chat') {
    entries = entries.filter(e => e.chat_id === scope.chatId);
  }
  
  if (options.fromDate) {
    const fromDate = new Date(options.fromDate);
    entries = entries.filter(e => new Date(e.timestamp_start) >= fromDate);
  }
  
  if (options.toDate) {
    const toDate = new Date(options.toDate);
    entries = entries.filter(e => new Date(e.timestamp_start) <= toDate);
  }
  
  // Step 5: Aggregate statistics
  const summary = {
    totalRequests: entries.length,
    successfulRequests: entries.filter(e => e.status === 'success').length,
    failedRequests: entries.filter(e => e.status === 'error' || e.status === 'timeout').length,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    averageLatencyMs: 0,
    estimatedCost: 0
  };
  
  let totalLatency = 0;
  let latencyCount = 0;
  const modelStats = {};
  
  for (const entry of entries) {
    if (entry.usage) {
      summary.totalTokens += entry.usage.total_tokens || 0;
      summary.promptTokens += entry.usage.prompt_tokens || 0;
      summary.completionTokens += entry.usage.completion_tokens || 0;
    }
    
    if (entry.latency_ms) {
      totalLatency += entry.latency_ms;
      latencyCount++;
    }
    
    // Track per-model stats
    if (entry.model) {
      if (!modelStats[entry.model]) {
        modelStats[entry.model] = {
          requests: 0,
          tokens: 0,
          latencyMs: 0,
          latencyCount: 0
        };
      }
      modelStats[entry.model].requests++;
      modelStats[entry.model].tokens += entry.usage?.total_tokens || 0;
      if (entry.latency_ms) {
        modelStats[entry.model].latencyMs += entry.latency_ms;
        modelStats[entry.model].latencyCount++;
      }
    }
  }
  
  // Calculate averages
  summary.averageLatencyMs = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
  
  // Estimate cost (rough estimate based on typical pricing)
  // This is a simplified estimate - real pricing varies by model
  summary.estimatedCost = (summary.promptTokens * 0.00001) + (summary.completionTokens * 0.00003);
  
  // Step 6: Group by requested dimension
  let breakdown = [];
  
  if (options.groupBy === 'model') {
    breakdown = Object.entries(modelStats).map(([model, stats]) => ({
      model,
      requests: stats.requests,
      tokens: stats.tokens,
      averageLatencyMs: stats.latencyCount > 0 ? Math.round(stats.latencyMs / stats.latencyCount) : 0
    }));
  } else if (options.groupBy === 'day' || options.groupBy === 'week' || options.groupBy === 'month') {
    const groups = {};
    
    for (const entry of entries) {
      const date = new Date(entry.timestamp_start);
      let key;
      
      if (options.groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (options.groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (options.groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groups[key]) {
        groups[key] = {
          period: key,
          requests: 0,
          tokens: 0,
          successfulRequests: 0,
          failedRequests: 0
        };
      }
      
      groups[key].requests++;
      groups[key].tokens += entry.usage?.total_tokens || 0;
      if (entry.status === 'success') groups[key].successfulRequests++;
      if (entry.status === 'error' || entry.status === 'timeout') groups[key].failedRequests++;
    }
    
    breakdown = Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
  }
  
  // Calculate per-model averages
  const models = {};
  for (const [model, stats] of Object.entries(modelStats)) {
    models[model] = {
      requests: stats.requests,
      tokens: stats.tokens,
      averageLatencyMs: stats.latencyCount > 0 ? Math.round(stats.latencyMs / stats.latencyCount) : 0
    };
  }
  
  // Step 7: Return Stats object
  return {
    scope: {
      type: scope.type,
      projectId: scope.projectId,
      chatId: scope.chatId
    },
    period: {
      from: options.fromDate || (entries.length > 0 ? entries[0].timestamp_start : null),
      to: options.toDate || (entries.length > 0 ? entries[entries.length - 1].timestamp_start : null)
    },
    summary,
    breakdown,
    models
  };
}

/**
 * Get quick stats from the in-memory cache (faster but may not include all historical data)
 * @param {Object} scope - Scope for statistics
 * @returns {Object} Cached statistics
 */
function getCachedStats(scope) {
  let metrics;
  
  if (scope.type === 'global') {
    metrics = metricsCache.global;
  } else if (scope.type === 'project') {
    metrics = metricsCache.projects.get(scope.projectId) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalLatencyMs: 0
    };
  } else if (scope.type === 'chat') {
    const chatKey = `${scope.projectId}:${scope.chatId}`;
    metrics = metricsCache.chats.get(chatKey) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalLatencyMs: 0
    };
  }
  
  return {
    scope,
    summary: {
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      totalTokens: metrics.totalTokens,
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      averageLatencyMs: metrics.totalRequests > 0 
        ? Math.round(metrics.totalLatencyMs / metrics.totalRequests) 
        : 0
    }
  };
}

/**
 * Reset the metrics cache (useful for testing)
 */
function resetMetricsCache() {
  metricsCache.global = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalLatencyMs: 0
  };
  metricsCache.projects.clear();
  metricsCache.chats.clear();
}

/**
 * Log a system event
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function logEvent(level, event, data = {}) {
  logger[level]({ event, ...data });
}

module.exports = {
  logLLMRequest,
  getStats,
  getCachedStats,
  resetMetricsCache,
  logEvent,
  logger,
  // Export error classes for testing
  ValidationError,
  NotFoundError,
  FileSystemError
};