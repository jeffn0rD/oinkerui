# API to Function Traceability Matrix

Generated: 2026-01-20T16:16:07.995283

This matrix maps API endpoints to their implementing functions.

## node_api

| Method | Path | Function Reference |
|--------|------|-------------------|
| GET | /projects | spec/modules/backend_node.yaml#list_projects |
| POST | /projects | spec/functions/backend_node/create_project.yaml |
| GET | /projects/{project_id} | N/A |
| PATCH | /projects/{project_id} | N/A |
| POST | /projects/{project_id}/archive | N/A |
| POST | /projects/{project_id}/restore | N/A |
| DELETE | /projects/{project_id} | N/A |
| GET | /projects/{project_id}/chats | spec/modules/backend_node.yaml#list_chats |
| POST | /projects/{project_id}/chats | spec/functions/backend_node/create_chat.yaml |
| GET | /projects/{project_id}/chats/{chat_id} | N/A |
| POST | /projects/{project_id}/chats/{chat_id}/close | N/A |
| POST | /projects/{project_id}/chats/{chat_id}/fork | N/A |
| POST | /projects/{project_id}/chats/{chat_id}/messages | spec/functions/backend_node/send_message.yaml |
| GET | /projects/{project_id}/chats/{chat_id}/messages | N/A |
| PATCH | /projects/{project_id}/chats/{chat_id}/messages/{message_id} | N/A |
| POST | /projects/{project_id}/chats/{chat_id}/messages/{message_id}/discard | N/A |
| POST | /projects/{project_id}/chats/{chat_id}/context-preview | spec/functions/backend_node/construct_context.yaml |
| GET | /projects/{project_id}/git/status | N/A |
| POST | /projects/{project_id}/git/commit | N/A |
| POST | /projects/{project_id}/git/push | N/A |
| GET | /projects/{project_id}/git/diff | spec/functions/git_integration/get_diff.yaml |
| GET | /templates | N/A |
| POST | /templates/{template_id}/render | spec/functions/backend_python_tools/render_template.yaml |
| GET | /projects/{project_id}/stats | spec/functions/logging_and_metrics/get_stats.yaml |
| GET | /projects/{project_id}/chats/{chat_id}/stats | N/A |

## python_tools_api

| Method | Path | Function Reference |
|--------|------|-------------------|
| POST | /render-template | spec/functions/backend_python_tools/render_template.yaml |
| POST | /execute | spec/functions/backend_python_tools/execute_code.yaml |
| GET | /health | N/A |
