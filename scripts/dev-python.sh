#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

source venv/bin/activate 2>/dev/null || true
PYTHONPATH="$PROJECT_ROOT/backend_python:$PYTHONPATH" python backend_python/src/main.py