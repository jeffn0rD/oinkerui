#!/usr/bin/env python3
"""
Prompt Generator Tool for oinkerui Project

This tool generates detailed LLM prompts for tasks based on:
- Task definition from master_todo.yaml
- Module specifications from spec/modules/
- Function specifications from spec/functions/
- Code generator tool references

The generated prompts include:
- Context gathering commands (doc_query)
- Code generator commands
- Detailed requirements from specs
- Verification steps

Usage:
    python3 tools/prompt_generator.py --task 1.0.0
    python3 tools/prompt_generator.py --all-phase 1
"""

import argparse
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import yaml

sys.path.insert(0, str(Path(__file__).parent))

from yaml_db import YAMLDatabase
from task_manager import TaskManager


class PromptGenerator:
    """Generate detailed LLM prompts for tasks."""
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.task_manager = TaskManager(project_root)
        self.prompts_dir = self.project_root / "prompts" / "dev"
        self.prompts_dir.mkdir(parents=True, exist_ok=True)
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task from master_todo.yaml."""
        # Check current
        task = self.task_manager.get_task_from_master(task_id)
        if task:
            return task.get('task', {})
        return None
    
    def load_module_spec(self, module_id: str) -> Optional[Dict[str, Any]]:
        """Load module specification."""
        spec_path = self.project_root / "spec" / "modules" / f"{module_id}.yaml"
        if spec_path.exists():
            db = YAMLDatabase(spec_path, create_backup=False)
            return db.load()
        return None
    
    def load_function_spec(self, func_path: str) -> Optional[Dict[str, Any]]:
        """Load function specification from path like 'backend_node/create_project.yaml'."""
        spec_path = self.project_root / "spec" / "functions" / func_path
        if spec_path.exists():
            db = YAMLDatabase(spec_path, create_backup=False)
            return db.load()
        return None
    
    def generate_prompt(self, task_id: str) -> Optional[str]:
        """Generate a detailed prompt for a task."""
        task = self.get_task(task_id)
        if not task:
            print(f"Error: Task {task_id} not found")
            return None
        
        task_name = task.get('name', 'Unknown Task')
        task_goal = task.get('goal', '')
        details = task.get('details', {})
        focus_areas = details.get('focus', [])
        functions = details.get('functions', [])
        verification = details.get('verification', [])
        
        # Determine modules involved
        modules = set()
        for func_path in functions:
            module_id = func_path.split('/')[0]
            modules.add(module_id)
        
        # Build prompt
        lines = []
        
        # Header
        lines.append(f"# Prompt {task_id}: {task_name}")
        lines.append("")
        lines.append("## Task Description")
        lines.append(task_goal)
        lines.append("")
        
        # Context Gathering
        lines.append("## Context Gathering")
        lines.append("Before starting, gather context using the doc_query tool:")
        lines.append("")
        lines.append("```bash")
        
        # Module specs
        for module_id in modules:
            lines.append(f"# Get {module_id} module specification")
            lines.append(f'python3 tools/doc_query.py --query "spec/modules/{module_id}.yaml" --mode file --pretty')
            lines.append("")
        
        # Function specs
        for func_path in functions:
            func_name = func_path.split('/')[-1].replace('.yaml', '')
            lines.append(f"# Get {func_name} function specification")
            lines.append(f'python3 tools/doc_query.py --query "spec/functions/{func_path}" --mode file --pretty')
            lines.append("")
        
        # Related specs
        lines.append("# Get domain entities")
        lines.append('python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty')
        lines.append("")
        lines.append("# Get API specifications")
        lines.append('python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty')
        lines.append("```")
        lines.append("")
        
        # Code Generation
        lines.append("## Code Generation")
        lines.append("Use the code generator to create scaffolding:")
        lines.append("")
        lines.append("```bash")
        for module_id in modules:
            lines.append(f"# Generate {module_id} module scaffolding")
            lines.append(f"python3 tools/code_generator.py --module {module_id} --preview")
            lines.append("")
        lines.append("# Or generate to files:")
        for module_id in modules:
            if module_id in ['backend_node', 'git_integration', 'logging_and_metrics']:
                lines.append(f"python3 tools/code_generator.py --module {module_id} --output backend/src")
            elif module_id == 'backend_python_tools':
                lines.append(f"python3 tools/code_generator.py --module {module_id} --output backend_python/src")
            elif module_id == 'frontend_svelte':
                lines.append(f"python3 tools/code_generator.py --module {module_id} --output frontend/src/lib")
        lines.append("```")
        lines.append("")
        
        # Requirements
        lines.append("## Requirements")
        lines.append("")
        
        # Focus areas
        if focus_areas:
            lines.append("### Focus Areas")
            for area in focus_areas:
                lines.append(f"- {area}")
            lines.append("")
        
        # Function details
        if functions:
            lines.append("### Functions to Implement")
            lines.append("")
            for func_path in functions:
                func_spec = self.load_function_spec(func_path)
                if func_spec:
                    func = func_spec.get('function', {})
                    func_name = func.get('name', 'unknown')
                    func_purpose = func.get('purpose', '').strip().split('\n')[0]
                    
                    lines.append(f"#### {func_name}")
                    lines.append(f"- **Purpose**: {func_purpose}")
                    
                    # Signature
                    sig = func.get('signature', {})
                    params = sig.get('parameters', [])
                    if params:
                        param_strs = []
                        for p in params:
                            p_name = p.get('name', 'arg')
                            p_type = p.get('type', 'any')
                            param_strs.append(f"{p_name}: {p_type}")
                        lines.append(f"- **Signature**: `{func_name}({', '.join(param_strs)})`")
                    
                    returns = sig.get('returns', {})
                    if returns:
                        lines.append(f"- **Returns**: `{returns.get('type', 'void')}` - {returns.get('description', '')}")
                    
                    # Contract
                    contract = func.get('contract', {})
                    preconditions = contract.get('preconditions', [])
                    if preconditions:
                        lines.append("- **Preconditions**:")
                        for pre in preconditions[:3]:  # Limit to first 3
                            lines.append(f"  - {pre}")
                    
                    postconditions = contract.get('postconditions', [])
                    if postconditions:
                        lines.append("- **Postconditions**:")
                        for post in postconditions[:3]:  # Limit to first 3
                            lines.append(f"  - {post}")
                    
                    lines.append(f"- **Spec**: `spec/functions/{func_path}`")
                    lines.append("")
        
        # Module dependencies
        if modules:
            lines.append("### Module Dependencies")
            for module_id in modules:
                module_spec = self.load_module_spec(module_id)
                if module_spec:
                    module = module_spec.get('module', {})
                    deps = module.get('dependencies', {})
                    external = deps.get('external', [])
                    if external:
                        lines.append(f"\n**{module_id}** external dependencies:")
                        for dep in external[:10]:  # Limit
                            if isinstance(dep, dict):
                                name = dep.get('name', dep.get('package', ''))
                                version = dep.get('version', '')
                                lines.append(f"- `{name}` {version}")
                            else:
                                lines.append(f"- `{dep}`")
            lines.append("")
        
        # Implementation Steps
        lines.append("## Implementation Steps")
        lines.append("")
        lines.append("1. **Generate Code Scaffolding**")
        lines.append("   - Run the code generator to create function signatures")
        lines.append("   - Review generated code structure and comments")
        lines.append("")
        lines.append("2. **Implement Functions**")
        lines.append("   - Follow the algorithm steps in each function spec")
        lines.append("   - Implement precondition validation first")
        lines.append("   - Handle all error cases from the spec")
        lines.append("   - Ensure postconditions are satisfied")
        lines.append("")
        lines.append("3. **Add Tests**")
        lines.append("   - Create unit tests for each function")
        lines.append("   - Test error cases and edge conditions")
        lines.append("   - Verify contract compliance")
        lines.append("")
        lines.append("4. **Integration**")
        lines.append("   - Wire up API routes if applicable")
        lines.append("   - Test end-to-end flow")
        lines.append("")
        
        # Verification
        lines.append("## Verification")
        lines.append("")
        if verification:
            for v in verification:
                lines.append(f"- [ ] {v}")
        else:
            lines.append("- [ ] All functions implemented according to spec")
            lines.append("- [ ] Unit tests pass")
            lines.append("- [ ] Integration tests pass")
            lines.append("- [ ] Code follows project style guidelines")
        lines.append("")
        
        # Completion
        lines.append("## Completion Checklist")
        lines.append("")
        lines.append("- [ ] All focus areas addressed")
        lines.append("- [ ] All functions implemented")
        lines.append("- [ ] Tests written and passing")
        lines.append("- [ ] Code reviewed against spec")
        lines.append("- [ ] Documentation updated if needed")
        lines.append("")
        lines.append("## Task Cleanup")
        lines.append("")
        lines.append("After completing the task:")
        lines.append("```bash")
        lines.append(f"python3 tools/task_cleanup.py --task-id {task_id}")
        lines.append("```")
        lines.append("")
        lines.append("---")
        lines.append(f"*Generated: {datetime.now().isoformat()}*")
        lines.append(f"*Spec Reference: python3 tools/doc_query.py --query &quot;{task_id}&quot; --mode task --pretty*")
        
        return '\n'.join(lines)
    
    def save_prompt(self, task_id: str, content: str) -> Path:
        """Save prompt to file."""
        # Convert task_id to filename (e.g., 1.0.0 -> prompt_1_0_0.md)
        filename = f"prompt_{task_id.replace('.', '_')}.md"
        filepath = self.prompts_dir / filename
        
        with open(filepath, 'w') as f:
            f.write(content)
        
        return filepath
    
    def generate_and_save(self, task_id: str) -> Optional[Path]:
        """Generate and save a prompt for a task."""
        content = self.generate_prompt(task_id)
        if content:
            filepath = self.save_prompt(task_id, content)
            print(f"✓ Generated prompt: {filepath}")
            return filepath
        return None
    
    def generate_phase_prompts(self, phase: int) -> List[Path]:
        """Generate prompts for all tasks in a phase."""
        generated = []
        
        # Get all task IDs
        all_ids = self.task_manager.get_all_task_ids()
        
        # Filter by phase
        phase_prefix = f"{phase}."
        
        for task_id in all_ids['current'] + all_ids['future']:
            if str(task_id).startswith(phase_prefix):
                filepath = self.generate_and_save(str(task_id))
                if filepath:
                    generated.append(filepath)
        
        return generated


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Generate LLM prompts for tasks')
    parser.add_argument('--project-root', default='.', help='Project root directory')
    parser.add_argument('--task', help='Task ID to generate prompt for')
    parser.add_argument('--all-phase', type=int, help='Generate prompts for all tasks in a phase')
    parser.add_argument('--preview', action='store_true', help='Preview without saving')
    
    args = parser.parse_args()
    
    generator = PromptGenerator(args.project_root)
    
    if args.task:
        if args.preview:
            content = generator.generate_prompt(args.task)
            if content:
                print(content)
        else:
            filepath = generator.generate_and_save(args.task)
            if not filepath:
                sys.exit(1)
    
    elif args.all_phase is not None:
        generated = generator.generate_phase_prompts(args.all_phase)
        print(f"\n✓ Generated {len(generated)} prompts for Phase {args.all_phase}")
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()