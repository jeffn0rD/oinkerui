# oinkerui Tools

This directory contains automation tools for task execution and project management.

## Available Tools

### 1. doc_query.py
**Purpose**: Contextual document retrieval from specifications, logs, and todos.

**Usage**:
```bash
python3 tools/doc_query.py --query "search term" --mode [text|key|file|related]
```

**Features**:
- Text search across YAML files
- YAML key/path search
- Full file content retrieval
- Related files discovery with relevance scoring
- JSON output for LLM consumption

See [doc_query.py](doc_query.py) for detailed documentation.

### 2. task_cleanup.py
**Purpose**: Automates task finalization and verification.

**Usage**:
```bash
python3 tools/task_cleanup.py --task-id TASK_ID [--dry-run] [--max-iterations N]
```

**Features**:
- Verifies task moved from master_todo.yaml to tasks_completed.yaml
- Checks required log files exist
- Runs YAML validation
- Executes task-specific tests
- Generates repair prompts for errors
- Commits and pushes repository

See [task_cleanup.py](task_cleanup.py) for detailed documentation.

### 3. task_executor.py
**Purpose**: Orchestrates task execution with automated prompt generation.

**Usage**:
```bash
python3 tools/task_executor.py --task-id TASK_ID [--generate-only]
python3 tools/task_executor.py --next [--generate-only]
```

**Features**:
- Reads tasks from master_todo.yaml
- Generates comprehensive orchestrator prompts
- Includes full prompt_guidance
- Provides execution instructions
- Integrates with task cleanup

See [task_executor.py](task_executor.py) for detailed documentation.

## Quick Start

### Execute Next Task

```bash
# Generate orchestrator prompt for next task
python3 tools/task_executor.py --next --generate-only

# Review the generated prompt
cat prompts/task_X.Y_orchestrator.md

# Execute the task following the prompt instructions

# Run cleanup when done
python3 tools/task_cleanup.py --task-id X.Y
```

### Validate YAML Files

```bash
# Validate all YAML files
python3 verify/validate_yaml.py --all

# Validate specific file
python3 verify/validate_yaml.py --file master_todo.yaml
```

### Query Documentation

```bash
# Search for text
python3 tools/doc_query.py --query "phase 0" --mode text --pretty

# Get file content
python3 tools/doc_query.py --query "domain.yaml" --mode file --pretty

# Find related files
python3 tools/doc_query.py --query "specification" --mode related --pretty
```

## Workflow

1. **Start Task**: `python3 tools/task_executor.py --next --generate-only`
2. **Execute Task**: Follow orchestrator prompt instructions
3. **Verify Completion**: `python3 tools/task_cleanup.py --task-id X.Y --dry-run`
4. **Finalize**: `python3 tools/task_cleanup.py --task-id X.Y`

## Documentation

For comprehensive documentation, see [docs/TOOLS.md](../docs/TOOLS.md).

## Requirements

- Python 3.9+
- PyYAML
- Git

## Notes

- All tools are designed to work with the oinkerui project structure
- Tools follow prompt_guidance from master_todo.yaml
- Generated prompts include context gathering instructions
- Cleanup tool ensures repository consistency before committing