#!/usr/bin/env python3
"""
Task Executor Tool for oinkerui Project

This tool automates task execution:
1. Reads task from master_todo.yaml
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


class TaskExecutor:
    """Automates task execution and coordination."""
    
    def __init__(self, base_path: str = "."):
        """Initialize task executor."""
        self.base_path = Path(base_path)
        self.task_data = None
        self.prompt_guidance = None
        
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
        
        # Load task from master_todo.yaml
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
        
        # Find next task
        next_task_id = self._find_next_task()
        if not next_task_id:
            print("❌ No tasks found in master_todo.yaml")
            return False
        
        print(f"Next task: {next_task_id}")
        print()
        
        return self.execute_task(next_task_id, generate_only)
    
    def _load_task(self, task_id: str) -> bool:
        """Load task data from master_todo.yaml."""
        master_todo_path = self.base_path / "master_todo.yaml"
        
        if not master_todo_path.exists():
            print(f"❌ master_todo.yaml not found")
            return False
        
        try:
            # Read as text first to extract prompt_guidance
            with open(master_todo_path, 'r') as f:
                content = f.read()
            
            # Extract prompt_guidance using regex
            guidance_match = re.search(
                r'prompt_guidance:\s*\|\s*\n((?:  .*\n)*)',
                content,
                re.MULTILINE
            )
            if guidance_match:
                # Remove leading spaces from each line
                guidance_lines = guidance_match.group(1).split('\n')
                self.prompt_guidance = '\n'.join(
                    line[2:] if line.startswith('  ') else line
                    for line in guidance_lines
                ).strip()
            
            # Try to parse YAML (may fail due to existing errors)
            try:
                data = yaml.safe_load(content)
                
                # Find task in current tasks
                if 'current' in data and isinstance(data['current'], list):
                    for item in data['current']:
                        if isinstance(item, dict) and 'task' in item:
                            task = item['task']
                            # Handle both list and dict formats
                            if isinstance(task, list) and len(task) > 0:
                                task = task[0]
                            
                            if isinstance(task, dict):
                                task_id_field = task.get('id') or (task[0].get('id') if isinstance(task, list) else None)
                                if str(task_id_field) == str(task_id):
                                    self.task_data = task
                                    return True
            except yaml.YAMLError:
                # If YAML parsing fails, try to extract task info from text
                print("⚠️  YAML parsing failed, extracting task info from text...")
                task_pattern = rf'- id:\s*{re.escape(task_id)}\s*\n\s*name:\s*"([^"]+)"\s*\n\s*goal:\s*"([^"]+)"'
                match = re.search(task_pattern, content)
                if match:
                    self.task_data = {
                        'id': task_id,
                        'name': match.group(1),
                        'goal': match.group(2)
                    }
                    return True
            
            print(f"❌ Task {task_id} not found in master_todo.yaml")
            return False
            
        except Exception as e:
            print(f"❌ Error loading task: {str(e)}")
            return False
    
    def _find_next_task(self) -> Optional[str]:
        """Find the next task ID in master_todo.yaml."""
        master_todo_path = self.base_path / "master_todo.yaml"
        
        try:
            with open(master_todo_path, 'r') as f:
                content = f.read()
            
            # Find first task ID in current section
            match = re.search(r'current:.*?- id:\s*(\S+)', content, re.DOTALL)
            if match:
                return match.group(1)
            
            return None
            
        except Exception as e:
            print(f"❌ Error finding next task: {str(e)}")
            return None
    
    def _generate_orchestrator_prompt(self, task_id: str) -> Optional[Path]:
        """Generate orchestrator prompt from template."""
        template_path = self.base_path / "prompts" / "templates" / "dev" / "orchestrator_prompt.md"
        
        if not template_path.exists():
            print(f"❌ Orchestrator template not found: {template_path}")
            return None
        
        try:
            with open(template_path, 'r') as f:
                template = f.read()
            
            # Extract task details
            task_name = self.task_data.get('name', f'Task {task_id}')
            task_goal = self.task_data.get('goal', 'No goal specified')
            
            # Build task details
            task_details = []
            if 'files' in self.task_data:
                task_details.append("**Files:**")
                for f in self.task_data['files']:
                    task_details.append(f"- {f}")
                task_details.append("")
            
            if 'details' in self.task_data:
                details = self.task_data['details']
                if isinstance(details, dict):
                    if 'focus' in details:
                        task_details.append("**Focus Areas:**")
                        for item in details['focus']:
                            task_details.append(f"- {item}")
                        task_details.append("")
                    
                    if 'notes' in details:
                        task_details.append("**Notes:**")
                        for note in details['notes']:
                            task_details.append(f"- {note}")
                        task_details.append("")
                    
                    if 'steps' in details:
                        task_details.append("**Steps:**")
                        for i, step in enumerate(details['steps'], 1):
                            task_details.append(f"{i}. {step}")
                        task_details.append("")
            
            # Check for prompt file reference
            prompt_file = self.task_data.get('prompt', '')
            if prompt_file:
                task_details.append(f"**Prompt File:** {prompt_file}")
                task_details.append("")
                task_details.append("Review the detailed prompt file for specific instructions.")
            
            # Build execution steps
            execution_steps = []
            if 'details' in self.task_data and 'steps' in self.task_data['details']:
                for i, step in enumerate(self.task_data['details']['steps'], 1):
                    execution_steps.append(f"{i}. {step}")
            else:
                execution_steps.append("1. Review task goal and requirements")
                execution_steps.append("2. Gather context using doc_query tool")
                execution_steps.append("3. Execute task steps")
                execution_steps.append("4. Verify completion")
                execution_steps.append("5. Document work in task summary")
            
            # Build expected outputs
            expected_outputs = []
            expected_outputs.append(f"- Task {task_id} completed successfully")
            expected_outputs.append(f"- All deliverables created")
            expected_outputs.append(f"- Task summary in log/task_{task_id}_summary.yaml")
            expected_outputs.append(f"- Task moved to log/tasks_completed.yaml")
            
            # Build verification steps
            verification_steps = []
            verification_steps.append("1. Run YAML validation:")
            verification_steps.append("   ```bash")
            verification_steps.append("   python3 verify/validate_yaml.py --all")
            verification_steps.append("   ```")
            verification_steps.append("")
            verification_steps.append("2. Run task cleanup:")
            verification_steps.append("   ```bash")
            verification_steps.append(f"   python3 tools/task_cleanup.py --task-id {task_id}")
            verification_steps.append("   ```")
            
            # Build files referenced
            files_referenced = []
            if 'files' in self.task_data:
                for f in self.task_data['files']:
                    files_referenced.append(f"- {f}")
            
            # Get previous task ID for context
            previous_task_id = self._get_previous_task_id(task_id)
            
            # Determine related specs
            related_specs = "spec"
            if 'files' in self.task_data:
                spec_files = [f for f in self.task_data['files'] if 'spec/' in f]
                if spec_files:
                    related_specs = " ".join(spec_files)
            
            # Fill template
            prompt = template.format(
                task_id=task_id,
                task_name=task_name,
                task_goal=task_goal,
                task_details="\n".join(task_details),
                previous_task_id=previous_task_id,
                related_specs=related_specs,
                topic=task_name.lower().replace(" ", "_"),
                execution_steps="\n".join(execution_steps),
                expected_outputs="\n".join(expected_outputs),
                verification_steps="\n".join(verification_steps),
                files_referenced="\n".join(files_referenced) if files_referenced else "See task details above"
            )
            
            # Add prompt guidance at the beginning
            if self.prompt_guidance:
                full_prompt = f"# Task {task_id}: {task_name}\n\n"
                full_prompt += f"## Prompt Guidance\n\n{self.prompt_guidance}\n\n"
                full_prompt += "---\n\n"
                full_prompt += prompt
            else:
                full_prompt = prompt
            
            # Save prompt
            output_path = self.base_path / "prompts" / f"task_{task_id}_orchestrator.md"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w') as f:
                f.write(full_prompt)
            
            return output_path
            
        except Exception as e:
            print(f"❌ Error generating orchestrator prompt: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def _get_previous_task_id(self, task_id: str) -> str:
        """Get the previous task ID."""
        try:
            # Parse task ID (e.g., "0.1" -> 0, 1)
            parts = task_id.split('.')
            if len(parts) == 2:
                major, minor = int(parts[0]), int(parts[1])
                if minor > 0:
                    return f"{major}.{minor - 1}"
                elif major > 0:
                    return f"{major - 1}.0"
            return "0.0"
        except:
            return "0.0"


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Execute tasks from master_todo.yaml"
    )
    parser.add_argument(
        "--task-id", "-t",
        help="Task ID to execute (e.g., 0.2, 0.3)"
    )
    parser.add_argument(
        "--next", "-n",
        action="store_true",
        help="Execute the next task in the list"
    )
    parser.add_argument(
        "--generate-only", "-g",
        action="store_true",
        help="Only generate prompt without executing"
    )
    
    args = parser.parse_args()
    
    if not args.task_id and not args.next:
        parser.error("Either --task-id or --next must be specified")
    
    executor = TaskExecutor(".")
    
    if args.next:
        success = executor.execute_next_task(args.generate_only)
    else:
        success = executor.execute_task(args.task_id, args.generate_only)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()