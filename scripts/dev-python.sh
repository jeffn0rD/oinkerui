#!/bin/bash
set -e
source venv/bin/activate 2>/dev/null || true
cd backend_python && python src/main.py