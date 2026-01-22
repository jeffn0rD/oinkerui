#!/bin/bash
set -e

echo "Running all tests..."

# Run backend tests
echo "Running Node.js backend tests..."
cd backend && npx jest
cd ..

# Run Python tests
echo "Running Python tests..."
source venv/bin/activate
cd backend_python && pytest
cd ..

# Run frontend tests
echo "Running frontend tests..."
cd frontend && npm run test
cd ..

echo "All tests passed!"