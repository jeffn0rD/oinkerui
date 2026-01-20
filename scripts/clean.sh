#!/bin/bash

echo "Cleaning build artifacts..."

# Clean Node.js
rm -rf node_modules
rm -rf backend/node_modules
rm -f package-lock.json

# Clean frontend
rm -rf frontend/node_modules
rm -rf frontend/dist
rm -f frontend/package-lock.json

# Clean Python
rm -rf venv
rm -rf backend_python/__pycache__
rm -rf backend_python/**/__pycache__
rm -rf backend_python/.pytest_cache
rm -rf backend_python/.mypy_cache

# Clean workspace directories (optional - commented out for safety)
# rm -rf workspaces/*
# rm -rf data/*

echo "Clean complete!"