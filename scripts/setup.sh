#!/bin/bash
set -e

echo "Setting up OinkerUI development environment..."

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install
cd ..

# Set up Python virtual environment
echo "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Create .env from example
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env and set your OPENROUTER_API_KEY"
fi

# Create workspace directories
echo "Creating workspace directories..."
mkdir -p workspaces data backend_python/templates backend_python/sandboxes

echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and set your OPENROUTER_API_KEY"
echo "2. Run 'npm run dev' to start development servers"