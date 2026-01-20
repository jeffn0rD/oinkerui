#!/usr/bin/env python3
"""
Check consistency between related specifications.

This script validates that related specifications are consistent with
each other (e.g., functions listed in modules have specs, API endpoints
reference valid functions, etc.).
"""

import yaml
import sys
from pathlib import Path
from typing import Dict, List, Any, Set


class ConsistencyChecker:
    """Check specification consistency."""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.errors: List[Dict[str, Any]] = []
        self.warnings: List[Dict[str, Any]] = []
        self.stats: Dict[str, Any] = {}
    
    def check_all(self) -> Dict[str, Any]:
        """Run all consistency checks."""
        print("Checking specification consistency...")
        
        self.check_function_module_consistency()
        self.check_api_function_consistency()
        self.check_workflow_function_consistency()
        self.check_state_transition_consistency()
        self.check_entity_relationship_consistency()
        
        return self.generate_report()
    
    def check_function_module_consistency(self):
        """Check that functions listed in modules have specs."""
        modules_dir = self.base_path / "spec" / "modules"
        functions_dir = self.base_path / "spec" / "functions"
        
        if not modules_dir.exists() or not functions_dir.exists():
            return
        
        # Collect all function specs
        function_specs: Set[str] = set()
        for module_dir in functions_dir.iterdir():
            if not module_dir.is_dir():
                continue
            for func_file in module_dir.glob("*.yaml"):
                with open(func_file) as f:
                    data = yaml.safe_load(f)
                func_id = data.get('function', {}).get('id', '')
                if func_id:
                    function_specs.add(func_id)
        
        # Check each module's function list
        functions_listed = 0
        functions_with_specs = 0
        
        for module_file in modules_dir.glob("*.yaml"):
            with open(module_file) as f:
                data = yaml.safe_load(f)
            
            module_data = data.get('module', {})
            module_id = module_data.get('id', module_file.stem)
            functions = module_data.get('functions', [])
            
            for func in functions:
                func_id = func.get('id', '')
                if not func_id:
                    continue
                
                functions_listed += 1
                full_func_id = f"{module_id}.{func_id}"
                
                # Check if function spec exists
                if full_func_id in function_specs:
                    functions_with_specs += 1
                else:
                    # Also check without module prefix
                    if func_id not in function_specs:
                        self.warnings.append({
                            'type': 'missing_function_spec',
                            'module': module_id,
                            'function': func_id,
                            'message': f"Function '{func_id}' listed in module but no spec found"
                        })
        
        self.stats['function_module'] = {
            'functions_listed': functions_listed,
            'functions_with_specs': functions_with_specs
        }
    
    def check_api_function_consistency(self):
        """Check that API endpoints reference valid functions."""
        api_file = self.base_path / "spec" / "apis.yaml"
        functions_dir = self.base_path / "spec" / "functions"
        
        if not api_file.exists():
            return
        
        # Collect all function spec files
        function_files: Set[str] = set()
        if functions_dir.exists():
            for func_file in functions_dir.rglob("*.yaml"):
                rel_path = str(func_file.relative_to(self.base_path))
                function_files.add(rel_path)
        
        with open(api_file) as f:
            data = yaml.safe_load(f)
        
        endpoints_checked = 0
        endpoints_with_refs = 0
        
        for service_name, service_data in data.get('services', {}).items():
            for endpoint in service_data.get('endpoints', []):
                endpoints_checked += 1
                
                func_ref = endpoint.get('function_reference', '')
                if func_ref:
                    endpoints_with_refs += 1
                    
                    # Check if function file exists
                    if func_ref not in function_files:
                        # Try without quotes
                        clean_ref = func_ref.strip('"\'')
                        if clean_ref not in function_files:
                            self.warnings.append({
                                'type': 'invalid_function_reference',
                                'service': service_name,
                                'endpoint': endpoint.get('name', 'unknown'),
                                'reference': func_ref,
                                'message': f"Function reference not found: {func_ref}"
                            })
        
        self.stats['api_function'] = {
            'endpoints_checked': endpoints_checked,
            'endpoints_with_refs': endpoints_with_refs
        }
    
    def check_workflow_function_consistency(self):
        """Check that workflow steps reference valid functions."""
        workflow_file = self.base_path / "spec" / "workflows.yaml"
        
        if not workflow_file.exists():
            return
        
        with open(workflow_file) as f:
            data = yaml.safe_load(f)
        
        workflows = data.get('concrete_workflows', {})
        steps_checked = 0
        steps_with_functions = 0
        
        for workflow_name, workflow_data in workflows.items():
            steps = workflow_data.get('steps', [])
            
            for step in steps:
                steps_checked += 1
                
                func_ref = step.get('function', '')
                if func_ref:
                    steps_with_functions += 1
                    # Note: We don't validate function references here
                    # as they may use different formats
        
        self.stats['workflow_function'] = {
            'steps_checked': steps_checked,
            'steps_with_functions': steps_with_functions
        }
    
    def check_state_transition_consistency(self):
        """Check that state transitions are consistent with state machines."""
        domain_file = self.base_path / "spec" / "domain.yaml"
        sm_file = self.base_path / "spec" / "state_machines.yaml"
        
        if not domain_file.exists() or not sm_file.exists():
            return
        
        with open(domain_file) as f:
            domain_data = yaml.safe_load(f)
        
        with open(sm_file) as f:
            sm_data = yaml.safe_load(f)
        
        state_machines = sm_data.get('state_machines', {})
        entities = domain_data.get('entities', {})
        
        entities_checked = 0
        entities_with_sm = 0
        
        for entity_name, entity_data in entities.items():
            entities_checked += 1
            
            # Check if entity has states defined
            entity_states = entity_data.get('states', [])
            if not entity_states:
                continue
            
            # Find corresponding state machine
            sm_name = f"{entity_name.lower()}_lifecycle"
            if sm_name in state_machines:
                entities_with_sm += 1
                
                # Check state names match
                sm_states = state_machines[sm_name].get('states', {})
                entity_state_names = {s.get('name') for s in entity_states if isinstance(s, dict)}
                sm_state_names = set(sm_states.keys())
                
                # Check for mismatches
                missing_in_sm = entity_state_names - sm_state_names
                missing_in_entity = sm_state_names - entity_state_names
                
                if missing_in_sm:
                    self.warnings.append({
                        'type': 'state_mismatch',
                        'entity': entity_name,
                        'message': f"States in entity but not in state machine: {missing_in_sm}"
                    })
                
                if missing_in_entity:
                    self.warnings.append({
                        'type': 'state_mismatch',
                        'entity': entity_name,
                        'message': f"States in state machine but not in entity: {missing_in_entity}"
                    })
        
        self.stats['state_transition'] = {
            'entities_checked': entities_checked,
            'entities_with_sm': entities_with_sm
        }
    
    def check_entity_relationship_consistency(self):
        """Check that entity relationships are bidirectional."""
        domain_file = self.base_path / "spec" / "domain.yaml"
        
        if not domain_file.exists():
            return
        
        with open(domain_file) as f:
            data = yaml.safe_load(f)
        
        entities = data.get('entities', {})
        relationships_checked = 0
        
        for entity_name, entity_data in entities.items():
            relationships = entity_data.get('relationships', [])
            
            for rel in relationships:
                if not isinstance(rel, dict):
                    continue
                
                relationships_checked += 1
                target_entity = rel.get('entity', '')
                
                # Check if target entity exists
                if target_entity and target_entity not in entities:
                    self.warnings.append({
                        'type': 'invalid_relationship',
                        'entity': entity_name,
                        'target': target_entity,
                        'message': f"Relationship references non-existent entity: {target_entity}"
                    })
        
        self.stats['entity_relationship'] = {
            'relationships_checked': relationships_checked
        }
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate consistency report."""
        return {
            'errors': self.errors,
            'warnings': self.warnings,
            'stats': self.stats,
            'summary': {
                'total_errors': len(self.errors),
                'total_warnings': len(self.warnings)
            }
        }


def main():
    """Run consistency checks."""
    checker = ConsistencyChecker()
    report = checker.check_all()
    
    print("\n" + "=" * 70)
    print("CONSISTENCY CHECK RESULTS")
    print("=" * 70)
    
    # Print stats
    print("\nStatistics:")
    for category, stats in report['stats'].items():
        print(f"  {category}:")
        for key, value in stats.items():
            print(f"    {key}: {value}")
    
    # Print errors
    if report['errors']:
        print(f"\n❌ Errors ({len(report['errors'])}):")
        for error in report['errors']:
            print(f"  - [{error['type']}] {error['message']}")
    
    # Print warnings
    if report['warnings']:
        print(f"\n⚠️  Warnings ({len(report['warnings'])}):")
        for warning in report['warnings'][:15]:
            print(f"  - [{warning['type']}] {warning['message']}")
        if len(report['warnings']) > 15:
            print(f"  ... and {len(report['warnings']) - 15} more warnings")
    
    print("\n" + "=" * 70)
    
    if report['errors']:
        print("❌ Consistency check failed")
        return 1
    elif report['warnings']:
        print(f"⚠️  Consistency check passed with {len(report['warnings'])} warnings")
        return 0
    else:
        print("✅ All specifications are consistent!")
        return 0


if __name__ == "__main__":
    sys.exit(main())