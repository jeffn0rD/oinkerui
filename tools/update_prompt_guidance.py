#!/usr/bin/env python3
"""
Update prompt_guidance in master_todo.yaml
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from yaml_db import YAMLDatabase

def update_prompt_guidance():
    """Update the prompt_guidance field in master_todo.yaml"""
    
    project_root = Path(__file__).parent.parent
    master_todo_path = project_root / "master_todo.yaml"
    
    db = YAMLDatabase(master_todo_path)
    db.load()
    
    new_guidance = """Always follow these guidelines and update project documentation:
**** ALWAYS PULL the repository before starting a task. ****
**** When possible and practical use deterministic methods (python code) to accomplish tasks.  ****

YAML FILE OPERATIONS - MANDATORY WORKFLOW:
* NEVER manually edit YAML files with string operations or text replacement
* ALWAYS use the Python YAML tools in tools/ directory:
  - tools/yaml_db.py - Core YAML database operations (load, save, get, set, append, remove)
  - tools/task_manager.py - Task operations (move tasks, add tasks, list tasks)
  - tools/validate_schemas.py - Schema validation for YAML files
* To move a task to completed: python3 tools/task_manager.py move <task_id> --date YYYY-MM-DD --commit <hash> --summary "..."
* To add a new task: python3 tools/task_manager.py add <task_id> <name> <goal> --prompt <path> --section current|future
* To list tasks: python3 tools/task_manager.py list --status all|current|future|completed
* To validate YAML files: python3 tools/validate_schemas.py --file all|master_todo|tasks_completed
* These tools ensure data integrity, create backups, and prevent corruption

TASK PROCESSING:
* When processing tasks always create a brief summary of steps and actions in log/task_<id>_summary.yaml
* When processing a task review the last task notes (log/task_<id>_notes.yaml). There may be information needed or remaining
work that needs to be completed first.
* In the task_<id>_summary.yaml file always provide 'justification:' for each step/action. It is important to track the
decisions made and reasoning behind them.
* If there are errors, inconsistencies, or inadequate information to accomplish all goals of a task append questions to
./open_questions.yaml
* If the task is complete use tools/task_manager.py to move it from master_todo.yaml to log/tasks_completed.yaml
* Tasks should be verified before considered complete, when possible use a small python script (save to ./verify/task_<id>_<descriptor>.py).
The script should be well commented as to what it does and why.

DOCUMENTATION:
* Always make sure system documentation is up to date with work just done! manuals go in ./man/*.yaml
* NOTE: All spec files need to have consistent references to each other. This needs to be verified whenever spec files
are changed.

REPOSITORY HYGIENE:
* You can create temporary files to assist with task completion but they should be removed when task is complete. Use
the files outlined here for project tracking.
* It is important to keep the repository clean of unnecessary files.
* Follow the task instructions closely and carefully. Constrain work and scope to the task. Return with questions if
needed and confirm any extra work if it is outside the scope.
* ALWAYS COMMIT AND PUSH the repository after a task.
"""
    
    db.set('prompt_guidance', new_guidance)
    db.save()
    
    print("✓ Updated prompt_guidance in master_todo.yaml")

if __name__ == "__main__":
    update_prompt_guidance()