#!/bin/bash
set -e

echo "Setting up Python environment..."

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

echo "✓ Python environment setup complete!"
echo ""
echo "To activate the virtual environment:"
echo "  source venv/bin/activate"