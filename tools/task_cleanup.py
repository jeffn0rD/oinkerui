#!/usr/bin/env python3
"""
Task Cleanup Tool for oinkerui Project

This tool automates task finalization according to prompt_guidance in master_todo.yaml:
1. Verifies task moved from master_todo.yaml to log/tasks_completed.yaml
2. Verifies task notes and summary files exist in ./log
3. Runs all tests and verifications
4. Generates repair prompts if errors found
5. Loops until no errors (with iteration cap)
6. Commits and pushes repository

Usage:
    python3 tools/task_cleanup.py --task-id TASK_ID [--dry-run] [--max-iterations N]
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import yaml


class TaskCleanup:
    """Automates task cleanup and finalization."""
    
    def __init__(self, task_id: str, base_path: str = ".", max_iterations: int = 3):
        """Initialize task cleanup."""
        self.task_id = task_id
        self.base_path = Path(base_path)
        self.max_iterations = max_iterations
        self.issues = []
        self.warnings = []
        
    def run_cleanup(self, dry_run: bool = False) -> bool:
        """
        Run complete cleanup process.
        
        Returns:
            True if cleanup successful, False otherwise
        """
        print(f"=" * 70)
        print(f"Task Cleanup: {self.task_id}")
        print(f"=" * 70)
        print()
        
        iteration = 0
        while iteration < self.max_iterations:
            iteration += 1
            print(f"Iteration {iteration}/{self.max_iterations}")
            print("-" * 70)
            
            self.issues = []
            self.warnings = []
            
            # Run all checks
            self._check_task_moved()
            self._check_log_files()
            self._run_validations()
            self._run_tests()
            
            # Report results
            self._print_results()
            
            if not self.issues:
                print("\n✅ All checks passed!")
                
                if not dry_run:
                    # Commit and push
                    success = self._commit_and_push()
                    if success:
                        print("\n✅ Repository committed and pushed successfully!")
                        return True
                    else:
                        print("\n❌ Failed to commit and push repository")
                        return False
                else:
                    print("\n(Dry run - skipping commit and push)")
                    return True
            
            # Generate repair prompt
            if iteration < self.max_iterations:
                print(f"\n⚠️  Issues found. Generating repair prompt...")
                self._generate_repair_prompt()
                
                if not dry_run:
                    print("\n❌ Automatic repair not implemented yet.")
                    print("Please review the generated repair prompt and fix issues manually.")
                    print(f"Repair prompt: prompts/repair_task_{self.task_id}.md")
                    return False
                else:
                    print("(Dry run - would generate repair prompt)")
                    return False
        
        print(f"\n❌ Max iterations ({self.max_iterations}) reached. Manual intervention required.")
        return False
    
    def _check_task_moved(self):
        """Check if task was moved from master_todo.yaml to tasks_completed.yaml."""
        print("\n1. Checking task movement...")
        
        # Check master_todo.yaml
        master_todo_path = self.base_path / "master_todo.yaml"
        if not master_todo_path.exists():
            self.issues.append({
                "type": "file_missing",
                "file": "master_todo.yaml",
                "message": "master_todo.yaml not found",
                "severity": "error"
            })
            return
        
        try:
            with open(master_todo_path, 'r') as f:
                # Read as text to avoid YAML parsing errors
                content = f.read()
                if f"id: {self.task_id}" in content:
                    self.issues.append({
                        "type": "task_not_moved",
                        "file": "master_todo.yaml",
                        "message": f"Task {self.task_id} still in master_todo.yaml",
                        "severity": "error",
                        "action": f"Remove task {self.task_id} from master_todo.yaml"
                    })
                else:
                    print(f"   ✓ Task {self.task_id} not in master_todo.yaml")
        except Exception as e:
            self.issues.append({
                "type": "read_error",
                "file": "master_todo.yaml",
                "message": f"Error reading master_todo.yaml: {str(e)}",
                "severity": "error"
            })
        
        # Check tasks_completed.yaml
        completed_path = self.base_path / "log" / "tasks_completed.yaml"
        if not completed_path.exists():
            self.issues.append({
                "type": "file_missing",
                "file": "log/tasks_completed.yaml",
                "message": "tasks_completed.yaml not found",
                "severity": "error"
            })
            return
        
        try:
            with open(completed_path, 'r') as f:
                content = f.read()
                if f"id: {self.task_id}" in content:
                    print(f"   ✓ Task {self.task_id} in tasks_completed.yaml")
                else:
                    self.issues.append({
                        "type": "task_not_completed",
                        "file": "log/tasks_completed.yaml",
                        "message": f"Task {self.task_id} not in tasks_completed.yaml",
                        "severity": "error",
                        "action": f"Add task {self.task_id} to tasks_completed.yaml"
                    })
        except Exception as e:
            self.issues.append({
                "type": "read_error",
                "file": "log/tasks_completed.yaml",
                "message": f"Error reading tasks_completed.yaml: {str(e)}",
                "severity": "error"
            })
    
    def _check_log_files(self):
        """Check if required log files exist."""
        print("\n2. Checking log files...")
        
        log_dir = self.base_path / "log"
        if not log_dir.exists():
            self.issues.append({
                "type": "directory_missing",
                "file": "log/",
                "message": "log/ directory not found",
                "severity": "error"
            })
            return
        
        # Check for task summary
        summary_file = log_dir / f"task_{self.task_id}_summary.yaml"
        if summary_file.exists():
            print(f"   ✓ Task summary exists: {summary_file.name}")
        else:
            self.issues.append({
                "type": "file_missing",
                "file": str(summary_file),
                "message": f"Task summary file missing: {summary_file.name}",
                "severity": "error",
                "action": f"Create log/task_{self.task_id}_summary.yaml with task completion details"
            })
        
        # Check for task notes (optional but recommended)
        notes_file = log_dir / f"task_{self.task_id}_notes.yaml"
        if notes_file.exists():
            print(f"   ✓ Task notes exist: {notes_file.name}")
        else:
            self.warnings.append({
                "type": "file_missing",
                "file": str(notes_file),
                "message": f"Task notes file missing: {notes_file.name} (optional)",
                "severity": "warning"
            })
    
    def _run_validations(self):
        """Run YAML validation."""
        print("\n3. Running YAML validation...")
        
        validator_path = self.base_path / "verify" / "validate_yaml.py"
        if not validator_path.exists():
            self.warnings.append({
                "type": "validator_missing",
                "message": "YAML validator not found, skipping validation",
                "severity": "warning"
            })
            return
        
        try:
            result = subprocess.run(
                ["python3", str(validator_path), "--all", "--json"],
                capture_output=True,
                text=True,
                cwd=str(self.base_path)
            )
            
            if result.returncode == 0:
                print("   ✓ All YAML files valid")
            else:
                # Parse JSON output
                try:
                    validation_results = json.loads(result.stdout)
                    if validation_results.get("errors"):
                        for error in validation_results["errors"]:
                            self.issues.append({
                                "type": "yaml_validation_error",
                                "file": error.get("file", "unknown"),
                                "message": error.get("message", "Unknown error"),
                                "severity": "error",
                                "details": error
                            })
                except json.JSONDecodeError:
                    self.issues.append({
                        "type": "validation_error",
                        "message": "YAML validation failed",
                        "severity": "error",
                        "output": result.stdout
                    })
        except Exception as e:
            self.warnings.append({
                "type": "validation_error",
                "message": f"Error running validation: {str(e)}",
                "severity": "warning"
            })
    
    def _run_tests(self):
        """Run task-specific tests if they exist."""
        print("\n4. Running tests...")
        
        verify_dir = self.base_path / "verify"
        if not verify_dir.exists():
            print("   ⚠ No verify/ directory found")
            return
        
        # Look for task-specific test files
        test_files = list(verify_dir.glob(f"test_*{self.task_id}*.py"))
        test_files.extend(verify_dir.glob(f"task_{self.task_id}_*.py"))
        
        if not test_files:
            print(f"   ℹ No task-specific tests found for {self.task_id}")
            return
        
        for test_file in test_files:
            print(f"   Running {test_file.name}...")
            try:
                result = subprocess.run(
                    ["python3", str(test_file)],
                    capture_output=True,
                    text=True,
                    cwd=str(self.base_path)
                )
                
                if result.returncode == 0:
                    print(f"   ✓ {test_file.name} passed")
                else:
                    self.issues.append({
                        "type": "test_failure",
                        "file": str(test_file),
                        "message": f"Test failed: {test_file.name}",
                        "severity": "error",
                        "output": result.stdout + result.stderr
                    })
            except Exception as e:
                self.warnings.append({
                    "type": "test_error",
                    "file": str(test_file),
                    "message": f"Error running test: {str(e)}",
                    "severity": "warning"
                })
    
    def _print_results(self):
        """Print check results."""
        print("\n" + "=" * 70)
        print("Results")
        print("=" * 70)
        
        if self.issues:
            print(f"\n❌ {len(self.issues)} issue(s) found:\n")
            for i, issue in enumerate(self.issues, 1):
                print(f"{i}. [{issue['severity'].upper()}] {issue['message']}")
                if 'file' in issue:
                    print(f"   File: {issue['file']}")
                if 'action' in issue:
                    print(f"   Action: {issue['action']}")
                print()
        
        if self.warnings:
            print(f"\n⚠️  {len(self.warnings)} warning(s):\n")
            for i, warning in enumerate(self.warnings, 1):
                print(f"{i}. {warning['message']}")
                if 'file' in warning:
                    print(f"   File: {warning['file']}")
                print()
        
        if not self.issues and not self.warnings:
            print("\n✅ No issues found!")
    
    def _generate_repair_prompt(self):
        """Generate repair prompt from template."""
        template_path = self.base_path / "prompts" / "templates" / "dev" / "repair_prompt.md"
        
        if not template_path.exists():
            print(f"⚠️  Repair prompt template not found: {template_path}")
            return
        
        try:
            with open(template_path, 'r') as f:
                template = f.read()
            
            # Build issues list
            issues_list = []
            for i, issue in enumerate(self.issues, 1):
                issues_list.append(f"{i}. **{issue['severity'].upper()}**: {issue['message']}")
                if 'file' in issue:
                    issues_list.append(f"   - File: `{issue['file']}`")
                if 'action' in issue:
                    issues_list.append(f"   - Action: {issue['action']}")
                issues_list.append("")
            
            # Build required actions
            required_actions = []
            for issue in self.issues:
                if 'action' in issue:
                    required_actions.append(f"- {issue['action']}")
            
            # Build files to modify
            files_to_modify = set()
            for issue in self.issues:
                if 'file' in issue:
                    files_to_modify.add(issue['file'])
            
            # Fill template
            prompt = template.format(
                task_id=self.task_id,
                task_name=f"Task {self.task_id}",
                status="needs_repair",
                issues_list="\n".join(issues_list),
                required_actions="\n".join(required_actions) if required_actions else "See issues list above",
                test_commands="python3 verify/validate_yaml.py --all",
                required_files=f"- log/task_{self.task_id}_summary.yaml\n- Entry in log/tasks_completed.yaml",
                context=f"Task {self.task_id} cleanup found {len(self.issues)} issue(s) that need to be resolved.",
                files_to_modify="\n".join(f"- {f}" for f in sorted(files_to_modify))
            )
            
            # Save prompt
            output_path = self.base_path / "prompts" / f"repair_task_{self.task_id}.md"
            with open(output_path, 'w') as f:
                f.write(prompt)
            
            print(f"✓ Repair prompt generated: {output_path}")
            
        except Exception as e:
            print(f"❌ Error generating repair prompt: {str(e)}")
    
    def _commit_and_push(self) -> bool:
        """Commit and push repository."""
        print("\n5. Committing and pushing repository...")
        
        try:
            # Check if there are changes to commit
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                cwd=str(self.base_path)
            )
            
            if not result.stdout.strip():
                print("   ℹ No changes to commit")
                return True
            
            # Add all changes
            subprocess.run(
                ["git", "add", "-A"],
                check=True,
                cwd=str(self.base_path)
            )
            
            # Commit
            commit_message = f"Complete task {self.task_id}\n\nTask cleanup verified and passed all checks."
            subprocess.run(
                ["git", "commit", "-m", commit_message],
                check=True,
                cwd=str(self.base_path)
            )
            
            # Push
            subprocess.run(
                ["git", "push", "https://x-access-token:${GITHUB_TOKEN}@github.com/jeffn0rD/oinkerui.git", "main"],
                check=True,
                cwd=str(self.base_path),
                shell=True
            )
            
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"   ❌ Git operation failed: {str(e)}")
            return False
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Automate task cleanup and finalization"
    )
    parser.add_argument(
        "--task-id", "-t",
        required=True,
        help="Task ID to clean up (e.g., 0.1, 0.2)"
    )
    parser.add_argument(
        "--dry-run", "-d",
        action="store_true",
        help="Run checks without committing/pushing"
    )
    parser.add_argument(
        "--max-iterations", "-m",
        type=int,
        default=3,
        help="Maximum repair iterations (default: 3)"
    )
    
    args = parser.parse_args()
    
    cleanup = TaskCleanup(args.task_id, ".", args.max_iterations)
    success = cleanup.run_cleanup(args.dry_run)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()