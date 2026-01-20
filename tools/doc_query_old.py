#!/usr/bin/env python3
"""
Document Query Tool for oinkerui Project

This tool provides contextual document retrieval from specification files,
logs, and todos. It searches YAML files and returns relevant excerpts with
references in JSON format for LLM reasoning.

Usage:
    python doc_query.py --query "search term" [--mode text|key|file|related]
    
Modes:
    text    - Search for text content across all YAML files (default)
    key     - Search for specific YAML keys/paths
    file    - Retrieve full content of specific file(s)
    related - Find files related to a topic with relevance scoring
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import yaml


class DocQueryTool:
    """Tool for querying project documentation and specifications."""
    
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
            print(f"Warning: Could not load {file_path}: {e}", file=sys.stderr)
            return None
    
    def _search_text_in_dict(self, data: Any, query: str, path: str = "") -> List[Dict]:
        """Recursively search for text in nested dictionary/list structures."""
        results = []
        query_lower = query.lower()
        
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
                results.extend(self._search_text_in_dict(value, query, current_path))
        
        elif isinstance(data, list):
            for i, item in enumerate(data):
                current_path = f"{path}[{i}]"
                results.extend(self._search_text_in_dict(item, query, current_path))
        
        elif isinstance(data, str):
            # Check if text content matches
            if query_lower in data.lower():
                results.append({
                    "path": path,
                    "type": "value",
                    "content": data
                })
        
        return results
    
    def search_text(self, query: str) -> Dict[str, Any]:
        """Search for text content across all YAML files."""
        all_results = {}
        
        for file_path in self.yaml_files:
            data = self._load_yaml_safe(file_path)
            if data is None:
                continue
            
            matches = self._search_text_in_dict(data, query)
            if matches:
                rel_path = str(file_path.relative_to(self.base_path))
                all_results[rel_path] = {
                    "file": rel_path,
                    "matches": matches,
                    "match_count": len(matches)
                }
        
        return {
            "query": query,
            "mode": "text_search",
            "total_files": len(all_results),
            "results": all_results
        }
    
    def search_key(self, key_path: str) -> Dict[str, Any]:
        """Search for specific YAML key paths."""
        all_results = {}
        
        for file_path in self.yaml_files:
            data = self._load_yaml_safe(file_path)
            if data is None:
                continue
            
            # Try to navigate to the key path
            value = self._get_nested_value(data, key_path)
            if value is not None:
                rel_path = str(file_path.relative_to(self.base_path))
                all_results[rel_path] = {
                    "file": rel_path,
                    "key_path": key_path,
                    "value": value
                }
        
        return {
            "query": key_path,
            "mode": "key_search",
            "total_files": len(all_results),
            "results": all_results
        }
    
    def _get_nested_value(self, data: Any, path: str) -> Optional[Any]:
        """Get value from nested dictionary using dot notation."""
        parts = path.split('.')
        current = data
        
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        
        return current
    
    def get_file_content(self, file_pattern: str) -> Dict[str, Any]:
        """Retrieve full content of files matching pattern."""
        results = {}
        
        for file_path in self.yaml_files:
            rel_path = str(file_path.relative_to(self.base_path))
            if file_pattern in rel_path:
                data = self._load_yaml_safe(file_path)
                if data is not None:
                    results[rel_path] = {
                        "file": rel_path,
                        "content": data
                    }
        
        return {
            "query": file_pattern,
            "mode": "file_content",
            "total_files": len(results),
            "results": results
        }
    
    def find_related(self, topic: str) -> Dict[str, Any]:
        """Find files related to a topic with relevance scoring."""
        scored_files = []
        
        for file_path in self.yaml_files:
            data = self._load_yaml_safe(file_path)
            if data is None:
                continue
            
            # Calculate relevance score
            score = self._calculate_relevance(data, topic, file_path)
            if score > 0:
                rel_path = str(file_path.relative_to(self.base_path))
                scored_files.append({
                    "file": rel_path,
                    "relevance_score": score,
                    "preview": self._get_preview(data, topic)
                })
        
        # Sort by relevance score
        scored_files.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return {
            "query": topic,
            "mode": "related_files",
            "total_files": len(scored_files),
            "results": scored_files
        }
    
    def _calculate_relevance(self, data: Any, topic: str, file_path: Path) -> int:
        """Calculate relevance score for a file based on topic."""
        score = 0
        topic_lower = topic.lower()
        
        # Check filename
        if topic_lower in str(file_path).lower():
            score += 10
        
        # Convert data to string and count occurrences
        data_str = json.dumps(data, default=str).lower()
        score += data_str.count(topic_lower) * 2
        
        return score
    
    def _get_preview(self, data: Any, topic: str, max_length: int = 200) -> str:
        """Get a preview of content related to the topic."""
        data_str = json.dumps(data, indent=2, default=str)
        topic_lower = topic.lower()
        data_lower = data_str.lower()
        
        # Find first occurrence
        idx = data_lower.find(topic_lower)
        if idx == -1:
            return data_str[:max_length] + "..."
        
        # Get context around the match
        start = max(0, idx - 50)
        end = min(len(data_str), idx + max_length)
        preview = data_str[start:end]
        
        if start > 0:
            preview = "..." + preview
        if end < len(data_str):
            preview = preview + "..."
        
        return preview


def main():
    """Main entry point for the tool."""
    parser = argparse.ArgumentParser(
        description="Query project documentation and specifications"
    )
    parser.add_argument(
        "--query", "-q",
        required=True,
        help="Search query or topic"
    )
    parser.add_argument(
        "--mode", "-m",
        choices=["text", "key", "file", "related"],
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
    tool = DocQueryTool(args.base_path)
    
    # Execute query based on mode
    if args.mode == "text":
        results = tool.search_text(args.query)
    elif args.mode == "key":
        results = tool.search_key(args.query)
    elif args.mode == "file":
        results = tool.get_file_content(args.query)
    elif args.mode == "related":
        results = tool.find_related(args.query)
    
    # Output results
    if args.pretty:
        print(json.dumps(results, indent=2, default=str))
    else:
        print(json.dumps(results, default=str))


if __name__ == "__main__":
    main()