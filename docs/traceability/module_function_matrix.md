# Module to Function Traceability Matrix

Generated: 2026-01-20T16:16:07.862220

This matrix maps modules to their function specifications.

## Node.js Backend Server

**Module ID:** `backend_node`

| Function | Has Spec | Spec File |
|----------|----------|-----------|
| createProject | ✅ | spec/functions/backend_node/create_project.yaml |
| getProject | ❌ | N/A |
| listProjects | ❌ | N/A |
| updateProject | ❌ | N/A |
| deleteProject | ❌ | N/A |
| archiveProject | ❌ | N/A |
| createChat | ✅ | spec/functions/backend_node/create_chat.yaml |
| getChat | ❌ | N/A |
| listChats | ❌ | N/A |
| forkChat | ❌ | N/A |
| sendMessage | ✅ | spec/functions/backend_node/send_message.yaml |
| updateMessageFlags | ❌ | N/A |
| buildContext | ❌ | N/A |
| estimateTokens | ❌ | N/A |
| getContextPreview | ❌ | N/A |
| callLLM | ✅ | spec/functions/backend_node/call_llm.yaml |
| streamLLMResponse | ❌ | N/A |
| parseSlashCommand | ✅ | spec/functions/backend_node/parse_slash_command.yaml |
| executeSlashCommand | ❌ | N/A |
| resolveTemplate | ❌ | N/A |
| listTemplates | ❌ | N/A |

**Function Specs Available:** 8

## Python Tools Backend Server

**Module ID:** `backend_python_tools`

| Function | Has Spec | Spec File |
|----------|----------|-----------|
| render_template | ✅ | spec/functions/backend_python_tools/render_template.yaml |
| validate_template | ❌ | N/A |
| get_template_filters | ❌ | N/A |
| create_jinja_env | ❌ | N/A |
| execute_code | ✅ | spec/functions/backend_python_tools/execute_code.yaml |
| execute_shell | ❌ | N/A |
| validate_path | ❌ | N/A |
| create_sandbox | ✅ | spec/functions/backend_python_tools/create_sandbox.yaml |
| get_or_create_venv | ❌ | N/A |
| install_requirements | ❌ | N/A |
| stream_to_file | ❌ | N/A |
| append_to_file | ❌ | N/A |
| generate_diff | ❌ | N/A |
| count_tokens | ❌ | N/A |

**Function Specs Available:** 3

## Svelte Frontend Application

**Module ID:** `frontend_svelte`

| Function | Has Spec | Spec File |
|----------|----------|-----------|
| AppLayout | ❌ | N/A |
| LeftSidebar | ❌ | N/A |
| MainArea | ❌ | N/A |
| RightSidebar | ❌ | N/A |
| MessageList | ❌ | N/A |
| MessageItem | ❌ | N/A |
| PromptInput | ❌ | N/A |
| ContextInfoBar | ❌ | N/A |
| MarkdownRenderer | ❌ | N/A |
| CodeBlock | ❌ | N/A |
| ModelSelector | ❌ | N/A |
| TemplatePicker | ❌ | N/A |
| fetchProjects | ❌ | N/A |
| fetchChats | ❌ | N/A |
| fetchMessages | ❌ | N/A |
| sendMessage | ❌ | N/A |
| apiGet | ❌ | N/A |
| apiPost | ❌ | N/A |

**Function Specs Available:** 4

## Git Integration Module

**Module ID:** `git_integration`

| Function | Has Spec | Spec File |
|----------|----------|-----------|
| initRepository | ✅ | spec/functions/git_integration/init_repository.yaml |
| cloneRepository | ❌ | N/A |
| isGitRepo | ❌ | N/A |
| getStatus | ❌ | N/A |
| getLog | ❌ | N/A |
| getDiff | ✅ | spec/functions/git_integration/get_diff.yaml |
| getFileHistory | ❌ | N/A |
| stageFiles | ❌ | N/A |
| unstageFiles | ❌ | N/A |
| commitChanges | ❌ | N/A |
| autoCommit | ✅ | spec/functions/git_integration/auto_commit.yaml |
| pushChanges | ❌ | N/A |
| pullChanges | ❌ | N/A |
| configureRemote | ❌ | N/A |
| getRemotes | ❌ | N/A |
| getCurrentBranch | ❌ | N/A |
| listBranches | ❌ | N/A |
| createBranch | ❌ | N/A |
| switchBranch | ❌ | N/A |
| discardChanges | ❌ | N/A |
| getFileContentAtCommit | ❌ | N/A |
| createGitignore | ❌ | N/A |
| getGitInstance | ❌ | N/A |

**Function Specs Available:** 3

## Logging and Metrics Module

**Module ID:** `logging_and_metrics`

| Function | Has Spec | Spec File |
|----------|----------|-----------|
| logLLMRequest | ✅ | spec/functions/logging_and_metrics/log_llm_request.yaml |
| logLLMRequestStart | ❌ | N/A |
| logLLMRequestComplete | ❌ | N/A |
| logLLMRequestError | ❌ | N/A |
| logSystemEvent | ❌ | N/A |
| logProjectEvent | ❌ | N/A |
| logChatEvent | ❌ | N/A |
| logError | ❌ | N/A |
| logWarning | ❌ | N/A |
| getLLMRequestLogs | ❌ | N/A |
| getSystemLogs | ❌ | N/A |
| searchLogs | ❌ | N/A |
| getProjectMetrics | ❌ | N/A |
| getChatMetrics | ❌ | N/A |
| getGlobalMetrics | ❌ | N/A |
| aggregateUsage | ❌ | N/A |
| rotateLogs | ❌ | N/A |
| cleanupOldLogs | ❌ | N/A |
| getLogger | ❌ | N/A |

**Function Specs Available:** 2
