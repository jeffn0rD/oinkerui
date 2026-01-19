#!/usr/bin/env python3
"""
Specification Reference Verification Script

This script parses all YAML files in the /spec/ directory and verifies:
1. All cross-references between spec files are valid
2. Referenced files exist
3. YAML structure is valid
4. No dangling references

Usage:
    python verify/check_spec_refs.py
"""

import os
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Set, Tuple


class SpecVerifier:
    def __init__(self, spec_dir: str = "spec"):
        self.spec_dir = Path(spec_dir)
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.spec_files: Set[str] = set()
        self.references: Dict[str, List[str]] = {}
        
    def load_yaml_file(self, filepath: Path) -> Dict:
        """Load and parse a YAML file."""
        try:
            with open(filepath, 'r') as f:
                return yaml.safe_load(f)
        except yaml.YAMLError as e:
            self.warnings.append(f"YAML parsing warning in {filepath}: {e}")
            return {}
        except Exception as e:
            self.errors.append(f"Error reading {filepath}: {e}")
            return {}
    
    def find_references_in_dict(self, data: any, current_file: str, path: str = "") -> None:
        """Recursively find file references in YAML data."""
        if isinstance(data, dict):
            # Check for common reference keys
            for key in ['ref', 'reference', 'path', 'file', 'spec']:
                if key in data and isinstance(data[key], str):
                    ref = data[key]
                    if ref.endswith('.yaml') or '/' in ref:
                        self.references.setdefault(current_file, []).append(ref)
            
            # Check 'references' section specifically
            if 'references' in data and isinstance(data['references'], dict):
                for ref_key, ref_value in data['references'].items():
                    if isinstance(ref_value, str) and ref_value.endswith('.yaml'):
                        self.references.setdefault(current_file, []).append(ref_value)
            
            # Recurse into nested dictionaries
            for key, value in data.items():
                self.find_references_in_dict(value, current_file, f"{path}.{key}" if path else key)
        
        elif isinstance(data, list):
            for i, item in enumerate(data):
                self.find_references_in_dict(item, current_file, f"{path}[{i}]")
    
    def verify_file_exists(self, ref: str, source_file: str) -> bool:
        """Verify that a referenced file exists."""
        # Skip API paths (they're not file references)
        if ref.startswith('/'):
            return True
        
        # Skip directory paths (they're not file references to verify)
        if ref.endswith('/'):
            return True
        
        # Skip template paths with variables
        if '<' in ref and '>' in ref:
            return True
        
        # Handle relative paths
        if ref.startswith('./'):
            ref = ref[2:]
        
        # Check in spec directory
        ref_path = self.spec_dir / ref
        if ref_path.exists():
            return True
        
        # Check relative to source file
        source_dir = (self.spec_dir / source_file).parent
        ref_path = source_dir / ref
        if ref_path.exists():
            return True
        
        return False
    
    def scan_spec_files(self) -> None:
        """Scan all YAML files in the spec directory."""
        if not self.spec_dir.exists():
            self.errors.append(f"Spec directory not found: {self.spec_dir}")
            return
        
        for filepath in self.spec_dir.glob("*.yaml"):
            self.spec_files.add(filepath.name)
            
            # Load and parse the file
            data = self.load_yaml_file(filepath)
            if not data:
                continue
            
            # Find references in the file
            self.find_references_in_dict(data, filepath.name)
    
    def verify_references(self) -> None:
        """Verify all found references."""
        for source_file, refs in self.references.items():
            for ref in refs:
                if not self.verify_file_exists(ref, source_file):
                    self.errors.append(
                        f"Reference not found: '{ref}' referenced in '{source_file}'"
                    )
    
    def check_main_spec_references(self) -> None:
        """Verify that spec.yaml references all other spec files."""
        main_spec_path = self.spec_dir / "spec.yaml"
        if not main_spec_path.exists():
            self.errors.append("Main spec.yaml file not found")
            return
        
        data = self.load_yaml_file(main_spec_path)
        if not data:
            return
        
        # Check references section
        if 'references' not in data:
            self.warnings.append("spec.yaml has no 'references' section")
            return
        
        referenced_files = set()
        for key, value in data['references'].items():
            if isinstance(value, str) and value.endswith('.yaml'):
                # Extract filename from path
                filename = value.split('/')[-1]
                referenced_files.add(filename)
        
        # Check if all spec files are referenced
        unreferenced = self.spec_files - referenced_files - {'spec.yaml'}
        if unreferenced:
            self.warnings.append(
                f"Spec files not referenced in spec.yaml: {', '.join(unreferenced)}"
            )
    
    def verify(self) -> bool:
        """Run all verification checks."""
        print("=" * 70)
        print("Specification Reference Verification")
        print("=" * 70)
        print()
        
        print(f"Scanning spec directory: {self.spec_dir}")
        self.scan_spec_files()
        print(f"Found {len(self.spec_files)} spec files")
        print()
        
        print("Verifying references...")
        self.verify_references()
        print()
        
        print("Checking main spec references...")
        self.check_main_spec_references()
        print()
        
        # Report results
        print("=" * 70)
        print("Verification Results")
        print("=" * 70)
        print()
        
        if self.errors:
            print(f"❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"  - {error}")
            print()
        
        if self.warnings:
            print(f"⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  - {warning}")
            print()
        
        if not self.errors and not self.warnings:
            print("✅ All checks passed! No issues found.")
            print()
        
        # Summary
        print("=" * 70)
        print("Summary")
        print("=" * 70)
        print(f"Spec files scanned: {len(self.spec_files)}")
        print(f"References found: {sum(len(refs) for refs in self.references.values())}")
        print(f"Errors: {len(self.errors)}")
        print(f"Warnings: {len(self.warnings)}")
        print()
        
        return len(self.errors) == 0


def main():
    """Main entry point."""
    # Determine spec directory (relative to script location)
    script_dir = Path(__file__).parent.parent
    spec_dir = script_dir / "spec"
    
    verifier = SpecVerifier(str(spec_dir))
    success = verifier.verify()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()