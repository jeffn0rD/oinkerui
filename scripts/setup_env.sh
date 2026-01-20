#!/bin/bash

echo "========================================"
echo "OinkerUI Environment Setup"
echo "========================================"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and set your OPENROUTER_API_KEY"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Create workspace directories
echo "Creating workspace directories..."
mkdir -p workspaces
mkdir -p data
mkdir -p backend_python/templates
mkdir -p backend_python/sandboxes
echo "✓ Workspace directories created"
echo ""

# Verify directories
echo "Verifying directory structure..."
dirs=("workspaces" "data" "backend_python/templates" "backend_python/sandboxes")
all_exist=true

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir"
    else
        echo "  ✗ $dir (missing)"
        all_exist=false
    fi
done

echo ""

if [ "$all_exist" = true ]; then
    echo "✓ All directories created successfully"
else
    echo "⚠️  Some directories are missing"
fi

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit .env and set your OPENROUTER_API_KEY"
echo "2. Run 'npm install' to install Node.js dependencies"
echo "3. Run 'pip install -r requirements.txt' to install Python dependencies"
echo "4. Start the development servers:"
echo "   - Node.js backend: npm run dev"
echo "   - Python backend: python backend_python/src/main.py"
echo "   - Frontend: cd frontend && npm run dev"
echo ""