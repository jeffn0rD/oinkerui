# Enhanced Document Query with Predicates - Changelog

## Version 3.0 - Predicate System

### New Features

#### 1. Predicate-Based Filtering
- **Syntax**: `path.to.array[*].{predicate_expression}`
- **Returns**: Ancestor nodes (entire objects) instead of just matched fields
- **Example**: `current[*].task.{name~Frontend}` returns the entire task object

#### 2. Comparison Operators
- `=` - Equals (exact match, works with strings and numbers)
- `!=` - Not equals
- `~` - Regex match (case-insensitive)
- `!~` - Regex not match
- `>` - Greater than (numeric)
- `<` - Less than (numeric)
- `>=` - Greater than or equal
- `<=` - Less than or equal

#### 3. Logical Operators
- `AND` or `&&` - Logical AND
- `OR` or `||` - Logical OR
- `NOT` or `!` - Logical NOT (prefix)

#### 4. Complex Expressions
```bash
# Multiple conditions with AND
python3 tools/doc_query.py --query "current[*].task.{name~Frontend AND status=active}" --mode path

# Multiple conditions with OR
python3 tools/doc_query.py --query "current[*].task.{id=0.2 OR id=0.3}" --mode path

# Negation with NOT
python3 tools/doc_query.py --query "current[*].task.{NOT status=completed}" --mode path
```

#### 5. Nested Field Access
```bash
# Access nested fields using dot notation
python3 tools/doc_query.py --query "current[*].task.{details.focus~Svelte}" --mode path
```

### Enhanced Components

#### doc_query.py (v3)
- Added `PredicateParser` class for parsing and evaluating predicates
- Enhanced `EnhancedDocQuery` class with predicate support
- Maintains full backward compatibility with legacy syntax
- Returns ancestor nodes when predicates match

#### task_executor.py (v2)
- Now uses `EnhancedDocQuery` class for all YAML operations
- Generates better context gathering commands with predicate examples
- Improved task finding logic using predicate queries
- Better error handling and reporting

#### Templates Updated
- `orchestrator_prompt.md` - Added predicate syntax examples
- Context gathering section now shows predicate usage

### Documentation

#### New Files
- `docs/PREDICATE_DESIGN.md` - Design document for predicate system
- `verify/test_predicates.py` - Comprehensive test suite for predicates

#### Updated Files
- `docs/DOC_QUERY_GUIDE.md` - Added comprehensive predicate documentation
- `docs/TOOLS.md` - Updated with predicate examples and features

### Testing

All tests pass:
- ✅ Predicate parser tests (6 tests)
- ✅ Predicate evaluation tests (13 tests)
- ✅ Path query tests (3 tests)
- ✅ Task query tests
- ✅ Backward compatibility tests (4 tests)

### Backward Compatibility

All existing query modes and syntax remain fully functional:
- Text search mode
- Key search mode
- File retrieval mode
- Related files mode
- Task query mode
- Legacy path queries (without predicates)

### Migration Guide

#### Old Way (still works)
```bash
python3 tools/doc_query.py --query "current[*].task.id=0.2" --mode path
```

#### New Way (recommended)
```bash
python3 tools/doc_query.py --query "current[*].task.{id=0.2}" --mode path
```

#### Benefits of New Syntax
1. Returns entire object (ancestor node) instead of just the matched field
2. Supports complex filtering with logical operators
3. More powerful and flexible
4. Better for LLM context gathering

### Examples

#### Find Task by Name Pattern
```bash
python3 tools/doc_query.py --query "current[*].task.{name~Frontend}" --mode path --pretty
```

Returns:
```json
{
  "matches": [{
    "file": "master_todo.yaml",
    "results": [{
      "path": "current[3].task",
      "value": {
        "id": 0.5,
        "name": "Initialize Svelte Frontend",
        "goal": "Set up Svelte frontend with Vite and Tailwind CSS.",
        "prompt": "./prompts/dev/prompt_0_2_4.md",
        "files": [...],
        "details": {...}
      }
    }]
  }]
}
```

#### Complex Query
```bash
python3 tools/doc_query.py --query "current[*].task.{name~Frontend AND priority>3 AND NOT status=completed}" --mode path --pretty
```

### Performance

- Predicate evaluation is efficient and scales well
- No performance degradation for legacy queries
- Minimal overhead for predicate parsing

### Future Enhancements

Potential future additions:
- Parentheses support for complex logical expressions
- Additional operators (contains, startswith, endswith)
- Array element predicates
- Cross-file queries