#!/usr/bin/env python3
"""
Validate that all references between specification files are valid.

This script checks that all cross-references in specification files
point to existing entities, modules, functions, and files.
"""

import yaml
import re
import sys
from pathlib import Path
from typing import Dict, List, Set, Any


class ReferenceChecker:
    """Check specification references."""
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.all_refs: Dict[str, Dict[str, Any]] = {}
        self.broken_refs: List[Dict[str, Any]] = []
        self.valid_refs: List[Dict[str, Any]] = []
    
    def check_all_references(self) -> Dict[str, Any]:
        """Check all references in all spec files."""
        print("Checking specification references...")
        
        # 1. Collect all referenceable items
        self.collect_entities()
        self.collect_modules()
        self.collect_functions()
        self.collect_files()
        
        # 2. Check all references
        self.check_module_references()
        self.check_function_references()
        self.check_api_references()
        self.check_workflow_references()
        self.check_ui_references()
        
        return self.generate_report()
    
    def collect_entities(self):
        """Collect all entities from domain.yaml."""
        domain_file = self.base_path / "spec" / "domain.yaml"
        
        if not domain_file.exists():
            return
        
        with open(domain_file) as f:
            data = yaml.safe_load(f)
        
        for entity_name in data.get('entities', {}).keys():
            ref_id = f"entity:{entity_name}"
            self.all_refs[ref_id] = {
                'type': 'entity',
                'file': 'spec/domain.yaml',
                'id': entity_name
            }
            
            # Also add as domain.yaml#Entity format
            self.all_refs[f"spec/domain.yaml#{entity_name}"] = {
                'type': 'entity',
                'file': 'spec/domain.yaml',
                'id': entity_name
            }
    
    def collect_modules(self):
        """Collect all modules from spec/modules/."""
        modules_dir = self.base_path / "spec" / "modules"
        
        if not modules_dir.exists():
            return
        
        for module_file in modules_dir.glob("*.yaml"):
            with open(module_file) as f:
                data = yaml.safe_load(f)
            
            module_data = data.get('module', {})
            module_id = module_data.get('id', module_file.stem)
            
            ref_id = f"module:{module_id}"
            self.all_refs[ref_id] = {
                'type': 'module',
                'file': str(module_file.relative_to(self.base_path)),
                'id': module_id
            }
            
            # Also add file path format
            rel_path = str(module_file.relative_to(self.base_path))
            self.all_refs[rel_path] = {
                'type': 'module',
                'file': rel_path,
                'id': module_id
            }
    
    def collect_functions(self):
        """Collect all functions from spec/functions/."""
        functions_dir = self.base_path / "spec" / "functions"
        
        if not functions_dir.exists():
            return
        
        for module_dir in functions_dir.iterdir():
            if not module_dir.is_dir():
                continue
            
            for func_file in module_dir.glob("*.yaml"):
                with open(func_file) as f:
                    data = yaml.safe_load(f)
                
                func_data = data.get('function', {})
                func_id = func_data.get('id', func_file.stem)
                
                ref_id = f"function:{func_id}"
                self.all_refs[ref_id] = {
                    'type': 'function',
                    'file': str(func_file.relative_to(self.base_path)),
                    'id': func_id
                }
                
                # Also add file path format
                rel_path = str(func_file.relative_to(self.base_path))
                self.all_refs[rel_path] = {
                    'type': 'function',
                    'file': rel_path,
                    'id': func_id
                }
    
    def collect_files(self):
        """Collect all spec files."""
        spec_dir = self.base_path / "spec"
        
        if not spec_dir.exists():
            return
        
        for spec_file in spec_dir.rglob("*.yaml"):
            rel_path = str(spec_file.relative_to(self.base_path))
            self.all_refs[rel_path] = {
                'type': 'file',
                'file': rel_path,
                'id': spec_file.stem
            }
    
    def check_module_references(self):
        """Check references in module specs."""
        modules_dir = self.base_path / "spec" / "modules"
        
        if not modules_dir.exists():
            return
        
        for module_file in modules_dir.glob("*.yaml"):
            self._check_file_references(module_file)
    
    def check_function_references(self):
        """Check references in function specs."""
        functions_dir = self.base_path / "spec" / "functions"
        
        if not functions_dir.exists():
            return
        
        for module_dir in functions_dir.iterdir():
            if not module_dir.is_dir():
                continue
            
            for func_file in module_dir.glob("*.yaml"):
                self._check_file_references(func_file)
    
    def check_api_references(self):
        """Check references in API specs."""
        api_file = self.base_path / "spec" / "apis.yaml"
        
        if api_file.exists():
            self._check_file_references(api_file)
    
    def check_workflow_references(self):
        """Check references in workflow specs."""
        workflow_file = self.base_path / "spec" / "workflows.yaml"
        
        if workflow_file.exists():
            self._check_file_references(workflow_file)
    
    def check_ui_references(self):
        """Check references in UI specs."""
        ui_file = self.base_path / "spec" / "ui.yaml"
        
        if ui_file.exists():
            self._check_file_references(ui_file)
    
    def _check_file_references(self, file_path: Path):
        """Check all references in a single file."""
        with open(file_path) as f:
            content = f.read()
        
        rel_file = str(file_path.relative_to(self.base_path))
        
        # Pattern 1: spec/path/file.yaml or spec/path/file.yaml#anchor
        ref_pattern1 = r'spec/[a-zA-Z0-9_/]+\.yaml(?:#[a-zA-Z0-9_]+)?'
        refs1 = re.findall(ref_pattern1, content)
        
        for ref in refs1:
            self._validate_reference(rel_file, ref)
        
        # Pattern 2: $ref: "..." format
        ref_pattern2 = r'\$ref:\s*["\']([^"\']+)["\']'
        refs2 = re.findall(ref_pattern2, content)
        
        for ref in refs2:
            self._validate_reference(rel_file, ref)
        
        # Pattern 3: function_reference: "..." format
        ref_pattern3 = r'function_reference:\s*["\']([^"\']+)["\']'
        refs3 = re.findall(ref_pattern3, content)
        
        for ref in refs3:
            self._validate_reference(rel_file, ref)
    
    def _validate_reference(self, source_file: str, reference: str):
        """Validate a single reference."""
        # Normalize reference
        ref = reference.strip('"\'')
        
        # Check if reference exists
        if ref in self.all_refs:
            self.valid_refs.append({
                'source': source_file,
                'reference': ref,
                'target': self.all_refs[ref]
            })
            return True
        
        # Check if it's a file path reference
        ref_path = ref.split('#')[0]
        if ref_path in self.all_refs:
            self.valid_refs.append({
                'source': source_file,
                'reference': ref,
                'target': self.all_refs[ref_path]
            })
            return True
        
        # Check if file exists
        full_path = self.base_path / ref_path
        if full_path.exists():
            self.valid_refs.append({
                'source': source_file,
                'reference': ref,
                'target': {'type': 'file', 'file': ref_path}
            })
            return True
        
        # Reference is broken
        self.broken_refs.append({
            'source': source_file,
            'reference': ref,
            'error': 'Reference not found'
        })
        return False
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate reference check report."""
        return {
            'total_refs_collected': len(self.all_refs),
            'valid_refs': len(self.valid_refs),
            'broken_refs': self.broken_refs,
            'summary': {
                'total_checked': len(self.valid_refs) + len(self.broken_refs),
                'valid': len(self.valid_refs),
                'broken': len(self.broken_refs)
            }
        }


def main():
    """Run reference checks."""
    checker = ReferenceChecker()
    report = checker.check_all_references()
    
    print("\n" + "=" * 70)
    print("REFERENCE CHECK RESULTS")
    print("=" * 70)
    
    print(f"\nReferenceable items collected: {report['total_refs_collected']}")
    print(f"References checked: {report['summary']['total_checked']}")
    print(f"Valid references: {report['summary']['valid']}")
    print(f"Broken references: {report['summary']['broken']}")
    
    if report['broken_refs']:
        print(f"\n❌ Broken References ({len(report['broken_refs'])}):")
        for ref in report['broken_refs'][:20]:
            print(f"  - {ref['source']}")
            print(f"    Reference: {ref['reference']}")
            print(f"    Error: {ref['error']}")
        if len(report['broken_refs']) > 20:
            print(f"  ... and {len(report['broken_refs']) - 20} more")
    
    print("\n" + "=" * 70)
    
    if report['broken_refs']:
        print(f"❌ Reference check failed with {len(report['broken_refs'])} broken references")
        return 1
    else:
        print("✅ All references are valid!")
        return 0


if __name__ == "__main__":
    sys.exit(main())