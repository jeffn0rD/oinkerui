# Document Query Tool Guide

## Overview

The `doc_query.py` tool provides powerful querying capabilities for project documentation, specifications, and task information. It's designed to help LLMs and developers quickly find relevant information.

## Query Modes

### 1. Task Mode (Recommended for Task Queries)

**Purpose**: Get complete information about a specific task, including related files and prompts.

**Usage**:
```bash
python3 tools/doc_query.py --query "0.2" --mode task --pretty
```

**Returns**:
- Task details from master_todo.yaml (if current)
- Task details from tasks_completed.yaml (if completed)
- Related summary file (log/task_X.Y_summary.yaml)
- Related notes file (log/task_X.Y_notes.yaml)
- Prompt file content (if specified)

**Example Output**:
```json
{
  "task_found": true,
  "current_task": {
    "file": "master_todo.yaml",
    "task": {
      "id": 0.2,
      "name": "Create Root Project Structure",
      "goal": "...",
      "prompt": "./prompts/dev/prompt_0_2_1.md",
      "files": ["..."],
      "details": {...}
    },
    "prompt_file": "...",
    "related_specs": [...]
  },
  "related_files": [...]
}
```

### 2. Path Mode (Structured Queries with Predicates)

**Purpose**: Query using structured path notation with powerful predicate filtering.

**New Predicate Syntax** (v3):
- `path.to.array[*].{predicate}` - Filter array elements using predicates
- Returns the **ancestor node** (entire object) when predicate matches

**Predicate Operators**:
- **Comparison**: `=`, `!=`, `~` (regex), `!~` (not regex), `>`, `<`, `>=`, `<=`
- **Logical**: `AND`, `OR`, `NOT`

**Predicate Examples**:
```bash
# Find task by name pattern (returns entire task object)
python3 tools/doc_query.py --query "current[*].task.{name~Frontend}" --mode path --pretty

# Find task by exact ID
python3 tools/doc_query.py --query "current[*].task.{id=0.2}" --mode path --pretty

# Find tasks NOT completed
python3 tools/doc_query.py --query "current[*].task.{NOT status=completed}" --mode path --pretty

# Complex predicate with AND
python3 tools/doc_query.py --query "current[*].task.{name~Frontend AND status=active}" --mode path --pretty

# Complex predicate with OR
python3 tools/doc_query.py --query "current[*].task.{id=0.2 OR id=0.3}" --mode path --pretty

# Numeric comparison
python3 tools/doc_query.py --query "current[*].task.{priority>3}" --mode path --pretty
```

**Legacy Syntax** (still supported):
- `path.to.key=value` - Exact match
- `path.to.key~pattern` - Pattern match (regex)
- `path[*].key` - Wildcard for arrays
- `path.*.key` - Wildcard for objects

**Examples**:
```bash
# Find task with specific ID
python3 tools/doc_query.py --query "current[*].task.id=0.2" --mode path --pretty

# Find tasks with "Node" in name
python3 tools/doc_query.py --query "current[*].task.name~Node" --mode path --pretty

# Find all phase IDs
python3 tools/doc_query.py --query "phases[*].phase_id=1" --mode path --pretty
```

**Returns**:
```json
{
  "matches": [
    {
      "file": "master_todo.yaml",
      "results": [
        {
          "path": "current[0].task.id",
          "value": 0.2
        }
      ]
    }
  ]
}
```

### 3. Text Mode (Enhanced)

**Purpose**: Search for text content with improved numeric matching.

**Usage**:
```bash
python3 tools/doc_query.py --query "0.2" --mode text --pretty
python3 tools/doc_query.py --query "phase 0" --mode text --pretty
```

**Features**:
- Searches both string and numeric values
- Matches "0.2" as both text and number
- Returns path to each match
- Shows match count per file

### 4. File Mode

**Purpose**: Retrieve complete content of specific files.

**Usage**:
```bash
python3 tools/doc_query.py --query "master_todo.yaml" --mode file --pretty
python3 tools/doc_query.py --query "spec.yaml" --mode file --pretty
```

### 5. Key Mode

**Purpose**: Search for specific YAML keys/paths.

**Usage**:
```bash
python3 tools/doc_query.py --query "title" --mode key --pretty
python3 tools/doc_query.py --query "prompt_guidance" --mode key --pretty
```

### 6. Related Mode

**Purpose**: Find files related to a topic with relevance scoring.

**Usage**:
```bash
python3 tools/doc_query.py --query "specification" --mode related --pretty
python3 tools/doc_query.py --query "domain" --mode related --pretty
```

## Best Practices

### For Task Execution

1. **Always start with task mode**:
   ```bash
   python3 tools/doc_query.py --query "0.2" --mode task --pretty
   ```

2. **Get related specifications**:
   ```bash
   python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
   ```

3. **Search for specific concepts**:
   ```bash
   python3 tools/doc_query.py --query "current[*].task.name~Frontend" --mode path --pretty
   ```

### For Research

1. **Find related files first**:
   ```bash
   python3 tools/doc_query.py --query "authentication" --mode related --pretty
   ```

2. **Then get specific content**:
   ```bash
   python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty
   ```

### For Verification

1. **Check if task exists**:
   ```bash
   python3 tools/doc_query.py --query "0.5" --mode task --pretty
   ```

2. **Verify task completion**:
   ```bash
   python3 tools/doc_query.py --query "tasks[*].task.id=0.1" --mode path --pretty
   ```

## Common Patterns

### Finding All Tasks
```bash
# Get all current tasks
python3 tools/doc_query.py --query "master_todo.yaml" --mode file --pretty

# Find specific task by name pattern
python3 tools/doc_query.py --query "current[*].task.name~Python" --mode path --pretty
```

### Getting Task Context
```bash
# Complete task information
python3 tools/doc_query.py --query "0.3" --mode task --pretty

# Task's prompt file
python3 tools/doc_query.py --query "prompts/dev/prompt_0_2_2.md" --mode file --pretty

# Related specifications
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```

### Searching Documentation
```bash
# Find all references to a concept
python3 tools/doc_query.py --query "Fastify" --mode text --pretty

# Find files about a topic
python3 tools/doc_query.py --query "workflow" --mode related --pretty
```

## Integration with Tools

### In task_executor.py

The task executor automatically generates query commands in orchestrator prompts:

```markdown
## Context Gathering

```bash
# Get complete task information
python3 tools/doc_query.py --query "0.2" --mode task --pretty

# Get spec/apis.yaml content
python3 tools/doc_query.py --query "spec/apis.yaml" --mode file --pretty
```
```

### In task_cleanup.py

Task cleanup uses queries to verify task completion:

```python
# Check if task is in master_todo.yaml
results = subprocess.run([
    "python3", "tools/doc_query.py",
    "--query", f"current[*].task.id={task_id}",
    "--mode", "path"
])
```

## Tips

1. **Use task mode for task queries** - It's specifically designed for this and returns all related information
2. **Use path mode for precise lookups** - When you know the exact structure
3. **Use text mode for exploration** - When you're not sure where information is
4. **Use file mode for complete context** - When you need the full file
5. **Always use --pretty for human-readable output**

## Troubleshooting

## Predicate System (v3)

### Overview

The predicate system allows you to filter data using complex expressions. When a predicate matches, the tool returns the **ancestor node** (the entire object containing the matched field), not just the matched field value.

### Predicate Syntax

```
path.to.array[*].{predicate_expression}
```

### Supported Operators

#### Comparison Operators
- `=` - Equals (exact match, works with strings and numbers)
- `!=` - Not equals
- `~` - Regex match (case-insensitive)
- `!~` - Regex not match
- `>` - Greater than (numeric)
- `<` - Less than (numeric)
- `>=` - Greater than or equal
- `<=` - Less than or equal

#### Logical Operators
- `AND` or `&&` - Logical AND
- `OR` or `||` - Logical OR
- `NOT` or `!` - Logical NOT (prefix)

### Predicate Examples

#### Simple Predicates
```bash
# Find task where name contains "Frontend"
python3 tools/doc_query.py --query "current[*].task.{name~Frontend}" --mode path --pretty

# Find task with exact ID
python3 tools/doc_query.py --query "current[*].task.{id=0.2}" --mode path --pretty

# Find tasks with priority greater than 3
python3 tools/doc_query.py --query "current[*].task.{priority>3}" --mode path --pretty
```

#### Complex Predicates with Logical Operators
```bash
# AND: Find tasks matching multiple conditions
python3 tools/doc_query.py --query "current[*].task.{name~Frontend AND status=active}" --mode path --pretty

# OR: Find tasks matching any condition
python3 tools/doc_query.py --query "current[*].task.{id=0.2 OR id=0.3}" --mode path --pretty

# NOT: Find tasks not matching condition
python3 tools/doc_query.py --query "current[*].task.{NOT status=completed}" --mode path --pretty

# Complex: Combine multiple operators
python3 tools/doc_query.py --query "current[*].task.{name~Frontend AND priority>3 AND NOT status=completed}" --mode path --pretty
```

#### Nested Field Access
```bash
# Access nested fields using dot notation
python3 tools/doc_query.py --query "current[*].task.{details.focus~Svelte}" --mode path --pretty
```

### Ancestor Node Return

**Key Feature**: Predicates return the ancestor node, not just the matched field.

Example:
```bash
# Query: Find task where name contains "Frontend"
python3 tools/doc_query.py --query "current[*].task.{name~Frontend}" --mode path --pretty

# Returns: The entire task object
{
  "matches": [{
    "file": "master_todo.yaml",
    "results": [{
      "path": "current[3].task",
      "value": {
        "id": 0.5,
        "name": "Initialize Svelte Frontend",
        "goal": "...",
        "prompt": "...",
        "files": [...],
        "details": {...}
      }
    }]
  }]
}
```

### Backward Compatibility

The legacy path syntax (without predicates) is still fully supported:

```bash
# Legacy syntax (still works)
python3 tools/doc_query.py --query "current[*].task.id=0.2" --mode path --pretty

# New predicate syntax (recommended)
python3 tools/doc_query.py --query "current[*].task.{id=0.2}" --mode path --pretty
```

## Troubleshooting

### Query returns no results

- Check if the file exists and is a YAML file
- Try text mode first to see if the content exists
- Use file mode to see the complete structure
- Check for typos in path queries
- For predicates, ensure the field path is correct

### Numeric values not matching

- The tool now handles both string and numeric matching
- "0.2" will match both the string "0.2" and the number 0.2
- Use task mode for task IDs - it handles this automatically

### Path queries not working

- Ensure proper syntax: `path.to.key=value` or `path.to.key~pattern`
- For predicates: `path.to.array[*].{field=value}`
- Use `[*]` for array wildcards
- Check that the path exists using file mode first

### Predicate not matching

- Verify field names are correct (case-sensitive)
- For nested fields, use dot notation: `field.subfield`
- For regex patterns, ensure proper escaping
- Test with simpler predicates first, then add complexity