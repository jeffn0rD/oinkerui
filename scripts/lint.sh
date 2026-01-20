#!/bin/bash
set -e

echo "Running linters..."

# Lint Node.js backend
echo "Linting Node.js backend..."
npm run lint

# Lint Python
echo "Linting Python..."
source venv/bin/activate
flake8 backend_python/src
mypy backend_python/src

# Lint frontend
echo "Linting frontend..."
cd frontend && npm run lint
cd ..

echo "All linting passed!"