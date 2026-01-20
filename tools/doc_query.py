#!/usr/bin/env python3
"""
Enhanced Document Query Tool for oinkerui Project (v3)

This version adds predicate-based filtering:
- Predicate syntax: path.to.array[*].{field=value AND other~pattern}
- Comparison operators: =, !=, ~, !~, >, <, >=, <=
- Logical operators: AND, OR, NOT
- Returns ancestor nodes when predicates match

Usage:
    python3 tools/doc_query.py --query "current[*].task.{name~Frontend}" --mode path
    python3 tools/doc_query.py --query "0.2" --mode task
    python3 tools/doc_query.py --query "phase*" --mode text
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Union
import yaml


class PredicateParser:
    """Parse and evaluate predicate expressions."""
    
    def __init__(self):
        self.operators = {
            '=': self._op_equals,
            '!=': self._op_not_equals,
            '~': self._op_regex,
            '!~': self._op_not_regex,
            '>': self._op_greater,
            '<': self._op_less,
            '>=': self._op_greater_equal,
            '<=': self._op_less_equal,
        }
    
    def parse(self, predicate_str: str) -> Dict[str, Any]:
        """Parse a predicate string into an expression tree."""
        # Remove outer braces if present
        predicate_str = predicate_str.strip()
        if predicate_str.startswith('{') and predicate_str.endswith('}'):
            predicate_str = predicate_str[1:-1].strip()
        
        # Remove outer parentheses if they wrap the entire expression
        if predicate_str.startswith('(') and predicate_str.endswith(')'):
            # Check if these are the outermost parentheses
            depth = 0
            for i, char in enumerate(predicate_str):
                if char == '(':
                    depth += 1
                elif char == ')':
                    depth -= 1
                    if depth == 0 and i < len(predicate_str) - 1:
                        # Not the outermost parentheses
                        break
            else:
                # They are outermost, remove them
                predicate_str = predicate_str[1:-1].strip()
        
        # Parse logical operators (OR has lower precedence than AND)
        # Need to respect parentheses when splitting
        or_parts = self._split_by_operator(predicate_str, ['OR', '||'])
        if len(or_parts) > 1:
            return {
                'type': 'or',
                'operands': [self.parse(p) for p in or_parts]
            }
        
        and_parts = self._split_by_operator(predicate_str, ['AND', '&&'])
        if len(and_parts) > 1:
            return {
                'type': 'and',
                'operands': [self.parse(p) for p in and_parts]
            }
        
        # Handle NOT operator
        if predicate_str.startswith('NOT ') or predicate_str.startswith('!'):
            inner = predicate_str[4:].strip() if predicate_str.startswith('NOT ') else predicate_str[1:].strip()
            return {
                'type': 'not',
                'operand': self.parse(inner)
            }
        
        # Parse comparison expression
        for op in ['!=', '!~', '>=', '<=', '=', '~', '>', '<']:
            if op in predicate_str:
                parts = predicate_str.split(op, 1)
                if len(parts) == 2:
                    field = parts[0].strip()
                    value = parts[1].strip().strip('"\'')
                    return {
                        'type': 'comparison',
                        'field': field,
                        'operator': op,
                        'value': value
                    }
        
        # If no operator found, treat as field existence check
        return {
            'type': 'exists',
            'field': predicate_str.strip()
        }
    
    def _split_by_operator(self, expr: str, operators: List[str]) -> List[str]:
        """Split expression by operators, respecting parentheses."""
        parts = []
        current = ""
        depth = 0
        i = 0
        
        while i < len(expr):
            char = expr[i]
            
            if char == '(':
                depth += 1
                current += char
                i += 1
            elif char == ')':
                depth -= 1
                current += char
                i += 1
            elif depth == 0:
                # Check if we're at an operator (must be surrounded by spaces or at boundaries)
                found_op = False
                for op in operators:
                    # Check for operator with spaces around it
                    op_with_spaces = f' {op} '
                    if expr[i:i+len(op_with_spaces)] == op_with_spaces:
                        # Found operator at top level
                        if current.strip():
                            parts.append(current.strip())
                        current = ""
                        i += len(op_with_spaces)
                        found_op = True
                        break
                
                if not found_op:
                    current += char
                    i += 1
            else:
                current += char
                i += 1
        
        if current.strip():
            parts.append(current.strip())
        
        return parts if len(parts) > 1 else [expr]
    
    def evaluate(self, predicate: Dict[str, Any], data: Any) -> bool:
        """Evaluate a predicate against data."""
        pred_type = predicate.get('type')
        
        if pred_type == 'or':
            return any(self.evaluate(op, data) for op in predicate['operands'])
        
        if pred_type == 'and':
            return all(self.evaluate(op, data) for op in predicate['operands'])
        
        if pred_type == 'not':
            return not self.evaluate(predicate['operand'], data)
        
        if pred_type == 'comparison':
            field = predicate['field']
            operator = predicate['operator']
            expected = predicate['value']
            
            # Get field value from data
            actual = self._get_field_value(data, field)
            if actual is None:
                return False
            
            # Apply operator
            op_func = self.operators.get(operator)
            if op_func:
                return op_func(actual, expected)
            return False
        
        if pred_type == 'exists':
            field = predicate['field']
            return self._get_field_value(data, field) is not None
        
        return False
    
    def _get_field_value(self, data: Any, field: str) -> Any:
        """Get a field value from data, supporting nested paths."""
        if not isinstance(data, dict):
            return None
        
        # Handle nested field paths (e.g., "task.name")
        parts = field.split('.')
        current = data
        
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        
        return current
    
    def _op_equals(self, actual: Any, expected: str) -> bool:
        """Equality comparison."""
        # Try numeric comparison first
        try:
            return float(actual) == float(expected)
        except (ValueError, TypeError):
            pass
        # Fall back to string comparison
        return str(actual) == expected
    
    def _op_not_equals(self, actual: Any, expected: str) -> bool:
        """Not equals comparison."""
        return not self._op_equals(actual, expected)
    
    def _op_regex(self, actual: Any, expected: str) -> bool:
        """Regex match (case-insensitive)."""
        try:
            return bool(re.search(expected, str(actual), re.IGNORECASE))
        except re.error:
            return False
    
    def _op_not_regex(self, actual: Any, expected: str) -> bool:
        """Regex not match."""
        return not self._op_regex(actual, expected)
    
    def _op_greater(self, actual: Any, expected: str) -> bool:
        """Greater than comparison."""
        try:
            return float(actual) > float(expected)
        except (ValueError, TypeError):
            return False
    
    def _op_less(self, actual: Any, expected: str) -> bool:
        """Less than comparison."""
        try:
            return float(actual) < float(expected)
        except (ValueError, TypeError):
            return False
    
    def _op_greater_equal(self, actual: Any, expected: str) -> bool:
        """Greater than or equal comparison."""
        try:
            return float(actual) >= float(expected)
        except (ValueError, TypeError):
            return False
    
    def _op_less_equal(self, actual: Any, expected: str) -> bool:
        """Less than or equal comparison."""
        try:
            return float(actual) <= float(expected)
        except (ValueError, TypeError):
            return False


class EnhancedDocQuery:
    """Enhanced document query tool with predicate support."""
    
    def __init__(self, base_path: str = "."):
        """Initialize the tool with the project base path."""
        self.base_path = Path(base_path)
        self.spec_dirs = ["spec", "log", "man"]
        self.yaml_files = []
        self.predicate_parser = PredicateParser()
        self._discover_files()
    
    def _discover_files(self):
        """Discover all YAML files in relevant directories."""
        for dir_name in self.spec_dirs:
            dir_path = self.base_path / dir_name
            if dir_path.exists():
                self.yaml_files.extend(dir_path.glob("**/*.yaml"))
                self.yaml_files.extend(dir_path.glob("**/*.yml"))
        
        # Also check for YAML files in root directory
        for yaml_file in self.base_path.glob("*.yaml"):
            if yaml_file.is_file():
                self.yaml_files.append(yaml_file)
        for yaml_file in self.base_path.glob("*.yml"):
            if yaml_file.is_file():
                self.yaml_files.append(yaml_file)
    
    def _load_yaml_safe(self, file_path: Path) -> Optional[Dict]:
        """Safely load a YAML file, returning None on error."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            return None
    
    def query_task(self, task_id: str) -> Dict[str, Any]:
        """
        Query for a specific task by ID.
        Searches master_todo.yaml and tasks_completed.yaml.
        """
        results = {
            "query": task_id,
            "mode": "task_query",
            "task_found": False,
            "current_task": None,
            "completed_task": None,
            "related_files": []
        }
        
        # Convert task_id to number if possible
        try:
            task_id_num = float(task_id)
        except:
            task_id_num = None
        
        # Search master_todo.yaml
        master_todo = self.base_path / "master_todo.yaml"
        if master_todo.exists():
            data = self._load_yaml_safe(master_todo)
            if data and "current" in data:
                for item in data["current"]:
                    if isinstance(item, dict) and "task" in item:
                        task = item["task"]
                        task_item_id = task.get("id")
                        # Match both string and numeric IDs
                        if (str(task_item_id) == task_id or 
                            (task_id_num is not None and task_item_id == task_id_num)):
                            results["task_found"] = True
                            results["current_task"] = {
                                "file": "master_todo.yaml",
                                "task": task,
                                "prompt_file": task.get("prompt"),
                                "related_specs": task.get("files", [])
                            }
                            break
        
        # Search tasks_completed.yaml
        completed = self.base_path / "log" / "tasks_completed.yaml"
        if completed.exists():
            data = self._load_yaml_safe(completed)
            if data and "tasks" in data:
                for item in data["tasks"]:
                    if isinstance(item, dict) and "task" in item:
                        task = item["task"]
                        task_item_id = task.get("id")
                        if (str(task_item_id) == task_id or 
                            (task_id_num is not None and task_item_id == task_id_num)):
                            results["completed_task"] = {
                                "file": "log/tasks_completed.yaml",
                                "task": task
                            }
                            break
        
        # Find related files (summary, notes, prompts)
        log_dir = self.base_path / "log"
        if log_dir.exists():
            summary = log_dir / f"task_{task_id}_summary.yaml"
            if summary.exists():
                results["related_files"].append({
                    "type": "summary",
                    "file": str(summary.relative_to(self.base_path)),
                    "content": self._load_yaml_safe(summary)
                })
            
            notes = log_dir / f"task_{task_id}_notes.yaml"
            if notes.exists():
                results["related_files"].append({
                    "type": "notes",
                    "file": str(notes.relative_to(self.base_path)),
                    "content": self._load_yaml_safe(notes)
                })
        
        # Find prompt file if specified
        if results["current_task"] and results["current_task"]["prompt_file"]:
            prompt_file = self.base_path / results["current_task"]["prompt_file"]
            if prompt_file.exists():
                try:
                    with open(prompt_file, 'r') as f:
                        results["related_files"].append({
                            "type": "prompt",
                            "file": results["current_task"]["prompt_file"],
                            "content": f.read()
                        })
                except:
                    pass
        
        return results
    
    def query_path(self, path_query: str) -> Dict[str, Any]:
        """
        Query using structured path notation with optional predicates.
        Examples:
          - current[*].task.id=0.2  (old style, still supported)
          - current[*].task.{id=0.2}  (new style with predicate)
          - current[*].task.{name~Frontend AND status=active}
        """
        results = {
            "query": path_query,
            "mode": "path_query",
            "matches": []
        }
        
        # Check if query contains predicate syntax
        has_predicate = '{' in path_query and '}' in path_query
        
        if has_predicate:
            # New predicate-based query
            return self._query_path_with_predicate(path_query, results)
        else:
            # Old-style query for backward compatibility
            return self._query_path_legacy(path_query, results)
    
    def _query_path_with_predicate(self, path_query: str, results: Dict) -> Dict:
        """Handle path queries with predicate syntax."""
        # Parse path and predicate
        # Format: path.to.node[*].{predicate}
        match = re.match(r'(.+)\.\{([^}]+)\}', path_query)
        if not match:
            results["error"] = "Invalid predicate syntax. Use: path.to.node.{field=value}"
            return results
        
        path_str = match.group(1)
        predicate_str = match.group(2)
        
        # Parse the predicate
        try:
            predicate = self.predicate_parser.parse(predicate_str)
        except Exception as e:
            results["error"] = f"Failed to parse predicate: {e}"
            return results
        
        # Search all files
        for file_path in self.yaml_files:
            data = self._load_yaml_safe(file_path)
            if data is None:
                continue
            
            matches = self._search_path_predicate(data, path_str, predicate)
            if matches:
                rel_path = str(file_path.relative_to(self.base_path))
                results["matches"].append({
                    "file": rel_path,
                    "results": matches
                })
        
        return results
    
    def _search_path_predicate(self, data: Any, path: str, predicate: Dict) -> List[Dict]:
        """Search using path with predicate evaluation."""
        matches = []
        
        # Split path into segments
        segments = self._parse_path_segments(path)
        
        # Traverse the path
        def traverse(current_data: Any, segment_idx: int, current_path: str):
            if segment_idx >= len(segments):
                # Reached end of path, evaluate predicate
                if self.predicate_parser.evaluate(predicate, current_data):
                    matches.append({
                        "path": current_path,
                        "value": current_data  # Return the ancestor node
                    })
                return
            
            segment = segments[segment_idx]
            
            if segment == '[*]':
                # Wildcard - iterate through array
                if isinstance(current_data, list):
                    for idx, item in enumerate(current_data):
                        new_path = f"{current_path}[{idx}]"
                        traverse(item, segment_idx + 1, new_path)
            elif segment.startswith('[') and segment.endswith(']'):
                # Specific index
                try:
                    idx = int(segment[1:-1])
                    if isinstance(current_data, list) and 0 <= idx < len(current_data):
                        new_path = f"{current_path}{segment}"
                        traverse(current_data[idx], segment_idx + 1, new_path)
                except ValueError:
                    pass
            else:
                # Regular key
                if isinstance(current_data, dict) and segment in current_data:
                    new_path = f"{current_path}.{segment}" if current_path else segment
                    traverse(current_data[segment], segment_idx + 1, new_path)
        
        traverse(data, 0, "")
        return matches
    
    def _parse_path_segments(self, path: str) -> List[str]:
        """Parse path string into segments."""
        # Split on dots, but keep array notation together
        segments = []
        current = ""
        in_brackets = False
        
        for char in path:
            if char == '[':
                if current:
                    segments.append(current)
                    current = ""
                in_brackets = True
                current = char
            elif char == ']':
                current += char
                segments.append(current)
                current = ""
                in_brackets = False
            elif char == '.' and not in_brackets:
                if current:
                    segments.append(current)
                    current = ""
            else:
                current += char
        
        if current:
            segments.append(current)
        
        return segments
    
    def _query_path_legacy(self, path_query: str, results: Dict) -> Dict:
        """Handle legacy path queries (without predicates)."""
        # Parse the path query
        # Format: path.to.key[*].subkey=value or path.to.key~"pattern"
        match = re.match(r'([^=~]+)([=~])(.+)', path_query)
        if not match:
            results["error"] = "Invalid path query format. Use: path.to.key=value or path.to.key~pattern"
            return results
        
        path_str, operator, value = match.groups()
        value = value.strip('"\'')
        
        # Search all files
        for file_path in self.yaml_files:
            data = self._load_yaml_safe(file_path)
            if data is None:
                continue
            
            matches = self._search_path_legacy(data, path_str, operator, value, "")
            if matches:
                rel_path = str(file_path.relative_to(self.base_path))
                results["matches"].append({
                    "file": rel_path,
                    "results": matches
                })
        
        return results
    
    def _search_path_legacy(self, data: Any, path: str, operator: str, value: str, current_path: str) -> List[Dict]:
        """Legacy search implementation."""
        matches = []
        
        # Split path into parts
        parts = re.split(r'[.\[]', path)
        parts = [p.rstrip(']') for p in parts if p]
        
        def traverse(current_data: Any, part_idx: int, path_so_far: str):
            if part_idx >= len(parts):
                # Reached the end, check value
                if self._matches_value(current_data, operator, value):
                    matches.append({
                        "path": path_so_far,
                        "value": current_data
                    })
                return
            
            part = parts[part_idx]
            
            if part == '*':
                # Wildcard
                if isinstance(current_data, list):
                    for idx, item in enumerate(current_data):
                        new_path = f"{path_so_far}[{idx}]"
                        traverse(item, part_idx + 1, new_path)
                elif isinstance(current_data, dict):
                    for key, item in current_data.items():
                        new_path = f"{path_so_far}.{key}" if path_so_far else key
                        traverse(item, part_idx + 1, new_path)
            else:
                # Specific key
                if isinstance(current_data, dict) and part in current_data:
                    new_path = f"{path_so_far}.{part}" if path_so_far else part
                    traverse(current_data[part], part_idx + 1, new_path)
        
        traverse(data, 0, "")
        return matches
    
    def _matches_value(self, actual: Any, operator: str, expected: str) -> bool:
        """Check if a value matches using the given operator."""
        if operator == '=':
            # Try numeric comparison first
            try:
                return float(actual) == float(expected)
            except (ValueError, TypeError):
                pass
            return str(actual) == expected
        elif operator == '~':
            # Regex match
            try:
                return bool(re.search(expected, str(actual), re.IGNORECASE))
            except re.error:
                return False
        return False
    
    def query_text(self, query: str) -> Dict[str, Any]:
        """
        Search for text across all YAML files.
        Supports wildcards and regex patterns.
        """
        results = {
            "query": query,
            "mode": "text_search",
            "matches": []
        }
        
        # Convert query to regex pattern
        pattern = query.replace('*', '.*')
        try:
            regex = re.compile(pattern, re.IGNORECASE)
        except re.error:
            results["error"] = f"Invalid regex pattern: {query}"
            return results
        
        # Search all files
        for file_path in self.yaml_files:
            data = self._load_yaml_safe(file_path)
            if data is None:
                continue
            
            matches = self._search_text_recursive(data, regex, "")
            if matches:
                rel_path = str(file_path.relative_to(self.base_path))
                results["matches"].append({
                    "file": rel_path,
                    "results": matches
                })
        
        return results
    
    def _search_text_recursive(self, data: Any, regex: re.Pattern, path: str) -> List[Dict]:
        """Recursively search for text matches."""
        matches = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                new_path = f"{path}.{key}" if path else key
                # Check key
                if regex.search(str(key)):
                    matches.append({
                        "path": new_path,
                        "match_type": "key",
                        "value": value
                    })
                # Recurse into value
                matches.extend(self._search_text_recursive(value, regex, new_path))
        elif isinstance(data, list):
            for idx, item in enumerate(data):
                new_path = f"{path}[{idx}]"
                matches.extend(self._search_text_recursive(item, regex, new_path))
        else:
            # Leaf value - check if it matches
            if regex.search(str(data)):
                matches.append({
                    "path": path,
                    "match_type": "value",
                    "value": data
                })
        
        return matches
    
    def query_key(self, key: str) -> Dict[str, Any]:
        """Search for a specific YAML key across all files."""
        results = {
            "query": key,
            "mode": "key_search",
            "matches": []
        }
        
        for file_path in self.yaml_files:
            data = self._load_yaml_safe(file_path)
            if data is None:
                continue
            
            matches = self._search_key_recursive(data, key, "")
            if matches:
                rel_path = str(file_path.relative_to(self.base_path))
                results["matches"].append({
                    "file": rel_path,
                    "results": matches
                })
        
        return results
    
    def _search_key_recursive(self, data: Any, target_key: str, path: str) -> List[Dict]:
        """Recursively search for a specific key."""
        matches = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                new_path = f"{path}.{key}" if path else key
                if key == target_key:
                    matches.append({
                        "path": new_path,
                        "value": value
                    })
                matches.extend(self._search_key_recursive(value, target_key, new_path))
        elif isinstance(data, list):
            for idx, item in enumerate(data):
                new_path = f"{path}[{idx}]"
                matches.extend(self._search_key_recursive(item, target_key, new_path))
        
        return matches
    
    def query_file(self, filename: str) -> Dict[str, Any]:
        """Retrieve the complete contents of a specific file."""
        results = {
            "query": filename,
            "mode": "file_retrieval",
            "file_found": False,
            "content": None
        }
        
        # Find the file
        target_path = self.base_path / filename
        if target_path.exists() and target_path.is_file():
            data = self._load_yaml_safe(target_path)
            if data is not None:
                results["file_found"] = True
                results["content"] = data
        
        return results
    
    def query_related(self, filename: str, max_results: int = 5) -> Dict[str, Any]:
        """Find files related to the given file based on content similarity."""
        results = {
            "query": filename,
            "mode": "related_files",
            "related": []
        }
        
        # Load the target file
        target_path = self.base_path / filename
        if not target_path.exists():
            results["error"] = f"File not found: {filename}"
            return results
        
        target_data = self._load_yaml_safe(target_path)
        if target_data is None:
            results["error"] = f"Failed to load file: {filename}"
            return results
        
        # Extract keywords from target file
        target_keywords = self._extract_keywords(target_data)
        
        # Score other files
        scored_files = []
        for file_path in self.yaml_files:
            if file_path == target_path:
                continue
            
            data = self._load_yaml_safe(file_path)
            if data is None:
                continue
            
            file_keywords = self._extract_keywords(data)
            score = self._calculate_similarity(target_keywords, file_keywords)
            
            if score > 0:
                rel_path = str(file_path.relative_to(self.base_path))
                scored_files.append({
                    "file": rel_path,
                    "relevance_score": score
                })
        
        # Sort by score and return top results
        scored_files.sort(key=lambda x: x["relevance_score"], reverse=True)
        results["related"] = scored_files[:max_results]
        
        return results
    
    def _extract_keywords(self, data: Any) -> set:
        """Extract keywords from YAML data."""
        keywords = set()
        
        def extract_recursive(obj: Any):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    keywords.add(key.lower())
                    extract_recursive(value)
            elif isinstance(obj, list):
                for item in obj:
                    extract_recursive(item)
            elif isinstance(obj, str):
                # Extract words from strings
                words = re.findall(r'\w+', obj.lower())
                keywords.update(words)
        
        extract_recursive(data)
        return keywords
    
    def _calculate_similarity(self, keywords1: set, keywords2: set) -> float:
        """Calculate similarity score between two keyword sets."""
        if not keywords1 or not keywords2:
            return 0.0
        
        intersection = keywords1.intersection(keywords2)
        union = keywords1.union(keywords2)
        
        return len(intersection) / len(union) if union else 0.0


def main():
    parser = argparse.ArgumentParser(
        description="Enhanced Document Query Tool with Predicate Support",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Task query
  python3 tools/doc_query.py --query "0.2" --mode task
  
  # Path query with predicate
  python3 tools/doc_query.py --query "current[*].task.{name~Frontend}" --mode path
  
  # Complex predicate
  python3 tools/doc_query.py --query "current[*].task.{name~Frontend AND status=active}" --mode path
  
  # Legacy path query (still supported)
  python3 tools/doc_query.py --query "current[*].task.id=0.2" --mode path
  
  # Text search
  python3 tools/doc_query.py --query "phase*" --mode text
  
  # Key search
  python3 tools/doc_query.py --query "phase_id" --mode key
  
  # File retrieval
  python3 tools/doc_query.py --query "spec/spec.yaml" --mode file
  
  # Related files
  python3 tools/doc_query.py --query "spec/spec.yaml" --mode related
        """
    )
    
    parser.add_argument('--query', '-q', required=True, help='Query string')
    parser.add_argument('--mode', '-m', 
                       choices=['text', 'key', 'file', 'related', 'task', 'path'],
                       default='text',
                       help='Query mode')
    parser.add_argument('--pretty', '-p', action='store_true',
                       help='Pretty print JSON output')
    parser.add_argument('--base-path', '-b', default='.',
                       help='Base path for the project (default: current directory)')
    
    args = parser.parse_args()
    
    # Initialize query tool
    query_tool = EnhancedDocQuery(args.base_path)
    
    # Execute query based on mode
    if args.mode == 'text':
        results = query_tool.query_text(args.query)
    elif args.mode == 'key':
        results = query_tool.query_key(args.query)
    elif args.mode == 'file':
        results = query_tool.query_file(args.query)
    elif args.mode == 'related':
        results = query_tool.query_related(args.query)
    elif args.mode == 'task':
        results = query_tool.query_task(args.query)
    elif args.mode == 'path':
        results = query_tool.query_path(args.query)
    else:
        results = {"error": f"Unknown mode: {args.mode}"}
    
    # Output results
    indent = 2 if args.pretty else None
    print(json.dumps(results, indent=indent, default=str))


if __name__ == "__main__":
    main()