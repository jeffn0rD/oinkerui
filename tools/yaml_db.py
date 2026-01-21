#!/usr/bin/env python3
"""
YAML Database Operations Module

This module provides robust, deterministic operations for managing YAML files
in the project. It uses Python dictionaries as an intermediate representation
to ensure consistency and avoid manual string manipulation errors.

Key Features:
- Safe loading and dumping of YAML files
- Schema validation
- Atomic file operations
- Backup creation before modifications
- Comprehensive error handling
"""

import yaml
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
import shutil
from copy import deepcopy


class YAMLDatabase:
    """
    A class for managing YAML files as structured databases.
    
    This class provides methods to safely read, write, and modify YAML files
    while maintaining data integrity and providing rollback capabilities.
    """
    
    def __init__(self, file_path: Union[str, Path], create_backup: bool = True):
        """
        Initialize the YAML database.
        
        Args:
            file_path: Path to the YAML file
            create_backup: Whether to create backups before modifications
        """
        self.file_path = Path(file_path)
        self.create_backup = create_backup
        self.data: Optional[Dict[str, Any]] = None
        
    def load(self) -> Dict[str, Any]:
        """
        Load the YAML file into memory.
        
        Returns:
            Dictionary representation of the YAML file
            
        Raises:
            FileNotFoundError: If the file doesn't exist
            yaml.YAMLError: If the file is not valid YAML
        """
        if not self.file_path.exists():
            raise FileNotFoundError(f"YAML file not found: {self.file_path}")
            
        with open(self.file_path, 'r', encoding='utf-8') as f:
            self.data = yaml.safe_load(f)
            
        if self.data is None:
            self.data = {}
            
        return deepcopy(self.data)
    
    def save(self, data: Optional[Dict[str, Any]] = None) -> None:
        """
        Save data to the YAML file.
        
        Args:
            data: Data to save. If None, saves the current self.data
            
        Raises:
            ValueError: If no data is provided and self.data is None
        """
        if data is not None:
            self.data = data
            
        if self.data is None:
            raise ValueError("No data to save")
            
        # Create backup if requested
        if self.create_backup and self.file_path.exists():
            backup_path = self._create_backup()
            print(f"Created backup: {backup_path}")
        
        # Write to temporary file first
        temp_path = self.file_path.with_suffix('.tmp')
        try:
            with open(temp_path, 'w', encoding='utf-8') as f:
                yaml.dump(
                    self.data,
                    f,
                    default_flow_style=False,
                    allow_unicode=True,
                    sort_keys=False,
                    width=120
                )
            
            # Atomic replace
            temp_path.replace(self.file_path)
            
        except Exception as e:
            # Clean up temp file on error
            if temp_path.exists():
                temp_path.unlink()
            raise e
    
    def _create_backup(self) -> Path:
        """
        Create a timestamped backup of the current file.
        
        Returns:
            Path to the backup file
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = self.file_path.with_suffix(f'.{timestamp}.bak')
        shutil.copy2(self.file_path, backup_path)
        return backup_path
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """
        Get a value from the data using a dot-notation key path.
        
        Args:
            key_path: Dot-separated path to the value (e.g., "tasks.0.task.id")
            default: Default value if key not found
            
        Returns:
            The value at the key path, or default if not found
        """
        if self.data is None:
            self.load()
            
        keys = key_path.split('.')
        current = self.data
        
        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            elif isinstance(current, list):
                try:
                    index = int(key)
                    current = current[index] if 0 <= index < len(current) else None
                except (ValueError, IndexError):
                    current = None
            else:
                current = None
                
            if current is None:
                return default
                
        return current
    
    def set(self, key_path: str, value: Any) -> None:
        """
        Set a value in the data using a dot-notation key path.
        
        Args:
            key_path: Dot-separated path to the value
            value: Value to set
        """
        if self.data is None:
            self.load()
            
        keys = key_path.split('.')
        current = self.data
        
        for i, key in enumerate(keys[:-1]):
            if isinstance(current, dict):
                if key not in current:
                    # Determine if next key is numeric (list) or not (dict)
                    next_key = keys[i + 1]
                    current[key] = [] if next_key.isdigit() else {}
                current = current[key]
            elif isinstance(current, list):
                index = int(key)
                while len(current) <= index:
                    current.append({})
                current = current[index]
        
        # Set the final value
        final_key = keys[-1]
        if isinstance(current, dict):
            current[final_key] = value
        elif isinstance(current, list):
            index = int(final_key)
            while len(current) <= index:
                current.append(None)
            current[index] = value
    
    def append(self, key_path: str, value: Any) -> None:
        """
        Append a value to a list in the data.
        
        Args:
            key_path: Dot-separated path to the list
            value: Value to append
            
        Raises:
            ValueError: If the target is not a list
        """
        if self.data is None:
            self.load()
            
        target = self.get(key_path, [])
        if not isinstance(target, list):
            raise ValueError(f"Target at {key_path} is not a list")
            
        target.append(value)
        self.set(key_path, target)
    
    def remove(self, key_path: str, predicate: Optional[callable] = None) -> bool:
        """
        Remove an item from the data.
        
        Args:
            key_path: Dot-separated path to the item or list
            predicate: Optional function to filter items in a list
            
        Returns:
            True if item was removed, False otherwise
        """
        if self.data is None:
            self.load()
            
        keys = key_path.split('.')
        parent_path = '.'.join(keys[:-1])
        final_key = keys[-1]
        
        parent = self.get(parent_path) if parent_path else self.data
        
        if isinstance(parent, dict) and final_key in parent:
            del parent[final_key]
            return True
        elif isinstance(parent, list):
            if predicate:
                original_len = len(parent)
                parent[:] = [item for item in parent if not predicate(item)]
                return len(parent) < original_len
            else:
                try:
                    index = int(final_key)
                    if 0 <= index < len(parent):
                        parent.pop(index)
                        return True
                except (ValueError, IndexError):
                    pass
        
        return False
    
    def find(self, key_path: str, predicate: callable) -> Optional[Any]:
        """
        Find an item in a list that matches a predicate.
        
        Args:
            key_path: Dot-separated path to the list
            predicate: Function that returns True for matching items
            
        Returns:
            The first matching item, or None if not found
        """
        if self.data is None:
            self.load()
            
        items = self.get(key_path, [])
        if not isinstance(items, list):
            return None
            
        for item in items:
            if predicate(item):
                return item
                
        return None
    
    def find_all(self, key_path: str, predicate: callable) -> List[Any]:
        """
        Find all items in a list that match a predicate.
        
        Args:
            key_path: Dot-separated path to the list
            predicate: Function that returns True for matching items
            
        Returns:
            List of matching items
        """
        if self.data is None:
            self.load()
            
        items = self.get(key_path, [])
        if not isinstance(items, list):
            return []
            
        return [item for item in items if predicate(item)]
    
    def to_json(self, indent: int = 2) -> str:
        """
        Convert the data to JSON string.
        
        Args:
            indent: Indentation level for pretty printing
            
        Returns:
            JSON string representation
        """
        if self.data is None:
            self.load()
            
        return json.dumps(self.data, indent=indent, ensure_ascii=False)
    
    def validate_structure(self, schema: Dict[str, Any]) -> List[str]:
        """
        Validate the data structure against a schema.
        
        Args:
            schema: Dictionary describing the expected structure
            
        Returns:
            List of validation errors (empty if valid)
        """
        if self.data is None:
            self.load()
            
        errors = []
        self._validate_recursive(self.data, schema, "", errors)
        return errors
    
    def _validate_recursive(
        self,
        data: Any,
        schema: Any,
        path: str,
        errors: List[str]
    ) -> None:
        """
        Recursively validate data against schema.
        
        Args:
            data: Data to validate
            schema: Schema to validate against
            path: Current path in the data structure
            errors: List to append errors to
        """
        if isinstance(schema, dict):
            if not isinstance(data, dict):
                errors.append(f"{path}: Expected dict, got {type(data).__name__}")
                return
                
            for key, value_schema in schema.items():
                if key.startswith('_'):  # Skip metadata keys
                    continue
                    
                if key not in data:
                    if not key.endswith('?'):  # Optional keys end with ?
                        errors.append(f"{path}.{key}: Required key missing")
                else:
                    self._validate_recursive(
                        data[key],
                        value_schema,
                        f"{path}.{key}" if path else key,
                        errors
                    )
        elif isinstance(schema, list):
            if not isinstance(data, list):
                errors.append(f"{path}: Expected list, got {type(data).__name__}")
                return
                
            if len(schema) > 0:
                item_schema = schema[0]
                for i, item in enumerate(data):
                    self._validate_recursive(
                        item,
                        item_schema,
                        f"{path}[{i}]",
                        errors
                    )
        elif isinstance(schema, type):
            if not isinstance(data, schema):
                errors.append(
                    f"{path}: Expected {schema.__name__}, got {type(data).__name__}"
                )


def load_yaml(file_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Convenience function to load a YAML file.
    
    Args:
        file_path: Path to the YAML file
        
    Returns:
        Dictionary representation of the YAML file
    """
    db = YAMLDatabase(file_path, create_backup=False)
    return db.load()


def save_yaml(file_path: Union[str, Path], data: Dict[str, Any]) -> None:
    """
    Convenience function to save data to a YAML file.
    
    Args:
        file_path: Path to the YAML file
        data: Data to save
    """
    db = YAMLDatabase(file_path, create_backup=True)
    db.save(data)


if __name__ == "__main__":
    # Example usage
    print("YAML Database Module")
    print("=" * 50)
    print("This module provides robust YAML file operations.")
    print("Import it in other scripts to use its functionality.")