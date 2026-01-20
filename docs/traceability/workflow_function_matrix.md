# Workflow to Function Traceability Matrix

Generated: 2026-01-20T16:16:08.057560

This matrix maps workflow steps to their implementing functions.

## Create Project Workflow

**ID:** `create_project`

| Step | Type | Function |
|------|------|----------|
| validate_input | validation | N/A |
| generate_ids | computation | backend_node.generate_project_ids |
| create_directory | io | backend_node.create_project_directory |
| init_git | external | git_integration.init_repository |
| create_metadata | data | backend_node.create_project_metadata |
| add_to_index | data | backend_node.add_to_project_index |
| emit_event | event | logging_and_metrics.emit_event |
| return_result | return | N/A |

## Send Message and Get LLM Response

**ID:** `send_message`

| Step | Type | Function |
|------|------|----------|
| validate_message | validation | N/A |
| check_slash_command | computation | backend_node.is_slash_command |
| parse_slash_command | computation | backend_node.parse_slash_command |
| execute_command | external | backend_node.execute_command |
| return_command_result | return | N/A |
| create_user_message | data | backend_node.create_message |
| save_user_message | io | backend_node.save_message |
| check_pure_aside | computation | N/A |
| return_aside_result | return | N/A |
| construct_context | computation | backend_node.construct_context |
| call_llm | external | backend_node.call_llm |
| create_assistant_message | data | backend_node.create_message |
| save_assistant_message | io | backend_node.save_message |
| log_request | event | logging_and_metrics.log_llm_request |
| update_chat_timestamp | data | backend_node.update_chat_timestamp |
| check_auto_commit | computation | N/A |
| auto_commit | external | git_integration.auto_commit |
| return_result | return | N/A |

## Execute Slash Command

**ID:** `execute_slash_command`

| Step | Type | Function |
|------|------|----------|
| parse_command | computation | backend_node.parse_slash_command |
| validate_command | validation | N/A |
| check_permissions | validation | N/A |
| dispatch_command | computation | backend_node.get_command_handler |
| execute_handler | external | backend_node.execute_handler |
| process_side_effects | computation | backend_node.process_side_effects |
| format_result | computation | backend_node.format_command_result |
| return_result | return | N/A |

## Fork Chat Workflow

**ID:** `fork_chat`

| Step | Type | Function |
|------|------|----------|
| validate_fork_request | validation | N/A |
| load_messages | io | backend_node.load_messages |
| filter_messages | computation | backend_node.filter_fork_messages |
| create_new_chat | data | backend_node.create_chat |
| copy_messages | io | backend_node.copy_messages |
| emit_event | event | logging_and_metrics.emit_event |
| return_result | return | N/A |

## Git Commit Workflow

**ID:** `git_commit`

| Step | Type | Function |
|------|------|----------|
| validate_request | validation | N/A |
| get_status | external | git_integration.get_status |
| check_changes | computation | N/A |
| return_no_changes | return | N/A |
| stage_files | external | git_integration.stage_files |
| create_commit | external | git_integration.commit |
| log_commit | event | logging_and_metrics.emit_event |
| return_result | return | N/A |

## Template Render Workflow

**ID:** `template_render`

| Step | Type | Function |
|------|------|----------|
| validate_request | validation | N/A |
| load_template | io | backend_node.load_template |
| validate_variables | validation | N/A |
| render_template | external | backend_python_tools.render_template |
| return_result | return | N/A |

## Create Data Entity Workflow

**ID:** `create_data_entity`

| Step | Type | Function |
|------|------|----------|
| validate_entity | validation | N/A |
| check_exists | io | backend_node.check_path_exists |
| create_entity_record | data | backend_node.create_data_entity |
| compute_hash | computation | backend_node.compute_entity_hash |
| update_entity_hash | data | backend_node.update_entity |
| add_to_index | data | backend_node.add_entity_to_index |
| emit_event | event | logging_and_metrics.emit_event |
| return_result | return | N/A |
