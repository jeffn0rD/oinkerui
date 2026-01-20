#!/usr/bin/env python3
"""
Generate traceability matrices showing relationships between specs.

This script creates markdown tables mapping features to modules,
modules to functions, and functions to tests.
"""

import yaml
import sys
from pathlib import Path
from typing import Dict, List, Any, Set
from datetime import datetime


class TraceabilityGenerator:
    """Generate traceability matrices."""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.output_dir = self.base_path / "docs" / "traceability"
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_all_matrices(self):
        """Generate all traceability matrices."""
        print("Generating traceability matrices...")
        
        self.generate_feature_to_module_matrix()
        self.generate_module_to_function_matrix()
        self.generate_api_to_function_matrix()
        self.generate_workflow_to_function_matrix()
        
        print(f"Traceability matrices generated in {self.output_dir}")
    
    def generate_feature_to_module_matrix(self):
        """Map Phase 1-2 features to implementing modules."""
        spec_file = self.base_path / "spec" / "spec.yaml"
        
        if not spec_file.exists():
            print("  Warning: spec/spec.yaml not found")
            return
        
        with open(spec_file) as f:
            data = yaml.safe_load(f)
        
        phases = data.get('phases', [])
        
        # Define module mappings
        module_mappings = {
            'Project': ['backend_node', 'git_integration'],
            'Chat': ['backend_node', 'frontend_svelte'],
            'Message': ['backend_node', 'frontend_svelte'],
            'LLM': ['backend_node'],
            'Template': ['backend_python_tools'],
            'Git': ['git_integration'],
            'Logging': ['logging_and_metrics'],
            'UI': ['frontend_svelte'],
            'API': ['backend_node'],
            'Code': ['backend_python_tools'],
            'Workflow': ['backend_node'],
            'Data': ['backend_node'],
        }
        
        output = []
        output.append("# Feature to Module Traceability Matrix")
        output.append("")
        output.append(f"Generated: {datetime.now().isoformat()}")
        output.append("")
        output.append("This matrix maps Phase 1-2 features to their implementing modules.")
        output.append("")
        
        for phase in phases:
            phase_id = phase.get('id', 'unknown')
            phase_name = phase.get('name', 'Unknown Phase')
            features = phase.get('features', [])
            
            if not features or phase_id not in ['phase_1', 'phase_2']:
                continue
            
            output.append(f"## {phase_name}")
            output.append("")
            output.append("| Feature | Modules |")
            output.append("|---------|---------|")
            
            for feature in features:
                if isinstance(feature, str):
                    # Determine modules based on keywords
                    modules = set()
                    for keyword, mods in module_mappings.items():
                        if keyword.lower() in feature.lower():
                            modules.update(mods)
                    
                    if not modules:
                        modules = {'backend_node'}  # Default
                    
                    modules_str = ', '.join(sorted(modules))
                    output.append(f"| {feature} | {modules_str} |")
            
            output.append("")
        
        output_file = self.output_dir / "feature_module_matrix.md"
        with open(output_file, 'w') as f:
            f.write('\n'.join(output))
        
        print(f"  Generated: {output_file}")
    
    def generate_module_to_function_matrix(self):
        """Map modules to their functions."""
        modules_dir = self.base_path / "spec" / "modules"
        functions_dir = self.base_path / "spec" / "functions"
        
        if not modules_dir.exists():
            print("  Warning: spec/modules not found")
            return
        
        output = []
        output.append("# Module to Function Traceability Matrix")
        output.append("")
        output.append(f"Generated: {datetime.now().isoformat()}")
        output.append("")
        output.append("This matrix maps modules to their function specifications.")
        output.append("")
        
        for module_file in sorted(modules_dir.glob("*.yaml")):
            with open(module_file) as f:
                data = yaml.safe_load(f)
            
            module_data = data.get('module', {})
            module_id = module_data.get('id', module_file.stem)
            module_name = module_data.get('name', module_id)
            
            output.append(f"## {module_name}")
            output.append("")
            output.append(f"**Module ID:** `{module_id}`")
            output.append("")
            
            # Get functions from module spec
            functions = module_data.get('functions', [])
            
            # Get function specs
            func_specs_dir = functions_dir / module_id
            func_specs = []
            if func_specs_dir.exists():
                func_specs = list(func_specs_dir.glob("*.yaml"))
            
            output.append("| Function | Has Spec | Spec File |")
            output.append("|----------|----------|-----------|")
            
            for func in functions:
                func_id = func.get('id', '') if isinstance(func, dict) else str(func)
                func_name = func.get('name', func_id) if isinstance(func, dict) else func_id
                
                # Check if spec exists
                spec_file = func_specs_dir / f"{func_id}.yaml" if func_specs_dir.exists() else None
                has_spec = spec_file and spec_file.exists()
                
                spec_path = str(spec_file.relative_to(self.base_path)) if has_spec else "N/A"
                has_spec_str = "✅" if has_spec else "❌"
                
                output.append(f"| {func_name} | {has_spec_str} | {spec_path} |")
            
            output.append("")
            output.append(f"**Function Specs Available:** {len(func_specs)}")
            output.append("")
        
        output_file = self.output_dir / "module_function_matrix.md"
        with open(output_file, 'w') as f:
            f.write('\n'.join(output))
        
        print(f"  Generated: {output_file}")
    
    def generate_api_to_function_matrix(self):
        """Map API endpoints to their implementing functions."""
        api_file = self.base_path / "spec" / "apis.yaml"
        
        if not api_file.exists():
            print("  Warning: spec/apis.yaml not found")
            return
        
        with open(api_file) as f:
            data = yaml.safe_load(f)
        
        output = []
        output.append("# API to Function Traceability Matrix")
        output.append("")
        output.append(f"Generated: {datetime.now().isoformat()}")
        output.append("")
        output.append("This matrix maps API endpoints to their implementing functions.")
        output.append("")
        
        for service_name, service_data in data.get('services', {}).items():
            output.append(f"## {service_name}")
            output.append("")
            output.append("| Method | Path | Function Reference |")
            output.append("|--------|------|-------------------|")
            
            for endpoint in service_data.get('endpoints', []):
                method = endpoint.get('method', 'GET')
                path = endpoint.get('path', '/')
                func_ref = endpoint.get('function_reference', 'N/A')
                
                output.append(f"| {method} | {path} | {func_ref} |")
            
            output.append("")
        
        output_file = self.output_dir / "api_function_matrix.md"
        with open(output_file, 'w') as f:
            f.write('\n'.join(output))
        
        print(f"  Generated: {output_file}")
    
    def generate_workflow_to_function_matrix(self):
        """Map workflows to their step functions."""
        workflow_file = self.base_path / "spec" / "workflows.yaml"
        
        if not workflow_file.exists():
            print("  Warning: spec/workflows.yaml not found")
            return
        
        with open(workflow_file) as f:
            data = yaml.safe_load(f)
        
        output = []
        output.append("# Workflow to Function Traceability Matrix")
        output.append("")
        output.append(f"Generated: {datetime.now().isoformat()}")
        output.append("")
        output.append("This matrix maps workflow steps to their implementing functions.")
        output.append("")
        
        workflows = data.get('concrete_workflows', {})
        
        for workflow_name, workflow_data in workflows.items():
            wf_name = workflow_data.get('name', workflow_name)
            output.append(f"## {wf_name}")
            output.append("")
            output.append(f"**ID:** `{workflow_data.get('id', workflow_name)}`")
            output.append("")
            output.append("| Step | Type | Function |")
            output.append("|------|------|----------|")
            
            for step in workflow_data.get('steps', []):
                step_id = step.get('id', 'unknown')
                step_type = step.get('type', 'unknown')
                func_ref = step.get('function', 'N/A')
                
                output.append(f"| {step_id} | {step_type} | {func_ref} |")
            
            output.append("")
        
        output_file = self.output_dir / "workflow_function_matrix.md"
        with open(output_file, 'w') as f:
            f.write('\n'.join(output))
        
        print(f"  Generated: {output_file}")


def main():
    """Generate all traceability matrices."""
    generator = TraceabilityGenerator()
    generator.generate_all_matrices()
    
    print("\n✅ Traceability matrices generated successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())