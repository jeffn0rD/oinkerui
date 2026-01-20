#!/usr/bin/env python3
"""
Task Executor Tool for oinkerui Project (v2)

Enhanced with EnhancedDocQuery integration for better context retrieval.

This tool automates task execution:
1. Reads task from master_todo.yaml using EnhancedDocQuery
2. Generates orchestrator prompt with prompt_guidance
3. Executes the task (or generates prompt for manual execution)
4. Runs task cleanup tool

Usage:
    python3 tools/task_executor.py --task-id TASK_ID [--generate-only]
    python3 tools/task_executor.py --next [--generate-only]
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import yaml
import re

# Import EnhancedDocQuery
sys.path.insert(0, str(Path(__file__).parent))
from doc_query import EnhancedDocQuery


class TaskExecutor:
    """Automates task execution and coordination."""
    
    def __init__(self, base_path: str = "."):
        """Initialize task executor."""
        self.base_path = Path(base_path)
        self.task_data = None
        self.prompt_guidance = None
        self.doc_query = EnhancedDocQuery(base_path)
        
    def execute_task(self, task_id: str, generate_only: bool = False) -> bool:
        """
        Execute a task by ID.
        
        Args:
            task_id: Task ID to execute
            generate_only: If True, only generate prompt without executing
            
        Returns:
            True if successful, False otherwise
        """
        print(f"=" * 70)
        print(f"Task Executor: {task_id}")
        print(f"=" * 70)
        print()
        
        # Load task using EnhancedDocQuery
        if not self._load_task(task_id):
            return False
        
        # Generate orchestrator prompt
        prompt_path = self._generate_orchestrator_prompt(task_id)
        if not prompt_path:
            return False
        
        print(f"\n✓ Orchestrator prompt generated: {prompt_path}")
        
        if generate_only:
            print("\n(Generate-only mode - prompt created but not executed)")
            print(f"\nTo execute this task manually, review the prompt at:")
            print(f"  {prompt_path}")
            print(f"\nAfter completing the task, run:")
            print(f"  python3 tools/task_cleanup.py --task-id {task_id}")
            return True
        
        # In this environment, we cannot spawn agents automatically
        # So we generate the prompt and provide instructions
        print("\n" + "=" * 70)
        print("EXECUTION INSTRUCTIONS")
        print("=" * 70)
        print(f"\nThe orchestrator prompt has been generated at:")
        print(f"  {prompt_path}")
        print(f"\nTo execute this task:")
        print(f"1. Review the orchestrator prompt")
        print(f"2. Follow the execution steps outlined in the prompt")
        print(f"3. Use the doc_query tool to gather context as needed")
        print(f"4. Complete all task requirements")
        print(f"5. Run task cleanup:")
        print(f"   python3 tools/task_cleanup.py --task-id {task_id}")
        print()
        
        return True
    
    def execute_next_task(self, generate_only: bool = False) -> bool:
        """Execute the next task in master_todo.yaml."""
        print(f"=" * 70)
        print(f"Task Executor: Next Task")
        print(f"=" * 70)
        print()
        
        # Find next task using EnhancedDocQuery
        next_task_id = self._find_next_task()
        if not next_task_id:
            print("❌ No tasks found in master_todo.yaml")
            return False
        
        print(f"Found next task: {next_task_id}")
        print()
        
        return self.execute_task(next_task_id, generate_only)
    
    def _load_task(self, task_id: str) -> bool:
        """Load task data using EnhancedDocQuery."""
        print(f"Loading task {task_id}...")
        
        # Use task query mode
        result = self.doc_query.query_task(task_id)
        
        if not result.get('task_found'):
            print(f"❌ Task {task_id} not found in master_todo.yaml or tasks_completed.yaml")
            return False
        
        # Check if task is already completed
        if result.get('completed_task') and not result.get('current_task'):
            print(f"⚠ Task {task_id} is already completed")
            print(f"  Found in: {result['completed_task']['file']}")
            return False
        
        # Store task data
        self.task_data = result['current_task']
        print(f"✓ Task loaded from {self.task_data['file']}")
        
        return True
    
    def _find_next_task(self) -> Optional[str]:
        """Find the next task in master_todo.yaml using EnhancedDocQuery."""
        # Query for all current tasks
        result = self.doc_query.query_path("current[*].task")
        
        if not result.get('matches'):
            return None
        
        # Get the first task from master_todo.yaml
        for match in result['matches']:
            if match['file'] == 'master_todo.yaml' and match.get('results'):
                first_task = match['results'][0]
                task_data = first_task.get('value', {})
                return str(task_data.get('id'))
        
        return None
    
    def _generate_orchestrator_prompt(self, task_id: str) -> Optional[Path]:
        """Generate orchestrator prompt for the task."""
        print(f"Generating orchestrator prompt...")
        
        # Load prompt template
        template_path = self.base_path / "prompts" / "templates" / "dev" / "orchestrator_prompt.md"
        if not template_path.exists():
            print(f"❌ Template not found: {template_path}")
            return None
        
        with open(template_path, 'r') as f:
            template = f.read()
        
        # Load prompt_guidance
        guidance_path = self.base_path / "prompts" / "prompt_guidance.md"
        if guidance_path.exists():
            with open(guidance_path, 'r') as f:
                self.prompt_guidance = f.read()
        else:
            self.prompt_guidance = "(prompt_guidance.md not found)"
        
        # Get task details
        task = self.task_data['task']
        task_name = task.get('name', 'Unknown Task')
        task_goal = task.get('goal', 'No goal specified')
        task_prompt_file = task.get('prompt', '')
        task_files = task.get('files', [])
        
        # Load task-specific prompt if it exists
        task_prompt_content = ""
        if task_prompt_file:
            task_prompt_path = self.base_path / task_prompt_file
            if task_prompt_path.exists():
                with open(task_prompt_path, 'r') as f:
                    task_prompt_content = f.read()
        
        # Generate context gathering commands using new predicate syntax
        context_commands = self._generate_context_commands(task_id, task_files)
        
        # Fill in template variables
        prompt = template.replace("{task_id}", str(task_id))
        prompt = prompt.replace("{task_name}", task_name)
        prompt = prompt.replace("{task_goal}", task_goal)
        prompt = prompt.replace("{task_details}", task_prompt_content)
        prompt = prompt.replace("{context_commands}", context_commands)
        prompt = prompt.replace("{prompt_guidance}", self.prompt_guidance)
        prompt = prompt.replace("{timestamp}", datetime.now().isoformat())
        
        # Save orchestrator prompt
        output_path = self.base_path / "prompts" / "generated" / f"orchestrator_{task_id}.md"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            f.write(prompt)
        
        return output_path
    
    def _generate_context_commands(self, task_id: str, related_files: List[str]) -> str:
        """Generate context gathering commands using new doc_query syntax."""
        commands = []
        
        # Command to get the task itself
        commands.append(f"# Get complete task information")
        commands.append(f"python3 tools/doc_query.py --query &quot;{task_id}&quot; --mode task --pretty")
        commands.append("")
        
        # Commands for related files
        if related_files:
            commands.append(f"# Get related specification files")
            for file in related_files:
                commands.append(f"python3 tools/doc_query.py --query &quot;{file}&quot; --mode file --pretty")
            commands.append("")
        
        # Example predicate queries
        commands.append(f"# Example: Find tasks by name pattern")
        commands.append(f"python3 tools/doc_query.py --query &quot;current[*].task.{{name~pattern}}&quot; --mode path --pretty")
        commands.append("")
        
        commands.append(f"# Example: Find tasks with specific status")
        commands.append(f"python3 tools/doc_query.py --query &quot;current[*].task.{{status=active}}&quot; --mode path --pretty")
        commands.append("")
        
        commands.append(f"# Example: Complex predicate query")
        commands.append(f"python3 tools/doc_query.py --query &quot;current[*].task.{{name~Frontend AND priority>3}}&quot; --mode path --pretty")
        commands.append("")
        
        # Text search for keywords
        commands.append(f"# Search for specific keywords")
        commands.append(f"python3 tools/doc_query.py --query &quot;keyword*&quot; --mode text --pretty")
        commands.append("")
        
        return "\n".join(commands)


def main():
    parser = argparse.ArgumentParser(
        description="Task Executor Tool with EnhancedDocQuery Integration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Execute specific task
  python3 tools/task_executor.py --task-id 0.2
  
  # Execute next task
  python3 tools/task_executor.py --next
  
  # Generate prompt only (don't execute)
  python3 tools/task_executor.py --task-id 0.2 --generate-only
        """
    )
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--task-id', '-t', help='Task ID to execute')
    group.add_argument('--next', '-n', action='store_true', help='Execute next task')
    
    parser.add_argument('--generate-only', '-g', action='store_true',
                       help='Generate prompt only, do not execute')
    parser.add_argument('--base-path', '-b', default='.',
                       help='Base path for the project (default: current directory)')
    
    args = parser.parse_args()
    
    # Initialize executor
    executor = TaskExecutor(args.base_path)
    
    # Execute task
    if args.task_id:
        success = executor.execute_task(args.task_id, args.generate_only)
    else:
        success = executor.execute_next_task(args.generate_only)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()