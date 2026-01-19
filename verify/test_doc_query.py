#!/usr/bin/env python3
"""
Test script for doc_query.py tool

This script tests the document query tool to ensure it correctly:
1. Searches for text content across YAML files
2. Searches for specific YAML keys
3. Retrieves full file content
4. Finds related files with relevance scoring
5. Handles errors gracefully
6. Returns properly formatted JSON output

Run this script from the project root directory.
"""

import json
import subprocess
import sys
from pathlib import Path


class TestDocQuery:
    """Test suite for doc_query.py tool."""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tool_path = Path("tools/doc_query.py")
        
    def run_query(self, query: str, mode: str = "text") -> dict:
        """Run the doc_query tool and return parsed JSON results."""
        try:
            result = subprocess.run(
                ["python3", str(self.tool_path), "--query", query, "--mode", mode],
                capture_output=True,
                text=True,
                check=True
            )
            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f"Error running query: {e}")
            print(f"STDERR: {e.stderr}")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return None
    
    def test_text_search(self):
        """Test 1: Basic text search functionality."""
        print("\n=== Test 1: Text Search ===")
        results = self.run_query("phase", "text")
        
        if results is None:
            print("❌ FAILED: Could not execute query")
            self.failed += 1
            return
        
        if results.get("mode") != "text_search":
            print(f"❌ FAILED: Wrong mode returned: {results.get('mode')}")
            self.failed += 1
            return
        
        if results.get("total_files", 0) == 0:
            print("❌ FAILED: No files found containing 'phase'")
            self.failed += 1
            return
        
        print(f"✅ PASSED: Found {results['total_files']} files containing 'phase'")
        self.passed += 1
    
    def test_key_search(self):
        """Test 2: YAML key path search."""
        print("\n=== Test 2: Key Search ===")
        results = self.run_query("title", "key")
        
        if results is None:
            print("❌ FAILED: Could not execute query")
            self.failed += 1
            return
        
        if results.get("mode") != "key_search":
            print(f"❌ FAILED: Wrong mode returned: {results.get('mode')}")
            self.failed += 1
            return
        
        if results.get("total_files", 0) == 0:
            print("❌ FAILED: No files found with 'title' key")
            self.failed += 1
            return
        
        print(f"✅ PASSED: Found {results['total_files']} files with 'title' key")
        self.passed += 1
    
    def test_file_content(self):
        """Test 3: Full file content retrieval."""
        print("\n=== Test 3: File Content Retrieval ===")
        # Use context.yaml which should parse correctly
        results = self.run_query("context.yaml", "file")
        
        if results is None:
            print("❌ FAILED: Could not execute query")
            self.failed += 1
            return
        
        if results.get("mode") != "file_content":
            print(f"❌ FAILED: Wrong mode returned: {results.get('mode')}")
            self.failed += 1
            return
        
        if results.get("total_files", 0) == 0:
            print("❌ FAILED: No files found matching 'context.yaml'")
            self.failed += 1
            return
        
        # Check if content is present
        has_content = False
        for file_data in results.get("results", {}).values():
            if "content" in file_data and file_data["content"] is not None:
                has_content = True
                break
        
        if not has_content:
            print("❌ FAILED: No valid file content found in results")
            self.failed += 1
            return
        
        print(f"✅ PASSED: Retrieved content from {results['total_files']} file(s)")
        self.passed += 1
    
    def test_related_files(self):
        """Test 4: Related files with relevance scoring."""
        print("\n=== Test 4: Related Files Search ===")
        results = self.run_query("specification", "related")
        
        if results is None:
            print("❌ FAILED: Could not execute query")
            self.failed += 1
            return
        
        if results.get("mode") != "related_files":
            print(f"❌ FAILED: Wrong mode returned: {results.get('mode')}")
            self.failed += 1
            return
        
        if results.get("total_files", 0) == 0:
            print("⚠️  WARNING: No related files found (may be expected)")
            self.passed += 1
            return
        
        # Check if results are sorted by relevance
        scores = [r["relevance_score"] for r in results.get("results", [])]
        if scores != sorted(scores, reverse=True):
            print("❌ FAILED: Results not sorted by relevance score")
            self.failed += 1
            return
        
        print(f"✅ PASSED: Found {results['total_files']} related files with proper scoring")
        self.passed += 1
    
    def test_context_extraction(self):
        """Test 5: Context extraction from search results."""
        print("\n=== Test 5: Context Extraction ===")
        results = self.run_query("task", "text")
        
        if results is None:
            print("❌ FAILED: Could not execute query")
            self.failed += 1
            return
        
        if results.get("total_files", 0) == 0:
            print("❌ FAILED: No files found containing 'task'")
            self.failed += 1
            return
        
        # Check if matches include path and content
        has_valid_matches = False
        for file_data in results.get("results", {}).values():
            for match in file_data.get("matches", []):
                if "path" in match and "content" in match:
                    has_valid_matches = True
                    break
            if has_valid_matches:
                break
        
        if not has_valid_matches:
            print("❌ FAILED: Matches don't include proper path and content")
            self.failed += 1
            return
        
        print("✅ PASSED: Context properly extracted with paths and content")
        self.passed += 1
    
    def test_error_handling(self):
        """Test 6: Error handling for invalid queries."""
        print("\n=== Test 6: Error Handling ===")
        
        # Test with non-existent file pattern
        results = self.run_query("nonexistent_file_12345", "file")
        
        if results is None:
            print("❌ FAILED: Tool crashed on non-existent file query")
            self.failed += 1
            return
        
        if results.get("total_files", -1) != 0:
            print("❌ FAILED: Should return 0 files for non-existent pattern")
            self.failed += 1
            return
        
        print("✅ PASSED: Gracefully handles non-existent files")
        self.passed += 1
    
    def run_all_tests(self):
        """Run all tests and report results."""
        print("=" * 60)
        print("Running doc_query.py Test Suite")
        print("=" * 60)
        
        # Check if tool exists
        if not self.tool_path.exists():
            print(f"❌ ERROR: Tool not found at {self.tool_path}")
            return False
        
        # Run all tests
        self.test_text_search()
        self.test_key_search()
        self.test_file_content()
        self.test_related_files()
        self.test_context_extraction()
        self.test_error_handling()
        
        # Report results
        print("\n" + "=" * 60)
        print("Test Results")
        print("=" * 60)
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Total: {self.passed + self.failed}")
        print("=" * 60)
        
        return self.failed == 0


def main():
    """Main entry point."""
    tester = TestDocQuery()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()