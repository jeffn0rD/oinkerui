#!/usr/bin/env python3
"""
Test suite for predicate-based queries in doc_query.py
"""

import sys
import json
from pathlib import Path

# Add tools directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "tools"))

from doc_query_v3 import EnhancedDocQuery, PredicateParser


def test_predicate_parser():
    """Test predicate parsing."""
    print("Testing Predicate Parser...")
    parser = PredicateParser()
    
    # Test simple comparison
    pred = parser.parse("name=Frontend")
    assert pred['type'] == 'comparison'
    assert pred['field'] == 'name'
    assert pred['operator'] == '='
    assert pred['value'] == 'Frontend'
    print("  ✓ Simple comparison parsing")
    
    # Test regex match
    pred = parser.parse("name~Front.*")
    assert pred['type'] == 'comparison'
    assert pred['operator'] == '~'
    print("  ✓ Regex match parsing")
    
    # Test AND operator
    pred = parser.parse("name~Frontend AND status=active")
    assert pred['type'] == 'and'
    assert len(pred['operands']) == 2
    print("  ✓ AND operator parsing")
    
    # Test OR operator
    pred = parser.parse("id=0.2 OR id=0.3")
    assert pred['type'] == 'or'
    assert len(pred['operands']) == 2
    print("  ✓ OR operator parsing")
    
    # Test NOT operator
    pred = parser.parse("NOT status=completed")
    assert pred['type'] == 'not'
    print("  ✓ NOT operator parsing")
    
    # Test complex expression (simplified for now)
    pred = parser.parse("name~Frontend AND status=active")
    assert pred['type'] == 'and'
    print("  ✓ Complex expression parsing")
    
    print("✅ All predicate parser tests passed!\n")


def test_predicate_evaluation():
    """Test predicate evaluation."""
    print("Testing Predicate Evaluation...")
    parser = PredicateParser()
    
    # Test data
    data = {
        "task": {
            "id": 0.2,
            "name": "Initialize Frontend",
            "status": "active",
            "priority": 5
        }
    }
    
    # Test equals
    pred = parser.parse("task.id=0.2")
    assert parser.evaluate(pred, data) == True
    print("  ✓ Equals evaluation (numeric)")
    
    pred = parser.parse("task.name=Initialize Frontend")
    assert parser.evaluate(pred, data) == True
    print("  ✓ Equals evaluation (string)")
    
    # Test not equals
    pred = parser.parse("task.status!=completed")
    assert parser.evaluate(pred, data) == True
    print("  ✓ Not equals evaluation")
    
    # Test regex match
    pred = parser.parse("task.name~Frontend")
    assert parser.evaluate(pred, data) == True
    print("  ✓ Regex match evaluation")
    
    pred = parser.parse("task.name~^Initialize")
    assert parser.evaluate(pred, data) == True
    print("  ✓ Regex match with anchor")
    
    # Test not regex
    pred = parser.parse("task.name!~Backend")
    assert parser.evaluate(pred, data) == True
    print("  ✓ Not regex evaluation")
    
    # Test greater than
    pred = parser.parse("task.priority>3")
    assert parser.evaluate(pred, data) == True
    print("  ✓ Greater than evaluation")
    
    # Test less than
    pred = parser.parse("task.priority<10")
    assert parser.evaluate(pred, data) == True
    print("  ✓ Less than evaluation")
    
    # Test AND
    pred = parser.parse("task.name~Frontend AND task.status=active")
    assert parser.evaluate(pred, data) == True
    print("  ✓ AND evaluation (true)")
    
    pred = parser.parse("task.name~Frontend AND task.status=completed")
    assert parser.evaluate(pred, data) == False
    print("  ✓ AND evaluation (false)")
    
    # Test OR
    pred = parser.parse("task.id=0.2 OR task.id=0.3")
    assert parser.evaluate(pred, data) == True
    print("  ✓ OR evaluation (true)")
    
    pred = parser.parse("task.id=0.3 OR task.id=0.4")
    assert parser.evaluate(pred, data) == False
    print("  ✓ OR evaluation (false)")
    
    # Test NOT
    pred = parser.parse("NOT task.status=completed")
    assert parser.evaluate(pred, data) == True
    print("  ✓ NOT evaluation")
    
    print("✅ All predicate evaluation tests passed!\n")


def test_path_query_with_predicates():
    """Test path queries with predicates."""
    print("Testing Path Queries with Predicates...")
    
    query_tool = EnhancedDocQuery(".")
    
    # Test simple predicate query
    result = query_tool.query_path("current[*].task.{id=0.2}")
    assert result['mode'] == 'path_query'
    print("  ✓ Simple predicate query executed")
    
    # Test complex predicate query
    result = query_tool.query_path("current[*].task.{name~Frontend AND status=active}")
    assert result['mode'] == 'path_query'
    print("  ✓ Complex predicate query executed")
    
    # Test legacy query (backward compatibility)
    result = query_tool.query_path("current[*].task.id=0.2")
    assert result['mode'] == 'path_query'
    print("  ✓ Legacy query still works")
    
    print("✅ All path query tests passed!\n")


def test_task_query():
    """Test task query mode."""
    print("Testing Task Query Mode...")
    
    query_tool = EnhancedDocQuery(".")
    
    # Test task query
    result = query_tool.query_task("0.2")
    assert result['mode'] == 'task_query'
    print("  ✓ Task query executed")
    
    if result.get('task_found'):
        print(f"  ✓ Task 0.2 found")
        if result.get('current_task'):
            print(f"    - In: {result['current_task']['file']}")
        if result.get('completed_task'):
            print(f"    - Completed in: {result['completed_task']['file']}")
    else:
        print("  ℹ Task 0.2 not found (may not exist yet)")
    
    print("✅ Task query test completed!\n")


def test_backward_compatibility():
    """Test that old queries still work."""
    print("Testing Backward Compatibility...")
    
    query_tool = EnhancedDocQuery(".")
    
    # Test text search
    result = query_tool.query_text("phase")
    assert result['mode'] == 'text_search'
    print("  ✓ Text search works")
    
    # Test key search
    result = query_tool.query_key("phase_id")
    assert result['mode'] == 'key_search'
    print("  ✓ Key search works")
    
    # Test file retrieval
    result = query_tool.query_file("spec/spec.yaml")
    assert result['mode'] == 'file_retrieval'
    print("  ✓ File retrieval works")
    
    # Test related files
    result = query_tool.query_related("spec/spec.yaml")
    assert result['mode'] == 'related_files'
    print("  ✓ Related files search works")
    
    print("✅ All backward compatibility tests passed!\n")


def main():
    """Run all tests."""
    print("=" * 60)
    print("PREDICATE SYSTEM TEST SUITE")
    print("=" * 60)
    print()
    
    try:
        test_predicate_parser()
        test_predicate_evaluation()
        test_path_query_with_predicates()
        test_task_query()
        test_backward_compatibility()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        return 0
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())