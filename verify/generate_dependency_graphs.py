#!/usr/bin/env python3
"""
Generate dependency graphs from specifications.

This script creates Mermaid diagrams showing module dependencies,
function call graphs, and data flow graphs.
"""

import yaml
import sys
from pathlib import Path
from typing import Dict, List, Any, Set
from datetime import datetime


class DependencyGraphGenerator:
    """Generate dependency graphs."""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.output_dir = self.base_path / "docs" / "diagrams" / "generated"
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_all_graphs(self):
        """Generate all dependency graphs."""
        print("Generating dependency graphs...")
        
        self.generate_module_dependency_graph()
        self.generate_entity_relationship_graph()
        self.generate_workflow_dependency_graph()
        
        print(f"Dependency graphs generated in {self.output_dir}")
    
    def generate_module_dependency_graph(self):
        """Generate module dependency graph in Mermaid format."""
        modules_dir = self.base_path / "spec" / "modules"
        
        if not modules_dir.exists():
            print("  Warning: spec/modules not found")
            return
        
        # Collect module dependencies
        modules: Dict[str, Dict[str, Any]] = {}
        
        for module_file in modules_dir.glob("*.yaml"):
            with open(module_file) as f:
                data = yaml.safe_load(f)
            
            module_data = data.get('module', {})
            module_id = module_data.get('id', module_file.stem)
            
            deps = module_data.get('dependencies', {})
            module_deps = deps.get('modules', [])
            external_deps = deps.get('external', [])
            
            modules[module_id] = {
                'name': module_data.get('name', module_id),
                'module_deps': [d.get('module_id', '') for d in module_deps if isinstance(d, dict)],
                'external_deps': [d.get('name', '') for d in external_deps if isinstance(d, dict)]
            }
        
        # Generate Mermaid graph
        output = []
        output.append("%%{init: {'theme': 'dark'}}%%")
        output.append("")
        output.append("graph TD")
        output.append("    %% Module Dependency Graph")
        output.append(f"    %% Generated: {datetime.now().isoformat()}")
        output.append("")
        
        # Define nodes
        output.append("    %% Modules")
        for module_id, module_info in modules.items():
            safe_id = module_id.replace('-', '_')
            output.append(f"    {safe_id}[{module_info['name']}]")
        
        output.append("")
        output.append("    %% External Dependencies")
        external_nodes: Set[str] = set()
        for module_info in modules.values():
            for ext in module_info['external_deps']:
                if ext:
                    safe_ext = ext.replace('-', '_').replace('@', '').replace('/', '_')
                    external_nodes.add(f"    ext_{safe_ext}(({ext}))")
        
        for node in sorted(external_nodes):
            output.append(node)
        
        output.append("")
        output.append("    %% Module Dependencies")
        for module_id, module_info in modules.items():
            safe_id = module_id.replace('-', '_')
            for dep in module_info['module_deps']:
                if dep and dep in modules:
                    safe_dep = dep.replace('-', '_')
                    output.append(f"    {safe_id} --> {safe_dep}")
        
        output.append("")
        output.append("    %% External Dependencies")
        for module_id, module_info in modules.items():
            safe_id = module_id.replace('-', '_')
            for ext in module_info['external_deps'][:3]:  # Limit to top 3
                if ext:
                    safe_ext = ext.replace('-', '_').replace('@', '').replace('/', '_')
                    output.append(f"    {safe_id} -.-> ext_{safe_ext}")
        
        output.append("")
        output.append("    %% Styling")
        output.append("    classDef module fill:#2d3748,stroke:#4a5568")
        output.append("    classDef external fill:#553c9a,stroke:#6b46c1")
        
        for module_id in modules.keys():
            safe_id = module_id.replace('-', '_')
            output.append(f"    class {safe_id} module")
        
        output_file = self.output_dir / "module_dependencies.mmd"
        with open(output_file, 'w') as f:
            f.write('\n'.join(output))
        
        print(f"  Generated: {output_file}")
    
    def generate_entity_relationship_graph(self):
        """Generate entity relationship graph."""
        domain_file = self.base_path / "spec" / "domain.yaml"
        
        if not domain_file.exists():
            print("  Warning: spec/domain.yaml not found")
            return
        
        with open(domain_file) as f:
            data = yaml.safe_load(f)
        
        entities = data.get('entities', {})
        
        output = []
        output.append("%%{init: {'theme': 'dark'}}%%")
        output.append("")
        output.append("graph TD")
        output.append("    %% Entity Relationship Graph")
        output.append(f"    %% Generated: {datetime.now().isoformat()}")
        output.append("")
        
        # Define entity nodes
        output.append("    %% Entities")
        for entity_name in entities.keys():
            output.append(f"    {entity_name}[{entity_name}]")
        
        output.append("")
        output.append("    %% Relationships")
        
        for entity_name, entity_data in entities.items():
            relationships = entity_data.get('relationships', [])
            
            for rel in relationships:
                if not isinstance(rel, dict):
                    continue
                
                target = rel.get('entity', '')
                rel_type = rel.get('type', 'relates_to')
                cardinality = rel.get('cardinality', '')
                
                if target and target in entities:
                    label = f"{rel_type}"
                    if cardinality:
                        label += f" ({cardinality})"
                    output.append(f"    {entity_name} -->|{label}| {target}")
        
        output.append("")
        output.append("    %% Styling")
        output.append("    classDef entity fill:#2c5282,stroke:#3182ce")
        
        for entity_name in entities.keys():
            output.append(f"    class {entity_name} entity")
        
        output_file = self.output_dir / "entity_relationships.mmd"
        with open(output_file, 'w') as f:
            f.write('\n'.join(output))
        
        print(f"  Generated: {output_file}")
    
    def generate_workflow_dependency_graph(self):
        """Generate workflow step dependency graph."""
        workflow_file = self.base_path / "spec" / "workflows.yaml"
        
        if not workflow_file.exists():
            print("  Warning: spec/workflows.yaml not found")
            return
        
        with open(workflow_file) as f:
            data = yaml.safe_load(f)
        
        workflows = data.get('concrete_workflows', {})
        
        output = []
        output.append("%%{init: {'theme': 'dark'}}%%")
        output.append("")
        output.append("graph TD")
        output.append("    %% Workflow Dependencies")
        output.append(f"    %% Generated: {datetime.now().isoformat()}")
        output.append("")
        
        # Create subgraphs for each workflow
        for workflow_name, workflow_data in list(workflows.items())[:3]:  # Limit to 3
            wf_id = workflow_data.get('id', workflow_name)
            wf_name = workflow_data.get('name', workflow_name)
            
            output.append(f"    subgraph {wf_id}[{wf_name}]")
            
            steps = workflow_data.get('steps', [])
            prev_step = None
            
            for step in steps:
                step_id = step.get('id', 'unknown')
                step_name = step.get('name', step_id)
                step_type = step.get('type', 'unknown')
                
                full_id = f"{wf_id}_{step_id}"
                output.append(f"        {full_id}[{step_name}]")
                
                if prev_step:
                    output.append(f"        {prev_step} --> {full_id}")
                
                prev_step = full_id
            
            output.append("    end")
            output.append("")
        
        output.append("    %% Styling")
        output.append("    classDef step fill:#744210,stroke:#d69e2e")
        
        output_file = self.output_dir / "workflow_dependencies.mmd"
        with open(output_file, 'w') as f:
            f.write('\n'.join(output))
        
        print(f"  Generated: {output_file}")


def main():
    """Generate all dependency graphs."""
    generator = DependencyGraphGenerator()
    generator.generate_all_graphs()
    
    print("\n✅ Dependency graphs generated successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())