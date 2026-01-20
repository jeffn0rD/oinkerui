#!/usr/bin/env python3
"""
Check that all specifications are complete for Phase 1-2 implementation.

This script validates that all specification files contain the required
sections and content for implementation.
"""

import yaml
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple


class CompletenessChecker:
    """Check specification completeness."""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.errors: List[Dict[str, Any]] = []
        self.warnings: List[Dict[str, Any]] = []
        self.stats: Dict[str, Any] = {}
    
    def check_all(self) -> Dict[str, Any]:
        """Run all completeness checks."""
        print("Checking specification completeness...")
        
        self.check_domain_completeness()
        self.check_module_completeness()
        self.check_function_completeness()
        self.check_api_completeness()
        self.check_ui_completeness()
        self.check_workflow_completeness()
        self.check_state_machine_completeness()
        
        return self.generate_report()
    
    def check_domain_completeness(self):
        """Check that all entities have complete specifications."""
        domain_file = self.base_path / "spec" / "domain.yaml"
        
        if not domain_file.exists():
            self.errors.append({
                'type': 'missing_file',
                'file': 'spec/domain.yaml',
                'message': 'Domain specification file not found'
            })
            return
        
        with open(domain_file) as f:
            data = yaml.safe_load(f)
        
        entities = data.get('entities', {})
        required_entity_sections = ['fields', 'states', 'invariants', 'relationships', 'validation']
        
        entity_count = 0
        complete_count = 0
        
        for entity_name, entity_data in entities.items():
            entity_count += 1
            is_complete = True
            
            for section in required_entity_sections:
                if section not in entity_data:
                    self.warnings.append({
                        'type': 'incomplete_entity',
                        'file': 'spec/domain.yaml',
                        'entity': entity_name,
                        'message': f"Entity '{entity_name}' missing '{section}' section"
                    })
                    is_complete = False
            
            # Check that states have transitions
            if 'states' in entity_data:
                for state in entity_data['states']:
                    if isinstance(state, dict) and 'transitions' not in state:
                        self.warnings.append({
                            'type': 'incomplete_state',
                            'file': 'spec/domain.yaml',
                            'entity': entity_name,
                            'state': state.get('name', 'unknown'),
                            'message': f"State missing transitions"
                        })
            
            if is_complete:
                complete_count += 1
        
        self.stats['domain'] = {
            'entities': entity_count,
            'complete': complete_count
        }
    
    def check_module_completeness(self):
        """Check that all modules have complete specifications."""
        modules_dir = self.base_path / "spec" / "modules"
        
        if not modules_dir.exists():
            self.errors.append({
                'type': 'missing_directory',
                'path': 'spec/modules',
                'message': 'Modules directory not found'
            })
            return
        
        required_sections = [
            'module.id', 'module.name', 'module.description',
            'module.responsibilities', 'module.dependencies',
            'module.functions', 'module.llm_guidance'
        ]
        
        module_count = 0
        complete_count = 0
        
        for module_file in modules_dir.glob("*.yaml"):
            module_count += 1
            
            with open(module_file) as f:
                data = yaml.safe_load(f)
            
            module_data = data.get('module', {})
            is_complete = True
            
            for section_path in required_sections:
                parts = section_path.split('.')
                current = data
                found = True
                
                for part in parts:
                    if isinstance(current, dict) and part in current:
                        current = current[part]
                    else:
                        found = False
                        break
                
                if not found:
                    self.warnings.append({
                        'type': 'incomplete_module',
                        'file': str(module_file.relative_to(self.base_path)),
                        'message': f"Module missing '{section_path}'"
                    })
                    is_complete = False
            
            if is_complete:
                complete_count += 1
        
        self.stats['modules'] = {
            'total': module_count,
            'complete': complete_count
        }
    
    def check_function_completeness(self):
        """Check that critical functions have specifications."""
        functions_dir = self.base_path / "spec" / "functions"
        
        if not functions_dir.exists():
            self.errors.append({
                'type': 'missing_directory',
                'path': 'spec/functions',
                'message': 'Functions directory not found'
            })
            return
        
        required_sections = [
            'function.id', 'function.name', 'function.module',
            'function.purpose', 'function.signature', 'function.contract',
            'function.algorithm', 'function.complexity', 'function.llm_guidance'
        ]
        
        function_count = 0
        complete_count = 0
        
        for module_dir in functions_dir.iterdir():
            if not module_dir.is_dir():
                continue
            
            for func_file in module_dir.glob("*.yaml"):
                function_count += 1
                
                with open(func_file) as f:
                    data = yaml.safe_load(f)
                
                is_complete = True
                
                for section_path in required_sections:
                    parts = section_path.split('.')
                    current = data
                    found = True
                    
                    for part in parts:
                        if isinstance(current, dict) and part in current:
                            current = current[part]
                        else:
                            found = False
                            break
                    
                    if not found:
                        self.warnings.append({
                            'type': 'incomplete_function',
                            'file': str(func_file.relative_to(self.base_path)),
                            'message': f"Function missing '{section_path}'"
                        })
                        is_complete = False
                
                # Check contract has preconditions and postconditions
                contract = data.get('function', {}).get('contract', {})
                if not contract.get('preconditions'):
                    self.warnings.append({
                        'type': 'incomplete_contract',
                        'file': str(func_file.relative_to(self.base_path)),
                        'message': "Contract missing preconditions"
                    })
                    is_complete = False
                
                if not contract.get('postconditions'):
                    self.warnings.append({
                        'type': 'incomplete_contract',
                        'file': str(func_file.relative_to(self.base_path)),
                        'message': "Contract missing postconditions"
                    })
                    is_complete = False
                
                if is_complete:
                    complete_count += 1
        
        self.stats['functions'] = {
            'total': function_count,
            'complete': complete_count
        }
    
    def check_api_completeness(self):
        """Check that API specifications are complete."""
        api_file = self.base_path / "spec" / "apis.yaml"
        
        if not api_file.exists():
            self.errors.append({
                'type': 'missing_file',
                'file': 'spec/apis.yaml',
                'message': 'API specification file not found'
            })
            return
        
        with open(api_file) as f:
            data = yaml.safe_load(f)
        
        services = data.get('services', {})
        endpoint_count = 0
        complete_count = 0
        
        for service_name, service_data in services.items():
            endpoints = service_data.get('endpoints', [])
            
            for endpoint in endpoints:
                endpoint_count += 1
                is_complete = True
                
                required_fields = ['name', 'method', 'path']
                for field in required_fields:
                    if field not in endpoint:
                        self.warnings.append({
                            'type': 'incomplete_endpoint',
                            'service': service_name,
                            'endpoint': endpoint.get('name', 'unknown'),
                            'message': f"Endpoint missing '{field}'"
                        })
                        is_complete = False
                
                # Check response is defined
                if 'response' not in endpoint:
                    self.warnings.append({
                        'type': 'incomplete_endpoint',
                        'service': service_name,
                        'endpoint': endpoint.get('name', 'unknown'),
                        'message': "Endpoint missing response definition"
                    })
                    is_complete = False
                
                if is_complete:
                    complete_count += 1
        
        self.stats['apis'] = {
            'endpoints': endpoint_count,
            'complete': complete_count
        }
    
    def check_ui_completeness(self):
        """Check that UI specifications are complete."""
        ui_file = self.base_path / "spec" / "ui.yaml"
        
        if not ui_file.exists():
            self.errors.append({
                'type': 'missing_file',
                'file': 'spec/ui.yaml',
                'message': 'UI specification file not found'
            })
            return
        
        with open(ui_file) as f:
            data = yaml.safe_load(f)
        
        required_sections = ['theme', 'layout', 'screens', 'components', 'modals', 'interaction_flows']
        complete_sections = 0
        
        for section in required_sections:
            if section in data:
                complete_sections += 1
            else:
                self.warnings.append({
                    'type': 'incomplete_ui',
                    'file': 'spec/ui.yaml',
                    'message': f"UI spec missing '{section}' section"
                })
        
        self.stats['ui'] = {
            'required_sections': len(required_sections),
            'complete': complete_sections
        }
    
    def check_workflow_completeness(self):
        """Check that workflow specifications are complete."""
        workflow_file = self.base_path / "spec" / "workflows.yaml"
        
        if not workflow_file.exists():
            self.errors.append({
                'type': 'missing_file',
                'file': 'spec/workflows.yaml',
                'message': 'Workflow specification file not found'
            })
            return
        
        with open(workflow_file) as f:
            data = yaml.safe_load(f)
        
        workflows = data.get('concrete_workflows', {})
        workflow_count = 0
        complete_count = 0
        
        required_fields = ['id', 'name', 'description', 'steps']
        
        for workflow_name, workflow_data in workflows.items():
            workflow_count += 1
            is_complete = True
            
            for field in required_fields:
                if field not in workflow_data:
                    self.warnings.append({
                        'type': 'incomplete_workflow',
                        'workflow': workflow_name,
                        'message': f"Workflow missing '{field}'"
                    })
                    is_complete = False
            
            # Check steps have required fields
            steps = workflow_data.get('steps', [])
            for step in steps:
                if 'id' not in step or 'type' not in step:
                    self.warnings.append({
                        'type': 'incomplete_workflow_step',
                        'workflow': workflow_name,
                        'message': f"Step missing 'id' or 'type'"
                    })
                    is_complete = False
            
            if is_complete:
                complete_count += 1
        
        self.stats['workflows'] = {
            'total': workflow_count,
            'complete': complete_count
        }
    
    def check_state_machine_completeness(self):
        """Check that state machine specifications are complete."""
        sm_file = self.base_path / "spec" / "state_machines.yaml"
        
        if not sm_file.exists():
            self.warnings.append({
                'type': 'missing_file',
                'file': 'spec/state_machines.yaml',
                'message': 'State machines specification file not found'
            })
            return
        
        with open(sm_file) as f:
            data = yaml.safe_load(f)
        
        state_machines = data.get('state_machines', {})
        sm_count = 0
        complete_count = 0
        
        for sm_name, sm_data in state_machines.items():
            sm_count += 1
            is_complete = True
            
            if 'initial_state' not in sm_data:
                self.warnings.append({
                    'type': 'incomplete_state_machine',
                    'state_machine': sm_name,
                    'message': "State machine missing 'initial_state'"
                })
                is_complete = False
            
            if 'states' not in sm_data:
                self.warnings.append({
                    'type': 'incomplete_state_machine',
                    'state_machine': sm_name,
                    'message': "State machine missing 'states'"
                })
                is_complete = False
            
            if is_complete:
                complete_count += 1
        
        self.stats['state_machines'] = {
            'total': sm_count,
            'complete': complete_count
        }
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate completeness report."""
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
    """Run completeness checks."""
    checker = CompletenessChecker()
    report = checker.check_all()
    
    print("\n" + "=" * 70)
    print("COMPLETENESS CHECK RESULTS")
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
            if 'file' in error:
                print(f"    File: {error['file']}")
    
    # Print warnings (limited)
    if report['warnings']:
        print(f"\n⚠️  Warnings ({len(report['warnings'])}):")
        for warning in report['warnings'][:10]:
            print(f"  - [{warning['type']}] {warning['message']}")
        if len(report['warnings']) > 10:
            print(f"  ... and {len(report['warnings']) - 10} more warnings")
    
    print("\n" + "=" * 70)
    
    if report['errors']:
        print("❌ Completeness check failed")
        return 1
    elif report['warnings']:
        print(f"⚠️  Completeness check passed with {len(report['warnings'])} warnings")
        return 0
    else:
        print("✅ All specifications are complete!")
        return 0


if __name__ == "__main__":
    sys.exit(main())