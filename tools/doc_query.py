#!/usr/bin/env python3
"""
Enhanced Document Query Tool for oinkerui Project (v2)

This enhanced version adds:
- Structured path queries (e.g., current[*].task.id=0.2)
- Better numeric value matching
- Wildcard support
- Task-specific query mode
- Improved relevance scoring

Usage:
    python3 tools/doc_query_v2.py --query "0.2" --mode task
    python3 tools/doc_query_v2.py --query "current[*].task.id=0.2" --mode path
    python3 tools/doc_query_v2.py --query "phase*" --mode text
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import yaml


class EnhancedDocQuery:
    """Enhanced document query tool with structured queries."""
    
    def __init__(self, base_path: str = "."):
        """Initialize the tool with the project base path."""
        self.base_path = Path(base_path)
        self.spec_dirs = ["spec", "log", "man"]
        self.yaml_files = []
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
        Query using structured path notation.
        Examples:
          - current[*].task.id=0.2
          - current[*].task.name~"Node"
          - spec.phases[*].phase_id=1
        """
        results = {
            "query": path_query,
            "mode": "path_query",
            "matches": []
        }
        
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
            
            matches = self._search_path(data, path_str, operator, value, "")
            if matches:
                rel_path = str(file_path.relative_to(self.base_path))
                results["matches"].append({
                    "file": rel_path,
                    "results": matches
                })
        
        return results
    
    def _search_path(self, data: Any, path: str, operator: str, value: str, current_path: str) -> List[Dict]:
        """Search for matches using path notation."""
        matches = []
        
        # Split path into parts
        parts = re.split(r'[\.\[]', path)
        parts = [p.rstrip(']') for p in parts if p]
        
        if not parts:
            # We've reached the end of the path, check the value
            if operator == '=':
                # Exact match (handle both string and numeric)
                try:
                    value_num = float(value)
                    if data == value or data == value_num:
                        matches.append({
                            "path": current_path,
                            "value": data
                        })
                except:
                    if str(data) == value:
                        matches.append({
                            "path": current_path,
                            "value": data
                        })
            elif operator == '~':
                # Pattern match
                if isinstance(data, str) and re.search(value, data, re.IGNORECASE):
                    matches.append({
                        "path": current_path,
                        "value": data
                    })
            return matches
        
        first_part = parts[0]
        rest_path = '.'.join(parts[1:]) if len(parts) > 1 else ""
        
        if first_part == '*':
            # Wildcard - search all items
            if isinstance(data, list):
                for i, item in enumerate(data):
                    new_path = f"{current_path}[{i}]" if current_path else f"[{i}]"
                    matches.extend(self._search_path(item, rest_path, operator, value, new_path))
            elif isinstance(data, dict):
                for key, item in data.items():
                    new_path = f"{current_path}.{key}" if current_path else key
                    matches.extend(self._search_path(item, rest_path, operator, value, new_path))
        else:
            # Specific key
            if isinstance(data, dict) and first_part in data:
                new_path = f"{current_path}.{first_part}" if current_path else first_part
                matches.extend(self._search_path(data[first_part], rest_path, operator, value, new_path))
            elif isinstance(data, list):
                # Try to parse as index
                try:
                    idx = int(first_part)
                    if 0 <= idx < len(data):
                        new_path = f"{current_path}[{idx}]" if current_path else f"[{idx}]"
                        matches.extend(self._search_path(data[idx], rest_path, operator, value, new_path))
                except:
                    pass
        
        return matches
    
    def search_text_enhanced(self, query: str) -> Dict[str, Any]:
        """Enhanced text search with better numeric matching."""
        all_results = {}
        
        # Try to parse query as number
        try:
            query_num = float(query)
            is_numeric = True
        except:
            query_num = None
            is_numeric = False
        
        query_lower = query.lower()
        
        for file_path in self.yaml_files:
            data = self._load_yaml_safe(file_path)
            if data is None:
                continue
            
            matches = self._search_text_in_dict_enhanced(data, query, query_lower, query_num, is_numeric, "")
            if matches:
                rel_path = str(file_path.relative_to(self.base_path))
                all_results[rel_path] = {
                    "file": rel_path,
                    "matches": matches,
                    "match_count": len(matches)
                }
        
        return {
            "query": query,
            "mode": "text_search_enhanced",
            "total_files": len(all_results),
            "results": all_results
        }
    
    def _search_text_in_dict_enhanced(self, data: Any, query: str, query_lower: str, 
                                     query_num: Optional[float], is_numeric: bool, path: str = "") -> List[Dict]:
        """Recursively search with enhanced numeric matching."""
        results = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                current_path = f"{path}.{key}" if path else key
                
                # Check if key matches
                if query_lower in key.lower():
                    results.append({
                        "path": current_path,
                        "type": "key",
                        "content": {key: value}
                    })
                
                # Recurse into value
                results.extend(self._search_text_in_dict_enhanced(value, query, query_lower, query_num, is_numeric, current_path))
        
        elif isinstance(data, list):
            for i, item in enumerate(data):
                current_path = f"{path}[{i}]"
                results.extend(self._search_text_in_dict_enhanced(item, query, query_lower, query_num, is_numeric, current_path))
        
        elif isinstance(data, str):
            # Check if text content matches
            if query_lower in data.lower():
                results.append({
                    "path": path,
                    "type": "value",
                    "content": data
                })
        
        elif isinstance(data, (int, float)):
            # Check numeric match
            if is_numeric and data == query_num:
                results.append({
                    "path": path,
                    "type": "value",
                    "content": data
                })
            # Also check string representation
            elif query_lower in str(data).lower():
                results.append({
                    "path": path,
                    "type": "value",
                    "content": data
                })
        
        return results


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Enhanced query tool for project documentation"
    )
    parser.add_argument(
        "--query", "-q",
        required=True,
        help="Search query"
    )
    parser.add_argument(
        "--mode", "-m",
        choices=["task", "path", "text", "file", "related"],
        default="text",
        help="Query mode (default: text)"
    )
    parser.add_argument(
        "--base-path", "-b",
        default=".",
        help="Base path of the project (default: current directory)"
    )
    parser.add_argument(
        "--pretty", "-p",
        action="store_true",
        help="Pretty print JSON output"
    )
    
    args = parser.parse_args()
    
    # Initialize tool
    tool = EnhancedDocQuery(args.base_path)
    
    # Execute query based on mode
    if args.mode == "task":
        results = tool.query_task(args.query)
    elif args.mode == "path":
        results = tool.query_path(args.query)
    elif args.mode == "text":
        results = tool.search_text_enhanced(args.query)
    elif args.mode == "file":
        # Use original file mode from old implementation
        from tools.doc_query_old import DocQueryTool
        base_tool = DocQueryTool(args.base_path)
        results = base_tool.get_file_content(args.query)
    elif args.mode == "related":
        from tools.doc_query_old import DocQueryTool
        base_tool = DocQueryTool(args.base_path)
        results = base_tool.find_related(args.query)
    
    # Output results
    if args.pretty:
        print(json.dumps(results, indent=2, default=str))
    else:
        print(json.dumps(results, default=str))


if __name__ == "__main__":
    main()