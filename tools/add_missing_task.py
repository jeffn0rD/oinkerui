#!/usr/bin/env python3
"""
Script to add missing task 0.4 to tasks_completed.yaml
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from yaml_db import YAMLDatabase

def add_task_0_4():
    """Add task 0.4 to tasks_completed.yaml"""
    
    project_root = Path(__file__).parent.parent
    tasks_completed_path = project_root / "log" / "tasks_completed.yaml"
    
    db = YAMLDatabase(tasks_completed_path)
    db.load()
    
    # Check if task 0.4 already exists
    tasks = db.get('tasks', [])
    for task in tasks:
        if task.get('task', {}).get('id') == 0.4:
            print("Task 0.4 already exists in tasks_completed.yaml")
            return False
    
    # Create task 0.4 entry
    task_0_4 = {
        'task': {
            'id': 0.4,
            'name': 'Initialize Python Project',
            'goal': 'Set up Python backend with FastAPI and development tools.',
            'completed_date': '2024-01-20',
            'commit': '67438e1',
            'summary': '''Successfully initialized the Python project with requirements.txt, configured all 
dependencies according to spec/modules/backend_python_tools.yaml, and set up the complete 
development environment including linting, formatting, and testing infrastructure.''',
            'deliverables': [
                'requirements.txt with all dependencies',
                'requirements-dev.txt with development tools',
                'Configuration files (pyproject.toml for black/mypy)',
                'Backend directory structure',
                'Placeholder backend_python/src/main.py with FastAPI server',
                'Updated .gitignore file'
            ],
            'verification': {
                'method': 'pip list, server start, health check, linting, formatting, type checking',
                'result': 'success',
                'notes': 'All dependencies installed, server running on port 8000, all tools working'
            }
        }
    }
    
    # Find the correct position to insert (after 0.3.5)
    insert_index = None
    for i, task in enumerate(tasks):
        task_id = task.get('task', {}).get('id')
        if task_id == '0.3.5':
            insert_index = i + 1
            break
    
    if insert_index is not None:
        tasks.insert(insert_index, task_0_4)
    else:
        # If 0.3.5 not found, append at the end
        tasks.append(task_0_4)
    
    db.set('tasks', tasks)
    db.save()
    
    print("✓ Successfully added task 0.4 to tasks_completed.yaml")
    return True

if __name__ == "__main__":
    add_task_0_4()