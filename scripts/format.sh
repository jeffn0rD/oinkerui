#!/bin/bash
set -e

echo "Formatting code..."

# Format Node.js
npm run format

# Format Python
source venv/bin/activate
black backend_python/src

# Format frontend
cd frontend && npm run format
cd ..

echo "Code formatting complete!"