/**
 * @module backend_node
 * @version 1.0.0
 *
 * Node.js Backend Server
 *
 * The Node.js backend is the primary API server for OinkerUI, built with Fastify.
 * It implements all business logic, manages project/chat/message data, integrates
 * with OpenRouter for LLM calls, coordinates with the Python tools backend, and
 * handles Git operations. All client requests flow through this server.
 *
 * Responsibilities:
 *   - Expose REST API endpoints for all CRUD operations
 *   - Implement project lifecycle management (create, archive, delete)
 *   - Manage chat and message persistence (JSONL files)
 *   - Construct LLM context per spec/context.yaml algorithm
 *   - Integrate with OpenRouter API for LLM requests
 *   - Parse and dispatch slash commands
 *   - Coordinate with Python tools backend for code execution
 *   - Manage Git operations (init, commit, status, push)
 *   - Handle prompt template resolution
 *   - Log all LLM requests and system events
 *   - Serve static frontend assets in production
 *
 * @see spec/modules/backend_node.yaml
 * @generated 2026-01-21T21:39:18.889346
 */

'use strict';

// External dependencies
const fastify = require('fastify');
const cors = require('@fastify/cors');
const static = require('@fastify/static');
const simple_git = require('simple-git');
const axios = require('axios');
const uuid = require('uuid');
const date_fns = require('date-fns');
const tiktoken = require('tiktoken');
const slugify = require('slugify');

// Custom error classes
/**
 * ValidationError
 * @description Input validation failed
 */
class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * ConflictError
 * @description Resource conflict
 */
class ConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConflictError';
    this.details = details;
  }
}

/**
 * NotFoundError
 * @description Resource not found
 */
class NotFoundError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'NotFoundError';
    this.details = details;
  }
}

/**
 * FileSystemError
 * @description File system operation failed
 */
class FileSystemError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'FileSystemError';
    this.details = details;
  }
}

/**
 * GitError
 * @description Git operation failed
 */
class GitError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'GitError';
    this.details = details;
  }
}

// Functions (8 total)

/**
 * sendMessage
 *
 * Process a user message in a chat, optionally calling the LLM for a response.
 * This is the primary entry point for chat interactions. It handles slash
 * command parsing, context construction, LLM API calls, and message persistence.
 *
 * @param {string} projectId - UUID of the project
 * @param {string} chatId - UUID of the chat
 * @param {SendMessageRequest} request - Message request payload
 * @returns {Promise<SendMessageResponse>} Response containing user message, assistant message, and request log
 * @throws {NotFoundError} 
 * @throws {ValidationError} 
 * @throws {LLMError} 
 *
 * @preconditions
 *   - projectId is valid UUID referencing active project
 *   - chatId is valid UUID referencing active chat in project
 *   - raw_text is non-empty string
 *   - If model_id provided, must be valid configured model
 * @postconditions
 *   - User message is persisted to chat storage
 *   - If LLM called, assistant message is persisted
 *   - LLM request is logged
 *   - Chat updated_at timestamp is updated
 *   - If slash command, command is executed
 *
 * @fol_specification
 *   forall projectId, chatId in UUID, req in SendMessageRequest:
 *   ValidProject(projectId) and ValidChat(chatId, projectId) and
 *   NonEmpty(req.raw_text) implies
 *   exists um, am in Message, log in LLMRequestLogEntry:
 *   um.role = 'user' and
 *   um.content = req.raw_text and
 *   um.chat_id = chatId and
 *   Persisted(um) and
 *   (not IsSlashCommand(req.raw_text) implies
 *   am.role = 'assistant' and
 *   am.chat_id = chatId and
 *   Persisted(am) and
 *   log.chat_id = chatId and
 *   Persisted(log))
 *
 * @see spec/functions/backend_node/send_message.yaml
 * @query python3 tools/doc_query.py --query &quot;backend_node.send_message&quot; --mode text --pretty
 */
async function sendMessage(projectId, chatId, request) {
  // Algorithm steps:
  // Step 1: Validate projectId, chatId are valid UUIDs
  //   Rationale: Fail fast on invalid input
  // Step 2: Load project and chat, verify both are active
  //   Rationale: Ensure valid context for message
  // Step 3: Check if raw_text starts with '/'
  //   Rationale: Detect slash commands
  // Step 4: If slash command, parse and dispatch to command handler
  //   Rationale: Handle special commands separately
  // Step 5: Create Message object with role='user'
  //   Rationale: Prepare user message for storage
  // Step 6: Append user message to chat JSONL
  //   Rationale: Persist user input
  // Step 7: If not pure_aside, call buildContext() for LLM context
  //   Rationale: Prepare messages for LLM
  // Step 8: Call OpenRouter API with context and model
  //   Rationale: Get LLM response
  // Step 9: Create Message object with role='assistant' from response
  //   Rationale: Prepare assistant message
  // Step 10: Append assistant message to chat JSONL
  //   Rationale: Persist LLM response
  // Step 11: Create and save LLMRequestLogEntry
  //   Rationale: Audit and metrics
  // Step 12: Update chat.updated_at
  //   Rationale: Track activity
  // Step 13: Return SendMessageResponse
  //   Rationale: Provide caller with results

  // TODO: Implement according to spec
  throw new Error('Not implemented');
}

/**
 * callLLM
 *
 * Make an API call to OpenRouter to get an LLM response. Handles authentication,
 * request formatting, response parsing, error handling, and retry logic.
 * This is the core integration point with external LLM providers.
 *
 * @param {LLMRequest} request - LLM request configuration
 * @returns {Promise<LLMResponse>} LLM response with content and metadata
 * @throws {LLMError} 
 * @throws {TimeoutError} 
 * @throws {RateLimitError} 
 * @throws {AuthenticationError} 
 *
 * @preconditions
 *   - OPENROUTER_API_KEY environment variable is set
 *   - request.model is valid OpenRouter model ID
 *   - request.messages is non-empty array
 *   - Each message has role and content
 * @postconditions
 *   - Returns LLMResponse with non-empty content
 *   - Usage statistics are populated
 *   - Request ID is available for tracking
 *
 * @fol_specification
 *   forall req in LLMRequest:
 *   ValidAPIKey() and
 *   ValidModel(req.model) and
 *   NonEmpty(req.messages) and
 *   forall m in req.messages: HasRole(m) and HasContent(m)
 *   implies
 *   exists resp in LLMResponse:
 *   NonEmpty(resp.content) and
 *   resp.usage.total_tokens > 0 and
 *   NonEmpty(resp.request_id)
 *   or
 *   exists err in Error:
 *   err.type in {LLMError, TimeoutError, RateLimitError}
 *
 * @see spec/functions/backend_node/call_llm.yaml
 * @query python3 tools/doc_query.py --query &quot;backend_node.call_llm&quot; --mode text --pretty
 */
async function callLLM(request) {
  // Algorithm steps:
  // Step 1: Validate model ID, messages array, optional parameters
  //   Rationale: Fail fast on invalid input
  // Step 2: Read OPENROUTER_API_KEY from environment
  //   Rationale: Secure credential access
  // Step 3: Format request body per OpenRouter API spec
  //   Rationale: Match API requirements
  // Step 4: POST to /api/v1/chat/completions with 60s timeout
  //   Rationale: Make API call with reasonable timeout
  // Step 5: Check HTTP status, handle errors
  //   Rationale: Proper error handling
  // Step 6: Parse JSON response body
  //   Rationale: Extract structured data
  // Step 7: Extract content, usage, request_id from response
  //   Rationale: Normalize response format
  // Step 8: Return LLMResponse object
  //   Rationale: Provide caller with results

  // TODO: Implement according to spec
  throw new Error('Not implemented');
}

/**
 * createChat
 *
 * Create a new chat within a project. Initializes the chat storage file,
 * sets up the system prelude, and registers the chat with the project.
 * Chats are the primary interface for LLM conversations.
 *
 * @param {string} projectId - UUID of the parent project
 * @param {CreateChatOptions} [options={}] - Optional chat configuration
 * @returns {Promise<Chat>} Created chat object with ID and metadata
 * @throws {NotFoundError} Referenced project not found
 * @throws {ValidationError} Cannot create chat in archived/deleted project
 * @throws {FileSystemError} File system operation failed
 *
 * @preconditions
 *   - projectId is a valid UUID
 *   - Project with projectId exists
 *   - Project status is 'active'
 *   - Project directory is writable
 * @postconditions
 *   - Chat storage file exists at project/chats/{chat_id}.jsonl
 *   - Chat is registered in project's chat index
 *   - Chat status is 'active'
 *   - System prelude message is written if provided
 *   - Returns valid Chat object with unique ID
 *
 * @fol_specification
 *   forall projectId in UUID, opts in Options:
 *   ValidUUID(projectId) and
 *   exists p in Projects: (p.id = projectId and p.status = 'active') implies
 *   exists chatId in UUID, c in Chat:
 *   c.id = chatId and
 *   c.project_id = projectId and
 *   c.status = 'active' and
 *   c.created_at = now() and
 *   FileExists(p.paths.chats_dir + "/" + chatId + ".jsonl") and
 *   c in p.chats
 *
 * @see spec/functions/backend_node/create_chat.yaml
 * @query python3 tools/doc_query.py --query &quot;backend_node.create_chat&quot; --mode text --pretty
 */
async function createChat(projectId, options = {}) {
  // Algorithm steps:
  // Step 1: Validate projectId is valid UUID format
  //   Rationale: Fail fast on invalid input
  // Step 2: Load project from index, verify status is 'active'
  //   Rationale: Ensure parent project is valid
  // Step 3: Generate UUID v4 for chat ID
  //   Rationale: Ensure globally unique identifier
  // Step 4: Generate default name 'Chat {timestamp}' if not provided
  //   Rationale: Ensure chat has displayable name
  // Step 5: Resolve system_prelude from template if template_id provided
  //   Rationale: Support both inline and template-based preludes
  // Step 6: Create empty JSONL file at chats/{chat_id}.jsonl
  //   Rationale: Initialize persistent storage
  // Step 7: If system_prelude exists, write as first message with role='system'
  //   Rationale: Establish chat context
  // Step 8: Add chat to project's chat list
  //   Rationale: Register chat with parent
  // Step 9: Log chat_created event
  //   Rationale: Audit trail
  // Step 10: Return Chat object
  //   Rationale: Provide caller with chat reference

  // TODO: Implement according to spec
  throw new Error('Not implemented');
}

/**
 * constructContext
 *
 * Build the message context array for an LLM request following the context
 * construction algorithm defined in spec/context.yaml. This function selects
 * which messages to include, respects token limits, handles pinned/aside
 * messages, and applies truncation strategies.
 *
 * @param {Chat} chat - Chat object with message history
 * @param {Message} currentMessage - Current user message being processed
 * @param {string} [modelId=undefined] - Model ID for token limit lookup
 * @returns {Promise<ContextMessage[]>} Array of messages formatted for LLM API
 * @throws {ValidationError} 
 * @throws {ConfigError} 
 *
 * @preconditions
 *   - chat is valid Chat object
 *   - chat.storage_path exists and is readable
 *   - currentMessage is valid Message object
 * @postconditions
 *   - Returned array contains system prelude if present
 *   - Returned array contains currentMessage
 *   - All pinned messages are included
 *   - Total tokens <= max_context_tokens
 *   - Messages are in chronological order
 *   - Discarded messages are excluded
 *   - Aside messages are excluded (unless pinned)
 *
 * @fol_specification
 *   forall chat in Chat, current in Message:
 *   let context = constructContext(chat, current) in
 *   let messages = loadMessages(chat) in
 *   
 *   // System prelude first if exists
 *   (exists prelude in chat.system_prelude implies
 *   context[0].role = 'system' and
 *   context[0].content = prelude.content) and
 *   
 *   // Current message always last
 *   context[last].content = current.content and
 *   
 *   // All pinned messages included
 *   forall m in messages:
 *   (m.is_pinned and not m.is_discarded) implies
 *   exists c in context: c.content = m.content and
 *   
 *   // No discarded messages
 *   forall c in context:
 *   not exists m in messages:
 *   m.content = c.content and m.is_discarded and
 *   
 *   // No aside messages (unless pinned)
 *   forall c in context:
 *   not exists m in messages:
 *   m.content = c.content and m.is_aside and not m.is_pinned and
 *   
 *   // Token limit respected
 *   sum(tokenCount(c.content) for c in context) <= maxTokens(chat.project)
 *
 * @see spec/functions/backend_node/construct_context.yaml
 * @query python3 tools/doc_query.py --query &quot;backend_node.construct_context&quot; --mode text --pretty
 */
async function constructContext(chat, currentMessage, modelId = null) {
  // Algorithm steps:
  // Step 1: Load all messages from chat JSONL file
  //   Rationale: Get complete message history
  // Step 2: Filter: exclude messages where is_discarded=true
  //   Rationale: Discarded messages should never be in context
  // Step 3: Filter: exclude messages where is_aside=true AND is_pinned=false
  //   Rationale: Aside messages excluded unless explicitly pinned
  // Step 4: Separate pinned messages (is_pinned=true) from regular
  //   Rationale: Pinned messages have priority
  // Step 5: Get max_context_tokens from project settings or model config
  //   Rationale: Determine token budget
  // Step 6: Calculate tokens for system prelude, reserve from budget
  //   Rationale: System prelude always included
  // Step 7: Calculate tokens for current message, reserve from budget
  //   Rationale: Current message always included
  // Step 8: Calculate tokens for all pinned messages, reserve from budget
  //   Rationale: Pinned messages always included
  // Step 9: Sort remaining messages by created_at descending
  //   Rationale: Prefer recent messages
  // Step 10: Add messages until budget exhausted
  //   Rationale: Fill context with recent history
  // Step 11: Sort selected messages chronologically
  //   Rationale: LLM expects chronological order
  // Step 12: Format as [{role, content}] array
  //   Rationale: Match LLM API format

  // TODO: Implement according to spec
  throw new Error('Not implemented');
}

/**
 * parseSlashCommand
 *
 * Parse a slash command from user input text. Extracts the command name,
 * arguments, and validates against the registered command definitions.
 * Returns a structured command object for execution.
 *
 * @param {string} input - Raw user input starting with '/'
 * @returns {Promise<ParsedCommand>} Parsed command with name and arguments
 * @throws {ValidationError} 
 * @throws {UnknownCommandError} 
 *
 * @preconditions
 *   - input is non-empty string
 *   - input starts with '/'
 * @postconditions
 *   - Returns ParsedCommand with valid command name
 *   - Command name is lowercase
 *   - Arguments are properly split
 *   - Options are parsed from --key=value format
 *
 * @fol_specification
 *   forall input in String:
 *   StartsWith(input, '/') and Length(input) > 1 implies
 *   let parsed = parseSlashCommand(input) in
 *   exists cmd in REGISTERED_COMMANDS:
 *   parsed.command = Lowercase(cmd.name) and
 *   parsed.raw_args = Substring(input, Length(cmd.name) + 2)
 *
 * @see spec/functions/backend_node/parse_slash_command.yaml
 * @query python3 tools/doc_query.py --query &quot;backend_node.parse_slash_command&quot; --mode text --pretty
 */
async function parseSlashCommand(input) {
  // Algorithm steps:
  // Step 1: Check input starts with '/'
  //   Rationale: Validate slash command format
  // Step 2: Remove '/' prefix, trim whitespace
  //   Rationale: Normalize input
  // Step 3: Split on first whitespace to get command and rest
  //   Rationale: Separate command from arguments
  // Step 4: Convert command to lowercase
  //   Rationale: Case-insensitive commands
  // Step 5: Check command exists in REGISTERED_COMMANDS
  //   Rationale: Validate known command
  // Step 6: Parse rest into args and options
  //   Rationale: Extract structured arguments
  // Step 7: Return ParsedCommand
  //   Rationale: Provide structured result

  // TODO: Implement according to spec
  throw new Error('Not implemented');
}

/**
 * executeCommand
 *
 * Execute a parsed slash command and return the result. Dispatches to the
 * appropriate command handler based on command name. Handles command-specific
 * logic, validation, and side effects.
 *
 * @param {ParsedCommand} parsedCommand - Parsed command from parseSlashCommand
 * @param {CommandContext} context - Execution context with project, chat, user info
 * @returns {Promise<CommandResult>} Result of command execution
 * @throws {CommandError} 
 * @throws {ValidationError} 
 * @throws {PermissionError} 
 *
 * @preconditions
 *   - parsedCommand is valid ParsedCommand object
 *   - parsedCommand.command is registered command
 *   - context.project is valid and active
 *   - context.chat is valid and active
 * @postconditions
 *   - Returns CommandResult with success status
 *   - Side effects are documented in result
 *   - Command-specific postconditions are met
 *
 * @fol_specification
 *   forall cmd in ParsedCommand, ctx in CommandContext:
 *   ValidCommand(cmd) and ValidContext(ctx) implies
 *   exists result in CommandResult:
 *   result.success = HandlerSucceeds(cmd.command, cmd.args, ctx) and
 *   result.side_effects = CollectSideEffects(cmd.command)
 *
 * @see spec/functions/backend_node/execute_command.yaml
 * @query python3 tools/doc_query.py --query &quot;backend_node.execute_command&quot; --mode text --pretty
 */
async function executeCommand(parsedCommand, context) {
  // Algorithm steps:
  // Step 1: Validate parsedCommand has required fields
  //   Rationale: Ensure valid input
  // Step 2: Get handler function from COMMAND_HANDLERS map
  //   Rationale: Dispatch to correct handler
  // Step 3: Validate args against command definition
  //   Rationale: Ensure correct usage
  // Step 4: Check user permissions if command requires them
  //   Rationale: Security enforcement
  // Step 5: Call handler(parsedCommand, context)
  //   Rationale: Execute command logic
  // Step 6: Collect and document side effects
  //   Rationale: Transparency for caller
  // Step 7: Return CommandResult
  //   Rationale: Provide execution result

  // TODO: Implement according to spec
  throw new Error('Not implemented');
}

/**
 * saveMessage
 *
 * Persist a message to the chat's JSONL storage file. Handles both new
 * message creation (append) and existing message updates. Ensures data
 * integrity and proper file locking.
 *
 * @param {string} chatId - UUID of the chat
 * @param {Message} message - Message object to save
 * @param {SaveOptions} [options={}] - Save options
 * @returns {Promise<Message>} Saved message with any server-generated fields
 * @throws {NotFoundError} 
 * @throws {FileSystemError} 
 * @throws {ValidationError} 
 *
 * @preconditions
 *   - chatId is valid UUID
 *   - Chat exists and has storage_path
 *   - message has required fields (id, role, content)
 *   - message.chat_id matches chatId
 * @postconditions
 *   - Message is persisted to JSONL file
 *   - If append: message is at end of file
 *   - If update: message replaces existing entry
 *   - File is valid JSONL after operation
 *
 * @fol_specification
 *   forall chatId in UUID, msg in Message:
 *   ValidChat(chatId) and
 *   ValidMessage(msg) and
 *   msg.chat_id = chatId implies
 *   let saved = saveMessage(chatId, msg) in
 *   Persisted(saved) and
 *   saved.id = msg.id and
 *   exists line in FileLines(chat.storage_path):
 *   JSON.parse(line).id = saved.id
 *
 * @see spec/functions/backend_node/save_message.yaml
 * @query python3 tools/doc_query.py --query &quot;backend_node.save_message&quot; --mode text --pretty
 */
async function saveMessage(chatId, message, options = {}) {
  // Algorithm steps:
  // Step 1: Validate chatId is valid UUID
  //   Rationale: Fail fast on invalid input
  // Step 2: Load chat from storage, get storage_path
  //   Rationale: Get file location
  // Step 3: Validate message.chat_id == chatId
  //   Rationale: Ensure message belongs to chat
  // Step 4: Set created_at if not present
  //   Rationale: Server-generated timestamp
  // Step 5: Serialize message to JSON
  //   Rationale: Prepare for storage
  // Step 6: Append JSON line to file (or rewrite for update)
  //   Rationale: Persist message
  // Step 7: Return message
  //   Rationale: Confirm save

  // TODO: Implement according to spec
  throw new Error('Not implemented');
}

/**
 * createProject
 *
 * Create a new project with the given name and configuration.
 * Initializes the project directory structure, Git repository,
 * and creates the initial project metadata. This is the entry point
 * for all new projects in the system.
 *
 * @param {string} projectName - Human-readable name of the project
 * @param {CreateProjectOptions} [options={}] - Optional project configuration
 * @returns {Promise<Project>} Created project object with ID and metadata
 * @throws {ValidationError} Project name doesn't meet constraints
 * @throws {ConflictError} A project with this slug already exists
 * @throws {FileSystemError} File system operation failed
 * @throws {GitError} Git repository could not be initialized
 *
 * @preconditions
 *   - projectName is a non-empty string
 *   - projectName matches the allowed pattern
 *   - No active/archived project with same slug exists
 *   - Workspace root directory exists and is writable
 * @postconditions
 *   - Project directory exists at workspace_root/projects/{slug}/
 *   - Git repository is initialized in project directory
 *   - Project metadata file (project.json) exists
 *   - Project is added to global project index
 *   - Project status is 'active'
 *   - Returns valid Project object with unique ID
 *
 * @fol_specification
 *   forall name in String, opts in Options:
 *   Valid(name) and not ExistsSlug(slugify(name)) implies
 *   exists id in UUID, p in Project:
 *   p.id = id and
 *   p.name = name and
 *   p.slug = slugify(name) and
 *   p.status = 'active' and
 *   p.created_at = now() and
 *   DirExists(workspace_root/projects/p.slug) and
 *   GitInitialized(workspace_root/projects/p.slug) and
 *   InIndex(p)
 *
 * @see spec/functions/backend_node/create_project.yaml
 * @query python3 tools/doc_query.py --query &quot;backend_node.create_project&quot; --mode text --pretty
 */
async function createProject(projectName, options = {}) {
  // Algorithm steps:
  // Step 1: Validate projectName against pattern and length constraints
  //   Rationale: Ensure data integrity before any side effects
  // Step 2: Generate URL-safe slug from projectName using slugify
  //   Rationale: Create filesystem-safe identifier
  // Step 3: Check if project with slug exists in index (active or archived)
  //   Rationale: Prevent duplicate projects
  // Step 4: Generate UUID v4 for project ID
  //   Rationale: Ensure globally unique identifier
  // Step 5: Create directory structure: chats/, data/, logs/, public/
  //   Rationale: Establish standard project workspace
  // Step 6: Execute git init in project directory
  //   Rationale: Enable version control from start
  // Step 7: Write project.json with metadata
  //   Rationale: Persist project configuration
  // Step 8: Add project to global index.json
  //   Rationale: Make project discoverable
  // Step 9: Log project_created event
  //   Rationale: Audit trail and observability
  // Step 10: Return Project object
  //   Rationale: Provide caller with project reference

  // TODO: Implement according to spec
  throw new Error('Not implemented');
}

module.exports = {
  sendMessage,
  callLLM,
  createChat,
  constructContext,
  parseSlashCommand,
  executeCommand,
  saveMessage,
  createProject,
};