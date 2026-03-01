#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

echo -e "${BLUE}Starting OinkerUI Development Environment...${NC}"
echo -e "${BLUE}Project root: ${PROJECT_ROOT}${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found. Run 'npm run setup' first.${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${RED}Shutting down services...${NC}"
    kill 0
}
trap cleanup EXIT

# Start Python backend
echo -e "${GREEN}Starting Python tools backend (port 8000)...${NC}"
source venv/bin/activate 2>/dev/null || true
(cd backend_python && PYTHONPATH="$PROJECT_ROOT/backend_python:$PYTHONPATH" python src/main.py) &
PYTHON_PID=$!

# Start Node.js backend
echo -e "${GREEN}Starting Node.js backend (port 3000)...${NC}"
(cd "$PROJECT_ROOT" && npm run dev:backend) &
NODE_PID=$!

# Start frontend
echo -e "${GREEN}Starting frontend dev server (port 5173)...${NC}"
(cd "$PROJECT_ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

echo -e "${BLUE}All services started!${NC}"
echo -e "Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "Node.js API: ${GREEN}http://localhost:3000${NC}"
echo -e "Python Tools: ${GREEN}http://localhost:8000${NC}"
echo -e "\nPress Ctrl+C to stop all services"

# Wait for all background processes
wait