#!/usr/bin/env python3
"""
Schema Validation Module

This module provides schema validation for YAML files in the project.
It defines schemas for master_todo.yaml and tasks_completed.yaml and
validates files against these schemas.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import sys

sys.path.insert(0, str(Path(__file__).parent))

from yaml_db import YAMLDatabase


# Schema definitions
MASTER_TODO_SCHEMA = {
    'title': str,
    'description': str,
    'prompt_guidance': str,
    'current': [
        {
            'task': {
                'id': (str, int, float),
                'name': str,
                'goal': str,
                'prompt?': str,
                'files?': [str],
                'details?': dict
            }
        }
    ],
    'future': list,  # Can contain tasks or strings
    'open_questions?': list
}

TASKS_COMPLETED_SCHEMA = {
    'title': str,
    'description': str,
    'tasks': [
        {
            'task': {
                'id': (str, int, float),
                'name': str,
                'goal?': str,  # Optional for backward compatibility
                'completed_date': (str, object),  # Can be str or date object
                'commit?': str,
                'summary?': str,
                'deliverables?': list,
                'verification?': dict,
                'files_created?': list,
                'files_modified?': list,
                'git_commit?': str,
                'git_pushed?': bool
            }
        }
    ]
}


class SchemaValidator:
    """
    Validator for YAML file schemas.
    """
    
    def __init__(self, schema: Dict[str, Any]):
        """
        Initialize the validator with a schema.
        
        Args:
            schema: Schema definition
        """
        self.schema = schema
        self.errors: List[str] = []
    
    def validate(self, data: Any, schema: Any = None, path: str = "") -> bool:
        """
        Validate data against schema.
        
        Args:
            data: Data to validate
            schema: Schema to validate against (uses self.schema if None)
            path: Current path in data structure
            
        Returns:
            True if valid, False otherwise
        """
        if schema is None:
            schema = self.schema
            self.errors = []
        
        if isinstance(schema, dict):
            return self._validate_dict(data, schema, path)
        elif isinstance(schema, list):
            return self._validate_list(data, schema, path)
        elif isinstance(schema, tuple):
            return self._validate_type_union(data, schema, path)
        elif isinstance(schema, type):
            return self._validate_type(data, schema, path)
        else:
            self.errors.append(f"{path}: Invalid schema definition")
            return False
    
    def _validate_dict(self, data: Any, schema: Dict[str, Any], path: str) -> bool:
        """Validate dictionary data."""
        if not isinstance(data, dict):
            self.errors.append(f"{path}: Expected dict, got {type(data).__name__}")
            return False
        
        valid = True
        
        for key, value_schema in schema.items():
            # Check if key is optional
            is_optional = key.endswith('?')
            clean_key = key.rstrip('?')
            
            if clean_key not in data:
                if not is_optional:
                    self.errors.append(f"{path}.{clean_key}: Required key missing")
                    valid = False
            else:
                key_path = f"{path}.{clean_key}" if path else clean_key
                if not self.validate(data[clean_key], value_schema, key_path):
                    valid = False
        
        return valid
    
    def _validate_list(self, data: Any, schema: List[Any], path: str) -> bool:
        """Validate list data."""
        if not isinstance(data, list):
            self.errors.append(f"{path}: Expected list, got {type(data).__name__}")
            return False
        
        if len(schema) == 0:
            return True  # Empty schema means any list is valid
        
        item_schema = schema[0]
        valid = True
        
        for i, item in enumerate(data):
            item_path = f"{path}[{i}]"
            if not self.validate(item, item_schema, item_path):
                valid = False
        
        return valid
    
    def _validate_type_union(self, data: Any, types: tuple, path: str) -> bool:
        """Validate data against a union of types."""
        for type_option in types:
            if isinstance(data, type_option):
                return True
        
        type_names = ", ".join(t.__name__ for t in types)
        self.errors.append(
            f"{path}: Expected one of ({type_names}), got {type(data).__name__}"
        )
        return False
    
    def _validate_type(self, data: Any, expected_type: type, path: str) -> bool:
        """Validate data type."""
        if not isinstance(data, expected_type):
            self.errors.append(
                f"{path}: Expected {expected_type.__name__}, got {type(data).__name__}"
            )
            return False
        return True
    
    def get_errors(self) -> List[str]:
        """Get validation errors."""
        return self.errors


def validate_master_todo(file_path: Path) -> tuple[bool, List[str]]:
    """
    Validate master_todo.yaml file.
    
    Args:
        file_path: Path to master_todo.yaml
        
    Returns:
        Tuple of (is_valid, errors)
    """
    db = YAMLDatabase(file_path, create_backup=False)
    data = db.load()
    
    validator = SchemaValidator(MASTER_TODO_SCHEMA)
    is_valid = validator.validate(data)
    
    return is_valid, validator.get_errors()


def validate_tasks_completed(file_path: Path) -> tuple[bool, List[str]]:
    """
    Validate tasks_completed.yaml file.
    
    Args:
        file_path: Path to tasks_completed.yaml
        
    Returns:
        Tuple of (is_valid, errors)
    """
    db = YAMLDatabase(file_path, create_backup=False)
    data = db.load()
    
    validator = SchemaValidator(TASKS_COMPLETED_SCHEMA)
    is_valid = validator.validate(data)
    
    return is_valid, validator.get_errors()


def main():
    """Main function for command-line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Validate YAML schemas')
    parser.add_argument('--project-root', default='.', help='Project root directory')
    parser.add_argument('--file', choices=['master_todo', 'tasks_completed', 'all'],
                       default='all', help='File to validate')
    
    args = parser.parse_args()
    
    project_root = Path(args.project_root)
    all_valid = True
    
    if args.file in ['master_todo', 'all']:
        print("\nValidating master_todo.yaml...")
        print("=" * 70)
        
        master_todo_path = project_root / "master_todo.yaml"
        is_valid, errors = validate_master_todo(master_todo_path)
        
        if is_valid:
            print("✓ master_todo.yaml is valid")
        else:
            print("✗ master_todo.yaml has errors:")
            for error in errors:
                print(f"  - {error}")
            all_valid = False
    
    if args.file in ['tasks_completed', 'all']:
        print("\nValidating tasks_completed.yaml...")
        print("=" * 70)
        
        tasks_completed_path = project_root / "log" / "tasks_completed.yaml"
        is_valid, errors = validate_tasks_completed(tasks_completed_path)
        
        if is_valid:
            print("✓ tasks_completed.yaml is valid")
        else:
            print("✗ tasks_completed.yaml has errors:")
            for error in errors:
                print(f"  - {error}")
            all_valid = False
    
    print("\n" + "=" * 70)
    if all_valid:
        print("✓ ALL FILES VALID")
    else:
        print("✗ VALIDATION FAILED")
    print("=" * 70)
    
    sys.exit(0 if all_valid else 1)


if __name__ == "__main__":
    main()