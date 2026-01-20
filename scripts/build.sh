#!/bin/bash
set -e

echo "Building OinkerUI for production..."

# Build frontend
echo "Building frontend..."
cd frontend && npm run build
cd ..

# Verify backend files
echo "Verifying backend files..."
if [ ! -f backend/src/index.js ]; then
    echo "Error: Backend files not found"
    exit 1
fi

echo "Build complete!"
echo "Frontend build: frontend/dist/"
echo "Backend: backend/src/"
echo "Python tools: backend_python/src/"