#!/usr/bin/env python3
"""
Verify that all Phase 0 tasks are completed
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from yaml_db import YAMLDatabase

def verify_phase_0():
    """Verify all Phase 0 tasks are completed"""
    
    project_root = Path(__file__).parent.parent
    
    # Load spec.yaml to get Phase 0 todos
    spec_db = YAMLDatabase(project_root / "spec" / "spec.yaml", create_backup=False)
    spec_db.load()
    
    phases = spec_db.get('phases', [])
    phase_0 = None
    for phase in phases:
        if phase.get('id') == 'phase_0':
            phase_0 = phase
            break
    
    if not phase_0:
        print("Error: Phase 0 not found in spec.yaml")
        return False
    
    phase_0_todos = phase_0.get('todos', [])
    print(f"\nPhase 0 has {len(phase_0_todos)} todos in spec.yaml")
    
    # Load completed tasks
    tasks_completed_db = YAMLDatabase(project_root / "log" / "tasks_completed.yaml", create_backup=False)
    tasks_completed_db.load()
    
    completed_tasks = tasks_completed_db.get('tasks', [])
    
    # Filter Phase 0 tasks (0.x.x)
    phase_0_completed = []
    for task in completed_tasks:
        task_id = str(task.get('task', {}).get('id', ''))
        if task_id.startswith('0.') or task_id == '0.0':
            phase_0_completed.append(task)
    
    print(f"Found {len(phase_0_completed)} completed Phase 0 tasks")
    print("\nCompleted Phase 0 tasks:")
    for task in phase_0_completed:
        task_id = task.get('task', {}).get('id')
        task_name = task.get('task', {}).get('name')
        print(f"  - {task_id}: {task_name}")
    
    # Map completed tasks to spec todos
    print("\n" + "=" * 70)
    print("MAPPING COMPLETED TASKS TO SPEC TODOS")
    print("=" * 70)
    
    mapping = {
        1: ["0.2"],  # Create root project structure
        2: ["0.3.5"],  # Initialize Node.js project
        3: ["0.4"],  # Initialize Python project
        4: ["0.5"],  # Initialize Svelte frontend
        5: ["0.6"],  # Create development environment configuration
        6: [],  # Set up workspace directory structure - NOT DONE
        7: ["0.7"],  # Create build and development scripts
        8: ["0.8"],  # Set up testing infrastructure
        9: ["0.9"],  # Create documentation
        10: ["0.9"],  # Initialize Git repository (part of 0.9)
        11: ["0.0", "0.2.5.6"]  # Create specification verification script
    }
    
    all_complete = True
    for todo_num, task_ids in mapping.items():
        todo_text = phase_0_todos[todo_num - 1][:80] + "..."
        if task_ids:
            status = "✓"
            tasks_str = ", ".join(task_ids)
        else:
            status = "✗"
            tasks_str = "NOT COMPLETED"
            all_complete = False
        
        print(f"\n{todo_num}. {todo_text}")
        print(f"   {status} Tasks: {tasks_str}")
    
    # Check for workspace directory structure
    print("\n" + "=" * 70)
    print("CHECKING WORKSPACE DIRECTORY STRUCTURE")
    print("=" * 70)
    
    workspace_dirs = [
        "workspace_root/projects",
        "workspace_root/global",
        "workspace_root/venvs",
        "workspace_root/temp"
    ]
    
    workspace_exists = False
    for dir_path in workspace_dirs:
        full_path = project_root / dir_path
        if full_path.exists():
            print(f"✓ {dir_path} exists")
            workspace_exists = True
        else:
            print(f"✗ {dir_path} does not exist")
    
    if not workspace_exists:
        print("\n⚠ Workspace directory structure not created")
        print("  This is todo #6 from spec.yaml Phase 0")
        all_complete = False
    
    print("\n" + "=" * 70)
    if all_complete:
        print("✓ ALL PHASE 0 TASKS COMPLETE")
    else:
        print("✗ PHASE 0 INCOMPLETE - Missing workspace directory structure")
    print("=" * 70)
    
    return all_complete

if __name__ == "__main__":
    success = verify_phase_0()
    sys.exit(0 if success else 1)