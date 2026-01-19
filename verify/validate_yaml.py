#!/usr/bin/env python3
"""
YAML Validation Tool for oinkerui Project

This tool validates YAML files in the project, checking for:
1. Syntax errors
2. Schema compliance
3. Reference consistency
4. Required fields

Outputs LLM-friendly error messages that can be used to repair files.

Usage:
    python3 verify/validate_yaml.py [--file FILE] [--all] [--verbose]
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import yaml


class YAMLValidator:
    """Validator for project YAML files."""
    
    def __init__(self, base_path: str = "."):
        """Initialize validator with project base path."""
        self.base_path = Path(base_path)
        self.errors = []
        self.warnings = []
        
        # Define expected schemas for different file types
        self.schemas = {
            "master_todo.yaml": {
                "required_fields": ["title", "description", "prompt_guidance", "current"],
                "field_types": {
                    "title": str,
                    "description": str,
                    "prompt_guidance": str,
                    "current": list,
                }
            },
            "tasks_completed.yaml": {
                "required_fields": ["title", "description", "tasks"],
                "field_types": {
                    "title": str,
                    "description": str,
                    "tasks": list,
                }
            },
            "spec/spec.yaml": {
                "required_fields": ["version", "title", "description"],
                "field_types": {
                    "version": str,
                    "title": str,
                    "description": str,
                }
            },
            "spec/domain.yaml": {
                "required_fields": ["version", "entities"],
                "field_types": {
                    "version": str,
                    "entities": (list, dict),
                }
            },
        }
    
    def validate_file(self, file_path: Path) -> Tuple[bool, List[Dict]]:
        """
        Validate a single YAML file.
        
        Returns:
            Tuple of (is_valid, errors_list)
        """
        errors = []
        
        # Check file exists
        if not file_path.exists():
            errors.append({
                "type": "file_not_found",
                "file": str(file_path),
                "message": f"File not found: {file_path}",
                "repair_hint": "Create the file or check the path is correct."
            })
            return False, errors
        
        # Try to load YAML
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                data = yaml.safe_load(content)
        except yaml.YAMLError as e:
            error_info = self._parse_yaml_error(e, file_path)
            errors.append(error_info)
            return False, errors
        except Exception as e:
            errors.append({
                "type": "read_error",
                "file": str(file_path),
                "message": f"Error reading file: {str(e)}",
                "repair_hint": "Check file permissions and encoding."
            })
            return False, errors
        
        # Validate schema if defined
        rel_path = str(file_path.relative_to(self.base_path))
        if rel_path in self.schemas:
            schema_errors = self._validate_schema(data, rel_path, file_path)
            errors.extend(schema_errors)
        
        # Additional validations
        if "master_todo.yaml" in str(file_path):
            task_errors = self._validate_master_todo(data, file_path)
            errors.extend(task_errors)
        
        if "tasks_completed.yaml" in str(file_path):
            completed_errors = self._validate_tasks_completed(data, file_path)
            errors.extend(completed_errors)
        
        return len(errors) == 0, errors
    
    def _parse_yaml_error(self, error: yaml.YAMLError, file_path: Path) -> Dict:
        """Parse YAML error into LLM-friendly format."""
        error_str = str(error)
        
        # Extract line and column if available
        line = None
        column = None
        if hasattr(error, 'problem_mark'):
            mark = error.problem_mark
            line = mark.line + 1
            column = mark.column + 1
        
        # Determine error type and provide repair hints
        if "could not find expected" in error_str.lower():
            error_type = "syntax_error"
            repair_hint = "Check for missing colons, incorrect indentation, or unclosed quotes."
        elif "mapping values are not allowed" in error_str.lower():
            error_type = "indentation_error"
            repair_hint = "Check indentation levels. YAML requires consistent spacing (usually 2 spaces per level)."
        elif "expected <block end>" in error_str.lower():
            error_type = "structure_error"
            repair_hint = "Check for incorrect list/dict nesting or missing dashes for list items."
        else:
            error_type = "yaml_parse_error"
            repair_hint = "Review YAML syntax. Common issues: incorrect indentation, missing colons, unquoted special characters."
        
        error_info = {
            "type": error_type,
            "file": str(file_path),
            "message": error_str,
            "repair_hint": repair_hint
        }
        
        if line:
            error_info["line"] = line
            error_info["column"] = column
            
            # Try to get the problematic line
            try:
                with open(file_path, 'r') as f:
                    lines = f.readlines()
                    if line <= len(lines):
                        error_info["problematic_line"] = lines[line - 1].rstrip()
                        
                        # Get context (2 lines before and after)
                        context_start = max(0, line - 3)
                        context_end = min(len(lines), line + 2)
                        error_info["context"] = {
                            "start_line": context_start + 1,
                            "lines": [l.rstrip() for l in lines[context_start:context_end]]
                        }
            except:
                pass
        
        return error_info
    
    def _validate_schema(self, data: Any, rel_path: str, file_path: Path) -> List[Dict]:
        """Validate data against expected schema."""
        errors = []
        schema = self.schemas.get(rel_path, {})
        
        if not isinstance(data, dict):
            errors.append({
                "type": "schema_error",
                "file": str(file_path),
                "message": "Root element must be a dictionary/mapping",
                "repair_hint": "Ensure the file starts with key-value pairs, not a list or scalar."
            })
            return errors
        
        # Check required fields
        required = schema.get("required_fields", [])
        for field in required:
            if field not in data:
                errors.append({
                    "type": "missing_field",
                    "file": str(file_path),
                    "field": field,
                    "message": f"Required field '{field}' is missing",
                    "repair_hint": f"Add the '{field}' field to the root level of the YAML file."
                })
        
        # Check field types
        field_types = schema.get("field_types", {})
        for field, expected_type in field_types.items():
            if field in data:
                value = data[field]
                if isinstance(expected_type, tuple):
                    if not isinstance(value, expected_type):
                        errors.append({
                            "type": "type_error",
                            "file": str(file_path),
                            "field": field,
                            "expected": str(expected_type),
                            "actual": type(value).__name__,
                            "message": f"Field '{field}' has wrong type",
                            "repair_hint": f"Field '{field}' should be one of {expected_type}, but is {type(value).__name__}."
                        })
                else:
                    if not isinstance(value, expected_type):
                        errors.append({
                            "type": "type_error",
                            "file": str(file_path),
                            "field": field,
                            "expected": expected_type.__name__,
                            "actual": type(value).__name__,
                            "message": f"Field '{field}' should be {expected_type.__name__}, not {type(value).__name__}",
                            "repair_hint": f"Change '{field}' to be a {expected_type.__name__}."
                        })
        
        return errors
    
    def _validate_master_todo(self, data: Dict, file_path: Path) -> List[Dict]:
        """Validate master_todo.yaml specific requirements."""
        errors = []
        
        if "current" in data and isinstance(data["current"], list):
            for i, item in enumerate(data["current"]):
                if not isinstance(item, dict):
                    errors.append({
                        "type": "structure_error",
                        "file": str(file_path),
                        "location": f"current[{i}]",
                        "message": f"Task item {i} is not a dictionary",
                        "repair_hint": "Each item in 'current' should be a dictionary with a 'task' key."
                    })
                    continue
                
                if "task" not in item:
                    errors.append({
                        "type": "missing_field",
                        "file": str(file_path),
                        "location": f"current[{i}]",
                        "message": f"Task item {i} missing 'task' field",
                        "repair_hint": "Add a 'task' field containing the task details."
                    })
        
        return errors
    
    def _validate_tasks_completed(self, data: Dict, file_path: Path) -> List[Dict]:
        """Validate tasks_completed.yaml specific requirements."""
        errors = []
        
        if "tasks" in data and isinstance(data["tasks"], list):
            for i, item in enumerate(data["tasks"]):
                if not isinstance(item, dict):
                    errors.append({
                        "type": "structure_error",
                        "file": str(file_path),
                        "location": f"tasks[{i}]",
                        "message": f"Task item {i} is not a dictionary",
                        "repair_hint": "Each item in 'tasks' should be a dictionary with a 'task' key."
                    })
                    continue
                
                if "task" not in item:
                    errors.append({
                        "type": "missing_field",
                        "file": str(file_path),
                        "location": f"tasks[{i}]",
                        "message": f"Completed task {i} missing 'task' field",
                        "repair_hint": "Add a 'task' field containing the task details."
                    })
                    continue
                
                task = item["task"]
                if isinstance(task, dict):
                    # Check for required fields in completed tasks
                    required = ["id", "name", "completed_date"]
                    for field in required:
                        if field not in task:
                            errors.append({
                                "type": "missing_field",
                                "file": str(file_path),
                                "location": f"tasks[{i}].task",
                                "field": field,
                                "message": f"Completed task missing '{field}'",
                                "repair_hint": f"Add '{field}' to the completed task entry."
                            })
        
        return errors
    
    def validate_all(self) -> Dict[str, Any]:
        """Validate all YAML files in the project."""
        results = {
            "valid": True,
            "files_checked": 0,
            "files_valid": 0,
            "files_invalid": 0,
            "errors": [],
            "warnings": []
        }
        
        # Find all YAML files
        yaml_files = []
        for pattern in ["*.yaml", "*.yml"]:
            yaml_files.extend(self.base_path.glob(pattern))
            yaml_files.extend(self.base_path.glob(f"**/{pattern}"))
        
        # Validate each file
        for file_path in yaml_files:
            # Skip backup files
            if ".backup" in str(file_path):
                continue
            
            results["files_checked"] += 1
            is_valid, errors = self.validate_file(file_path)
            
            if is_valid:
                results["files_valid"] += 1
            else:
                results["files_invalid"] += 1
                results["valid"] = False
                results["errors"].extend(errors)
        
        return results
    
    def format_results(self, results: Dict, verbose: bool = False) -> str:
        """Format validation results for display."""
        output = []
        
        output.append("=" * 70)
        output.append("YAML Validation Results")
        output.append("=" * 70)
        output.append(f"Files checked: {results['files_checked']}")
        output.append(f"Valid: {results['files_valid']}")
        output.append(f"Invalid: {results['files_invalid']}")
        output.append("")
        
        if results["valid"]:
            output.append("✅ All YAML files are valid!")
        else:
            output.append("❌ Validation errors found:")
            output.append("")
            
            for i, error in enumerate(results["errors"], 1):
                output.append(f"Error {i}:")
                output.append(f"  Type: {error['type']}")
                output.append(f"  File: {error['file']}")
                
                if "line" in error:
                    output.append(f"  Line: {error['line']}, Column: {error.get('column', 'N/A')}")
                
                if "field" in error:
                    output.append(f"  Field: {error['field']}")
                
                if "location" in error:
                    output.append(f"  Location: {error['location']}")
                
                output.append(f"  Message: {error['message']}")
                output.append(f"  Repair Hint: {error['repair_hint']}")
                
                if verbose and "problematic_line" in error:
                    output.append(f"  Problematic Line: {error['problematic_line']}")
                
                if verbose and "context" in error:
                    output.append(f"  Context (lines {error['context']['start_line']}-{error['context']['start_line'] + len(error['context']['lines']) - 1}):")
                    for j, line in enumerate(error['context']['lines'], error['context']['start_line']):
                        marker = ">>>" if j == error.get('line') else "   "
                        output.append(f"    {marker} {j}: {line}")
                
                output.append("")
        
        output.append("=" * 70)
        
        return "\n".join(output)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Validate YAML files in the oinkerui project"
    )
    parser.add_argument(
        "--file", "-f",
        help="Validate a specific file"
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="Validate all YAML files in the project"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed error information"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON"
    )
    
    args = parser.parse_args()
    
    validator = YAMLValidator(".")
    
    if args.file:
        # Validate single file
        file_path = Path(args.file)
        is_valid, errors = validator.validate_file(file_path)
        
        results = {
            "valid": is_valid,
            "files_checked": 1,
            "files_valid": 1 if is_valid else 0,
            "files_invalid": 0 if is_valid else 1,
            "errors": errors,
            "warnings": []
        }
    else:
        # Validate all files
        results = validator.validate_all()
    
    # Output results
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(validator.format_results(results, args.verbose))
    
    # Exit with appropriate code
    sys.exit(0 if results["valid"] else 1)


if __name__ == "__main__":
    main()