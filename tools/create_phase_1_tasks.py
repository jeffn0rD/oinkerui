#!/usr/bin/env python3
"""
Create Phase 1 tasks in master_todo.yaml

This script creates narrowly-scoped tasks for Phase 1 implementation,
grouping functions by module and complexity.
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from task_manager import TaskManager

def create_phase_1_tasks():
    """Create all Phase 1 tasks"""
    
    project_root = Path(__file__).parent.parent
    manager = TaskManager(project_root)
    
    # Phase 1 tasks organized by module and feature area
    tasks = [
        # 1.0.x - Project Management Backend
        {
            'id': '1.0.0',
            'name': 'Implement Project CRUD Operations',
            'goal': 'Implement backend functions for creating, reading, updating, and deleting projects.',
            'prompt': './prompts/dev/prompt_1_0_0.md',
            'details': {
                'focus': [
                    'createProject function',
                    'getProject function',
                    'listProjects function',
                    'deleteProject function',
                    'Project data persistence',
                    'Git repository initialization per project'
                ],
                'functions': [
                    'backend_node/create_project.yaml',
                    'git_integration/init_repository.yaml'
                ],
                'verification': [
                    'Unit tests for each CRUD operation',
                    'Integration test for project lifecycle',
                    'Verify Git repo created for each project'
                ]
            }
        },
        
        # 1.1.x - Chat Management Backend
        {
            'id': '1.1.0',
            'name': 'Implement Chat CRUD Operations',
            'goal': 'Implement backend functions for creating, reading, and managing chats within projects.',
            'prompt': './prompts/dev/prompt_1_1_0.md',
            'details': {
                'focus': [
                    'createChat function',
                    'getChat function',
                    'listChats function',
                    'Chat data persistence',
                    'Chat-project relationship'
                ],
                'functions': [
                    'backend_node/create_chat.yaml'
                ],
                'verification': [
                    'Unit tests for chat operations',
                    'Verify chat belongs to project',
                    'Test chat listing and retrieval'
                ]
            }
        },
        
        # 1.2.x - Message Management Backend
        {
            'id': '1.2.0',
            'name': 'Implement Message Operations',
            'goal': 'Implement backend functions for creating, storing, and retrieving messages.',
            'prompt': './prompts/dev/prompt_1_2_0.md',
            'details': {
                'focus': [
                    'sendMessage function',
                    'saveMessage function',
                    'getMessage function',
                    'listMessages function',
                    'Message persistence (JSONL)',
                    'Message-chat relationship'
                ],
                'functions': [
                    'backend_node/send_message.yaml',
                    'backend_node/save_message.yaml'
                ],
                'verification': [
                    'Unit tests for message operations',
                    'Verify JSONL format',
                    'Test message ordering'
                ]
            }
        },
        
        # 1.3.x - LLM Integration
        {
            'id': '1.3.0',
            'name': 'Implement OpenRouter LLM Integration',
            'goal': 'Implement LLM request handling with OpenRouter API, including context construction and response processing.',
            'prompt': './prompts/dev/prompt_1_3_0.md',
            'details': {
                'focus': [
                    'callLLM function',
                    'constructContext function',
                    'OpenRouter API integration',
                    'Model selection from config',
                    'Response streaming support',
                    'Error handling and retries'
                ],
                'functions': [
                    'backend_node/call_llm.yaml',
                    'backend_node/construct_context.yaml'
                ],
                'verification': [
                    'Unit tests with mocked API',
                    'Integration test with real API',
                    'Test context construction',
                    'Verify streaming works'
                ]
            }
        },
        
        # 1.4.x - Logging and Metrics
        {
            'id': '1.4.0',
            'name': 'Implement Logging and LLM Request Tracking',
            'goal': 'Implement comprehensive logging system for LLM requests, chat logs, and system events.',
            'prompt': './prompts/dev/prompt_1_4_0.md',
            'details': {
                'focus': [
                    'logLLMRequest function',
                    'LLMRequestLogEntry creation',
                    'Chat log persistence (JSONL)',
                    'System log configuration',
                    'Token usage tracking',
                    'Performance metrics'
                ],
                'functions': [
                    'logging_and_metrics/log_llm_request.yaml',
                    'logging_and_metrics/get_stats.yaml'
                ],
                'verification': [
                    'Unit tests for logging functions',
                    'Verify log file creation',
                    'Test metrics aggregation',
                    'Verify token counting'
                ]
            }
        },
        
        # 1.5.x - Data Entities
        {
            'id': '1.5.0',
            'name': 'Implement Data Entity Management',
            'goal': 'Implement backend functions for creating and managing data entities (files and objects).',
            'prompt': './prompts/dev/prompt_1_5_0.md',
            'details': {
                'focus': [
                    'createDataEntity function',
                    'getDataEntity function',
                    'listDataEntities function',
                    'File storage and retrieval',
                    'JSON/YAML object storage',
                    'Entity-project relationship'
                ],
                'verification': [
                    'Unit tests for entity operations',
                    'Test file upload/download',
                    'Test object serialization',
                    'Verify path constraints'
                ]
            }
        },
        
        # 1.6.x - Git Integration
        {
            'id': '1.6.0',
            'name': 'Implement Git Operations',
            'goal': 'Implement Git integration for project versioning, including auto-commit functionality.',
            'prompt': './prompts/dev/prompt_1_6_0.md',
            'details': {
                'focus': [
                    'autoCommit function',
                    'getDiff function',
                    'Dirty file detection',
                    'Commit message generation',
                    'Git status tracking'
                ],
                'functions': [
                    'git_integration/auto_commit.yaml',
                    'git_integration/get_diff.yaml'
                ],
                'verification': [
                    'Unit tests for Git operations',
                    'Test auto-commit batching',
                    'Verify commit messages',
                    'Test diff generation'
                ]
            }
        },
        
        # 1.7.x - Frontend Components
        {
            'id': '1.7.0',
            'name': 'Implement Core UI Components',
            'goal': 'Implement Svelte components for project list, chat interface, and message display.',
            'prompt': './prompts/dev/prompt_1_7_0.md',
            'details': {
                'focus': [
                    'ProjectList component',
                    'ChatList component',
                    'MessageList component',
                    'MessageInput component',
                    'Component styling with Tailwind',
                    'Dark theme implementation'
                ],
                'functions': [
                    'frontend_svelte/render_message.yaml',
                    'frontend_svelte/handle_send_message.yaml'
                ],
                'verification': [
                    'Component unit tests',
                    'Visual regression tests',
                    'Test dark theme',
                    'Test responsive layout'
                ]
            }
        },
        
        # 1.8.x - Frontend State Management
        {
            'id': '1.8.0',
            'name': 'Implement Frontend State Management',
            'goal': 'Implement Svelte stores for managing application state (projects, chats, messages, UI).',
            'prompt': './prompts/dev/prompt_1_8_0.md',
            'details': {
                'focus': [
                    'projectStore implementation',
                    'chatStore implementation',
                    'messageStore implementation',
                    'uiStore implementation',
                    'State synchronization with backend',
                    'Local state persistence'
                ],
                'functions': [
                    'frontend_svelte/update_context_display.yaml'
                ],
                'verification': [
                    'Store unit tests',
                    'Test state updates',
                    'Test store subscriptions',
                    'Verify persistence'
                ]
            }
        },
        
        # 1.9.x - Integration and Testing
        {
            'id': '1.9.0',
            'name': 'Phase 1 Integration and End-to-End Testing',
            'goal': 'Integrate all Phase 1 components and implement comprehensive end-to-end tests.',
            'prompt': './prompts/dev/prompt_1_9_0.md',
            'details': {
                'focus': [
                    'Full application integration',
                    'End-to-end test scenarios',
                    'Performance testing',
                    'Error handling verification',
                    'Documentation updates',
                    'Deployment preparation'
                ],
                'verification': [
                    'E2E test suite',
                    'Load testing',
                    'Security audit',
                    'Documentation review',
                    'User acceptance testing'
                ]
            }
        }
    ]
    
    print("=" * 70)
    print("CREATING PHASE 1 TASKS")
    print("=" * 70)
    print()
    
    for task in tasks:
        success = manager.add_task_to_master(
            task_id=task['id'],
            name=task['name'],
            goal=task['goal'],
            prompt=task.get('prompt'),
            details=task.get('details'),
            section='future'
        )
        
        if not success:
            print(f"Failed to add task {task['id']}")
            return False
    
    print("\n" + "=" * 70)
    print(f"✓ Successfully created {len(tasks)} Phase 1 tasks")
    print("=" * 70)
    
    # Print summary
    manager.print_task_summary()
    
    return True

if __name__ == "__main__":
    success = create_phase_1_tasks()
    sys.exit(0 if success else 1)