#!/usr/bin/env python3
"""
Task Manager Module

This module provides high-level operations for managing tasks in the
master_todo.yaml and tasks_completed.yaml files. It uses the yaml_db module
for all YAML operations to ensure consistency and reliability.

Key Features:
- Move tasks between master_todo and tasks_completed
- Add new tasks to master_todo
- Query tasks by ID or criteria
- Validate task structure
- Generate task summaries
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from yaml_db import YAMLDatabase


class TaskManager:
    """
    Manager for task operations across master_todo.yaml and tasks_completed.yaml.
    """
    
    def __init__(self, project_root: Union[str, Path]):
        """
        Initialize the task manager.
        
        Args:
            project_root: Root directory of the project
        """
        self.project_root = Path(project_root)
        self.master_todo_path = self.project_root / "master_todo.yaml"
        self.tasks_completed_path = self.project_root / "log" / "tasks_completed.yaml"
        
        # Initialize databases
        self.master_todo_db = YAMLDatabase(self.master_todo_path)
        self.tasks_completed_db = YAMLDatabase(self.tasks_completed_path)
    
    def get_task_from_master(self, task_id: Union[str, int, float]) -> Optional[Dict[str, Any]]:
        """
        Get a task from master_todo.yaml by ID.
        
        Args:
            task_id: Task ID to search for (can be string, int, or float)
            
        Returns:
            Task dictionary if found, None otherwise
        """
        self.master_todo_db.load()
        
        # Normalize task_id for comparison
        def normalize_id(tid):
            if isinstance(tid, str):
                try:
                    return float(tid)
                except ValueError:
                    return tid
            return tid
        
        normalized_search_id = normalize_id(task_id)
        
        # Check current tasks
        current_tasks = self.master_todo_db.get('current', [])
        for task_entry in current_tasks:
            entry_id = task_entry.get('task', {}).get('id')
            if normalize_id(entry_id) == normalized_search_id:
                return task_entry
        
        # Check future tasks
        future_tasks = self.master_todo_db.get('future', [])
        for task_entry in future_tasks:
            if isinstance(task_entry, dict):
                entry_id = task_entry.get('task', {}).get('id')
                if normalize_id(entry_id) == normalized_search_id:
                    return task_entry
        
        return None
    
    def get_task_from_completed(self, task_id: Union[str, int, float]) -> Optional[Dict[str, Any]]:
        """
        Get a task from tasks_completed.yaml by ID.
        
        Args:
            task_id: Task ID to search for (can be string, int, or float)
            
        Returns:
            Task dictionary if found, None otherwise
        """
        self.tasks_completed_db.load()
        
        # Normalize task_id for comparison
        def normalize_id(tid):
            if isinstance(tid, str):
                try:
                    return float(tid)
                except ValueError:
                    return tid
            return tid
        
        normalized_search_id = normalize_id(task_id)
        
        tasks = self.tasks_completed_db.get('tasks', [])
        for task_entry in tasks:
            entry_id = task_entry.get('task', {}).get('id')
            if normalize_id(entry_id) == normalized_search_id:
                return task_entry
        
        return None
    
    def move_task_to_completed(
        self,
        task_id: Union[str, int, float],
        completed_date: Optional[str] = None,
        commit: Optional[str] = None,
        summary: Optional[str] = None,
        **additional_fields
    ) -> bool:
        """
        Move a task from master_todo.yaml to tasks_completed.yaml.
        
        Args:
            task_id: ID of the task to move
            completed_date: Completion date (defaults to today)
            commit: Git commit hash
            summary: Task summary
            **additional_fields: Additional fields to add to the completed task
            
        Returns:
            True if successful, False otherwise
        """
        # Get task from master_todo
        task_entry = self.get_task_from_master(task_id)
        if not task_entry:
            print(f"Error: Task {task_id} not found in master_todo.yaml")
            return False
        
        # Check if already in completed
        if self.get_task_from_completed(task_id):
            print(f"Warning: Task {task_id} already in tasks_completed.yaml")
            return False
        
        # Prepare completed task entry
        completed_task = {
            'task': task_entry['task'].copy()
        }
        
        # Add completion metadata
        if completed_date is None:
            completed_date = datetime.now().strftime('%Y-%m-%d')
        completed_task['task']['completed_date'] = completed_date
        
        if commit:
            completed_task['task']['git_commit'] = commit
        
        if summary:
            completed_task['task']['summary'] = summary
        
        # Add any additional fields
        for key, value in additional_fields.items():
            completed_task['task'][key] = value
        
        # Add to tasks_completed.yaml
        self.tasks_completed_db.load()
        self.tasks_completed_db.append('tasks', completed_task)
        self.tasks_completed_db.save()
        print(f"✓ Added task {task_id} to tasks_completed.yaml")
        
        # Remove from master_todo.yaml
        self.master_todo_db.load()
        
        # Normalize task_id for comparison
        def normalize_id(tid):
            if isinstance(tid, str):
                try:
                    return float(tid)
                except ValueError:
                    return tid
            return tid
        
        normalized_search_id = normalize_id(task_id)
        
        # Remove from current tasks
        current_tasks = self.master_todo_db.get('current', [])
        new_current = [t for t in current_tasks if normalize_id(t.get('task', {}).get('id')) != normalized_search_id]
        
        if len(new_current) < len(current_tasks):
            self.master_todo_db.set('current', new_current)
            self.master_todo_db.save()
            print(f"✓ Removed task {task_id} from master_todo.yaml (current)")
            return True
        
        # Remove from future tasks
        future_tasks = self.master_todo_db.get('future', [])
        new_future = [t for t in future_tasks if not (isinstance(t, dict) and normalize_id(t.get('task', {}).get('id')) == normalized_search_id)]
        
        if len(new_future) < len(future_tasks):
            self.master_todo_db.set('future', new_future)
            self.master_todo_db.save()
            print(f"✓ Removed task {task_id} from master_todo.yaml (future)")
            return True
        
        print(f"Warning: Task {task_id} not found in current or future tasks")
        return False
    
    def move_task_to_current(self, task_id: Union[str, int, float]) -> bool:
        """
        Move a task from 'future' section to 'current' section.
        
        Args:
            task_id: ID of the task to move
            
        Returns:
            True if successful, False otherwise
        """
        self.master_todo_db.load()
        
        # Normalize task_id for comparison
        def normalize_id(tid):
            if isinstance(tid, str):
                try:
                    return float(tid)
                except ValueError:
                    return tid
            return tid
        
        normalized_search_id = normalize_id(task_id)
        
        # Find task in future
        future_tasks = self.master_todo_db.get('future', [])
        task_to_move = None
        task_index = None
        
        for i, task_entry in enumerate(future_tasks):
            if isinstance(task_entry, dict) and 'task' in task_entry:
                entry_id = task_entry.get('task', {}).get('id')
                if normalize_id(entry_id) == normalized_search_id:
                    task_to_move = task_entry
                    task_index = i
                    break
        
        if task_to_move is None:
            print(f"Error: Task {task_id} not found in future section")
            return False
        
        # Remove from future
        future_tasks.pop(task_index)
        self.master_todo_db.set('future', future_tasks)
        
        # Add to current
        current_tasks = self.master_todo_db.get('current', [])
        current_tasks.append(task_to_move)
        self.master_todo_db.set('current', current_tasks)
        
        self.master_todo_db.save()
        print(f"✓ Moved task {task_id} from future to current")
        
        return True
    
    def add_task_to_master(
        self,
        task_id: str,
        name: str,
        goal: str,
        prompt: Optional[str] = None,
        files: Optional[List[str]] = None,
        details: Optional[Dict[str, Any]] = None,
        section: str = 'future'
    ) -> bool:
        """
        Add a new task to master_todo.yaml.
        
        Args:
            task_id: Unique task ID
            name: Task name
            goal: Task goal/description
            prompt: Path to prompt file
            files: List of related files
            details: Additional task details
            section: Section to add to ('current' or 'future')
            
        Returns:
            True if successful, False otherwise
        """
        # Check if task already exists
        if self.get_task_from_master(task_id):
            print(f"Error: Task {task_id} already exists in master_todo.yaml")
            return False
        
        if self.get_task_from_completed(task_id):
            print(f"Error: Task {task_id} already exists in tasks_completed.yaml")
            return False
        
        # Create task entry
        task_entry = {
            'task': {
                'id': task_id,
                'name': name,
                'goal': goal
            }
        }
        
        if prompt:
            task_entry['task']['prompt'] = prompt
        
        if files:
            task_entry['task']['files'] = files
        
        if details:
            task_entry['task']['details'] = details
        
        # Add to master_todo.yaml
        self.master_todo_db.load()
        
        if section not in ['current', 'future']:
            print(f"Error: Invalid section '{section}'. Must be 'current' or 'future'")
            return False
        
        self.master_todo_db.append(section, task_entry)
        self.master_todo_db.save()
        print(f"✓ Added task {task_id} to master_todo.yaml ({section})")
        
        return True
    
    def list_current_tasks(self) -> List[Dict[str, Any]]:
        """
        List all current tasks from master_todo.yaml.
        
        Returns:
            List of current task entries
        """
        self.master_todo_db.load()
        return self.master_todo_db.get('current', [])
    
    def list_future_tasks(self) -> List[Dict[str, Any]]:
        """
        List all future tasks from master_todo.yaml.
        
        Returns:
            List of future task entries
        """
        self.master_todo_db.load()
        return self.master_todo_db.get('future', [])
    
    def list_completed_tasks(self) -> List[Dict[str, Any]]:
        """
        List all completed tasks from tasks_completed.yaml.
        
        Returns:
            List of completed task entries
        """
        self.tasks_completed_db.load()
        return self.tasks_completed_db.get('tasks', [])
    
    def get_all_task_ids(self) -> Dict[str, List[str]]:
        """
        Get all task IDs organized by status.
        
        Returns:
            Dictionary with 'current', 'future', and 'completed' lists
        """
        result = {
            'current': [],
            'future': [],
            'completed': []
        }
        
        # Current tasks
        for task_entry in self.list_current_tasks():
            task_id = task_entry.get('task', {}).get('id')
            if task_id:
                result['current'].append(task_id)
        
        # Future tasks
        for task_entry in self.list_future_tasks():
            if isinstance(task_entry, dict):
                task_id = task_entry.get('task', {}).get('id')
                if task_id:
                    result['future'].append(task_id)
        
        # Completed tasks
        for task_entry in self.list_completed_tasks():
            task_id = task_entry.get('task', {}).get('id')
            if task_id:
                result['completed'].append(task_id)
        
        return result
    
    def validate_task_structure(self, task_entry: Dict[str, Any]) -> List[str]:
        """
        Validate a task entry structure.
        
        Args:
            task_entry: Task entry to validate
            
        Returns:
            List of validation errors (empty if valid)
        """
        errors = []
        
        if 'task' not in task_entry:
            errors.append("Missing 'task' key")
            return errors
        
        task = task_entry['task']
        
        # Required fields
        required_fields = ['id', 'name', 'goal']
        for field in required_fields:
            if field not in task:
                errors.append(f"Missing required field: {field}")
        
        # Validate ID format
        if 'id' in task:
            task_id = task['id']
            if not isinstance(task_id, (str, int, float)):
                errors.append(f"Invalid task ID type: {type(task_id)}")
        
        return errors
    
    def print_task_summary(self) -> None:
        """
        Print a summary of all tasks.
        """
        all_ids = self.get_all_task_ids()
        
        print("\n" + "=" * 70)
        print("TASK SUMMARY")
        print("=" * 70)
        
        print(f"\nCurrent Tasks ({len(all_ids['current'])}):")
        for task_id in all_ids['current']:
            task = self.get_task_from_master(task_id)
            if task:
                print(f"  - {task_id}: {task['task'].get('name', 'N/A')}")
        
        print(f"\nFuture Tasks ({len(all_ids['future'])}):")
        for task_id in all_ids['future']:
            task = self.get_task_from_master(task_id)
            if task:
                print(f"  - {task_id}: {task['task'].get('name', 'N/A')}")
        
        print(f"\nCompleted Tasks ({len(all_ids['completed'])}):")
        for task_id in all_ids['completed']:
            task = self.get_task_from_completed(task_id)
            if task:
                print(f"  - {task_id}: {task['task'].get('name', 'N/A')}")
        
        print("\n" + "=" * 70)


def main():
    """
    Main function for command-line usage.
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Task Manager CLI')
    parser.add_argument('--project-root', default='.', help='Project root directory')
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List tasks')
    list_parser.add_argument('--status', choices=['current', 'future', 'completed', 'all'],
                            default='all', help='Task status to list')
    
    # Move command (to completed)
    move_parser = subparsers.add_parser('move', help='Move task to completed')
    move_parser.add_argument('task_id', help='Task ID to move')
    move_parser.add_argument('--date', help='Completion date (YYYY-MM-DD)')
    move_parser.add_argument('--commit', help='Git commit hash')
    move_parser.add_argument('--summary', help='Task summary')
    
    # Activate command (move from future to current)
    activate_parser = subparsers.add_parser('activate', help='Move task from future to current')
    activate_parser.add_argument('task_id', help='Task ID to activate')
    
    # Add command
    add_parser = subparsers.add_parser('add', help='Add new task')
    add_parser.add_argument('task_id', help='Task ID')
    add_parser.add_argument('name', help='Task name')
    add_parser.add_argument('goal', help='Task goal')
    add_parser.add_argument('--prompt', help='Prompt file path')
    add_parser.add_argument('--section', choices=['current', 'future'],
                           default='future', help='Section to add to')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    manager = TaskManager(args.project_root)
    
    if args.command == 'list':
        if args.status == 'all':
            manager.print_task_summary()
        else:
            all_ids = manager.get_all_task_ids()
            print(f"\n{args.status.capitalize()} Tasks:")
            for task_id in all_ids[args.status]:
                if args.status == 'completed':
                    task = manager.get_task_from_completed(task_id)
                else:
                    task = manager.get_task_from_master(task_id)
                if task:
                    print(f"  - {task_id}: {task['task'].get('name', 'N/A')}")
    
    elif args.command == 'move':
        success = manager.move_task_to_completed(
            args.task_id,
            completed_date=args.date,
            commit=args.commit,
            summary=args.summary
        )
        if success:
            print(f"\n✓ Successfully moved task {args.task_id} to completed")
        else:
            print(f"\n✗ Failed to move task {args.task_id}")
            sys.exit(1)
    
    elif args.command == 'add':
        success = manager.add_task_to_master(
            args.task_id,
            args.name,
            args.goal,
            prompt=args.prompt,
            section=args.section
        )
        if success:
            print(f"\n✓ Successfully added task {args.task_id}")
        else:
            print(f"\n✗ Failed to add task {args.task_id}")
            sys.exit(1)
    
    elif args.command == 'activate':
        success = manager.move_task_to_current(args.task_id)
        if success:
            print(f"\n✓ Successfully activated task {args.task_id}")
        else:
            print(f"\n✗ Failed to activate task {args.task_id}")
            sys.exit(1)


if __name__ == "__main__":
    main()